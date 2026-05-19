import cron from 'node-cron';
import { TwitterApi } from 'twitter-api-v2';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import db from './db.js';

// Load .env to ensure ENCRYPTION_KEY is available
// Resolve path relative to this file (works from dist/ folder too)
const __botrunner_filename = fileURLToPath(import.meta.url);
const __botrunner_dirname = path.dirname(__botrunner_filename);
dotenv.config({ path: path.resolve(__botrunner_dirname, '.env') });
if (!process.env.ENCRYPTION_KEY) {
    dotenv.config({ path: path.resolve(__botrunner_dirname, '..', '.env') });
}

// ===========================================
// AES-256-GCM Decryption for API Keys (matches index.ts)
// ===========================================
if (!process.env.ENCRYPTION_KEY) {
    console.error('[BotRunner][CRITICAL] ENCRYPTION_KEY is not set! Bot API operations will fail.');
}
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '';
const ENC_KEY_BUF = ENCRYPTION_KEY ? Buffer.from(ENCRYPTION_KEY, 'hex') : Buffer.alloc(32);
const ENCRYPTION_AVAILABLE = !!process.env.ENCRYPTION_KEY;

function decryptValue(encryptedStr: string): string {
    if (!ENCRYPTION_AVAILABLE) {
        console.error('[BotRunner][CRITICAL] Attempted to decrypt without ENCRYPTION_KEY!');
        return '';
    }
    try {
        const parts = encryptedStr.split(':');
        if (parts.length !== 3) return encryptedStr; // Not encrypted (legacy)
        const [ivHex, authTagHex, encrypted] = parts;
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-gcm', ENC_KEY_BUF, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch {
        console.error(`[BotRunner][CRITICAL] Decryption failed for value (len=${encryptedStr.length}). Key mismatch or corrupted data.`);
        return '';
    }
}

const __filename_br = fileURLToPath(import.meta.url);
const __dirname_br = path.dirname(__filename_br);

// ---------------------------------------------------------------------------
// Log helper: writes to both console and bot_logs table
// ---------------------------------------------------------------------------

type LogType = 'info' | 'success' | 'error' | 'warning';

function botLog(botId: string, screenName: string, logType: LogType, message: string): void {
    const prefix = `[BotRunner] [${screenName}]`;
    if (logType === 'error') {
        console.error(`${prefix} ${message}`);
    } else if (logType === 'warning') {
        console.warn(`${prefix} ${message}`);
    } else {
        console.log(`${prefix} ${message}`);
    }
    try {
        db.prepare(
            'INSERT INTO bot_logs (bot_id, log_type, message) VALUES (?, ?, ?)'
        ).run(botId, logType, message);
    } catch (err) {
        console.error('[BotRunner] Failed to write log to DB:', err);
    }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BotSettings {
    botType?: 'video_quote' | 'reply_to_championship';
    automationType?: 'none' | 'likes_follows';
    likeKeywords?: string[];
    followTargetAccount?: string;
    dailyLikeLimit?: number;
    followIntervals?: ('morning' | 'noon' | 'evening')[];
    randomTexts?: string[];
    referenceAccounts?: string[];
    dmmAffiliateId?: string;
    mgsAffiliateId?: string;
    affiliateLink?: string;
    linkPlacement?: 'post' | 'reply';
    // Championship Reply Bot
    championshipAccounts?: string[];
    replyTexts?: string[];
}

interface ActiveBot {
    id: string;
    userId: number;
    accountId: string;
    screenName: string;
    schedule: string[];   // e.g. ["9:00", "12:30", "20:00"]
    settings: BotSettings;
}

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

let activeBots: ActiveBot[] = [];

export function updateActiveBots(bots: ActiveBot[]) {
    activeBots = bots;
    console.log(`[BotRunner] Updated active bots: ${bots.length}`);
}

// ---------------------------------------------------------------------------
// Utility: get random text
// ---------------------------------------------------------------------------

export function getRandomText(settings: BotSettings): string {
    const texts = settings.randomTexts;
    if (!texts || texts.length === 0) return '';
    return texts[Math.floor(Math.random() * texts.length)];
}

// ---------------------------------------------------------------------------
// Utility: Affiliate URL generation (server-side mirror of src/lib/affiliate.ts)
// ---------------------------------------------------------------------------

function _generateAffiliateUrl(originalUrl: string, settings: BotSettings): string {
    if (!originalUrl) return '';

    // DMM/FANZA
    if (settings.dmmAffiliateId && (
        originalUrl.includes('fanza.co.jp') ||
        originalUrl.includes('dmm.co.jp') ||
        originalUrl.includes('fanza.com') ||
        originalUrl.includes('dmm.com')
    )) {
        const dmmRegex = /(id=)([^&]+)/;
        if (dmmRegex.test(originalUrl)) {
            return originalUrl.replace(dmmRegex, `$1${settings.dmmAffiliateId}`);
        }
    }

    // MGS
    if (settings.mgsAffiliateId && originalUrl.includes('mgstage.com')) {
        const mgsRegex = /(c=)([^&]+)/;
        if (mgsRegex.test(originalUrl)) {
            return originalUrl.replace(mgsRegex, `$1${settings.mgsAffiliateId}`);
        }
    }

    return originalUrl;
}

/**
 * Generate a default affiliate link when no URL in the source tweet was convertible.
 * Uses direct URL format (not al.dmm.co.jp redirect) so Twitter can display OGP card.
 */
function getDefaultAffiliateUrl(settings: BotSettings): string {
    if (settings.dmmAffiliateId) {
        // Direct FANZA URL with affiliate ID — Twitter can resolve OGP from this
        return `https://www.dmm.co.jp/?af_id=${settings.dmmAffiliateId}`;
    }
    if (settings.mgsAffiliateId) {
        return `https://www.mgstage.com/?c=${settings.mgsAffiliateId}`;
    }
    return '';
}

/**
 * Extract the direct DMM/FANZA URL from an al.dmm.co.jp redirect URL.
 * e.g. "https://al.dmm.co.jp/?lurl=https%3A%2F%2Fwww.dmm.co.jp%2F...&af_id=xxx"
 *   → "https://www.dmm.co.jp/..."
 * Returns the original URL if it's not an al.dmm.co.jp redirect.
 */
function extractDirectUrlFromDmmRedirect(url: string): string {
    try {
        const urlObj = new URL(url);
        if (urlObj.hostname === 'al.dmm.co.jp' && urlObj.searchParams.has('lurl')) {
            return urlObj.searchParams.get('lurl')!;
        }
    } catch { /* ignore */ }
    return url;
}

/**
 * Wrap a URL with DMM affiliate tracking while keeping the original URL accessible
 * for OGP card display. Uses direct URL + af_id parameter instead of al.dmm.co.jp redirect.
 * If the input is an al.dmm.co.jp redirect, extracts the direct URL first.
 */
function wrapWithDmmAffiliate(originalUrl: string, affiliateId: string): string {
    try {
        // First, extract direct URL if this is an al.dmm.co.jp redirect
        const directUrl = extractDirectUrlFromDmmRedirect(originalUrl);
        const urlObj = new URL(directUrl);
        // For DMM/FANZA URLs, just append/replace af_id parameter (OGP-friendly)
        if (urlObj.hostname.includes('dmm.co.jp') || urlObj.hostname.includes('fanza.co.jp') || urlObj.hostname.includes('dmm.com') || urlObj.hostname.includes('fanza.com')) {
            urlObj.searchParams.set('af_id', affiliateId);
            return urlObj.toString();
        }
        // For non-DMM URLs, use al.dmm.co.jp redirect (won't show OGP but rare case)
        return `https://al.dmm.co.jp/?lurl=${encodeURIComponent(directUrl)}&af_id=${affiliateId}&ch=link_tool&ch_id=text`;
    } catch {
        return `https://al.dmm.co.jp/?lurl=${encodeURIComponent(originalUrl)}&af_id=${affiliateId}&ch=link_tool&ch_id=text`;
    }
}

// ---------------------------------------------------------------------------
// Per-account Twitter client factory
// ---------------------------------------------------------------------------

function createTwitterClientForAccount(accountId: string): TwitterApi | null {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const account: any = db.prepare(
            'SELECT api_key, api_secret, access_token, access_secret FROM accounts WHERE id = ?'
        ).get(accountId);

        if (!account) {
            console.error(`[BotRunner] Account not found: ${accountId}`);
            return null;
        }

        if (!account.api_key || !account.api_secret || !account.access_token || !account.access_secret) {
            console.error(`[BotRunner] Account ${accountId} missing API credentials`);
            return null;
        }

        return new TwitterApi({
            appKey: decryptValue(account.api_key),
            appSecret: decryptValue(account.api_secret),
            accessToken: decryptValue(account.access_token),
            accessSecret: decryptValue(account.access_secret),
        });
    } catch (err) {
        console.error(`[BotRunner] Failed to create Twitter client for account ${accountId}:`, err);
        return null;
    }
}

// ---------------------------------------------------------------------------
// Duplicate check: has this source tweet already been posted by this bot?
// ---------------------------------------------------------------------------

function isAlreadyPosted(botId: string, sourceTweetId: string): boolean {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row: any = db.prepare(
        'SELECT id FROM posted_tweets WHERE bot_id = ? AND source_tweet_id = ?'
    ).get(botId, sourceTweetId);
    return !!row;
}

function recordPostedTweet(
    botId: string,
    sourceTweetId: string,
    postedTweetId: string | null,
    content: string,
    affiliateUrl: string
) {
    db.prepare(
        'INSERT INTO posted_tweets (bot_id, source_tweet_id, posted_tweet_id, content, affiliate_url) VALUES (?, ?, ?, ?, ?)'
    ).run(botId, sourceTweetId, postedTweetId || '', content, affiliateUrl);
}

// ---------------------------------------------------------------------------
// Core: Fetch video tweets from reference accounts
// ---------------------------------------------------------------------------

interface VideoTweet {
    id: string;
    text: string;
    authorUsername: string;
    urls: string[];         // expanded URLs found in entities (e.g. FANZA/MGS links)
    videoUrl: string;       // direct video download URL
    hasVideo: boolean;
}

async function fetchVideoTweets(
    client: TwitterApi,
    referenceAccounts: string[],
    botId?: string,
    botScreenName?: string
): Promise<VideoTweet[]> {
    const videoTweets: VideoTweet[] = [];
    const log = (type: LogType, msg: string) => {
        if (botId && botScreenName) botLog(botId, botScreenName, type, msg);
        else console.log(`[BotRunner] ${msg}`);
    };

    for (const screenName of referenceAccounts) {
        try {
            const cleanName = screenName.startsWith('@') ? screenName.slice(1) : screenName;
            const user = await client.v2.userByUsername(cleanName);
            if (!user?.data?.id) {
                log('warning', `Reference user not found: @${cleanName}`);
                continue;
            }

            const timeline = await client.v2.userTimeline(user.data.id, {
                max_results: 20,
                'tweet.fields': ['attachments', 'entities', 'created_at'],
                'media.fields': ['type', 'url', 'preview_image_url', 'variants'],
                expansions: ['attachments.media_keys'],
                exclude: ['retweets', 'replies'],
            });

            // Build media map: media_key -> { type, videoUrl }
            const mediaMap = new Map<string, { type: string; videoUrl: string }>();
            if (timeline.includes?.media) {
                for (const m of timeline.includes.media) {
                    let videoUrl = '';
                    if ((m.type === 'video' || m.type === 'animated_gif') && (m as any).variants) {
                        // Pick the highest bitrate mp4 variant
                        const mp4Variants = ((m as any).variants as any[])
                            .filter((v: any) => v.content_type === 'video/mp4' && v.url)
                            .sort((a: any, b: any) => (b.bit_rate || 0) - (a.bit_rate || 0));
                        if (mp4Variants.length > 0) {
                            videoUrl = mp4Variants[0].url;
                        }
                    }
                    mediaMap.set(m.media_key, { type: m.type, videoUrl });
                }
            }

            const tweets = timeline.data?.data || [];
            for (const tweet of tweets) {
                // Check if tweet has video attachment
                const mediaKeys = tweet.attachments?.media_keys || [];
                let videoUrl = '';
                let hasVideo = false;
                for (const k of mediaKeys) {
                    const media = mediaMap.get(k);
                    if (media && (media.type === 'video' || media.type === 'animated_gif')) {
                        hasVideo = true;
                        videoUrl = media.videoUrl;
                        break;
                    }
                }

                if (!hasVideo || !videoUrl) continue;

                // Extract URLs from entities (potential affiliate-convertible URLs)
                const urls = (tweet.entities?.urls || []).map(
                    (u: { expanded_url?: string; url?: string }) => u.expanded_url || u.url || ''
                ).filter((u: string) => u !== '' && !u.includes('twitter.com') && !u.includes('x.com'));

                videoTweets.push({
                    id: tweet.id,
                    text: tweet.text,
                    authorUsername: cleanName,
                    urls,
                    videoUrl,
                    hasVideo: true,
                });
            }
        } catch (err: any) {
            const errMsg = err?.message || String(err);
            log('error', `Error fetching timeline for @${screenName}: ${errMsg}`);
        }
    }

    return videoTweets;
}

// ---------------------------------------------------------------------------
// Download video to temporary file
// ---------------------------------------------------------------------------

async function downloadVideo(url: string, filePath: string): Promise<boolean> {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`[BotRunner] Video download failed: HTTP ${response.status}`);
            return false;
        }
        const buffer = Buffer.from(await response.arrayBuffer());
        fs.writeFileSync(filePath, buffer);
        return true;
    } catch (err) {
        console.error(`[BotRunner] Video download error:`, err);
        return false;
    }
}

// ---------------------------------------------------------------------------
// Core: Post video tweet with affiliate link
// Downloads video from source tweet, uploads as own media, posts with text.
// Affiliate link is posted as a reply with "↓作品はこちら".
// ---------------------------------------------------------------------------

async function postVideoTweet(
    bot: ActiveBot,
    client: TwitterApi,
    sourceTweet: VideoTweet
): Promise<string | null> {
    const tmpDir = path.join(__dirname_br, 'data', 'tmp');
    const tmpFile = path.join(tmpDir, `video_${bot.id}_${Date.now()}.mp4`);

    try {
        const settings = bot.settings;

        // 1. Download video from source tweet
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
        }

        botLog(bot.id, bot.screenName, 'info', `Downloading video from source tweet ${sourceTweet.id}...`);
        const downloaded = await downloadVideo(sourceTweet.videoUrl, tmpFile);
        if (!downloaded) {
            botLog(bot.id, bot.screenName, 'error', 'Failed to download video, skipping');
            return null;
        }

        const fileSize = fs.statSync(tmpFile).size;
        botLog(bot.id, bot.screenName, 'info', `Video downloaded: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);

        if (fileSize > 50 * 1024 * 1024) {
            botLog(bot.id, bot.screenName, 'warning', 'Video too large (>50MB), skipping');
            return null;
        }

        // 2. Upload video to Twitter via v1 media upload
        botLog(bot.id, bot.screenName, 'info', 'Uploading video to Twitter...');
        const rwClient = client.readWrite;
        const mediaId = await rwClient.v1.uploadMedia(tmpFile, {
            mimeType: 'video/mp4',
            target: 'tweet',
        });
        botLog(bot.id, bot.screenName, 'success', `Video uploaded, media_id: ${mediaId}`);

        // 3. Build tweet text
        const randomText = getRandomText(settings);

        // 4. Build affiliate URL from source tweet URLs
        // Always use direct URL format (not al.dmm.co.jp redirect) for OGP card display
        let affiliateUrl = '';
        for (const url of sourceTweet.urls) {
            if (settings.dmmAffiliateId && (url.includes('dmm') || url.includes('fanza'))) {
                affiliateUrl = wrapWithDmmAffiliate(url, settings.dmmAffiliateId);
                break;
            }
            if (settings.mgsAffiliateId && url.includes('mgstage')) {
                affiliateUrl = url.includes('c=') ? url.replace(/(c=)([^&]+)/, `$1${settings.mgsAffiliateId}`) : `${url}${url.includes('?') ? '&' : '?'}c=${settings.mgsAffiliateId}`;
                break;
            }
        }
        // Custom affiliate link fallback
        if (!affiliateUrl && settings.affiliateLink) {
            affiliateUrl = settings.affiliateLink;
        }
        // Default affiliate link as last resort
        if (!affiliateUrl) {
            affiliateUrl = getDefaultAffiliateUrl(settings);
        }

        // 5. Compose the tweet text
        const parts: string[] = [];
        if (randomText) parts.push(randomText);

        // If linkPlacement is 'post', include affiliate link in the tweet body
        if (affiliateUrl && settings.linkPlacement !== 'reply') {
            parts.push(affiliateUrl);
        }

        const tweetText = parts.join('\n') || '.';

        botLog(bot.id, bot.screenName, 'info', `Posting video tweet: text="${tweetText}", affiliateUrl="${affiliateUrl}", linkPlacement="${settings.linkPlacement}"`);

        // 6. Post the tweet with video
        const result = await rwClient.v2.tweet({
            text: tweetText,
            media: { media_ids: [mediaId] },
        });

        const postedTweetId = result.data?.id || null;
        botLog(bot.id, bot.screenName, 'success', `Posted video tweet: ${postedTweetId} (source: ${sourceTweet.id})`);

        // 7. If linkPlacement is 'reply', post affiliate link as a reply
        if (affiliateUrl && settings.linkPlacement === 'reply' && postedTweetId) {
            try {
                const replyText = `↓作品はこちら\n${affiliateUrl}`;
                await rwClient.v2.reply(replyText, postedTweetId);
                botLog(bot.id, bot.screenName, 'success', `Posted affiliate link as reply: ${affiliateUrl}`);
            } catch (replyErr) {
                botLog(bot.id, bot.screenName, 'error', `Failed to post reply with affiliate link: ${replyErr}`);
            }
        }

        // Record posted tweet
        recordPostedTweet(bot.id, sourceTweet.id, postedTweetId, tweetText, affiliateUrl);

        // Update daily metrics
        updateDailyTweetCount(bot.userId, bot.accountId);

        return postedTweetId;
    } catch (err) {
        botLog(bot.id, bot.screenName, 'error', `Failed to post video tweet: ${err}`);
        return null;
    } finally {
        // Clean up temporary file
        try {
            if (fs.existsSync(tmpFile)) {
                const size = fs.statSync(tmpFile).size;
                fs.unlinkSync(tmpFile);
                botLog(bot.id, bot.screenName, 'info', `Deleted temp video file: ${tmpFile} (${(size / 1024 / 1024).toFixed(2)} MB)`);
            }
        } catch (cleanupErr) {
            botLog(bot.id, bot.screenName, 'warning', `Failed to delete temp video file: ${tmpFile} - ${cleanupErr}`);
        }
    }
}

// ---------------------------------------------------------------------------
// Update daily tweet count
// ---------------------------------------------------------------------------

function updateDailyTweetCount(userId: number, accountId: string) {
    const today = new Date().toISOString().split('T')[0];
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const existing: any = db.prepare(
            'SELECT id FROM daily_metrics WHERE user_id = ? AND account_id = ? AND date = ?'
        ).get(userId, accountId, today);

        if (existing) {
            db.prepare('UPDATE daily_metrics SET tweets = tweets + 1 WHERE id = ?').run(existing.id);
        } else {
            db.prepare(
                'INSERT INTO daily_metrics (user_id, account_id, date, tweets) VALUES (?, ?, ?, 1)'
            ).run(userId, accountId, today);
        }
    } catch (err) {
        console.error('[BotRunner] Failed to update daily metrics:', err);
    }
}

// ---------------------------------------------------------------------------
// Main: Execute auto-posting for a bot (routes by botType)
// ---------------------------------------------------------------------------

async function performAutoPost(bot: ActiveBot) {
    const botType = bot.settings.botType || 'video_quote';

    if (botType === 'reply_to_championship') {
        await performReplyBot(bot);
    } else {
        await performVideoQuoteBot(bot);
    }
}

// ---------------------------------------------------------------------------
// Video Bot: Download video from reference accounts and post as own tweet
// ---------------------------------------------------------------------------

async function performVideoQuoteBot(bot: ActiveBot) {
  try {
    const settings = bot.settings;
    const referenceAccounts = settings.referenceAccounts || [];

    if (referenceAccounts.length === 0) {
        botLog(bot.id, bot.screenName, 'warning', 'No reference accounts configured, skipping post');
        return;
    }

    // Create per-account Twitter client with write access
    const client = createTwitterClientForAccount(bot.accountId);
    if (!client) {
        botLog(bot.id, bot.screenName, 'error', 'Cannot create Twitter client, skipping');
        return;
    }

    botLog(bot.id, bot.screenName, 'info', 'Starting auto-post (video download mode)...');
    botLog(bot.id, bot.screenName, 'info', `Settings: linkPlacement=${settings.linkPlacement}, affiliateLink=${settings.affiliateLink || 'none'}, dmmId=${settings.dmmAffiliateId || 'none'}, mgsId=${settings.mgsAffiliateId || 'none'}, randomTexts=${(settings.randomTexts || []).length}`);

    // Fetch video tweets from reference accounts
    const videoTweets = await fetchVideoTweets(client, referenceAccounts, bot.id, bot.screenName);
    botLog(bot.id, bot.screenName, 'info', `Found ${videoTweets.length} video tweets from reference accounts`);

    // Filter out already posted
    const newTweets = videoTweets.filter(t => !isAlreadyPosted(bot.id, t.id));
    botLog(bot.id, bot.screenName, 'info', `${newTweets.length} new (unposted) video tweets`);

    // Debug: log URLs found in each tweet
    for (const t of newTweets) {
        botLog(bot.id, bot.screenName, 'info', `Tweet ${t.id} by @${t.authorUsername}: urls=[${t.urls.join(', ')}]`);
    }

    // Filter: only keep tweets that have affiliate-convertible URLs (DMM/FANZA/MGS)
    // Check both extracted URLs and tweet text for DMM/FANZA/MGS links
    const affiliateDomains = ['dmm.co.jp', 'dmm.com', 'fanza.co.jp', 'fanza.com', 'mgstage.com', 'al.dmm.co.jp'];
    const tweetsWithAffiliateUrls = newTweets.filter(t => {
        const hasUrlMatch = t.urls.some(url =>
            affiliateDomains.some(domain => url.includes(domain))
        );
        const hasTextMatch = affiliateDomains.some(domain => t.text.includes(domain));
        return hasUrlMatch || hasTextMatch;
    });
    botLog(bot.id, bot.screenName, 'info', `${tweetsWithAffiliateUrls.length} tweets have affiliate-convertible URLs (DMM/FANZA/MGS)`);

    if (tweetsWithAffiliateUrls.length === 0) {
        botLog(bot.id, bot.screenName, 'info', 'No video tweets with affiliate URLs found, skipping post');
        return;
    }

    // Pick one random tweet to post
    const selected = tweetsWithAffiliateUrls[Math.floor(Math.random() * tweetsWithAffiliateUrls.length)];
    botLog(bot.id, bot.screenName, 'info', `Selected tweet ${selected.id} by @${selected.authorUsername}, videoUrl=${selected.videoUrl ? 'yes' : 'no'}, urls=${selected.urls.length}`);
    await postVideoTweet(bot, client, selected);
  } catch (err: any) {
    botLog(bot.id, bot.screenName, 'error', `performVideoQuoteBot failed: ${err?.message || String(err)}`);
  }
}

// ---------------------------------------------------------------------------
// Championship Reply Bot
// ---------------------------------------------------------------------------

interface ChampionshipTweet {
    id: string;
    text: string;
    authorUsername: string;
}

interface OwnTweet {
    id: string;
    text: string;
}

async function fetchChampionshipTweets(
    client: TwitterApi,
    accounts: string[]
): Promise<ChampionshipTweet[]> {
    const tweets: ChampionshipTweet[] = [];

    for (const screenName of accounts) {
        try {
            const cleanName = screenName.startsWith('@') ? screenName.slice(1) : screenName;
            const user = await client.v2.userByUsername(cleanName);
            if (!user?.data?.id) {
                console.warn(`[BotRunner] Championship account not found: @${cleanName}`);
                continue;
            }

            const timeline = await client.v2.userTimeline(user.data.id, {
                max_results: 10,
                'tweet.fields': ['created_at'],
                exclude: ['retweets'],
            });

            const tweetData = timeline.data?.data || [];
            for (const tweet of tweetData) {
                tweets.push({
                    id: tweet.id,
                    text: tweet.text,
                    authorUsername: cleanName,
                });
            }
        } catch (err) {
            console.error(`[BotRunner] Error fetching championship tweets from @${screenName}:`, err);
        }
    }

    return tweets;
}

async function _fetchOwnTweets(
    client: TwitterApi,
    screenName: string
): Promise<OwnTweet[]> {
    try {
        // Use authenticated user (me) instead of username lookup to avoid screen_name mismatch
        const me = await client.v2.me();
        if (!me?.data?.id) {
            console.warn(`[BotRunner] Own account not found via me() for @${screenName}`);
            return [];
        }
        console.log(`[BotRunner] Own account resolved: @${me.data.username} (id=${me.data.id})`);

        const timeline = await client.v2.userTimeline(me.data.id, {
            max_results: 50,
            'tweet.fields': ['created_at', 'referenced_tweets'],
            exclude: ['retweets', 'replies'],
        });

        const tweets = timeline.data?.data || [];
        return tweets.map(t => ({
            id: t.id,
            text: t.text,
        }));
    } catch (err) {
        console.error(`[BotRunner] Error fetching own tweets for @${screenName}:`, err);
        return [];
    }
}

async function performReplyBot(bot: ActiveBot) {
    const settings = bot.settings;
    const championshipAccounts = settings.championshipAccounts || [];

    if (championshipAccounts.length === 0) {
        botLog(bot.id, bot.screenName, 'warning', 'No championship accounts configured, skipping');
        return;
    }

    const client = createTwitterClientForAccount(bot.accountId);
    if (!client) {
        botLog(bot.id, bot.screenName, 'error', 'Cannot create Twitter client, skipping');
        return;
    }

    botLog(bot.id, bot.screenName, 'info', 'Starting championship reply bot...');

    // 1. Fetch recent tweets from championship accounts
    const championshipTweets = await fetchChampionshipTweets(client, championshipAccounts);
    botLog(bot.id, bot.screenName, 'info', `Found ${championshipTweets.length} championship tweets`);

    // 2. Filter out already replied
    const newTweets = championshipTweets.filter(t => !isAlreadyPosted(bot.id, t.id));
    botLog(bot.id, bot.screenName, 'info', `${newTweets.length} new (unreplied) championship tweets`);

    if (newTweets.length === 0) {
        botLog(bot.id, bot.screenName, 'info', 'No new championship tweets to reply to');
        return;
    }

    // 3. Get video bot's posted tweets from DB (same account) to use as reply URLs
    const rwClient = client.readWrite;
    const me = await rwClient.v2.me();
    const realScreenName = me?.data?.username || bot.screenName.replace(/^@/, '');

    // Find video bot for the same account to get its posted tweets
    const videoBotPosts: any[] = db.prepare(`
        SELECT pt.posted_tweet_id FROM posted_tweets pt
        JOIN bots b ON pt.bot_id = b.id
        WHERE b.account_id = ? AND b.id != ? AND pt.posted_tweet_id != ''
        ORDER BY pt.created_at DESC LIMIT 50
    `).all(bot.accountId, bot.id);

    if (videoBotPosts.length === 0) {
        botLog(bot.id, bot.screenName, 'warning', 'No video bot posts found for this account, skipping');
        return;
    }
    botLog(bot.id, bot.screenName, 'info', `Found ${videoBotPosts.length} video bot posts to reference`);

    // 4. Reply to one championship tweet (rate limit safety)
    const targetTweet = newTweets[0];
    const randomPost = videoBotPosts[Math.floor(Math.random() * videoBotPosts.length)];
    const videoTweetUrl = `https://x.com/${realScreenName}/status/${randomPost.posted_tweet_id}`;

    // Build reply text
    const replyTexts = settings.replyTexts || [];
    const randomText = replyTexts.length > 0
        ? replyTexts[Math.floor(Math.random() * replyTexts.length)]
        : '';
    const replyContent = randomText ? `${randomText}\n${videoTweetUrl}` : videoTweetUrl;

    try {
        botLog(bot.id, bot.screenName, 'info', `Replying to @${targetTweet.authorUsername} tweet ${targetTweet.id} with: "${replyContent}"`);
        const result = await rwClient.v2.reply(replyContent, targetTweet.id);
        const replyTweetId = result.data?.id || null;

        botLog(bot.id, bot.screenName, 'success', `Replied to championship tweet ${targetTweet.id} by @${targetTweet.authorUsername} → reply: ${replyTweetId}`);

        // Record to prevent duplicate replies
        recordPostedTweet(bot.id, targetTweet.id, replyTweetId, replyContent, videoTweetUrl);

        // Update daily metrics
        updateDailyTweetCount(bot.userId, bot.accountId);
    } catch (err) {
        botLog(bot.id, bot.screenName, 'error', `Failed to reply to championship tweet ${targetTweet.id}: ${err}`);
    }
}

// ---------------------------------------------------------------------------
// Helper: Check if tweet was already liked by this bot
// ---------------------------------------------------------------------------

function isAlreadyLiked(botId: string, tweetId: string): boolean {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row: any = db.prepare(
        'SELECT id FROM liked_tweets WHERE bot_id = ? AND tweet_id = ?'
    ).get(botId, tweetId);
    return !!row;
}

function recordLikedTweet(botId: string, tweetId: string, keyword: string): void {
    try {
        db.prepare(
            'INSERT OR IGNORE INTO liked_tweets (bot_id, tweet_id, keyword) VALUES (?, ?, ?)'
        ).run(botId, tweetId, keyword);
    } catch (err) {
        console.error('[BotRunner] Failed to record liked tweet:', err);
    }
}

// ---------------------------------------------------------------------------
// Helper: Check if user was already followed by this bot
// ---------------------------------------------------------------------------

function isAlreadyFollowed(botId: string, targetUserId: string): boolean {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row: any = db.prepare(
        'SELECT id FROM followed_users WHERE bot_id = ? AND target_user_id = ?'
    ).get(botId, targetUserId);
    return !!row;
}

function recordFollowedUser(botId: string, targetUserId: string, targetUsername: string): void {
    try {
        db.prepare(
            'INSERT OR IGNORE INTO followed_users (bot_id, target_user_id, target_username) VALUES (?, ?, ?)'
        ).run(botId, targetUserId, targetUsername);
    } catch (err) {
        console.error('[BotRunner] Failed to record followed user:', err);
    }
}

// ---------------------------------------------------------------------------
// Helper: Get pagination token for auto-follow (stored in bot_settings or memory)
// ---------------------------------------------------------------------------

// In-memory pagination token store: botId -> next_token
const followPaginationTokens: Record<string, string | undefined> = {};

// ---------------------------------------------------------------------------
// Auto Like (with duplicate skip)
// ---------------------------------------------------------------------------

async function performAutoLike(bot: ActiveBot) {
    const keywords = bot.settings.likeKeywords || [];
    if (keywords.length === 0) return;

    const DAILY_LIKE_LIMIT = 10;

    // Check how many likes already done today
    const today = new Date().toISOString().split('T')[0];
    const todayLikes: any = db.prepare(
        "SELECT COUNT(*) as count FROM liked_tweets WHERE bot_id = ? AND created_at >= ?"
    ).get(bot.id, today + ' 00:00:00');
    const alreadyLikedToday = todayLikes?.count || 0;

    if (alreadyLikedToday >= DAILY_LIKE_LIMIT) {
        botLog(bot.id, bot.screenName, 'info', `Daily like limit reached (${alreadyLikedToday}/${DAILY_LIKE_LIMIT}), skipping`);
        return;
    }

    const remaining = DAILY_LIKE_LIMIT - alreadyLikedToday;

    const client = createTwitterClientForAccount(bot.accountId);
    if (!client) return;

    botLog(bot.id, bot.screenName, 'info', `Starting auto-like task... (${alreadyLikedToday}/${DAILY_LIKE_LIMIT} today)`);
    const keyword = keywords[Math.floor(Math.random() * keywords.length)];

    try {
        const rwClient = client.readWrite;
        const searchResults = await rwClient.v2.search(keyword, { max_results: 20 });
        const tweets = searchResults.data?.data || [];

        // Filter out already liked tweets
        const newTweets = tweets.filter(t => !isAlreadyLiked(bot.id, t.id));

        botLog(bot.id, bot.screenName, 'info',
            `Found ${tweets.length} tweets for "${keyword}", ${newTweets.length} new (not yet liked)`
        );

        if (newTweets.length === 0) {
            botLog(bot.id, bot.screenName, 'info', 'All found tweets already liked, skipping');
            return;
        }

        const me = await rwClient.v2.me();
        const myId = me.data.id;

        let likedCount = 0;

        for (const tweet of newTweets) {
            if (likedCount >= remaining) break;
            try {
                await rwClient.v2.like(myId, tweet.id);
                recordLikedTweet(bot.id, tweet.id, keyword);
                botLog(bot.id, bot.screenName, 'success', `Liked tweet: ${tweet.id}`);
                likedCount++;
                // Delay between likes (3-6 seconds)
                await new Promise(r => setTimeout(r, 3000 + Math.random() * 3000));
            } catch (err) {
                recordLikedTweet(bot.id, tweet.id, keyword);
                botLog(bot.id, bot.screenName, 'error', `Failed to like tweet ${tweet.id}: ${err}`);
                // If 402 error (rate limit), stop immediately
                if (String(err).includes('402')) {
                    botLog(bot.id, bot.screenName, 'warning', 'API rate limit (402), stopping auto-like for now');
                    break;
                }
            }
        }

        botLog(bot.id, bot.screenName, 'info', `Auto-like complete: ${likedCount} tweets liked (total today: ${alreadyLikedToday + likedCount}/${DAILY_LIKE_LIMIT})`);
    } catch (error) {
        botLog(bot.id, bot.screenName, 'error', `Auto-like failed: ${error}`);
    }
}

// ---------------------------------------------------------------------------
// Auto Follow (with duplicate skip + pagination)
// ---------------------------------------------------------------------------

async function performAutoFollow(bot: ActiveBot) {
    const targetAccount = bot.settings.followTargetAccount;
    if (!targetAccount) return;

    const FOLLOWS_PER_RUN = 5;   // 5 per run (morning/noon/evening) = 15/day
    const DAILY_FOLLOW_LIMIT = 15;

    // Check how many follows already done today
    const today = new Date().toISOString().split('T')[0];
    const todayFollows: any = db.prepare(
        "SELECT COUNT(*) as count FROM followed_users WHERE bot_id = ? AND created_at >= ?"
    ).get(bot.id, today + ' 00:00:00');
    const alreadyFollowedToday = todayFollows?.count || 0;

    if (alreadyFollowedToday >= DAILY_FOLLOW_LIMIT) {
        botLog(bot.id, bot.screenName, 'info', `Daily follow limit reached (${alreadyFollowedToday}/${DAILY_FOLLOW_LIMIT}), skipping`);
        return;
    }

    const remaining = Math.min(FOLLOWS_PER_RUN, DAILY_FOLLOW_LIMIT - alreadyFollowedToday);

    const client = createTwitterClientForAccount(bot.accountId);
    if (!client) return;

    botLog(bot.id, bot.screenName, 'info', `Starting auto-follow task targeting @${targetAccount}... (${alreadyFollowedToday}/${DAILY_FOLLOW_LIMIT} today, ${remaining} this run)`);

    try {
        const rwClient = client.readWrite;
        const me = await rwClient.v2.me();
        const myId = me.data.id;

        const cleanTarget = targetAccount.startsWith('@') ? targetAccount.slice(1) : targetAccount;
        const targetUser = await rwClient.v2.userByUsername(cleanTarget);
        if (!targetUser.data) throw new Error(`Target user @${cleanTarget} not found`);

        // Use stored pagination token to continue from where we left off
        const paginationToken = followPaginationTokens[bot.id];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const followersOptions: any = { max_results: 50 };
        if (paginationToken) {
            followersOptions.pagination_token = paginationToken;
        }

        const followers = await rwClient.v2.followers(targetUser.data.id, followersOptions);
        const allFollowers = followers.data || [];

        if (followers.meta?.next_token) {
            followPaginationTokens[bot.id] = followers.meta.next_token;
        } else {
            delete followPaginationTokens[bot.id];
            botLog(bot.id, bot.screenName, 'info', 'Reached end of follower list, will restart from beginning next run');
        }

        const newUsers = allFollowers.filter(u => !isAlreadyFollowed(bot.id, u.id));

        botLog(bot.id, bot.screenName, 'info',
            `Fetched ${allFollowers.length} followers of @${cleanTarget}, ${newUsers.length} not yet followed`
        );

        if (newUsers.length === 0) {
            botLog(bot.id, bot.screenName, 'info', 'All fetched followers already followed, will try next page next run');
            return;
        }

        let followedCount = 0;

        for (const user of newUsers) {
            if (followedCount >= remaining) break;
            try {
                await rwClient.v2.follow(myId, user.id);
                recordFollowedUser(bot.id, user.id, user.username || '');
                botLog(bot.id, bot.screenName, 'success', `Followed user: @${user.username} (${user.id})`);
                followedCount++;
                // Delay between follows (5-10 seconds)
                await new Promise(r => setTimeout(r, 5000 + Math.random() * 5000));
            } catch (err) {
                recordFollowedUser(bot.id, user.id, user.username || '');
                botLog(bot.id, bot.screenName, 'error', `Failed to follow @${user.username}: ${err}`);
                if (String(err).includes('402')) {
                    botLog(bot.id, bot.screenName, 'warning', 'API rate limit (402), stopping auto-follow for now');
                    break;
                }
            }
        }

        botLog(bot.id, bot.screenName, 'info', `Auto-follow complete: ${followedCount} users followed (total today: ${alreadyFollowedToday + followedCount}/${DAILY_FOLLOW_LIMIT})`);
    } catch (error) {
        botLog(bot.id, bot.screenName, 'error', `Auto-follow failed: ${error}`);
    }
}

// ---------------------------------------------------------------------------
// Existing: Shadowban Check
// ---------------------------------------------------------------------------

async function performShadowbanCheck(bot: ActiveBot) {
    const client = createTwitterClientForAccount(bot.accountId);
    if (!client) return;

    const cleanName = bot.screenName.startsWith('@') ? bot.screenName.slice(1) : bot.screenName;
    botLog(bot.id, cleanName, 'info', 'Running daily shadowban check...');

    try {
        const user = await client.v2.userByUsername(cleanName, {
            "user.fields": ["public_metrics"]
        });

        if (!user || user.errors) {
            botLog(bot.id, cleanName, 'error', 'User not found or API error during shadowban check');
            return;
        }

        const metrics = user.data.public_metrics;
        let searchBan = false;
        try {
            const search = await client.v2.search(`from:${cleanName}`, { max_results: 10 });
            searchBan = search.meta.result_count === 0 && (metrics?.tweet_count || 0) > 0;
        } catch (e) {
            console.warn(`[BotRunner] [${cleanName}] Search check failed:`, e);
        }

        botLog(bot.id, cleanName, 'info', `Shadowban check result - Search Ban: ${searchBan}`);

        // Save to daily_metrics
        const today = new Date().toISOString().split('T')[0];
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const existing: any = db.prepare(
                'SELECT id FROM daily_metrics WHERE user_id = ? AND account_id = ? AND date = ?'
            ).get(bot.userId, bot.accountId, today);

            if (existing) {
                db.prepare('UPDATE daily_metrics SET followers = ?, tweets = ? WHERE id = ?').run(
                    metrics?.followers_count || 0,
                    metrics?.tweet_count || 0,
                    existing.id
                );
            } else {
                db.prepare(
                    'INSERT INTO daily_metrics (user_id, account_id, date, followers, tweets) VALUES (?, ?, ?, ?, ?)'
                ).run(bot.userId, bot.accountId, today, metrics?.followers_count || 0, metrics?.tweet_count || 0);
            }
            botLog(bot.id, cleanName, 'success', `Metrics updated for ${today}`);
        } catch (dbErr) {
            botLog(bot.id, cleanName, 'error', `Failed to save metrics: ${dbErr}`);
        }
    } catch (error) {
        botLog(bot.id, cleanName, 'error', `Shadowban check failed: ${error}`);
    }
}

// ---------------------------------------------------------------------------
// Metrics Collection: Fetch tweet impressions & engagement from Twitter API v2
// Twitter Basic plan supports organic_metrics on own tweets
// ---------------------------------------------------------------------------

async function performMetricsCollection(bot: ActiveBot) {
    const client = createTwitterClientForAccount(bot.accountId);
    if (!client) return;

    botLog(bot.id, bot.screenName, 'info', 'Starting metrics collection...');

    try {
        const rwClient = client.readWrite;
        const me = await rwClient.v2.me();
        if (!me?.data?.id) {
            botLog(bot.id, bot.screenName, 'error', 'Cannot resolve own user for metrics');
            return;
        }

        // Fetch recent tweets with public_metrics (impressions, likes, retweets, replies)
        const timeline = await rwClient.v2.userTimeline(me.data.id, {
            max_results: 50,
            'tweet.fields': ['public_metrics', 'created_at'],
            exclude: ['retweets', 'replies'],
        });

        const tweets = timeline.data?.data || [];
        if (tweets.length === 0) {
            botLog(bot.id, bot.screenName, 'info', 'No tweets found for metrics collection');
            return;
        }

        // Aggregate metrics by date
        const dailyMetrics: Record<string, { impressions: number; engagement: number }> = {};

        for (const tweet of tweets) {
            const pm = tweet.public_metrics;
            if (!pm) continue;

            // Use tweet creation date
            const tweetDate = tweet.created_at ? tweet.created_at.split('T')[0] : new Date().toISOString().split('T')[0];

            if (!dailyMetrics[tweetDate]) {
                dailyMetrics[tweetDate] = { impressions: 0, engagement: 0 };
            }

            // impression_count is available on Basic plan via public_metrics
            dailyMetrics[tweetDate].impressions += (pm as any).impression_count || 0;
            dailyMetrics[tweetDate].engagement += (pm.like_count || 0) + (pm.retweet_count || 0) + (pm.reply_count || 0);
        }

        // Update daily_metrics table
        let updatedDays = 0;
        for (const [date, metrics] of Object.entries(dailyMetrics)) {
            try {
                const existing: any = db.prepare(
                    'SELECT id, impressions, engagement FROM daily_metrics WHERE user_id = ? AND account_id = ? AND date = ?'
                ).get(bot.userId, bot.accountId, date);

                if (existing) {
                    db.prepare(
                        'UPDATE daily_metrics SET impressions = ?, engagement = ? WHERE id = ?'
                    ).run(metrics.impressions, metrics.engagement, existing.id);
                } else {
                    db.prepare(
                        'INSERT INTO daily_metrics (user_id, account_id, date, impressions, engagement) VALUES (?, ?, ?, ?, ?)'
                    ).run(bot.userId, bot.accountId, date, metrics.impressions, metrics.engagement);
                }
                updatedDays++;
            } catch (dbErr) {
                botLog(bot.id, bot.screenName, 'error', `Failed to save metrics for ${date}: ${dbErr}`);
            }
        }

        const totalImpressions = Object.values(dailyMetrics).reduce((sum, m) => sum + m.impressions, 0);
        const totalEngagement = Object.values(dailyMetrics).reduce((sum, m) => sum + m.engagement, 0);
        botLog(bot.id, bot.screenName, 'success', `Metrics collected: ${updatedDays} days updated, ${totalImpressions} total impressions, ${totalEngagement} total engagement`);
    } catch (error) {
        botLog(bot.id, bot.screenName, 'error', `Metrics collection failed: ${error}`);
    }
}

// ---------------------------------------------------------------------------
// Load bots from DB
// ---------------------------------------------------------------------------

function loadActiveBotsFromDB(): ActiveBot[] {
    try {
        const rows = db.prepare("SELECT * FROM bots WHERE status = 'active'").all();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return rows.map((b: any) => {
            const settings: BotSettings = JSON.parse(b.settings || '{}');
            const schedule: string[] = JSON.parse(b.schedule || '[]');

            // Look up the account's screen_name
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const account: any = db.prepare('SELECT screen_name FROM accounts WHERE id = ?').get(b.account_id);

            return {
                id: b.id,
                userId: b.user_id,
                accountId: b.account_id,
                screenName: account?.screen_name || b.account_id,
                schedule,
                settings,
            };
        });
    } catch (e) {
        console.error("[BotRunner] Error loading bots from DB:", e);
        return [];
    }
}

// ---------------------------------------------------------------------------
// Schedule check: should this bot post right now?
// ---------------------------------------------------------------------------

function shouldPostNow(bot: ActiveBot): boolean {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Round down to nearest 10-minute slot
    const roundedMinute = Math.floor(currentMinute / 10) * 10;
    const currentSlot = `${currentHour}:${String(roundedMinute).padStart(2, '0')}`;

    return bot.schedule.includes(currentSlot);
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function initBotRunner(_xClient?: any) {
    console.log("[BotRunner] Initializing cron jobs...");

    // Load active bots
    activeBots = loadActiveBotsFromDB();
    console.log(`[BotRunner] Loaded ${activeBots.length} active bots from database.`);
    for (const bot of activeBots) {
        console.log(`[BotRunner] Bot: id=${bot.id}, screen=${bot.screenName}, botType=${bot.settings.botType}, schedule=${JSON.stringify(bot.schedule)}, championshipAccounts=${JSON.stringify(bot.settings.championshipAccounts || [])}`);
    }

    // -----------------------------------------------------------------------
    // Scheduled Posting: Check every 10 minutes
    // -----------------------------------------------------------------------
    cron.schedule('*/10 * * * *', async () => {
        // Reload bots to catch any new/updated bots
        activeBots = loadActiveBotsFromDB();
        const now = new Date();
        const currentSlot = `${now.getHours()}:${String(Math.floor(now.getMinutes() / 10) * 10).padStart(2, '0')}`;

        for (const bot of activeBots) {
            try {
                const shouldPost = shouldPostNow(bot);
                if (shouldPost) {
                    botLog(bot.id, bot.screenName, 'info', `Triggered by schedule (slot=${currentSlot}, schedule=${JSON.stringify(bot.schedule)})`);
                    await performAutoPost(bot);
                }
            } catch (err: any) {
                botLog(bot.id, bot.screenName, 'error', `Auto-post cron error: ${err?.message || String(err)}`);
            }
        }
    });

    // -----------------------------------------------------------------------
    // Auto Like Job (Every hour)
    // -----------------------------------------------------------------------
    cron.schedule('0 * * * *', async () => {
        for (const bot of activeBots) {
            if (bot.settings.automationType === 'likes_follows') {
                await performAutoLike(bot);
            }
        }
    });

    // -----------------------------------------------------------------------
    // Auto Follow Jobs
    // -----------------------------------------------------------------------
    // Morning (8:00 AM)
    cron.schedule('0 8 * * *', async () => {
        for (const bot of activeBots) {
            if (bot.settings.automationType === 'likes_follows' && bot.settings.followIntervals?.includes('morning')) {
                await performAutoFollow(bot);
            }
        }
    });

    // Noon (12:00 PM)
    cron.schedule('0 12 * * *', async () => {
        for (const bot of activeBots) {
            if (bot.settings.automationType === 'likes_follows' && bot.settings.followIntervals?.includes('noon')) {
                await performAutoFollow(bot);
            }
        }
    });

    // Evening (8:00 PM)
    cron.schedule('0 20 * * *', async () => {
        for (const bot of activeBots) {
            if (bot.settings.automationType === 'likes_follows' && bot.settings.followIntervals?.includes('evening')) {
                await performAutoFollow(bot);
            }
        }
    });

    // -----------------------------------------------------------------------
    // Daily Shadowban Check (4:00 AM)
    // -----------------------------------------------------------------------
    cron.schedule('0 4 * * *', async () => {
        console.log("[BotRunner] Starting daily shadowban check for all bots...");
        for (const bot of activeBots) {
            await performShadowbanCheck(bot);
        }
    });

    // -----------------------------------------------------------------------
    // Metrics Collection: Every 6 hours (0:30, 6:30, 12:30, 18:30)
    // Fetches tweet impressions & engagement from Twitter API v2
    // -----------------------------------------------------------------------
    cron.schedule('30 */6 * * *', async () => {
        console.log("[BotRunner] Starting metrics collection for all bots...");
        activeBots = loadActiveBotsFromDB();
        // Only collect metrics for one bot per account (avoid duplicate API calls)
        const processedAccounts = new Set<string>();
        for (const bot of activeBots) {
            if (processedAccounts.has(bot.accountId)) continue;
            processedAccounts.add(bot.accountId);
            await performMetricsCollection(bot);
        }
    });

    // -----------------------------------------------------------------------
    // Daily cleanup: remove bot logs older than 30 days (3:00 AM)
    // Also clean up liked_tweets older than 90 days and followed_users older than 90 days
    // -----------------------------------------------------------------------
    cron.schedule('0 3 * * *', () => {
        try {
            db.prepare("DELETE FROM bot_logs WHERE created_at < datetime('now', '-30 days')").run();
            console.log('[BotRunner] Cleaned up bot logs older than 30 days');
        } catch (err) {
            console.error('[BotRunner] Failed to cleanup old logs:', err);
        }
        try {
            db.prepare("DELETE FROM liked_tweets WHERE created_at < datetime('now', '-90 days')").run();
            console.log('[BotRunner] Cleaned up liked_tweets older than 90 days');
        } catch (err) {
            console.error('[BotRunner] Failed to cleanup old liked_tweets:', err);
        }
        try {
            db.prepare("DELETE FROM followed_users WHERE created_at < datetime('now', '-90 days')").run();
            console.log('[BotRunner] Cleaned up followed_users older than 90 days');
        } catch (err) {
            console.error('[BotRunner] Failed to cleanup old followed_users:', err);
        }
    });

    // -----------------------------------------------------------------------
    // Database Backup: Every 3 hours (0:00, 3:00, 6:00, ..., 21:00)
    // Keeps last 8 backups (= 1 day of 3-hour intervals)
    // -----------------------------------------------------------------------
    cron.schedule('0 */3 * * *', () => {
        performDatabaseBackup();
    });

    // Run initial backup on startup
    performDatabaseBackup();

    console.log("[BotRunner] All cron jobs scheduled.");
}

// ---------------------------------------------------------------------------
// Database Backup
// ---------------------------------------------------------------------------

const BACKUP_DIR = path.join(__dirname_br, 'data', 'backups');
const MAX_BACKUPS = 8; // 3h × 8 = 24 hours of backups

function performDatabaseBackup(): void {
    try {
        const dbPath = path.join(__dirname_br, 'data', 'posutto.db');

        if (!fs.existsSync(dbPath)) {
            console.warn('[Backup] Database file not found, skipping backup');
            return;
        }

        // Ensure backup directory exists
        if (!fs.existsSync(BACKUP_DIR)) {
            fs.mkdirSync(BACKUP_DIR, { recursive: true });
        }

        // Create backup filename with timestamp: posutto_2026-02-23_15-00.db
        const now = new Date();
        const timestamp = now.toISOString()
            .replace('T', '_')
            .replace(/:/g, '-')
            .split('.')[0];
        const backupFileName = `posutto_${timestamp}.db`;
        const backupPath = path.join(BACKUP_DIR, backupFileName);

        // Copy database file
        fs.copyFileSync(dbPath, backupPath);
        console.log(`[Backup] Database backed up: ${backupFileName}`);

        // Rotate: remove old backups beyond MAX_BACKUPS
        const backupFiles = fs.readdirSync(BACKUP_DIR)
            .filter(f => f.startsWith('posutto_') && f.endsWith('.db'))
            .sort()
            .reverse(); // newest first

        if (backupFiles.length > MAX_BACKUPS) {
            const toDelete = backupFiles.slice(MAX_BACKUPS);
            for (const oldFile of toDelete) {
                fs.unlinkSync(path.join(BACKUP_DIR, oldFile));
                console.log(`[Backup] Deleted old backup: ${oldFile}`);
            }
        }

        console.log(`[Backup] Total backups: ${Math.min(backupFiles.length, MAX_BACKUPS)}`);
    } catch (err) {
        console.error('[Backup] Database backup failed:', err);
    }
}
