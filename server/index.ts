import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import { TwitterApi } from 'twitter-api-v2';
import { initBotRunner, updateActiveBots } from './botRunner.js';
import db, { initializeDatabase } from './db.js';
import bcrypt from 'bcryptjs';
import { stripe, WEBHOOK_SECRET, PLAN_PRICE_MAP, PRICE_PLAN_MAP, initializeStripePrices } from './stripe.js';
import Stripe from 'stripe';

// Load .env FIRST before anything references process.env
// Resolve .env path relative to this file's directory (works from both src/ and dist/)
const __dotenv_filename = fileURLToPath(import.meta.url);
const __dotenv_dirname = path.dirname(__dotenv_filename);
dotenv.config({ path: path.resolve(__dotenv_dirname, '.env') });
// Fallback: also try parent directory (server/.env when running from dist/)
if (!process.env.ENCRYPTION_KEY) {
    dotenv.config({ path: path.resolve(__dotenv_dirname, '..', '.env') });
}

// ===========================================
// Custom Rate Limiter (no external dependency)
// ===========================================
interface RateLimitEntry { count: number; resetTime: number; }
function createRateLimiter(windowMs: number, maxRequests: number, errorMessage: string) {
    const store = new Map<string, RateLimitEntry>();
    // Cleanup every 5 minutes
    setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of store.entries()) {
            if (entry.resetTime < now) store.delete(key);
        }
    }, 5 * 60 * 1000);

    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
        const key = req.ip || req.socket.remoteAddress || '0.0.0.0';
        const now = Date.now();
        const entry = store.get(key);

        if (!entry || entry.resetTime < now) {
            store.set(key, { count: 1, resetTime: now + windowMs });
            return next();
        }

        entry.count++;
        if (entry.count > maxRequests) {
            return res.status(429).json({ error: errorMessage });
        }
        next();
    };
}

// ===========================================
// AES-256-GCM Encryption for API Keys
// ===========================================
if (!process.env.ENCRYPTION_KEY) {
    console.error('[CRITICAL] ENCRYPTION_KEY is not set! API key encryption/decryption will not work.');
    console.error('[CRITICAL] Please ensure .env file contains ENCRYPTION_KEY and is in the correct path.');
    console.error('[CRITICAL] Server will continue but API key operations are DISABLED.');
}
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '';
const ENC_KEY_BUF = ENCRYPTION_KEY ? Buffer.from(ENCRYPTION_KEY, 'hex') : Buffer.alloc(32);
const ENCRYPTION_AVAILABLE = !!process.env.ENCRYPTION_KEY;

function encryptValue(plaintext: string): string {
    if (!ENCRYPTION_AVAILABLE) {
        console.error('[CRITICAL] Attempted to encrypt without ENCRYPTION_KEY! Operation blocked.');
        throw new Error('ENCRYPTION_KEY is not configured. Cannot encrypt API keys.');
    }
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', ENC_KEY_BUF, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

function decryptValue(encryptedStr: string): string {
    if (!ENCRYPTION_AVAILABLE) {
        console.error('[CRITICAL] Attempted to decrypt without ENCRYPTION_KEY! Returning empty.');
        return '';
    }
    try {
        const parts = encryptedStr.split(':');
        if (parts.length !== 3) return encryptedStr; // Not encrypted (legacy), return as-is
        const [ivHex, authTagHex, encrypted] = parts;
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-gcm', ENC_KEY_BUF, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch {
        console.error(`[CRITICAL] Decryption failed for value (len=${encryptedStr.length}). Key mismatch or corrupted data.`);
        return '';
    }
}

function isEncrypted(value: string | null | undefined): boolean {
    if (!value) return false;
    const parts = value.split(':');
    return parts.length === 3 && parts[0].length === 24 && parts[1].length === 32;
}

function encryptIfNeeded(value: string | null | undefined): string | null {
    if (!value) return null;
    if (isEncrypted(value)) return value; // Already encrypted
    return encryptValue(value);
}

const __filename_idx = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename_idx);

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
}));

// ===========================================
// Rate Limiters
// ===========================================
const globalLimiter = createRateLimiter(
    15 * 60 * 1000, 300,
    'リクエスト数が上限に達しました。しばらく経ってから再度お試しください。'
);

const authLimiter = createRateLimiter(
    15 * 60 * 1000, 20,
    '認証リクエスト数が上限に達しました。しばらく経ってから再度お試しください。'
);

const registrationLimiter = createRateLimiter(
    60 * 60 * 1000, 5,
    '登録リクエスト数が上限に達しました。しばらく経ってから再度お試しください。'
);

const contactLimiter = createRateLimiter(
    60 * 60 * 1000, 5,
    'お問い合わせの送信回数が上限に達しました。しばらく経ってから再度お試しください。'
);

app.use('/api/', globalLimiter);

// ===========================================
// Security Headers
// ===========================================
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
});

// Parse JSON for all routes EXCEPT Stripe webhook (needs raw body)
app.use((req, res, next) => {
    if (req.originalUrl === '/api/stripe/webhook') {
        next();
    } else {
        express.json({ limit: '10mb' })(req, res, next);
    }
});

// --- Simple Token-based Authentication Middleware ---
function generateSessionToken(): string {
    return crypto.randomBytes(32).toString('hex');
}

// In-memory session store (backed by DB for persistence across restarts)
const sessions = new Map<string, { email: string; role: string; userId: number }>();

// Session expiry: 30 days
const SESSION_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000;

// Persist session to DB when created
function saveSessionToDb(token: string, userId: number, email: string, role: string) {
    try {
        const expiresAt = new Date(Date.now() + SESSION_EXPIRY_MS).toISOString();
        db.prepare('INSERT OR REPLACE INTO sessions (token, user_id, email, role, expires_at) VALUES (?, ?, ?, ?, ?)').run(token, userId, email, role, expiresAt);
    } catch (e) {
        console.error('[Session] Failed to save session to DB:', e);
    }
}

// Remove session from DB when logged out
function removeSessionFromDb(token: string) {
    try {
        db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    } catch (e) {
        console.error('[Session] Failed to remove session from DB:', e);
    }
}

// Restore sessions from DB on startup (skip expired)
function restoreSessionsFromDb() {
    try {
        const now = new Date().toISOString();
        // Clean up expired sessions
        db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(now);

        const rows = db.prepare('SELECT token, user_id, email, role FROM sessions WHERE expires_at >= ?').all(now);
        for (const row of rows) {
            sessions.set(row.token as string, {
                email: row.email as string,
                role: row.role as string,
                userId: row.user_id as number
            });
        }
        console.log(`[Session] Restored ${rows.length} active sessions from DB.`);
    } catch (e) {
        console.error('[Session] Failed to restore sessions from DB:', e);
    }
}

function authenticateRequest(req: express.Request, res: express.Response, next: express.NextFunction) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token || !sessions.has(token)) {
        return res.status(401).json({ error: '認証が必要です。再ログインしてください。' });
    }

    // Check session expiry from DB on every request
    try {
        const sessionRow: any = db.prepare('SELECT expires_at FROM sessions WHERE token = ?').get(token);
        if (sessionRow && new Date(sessionRow.expires_at) < new Date()) {
            // Session expired - remove from memory and DB
            sessions.delete(token);
            removeSessionFromDb(token);
            return res.status(401).json({ error: 'セッションの有効期限が切れています。再ログインしてください。' });
        }
    } catch {
        // If DB check fails, continue with in-memory session
    }

    (req as any).session = sessions.get(token);
    (req as any).sessionToken = token;
    next();
}

function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
    const session = (req as any).session;
    if (!session || session.role !== 'admin') {
        return res.status(403).json({ error: '管理者権限が必要です。' });
    }
    next();
}

// IDOR protection: Verify URL :email param matches the authenticated session email
function verifyEmailOwnership(req: express.Request, res: express.Response, next: express.NextFunction) {
    const session = (req as any).session;
    const urlEmail = req.params.email;
    if (!session || !urlEmail) {
        return res.status(400).json({ error: 'パラメータが不正です。' });
    }
    // Admin can access any user's data
    if (session.role === 'admin') {
        return next();
    }
    if (session.email !== urlEmail) {
        return res.status(403).json({ error: '他のユーザーのデータにアクセスする権限がありません。' });
    }
    next();
}

// SMTP Mail Transporter (fallback)
const smtpTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.example.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: (process.env.SMTP_SECURE || 'false') === 'true',
    auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
    },
});

const MAIL_FROM = process.env.SMTP_FROM || process.env.SES_SENDER_EMAIL || 'info@sns-tool.online';
const ADMIN_KEY = process.env.ADMIN_KEY || 'pos_admin_2024_xserver_secure';

// メール送信ヘルパー関数 (PHP mail() proxy 経由 → フォールバック: SMTP)
async function sendMail(to: string, subject: string, html: string): Promise<boolean> {
    // 1. Try PHP mail proxy first (works on Xserver without SMTP auth)
    try {
        const phpMailUrl = 'https://sns-tool.online/posutto/server/send_mail.php';
        const response = await fetch(phpMailUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to, subject, html, from: MAIL_FROM, key: ADMIN_KEY }),
        });
        const result = await response.json();
        if (result.success) {
            console.log(`[MAIL-PHP] Successfully sent to ${to}: ${subject}`);
            return true;
        }
        console.warn(`[MAIL-PHP] Failed for ${to}:`, result.error || 'unknown error');
    } catch (phpErr: any) {
        console.warn(`[MAIL-PHP] Proxy error for ${to}:`, phpErr.message);
    }

    // 2. Fallback to SMTP
    try {
        await smtpTransporter.sendMail({
            from: `"Posutto" <${MAIL_FROM}>`,
            to,
            subject,
            html,
        });
        console.log(`[MAIL-SMTP] Successfully sent to ${to}: ${subject}`);
        return true;
    } catch (error: any) {
        console.error(`[MAIL] Failed to send to ${to}:`, error.message);
        return false;
    }
}

// Twitter Client
const twitterClient = process.env.X_BEARER_TOKEN ? new TwitterApi(process.env.X_BEARER_TOKEN) : null;
const xClient = twitterClient?.readOnly;

// --- Database Seed ---
const seedMasterAccount = async () => {
    const email = process.env.MASTER_EMAIL || 'admin@posutto.com';
    const password = process.env.MASTER_PASSWORD || 'ChangeMe123!';
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
        db.prepare('INSERT INTO users (email, password, role, plan, name) VALUES (?, ?, ?, ?, ?)').run(
            email,
            hashedPassword,
            'admin',
            'advanced_170',
            'Master User'
        );
        console.log('[DB] Master account seeded.');
    }
};
// seedMasterAccount() is called in startServer() after DB init

// --- Endpoints ---

// Auth: CAPTCHA Generation
app.get('/api/auth/captcha', (req, res) => {
    try {
        const num1 = Math.floor(Math.random() * 10) + 1;
        const num2 = Math.floor(Math.random() * 10) + 1;
        const answer = (num1 + num2).toString();
        const question = `${num1} + ${num2}`;
        const id = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

        db.prepare('INSERT INTO captchas (id, answer, expires_at) VALUES (?, ?, ?)').run(id, answer, expiresAt);
        console.log(`[AUTH] Generated CAPTCHA: id=${id}, answer=${answer}, expiresAt=${expiresAt}`);

        // Periodically cleanup expired captchas
        if (Math.random() < 0.1) {
            db.prepare('DELETE FROM captchas WHERE expires_at < ?').run(new Date().toISOString());
        }

        res.json({ id, question });
    } catch (error: any) {
        console.error('[ERROR]', error.message); res.status(500).json({ error: 'サーバーエラーが発生しました。' });
    }
});

// Auth: Register
app.post('/api/auth/register', registrationLimiter, async (req, res) => {
    const { email, password, name, referralCode } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "メールアドレスとパスワードは必須です。" });
    }

    // Input validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email) || email.length > 255) {
        return res.status(400).json({ error: "有効なメールアドレスを入力してください。" });
    }
    if (password.length < 8 || password.length > 128) {
        return res.status(400).json({ error: "パスワードは8文字以上128文字以内で設定してください。" });
    }
    if (name && name.length > 100) {
        return res.status(400).json({ error: "名前は100文字以内で入力してください。" });
    }

    try {
        // Check for duplicate email
        const existing: any = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (existing) {
            return res.status(409).json({ error: "このメールアドレスは既に登録されています。" });
        }

        // Resolve referral code to referrer user id
        let referredBy: number | null = null;
        if (referralCode) {
            const referrer: any = db.prepare('SELECT id FROM users WHERE referral_code = ?').get(referralCode);
            if (referrer) {
                referredBy = referrer.id;
            }
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate unique referral code for the new user
        const newReferralCode = crypto.randomBytes(4).toString('hex');

        // Insert into DB (new users start on free plan)
        const result = db.prepare('INSERT INTO users (email, password, role, plan, name, referral_code, referred_by) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
            email,
            hashedPassword,
            'user',
            'free',
            name || null,
            newReferralCode,
            referredBy
        );

        const user: any = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
        const { password: _password, ...userData } = user;

        // Create session token
        const sessionToken = generateSessionToken();
        sessions.set(sessionToken, { email: user.email, role: user.role, userId: user.id });
        saveSessionToDb(sessionToken, user.id, user.email, user.role);

        // Send welcome email in background via SMTP
        sendMail(
            email,
            '【Posutto】会員登録完了のお知らせ',
            `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
                    <h2 style="color: #7c3aed;">Posuttoへようこそ！</h2>
                    <p>${name ? name + 'さん、' : ''}この度はPosuttoにご登録いただき、誠にありがとうございます。</p>
                    <p>アカウントの作成が正常に完了いたしました。</p>
                    <p style="color: #666; font-size: 14px;">※ 本メールに心当たりがない場合は、お手数ですが破棄をお願いいたします。</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="color: #999; font-size: 12px;">© 2025 Posutto. All rights reserved.</p>
                </div>
            `
        ).catch((err: any) => console.error("Registration email error:", err));

        // Notify admin of new registration
        const adminEmail = process.env.MASTER_EMAIL || 'admin@posutto.com';
        const totalUsers: any = db.prepare('SELECT COUNT(*) as count FROM users').get();
        const referrerInfo = referredBy
            ? (() => { const r: any = db.prepare('SELECT name, email FROM users WHERE id = ?').get(referredBy); return r ? `${r.name || r.email}` : `ID: ${referredBy}`; })()
            : 'なし';
        sendMail(
            adminEmail,
            '【Posutto管理】新規会員登録がありました',
            `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
                    <h2 style="color: #7c3aed;">新規会員登録通知</h2>
                    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                        <tr><td style="padding: 8px 12px; background: #f9fafb; border: 1px solid #eee; font-weight: bold; width: 120px;">名前</td><td style="padding: 8px 12px; border: 1px solid #eee;">${name || '未設定'}</td></tr>
                        <tr><td style="padding: 8px 12px; background: #f9fafb; border: 1px solid #eee; font-weight: bold;">メール</td><td style="padding: 8px 12px; border: 1px solid #eee;">${email}</td></tr>
                        <tr><td style="padding: 8px 12px; background: #f9fafb; border: 1px solid #eee; font-weight: bold;">プラン</td><td style="padding: 8px 12px; border: 1px solid #eee;">フリー</td></tr>
                        <tr><td style="padding: 8px 12px; background: #f9fafb; border: 1px solid #eee; font-weight: bold;">紹介者</td><td style="padding: 8px 12px; border: 1px solid #eee;">${referrerInfo}</td></tr>
                        <tr><td style="padding: 8px 12px; background: #f9fafb; border: 1px solid #eee; font-weight: bold;">登録日時</td><td style="padding: 8px 12px; border: 1px solid #eee;">${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}</td></tr>
                        <tr><td style="padding: 8px 12px; background: #f9fafb; border: 1px solid #eee; font-weight: bold;">総ユーザー数</td><td style="padding: 8px 12px; border: 1px solid #eee;">${totalUsers.count}人</td></tr>
                    </table>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="color: #999; font-size: 12px;">この通知はPosuttoシステムから自動送信されています。</p>
                </div>
            `
        ).catch((err: any) => console.error("Admin notification email error:", err));

        res.json({ ...userData, token: sessionToken });
    } catch (error: any) {
        console.error("Registration Error:", error);
        res.status(500).json({ error: 'アカウント登録中にエラーが発生しました。' });
    }
});

// Auth: Login
app.post('/api/auth/login', authLimiter, async (req, res) => {
    const { email, password, captchaId, captchaAnswer } = req.body || {};
    const ipAddress = req.ip || req.socket.remoteAddress || '0.0.0.0';
    console.log(`[AUTH] Login attempt: email=${email}, ip=${ipAddress}`);

    if (!email || !password) {
        return res.status(400).json({ error: 'メールアドレスとパスワードは必須です。' });
    }

    try {
        // --- 1. Throttling Check ---
        const loginAttempt: any = db.prepare('SELECT * FROM login_attempts WHERE ip_address = ? AND email = ?').get(ipAddress, email);
        if (loginAttempt) {
            if (loginAttempt.locked_until && new Date(loginAttempt.locked_until) > new Date()) {
                const waitTime = Math.ceil((new Date(loginAttempt.locked_until).getTime() - Date.now()) / 1000 / 60);
                return res.status(429).json({ error: `ログイン試行回数が上限を超えました。${waitTime}分後に再度お試しください。` });
            }
        }

        // --- 2. CAPTCHA Verification ---
        if (!captchaId) {
            return res.status(400).json({ error: "CAPTCHAが必要です。ページをリロードしてください。" });
        }
        const captcha: any = db.prepare('SELECT * FROM captchas WHERE id = ?').get(captchaId);
        console.log(`[AUTH] Verifying CAPTCHA: id=${captchaId}, found=${!!captcha}`);

        if (!captcha) {
            return res.status(400).json({ error: "CAPTCHAの有効期限が切れています。もう一度お試しください。" });
        }

        console.log(`[AUTH] CAPTCHA data: answer=${captcha.answer}, input=${captchaAnswer}, expiresAt=${captcha.expires_at}, now=${new Date().toISOString()}`);

        if (String(captcha.answer) !== String(captchaAnswer)) {
            return res.status(400).json({ error: "CAPTCHAの答えが正しくありません。" });
        }

        // Add 30 seconds buffer for clock skew
        const now = new Date();
        const expiryDate = new Date(captcha.expires_at);
        const bufferTime = 30 * 1000; // 30 seconds

        if (expiryDate.getTime() + bufferTime < now.getTime()) {
            console.log(`[AUTH] CAPTCHA truly expired: expiresAt=${captcha.expires_at}, now=${now.toISOString()}`);
            db.prepare('DELETE FROM captchas WHERE id = ?').run(captchaId);
            return res.status(400).json({ error: "CAPTCHAの有効期限が切れています。" });
        }

        db.prepare('DELETE FROM captchas WHERE id = ?').run(captchaId);

        // --- 3. Credential Verification ---
        const user: any = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        if (!user) {
            // Record failed attempt
            recordLoginAttempt(String(ipAddress), email, false);
            return res.status(401).json({ error: "ユーザーが見つかりません。" });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            // Record failed attempt
            recordLoginAttempt(String(ipAddress), email, false);
            return res.status(401).json({ error: "パスワードが正しくありません。" });
        }

        // Reset login attempts on password success
        recordLoginAttempt(String(ipAddress), email, true);

        // --- 4. Admin: Skip 2FA, login directly ---
        if (user.role === 'admin') {
            const { password: _password, ...userData } = user;
            const sessionToken = generateSessionToken();
            sessions.set(sessionToken, { email: user.email, role: user.role, userId: user.id });
            saveSessionToDb(sessionToken, user.id, user.email, user.role);
            console.log(`[AUTH] Admin login success (2FA skipped): ${email}`);
            return res.json({ ...userData, token: sessionToken, require2FA: false });
        }

        // --- 5. 2FA Generation (for non-admin users) ---
        // Generate 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

        // Save token
        db.prepare('INSERT OR REPLACE INTO two_factor_tokens (email, token, expires_at) VALUES (?, ?, ?)').run(email, code, expiresAt);

        // Send 2FA code email via SMTP
        let emailSent = false;
        let errorMessage = "";

        try {
            emailSent = await sendMail(
                email,
                '【Posutto】ログイン認証コード',
                `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
                        <h2 style="color: #7c3aed;">認証コードのお知らせ</h2>
                        <p>ログインを完了するには、以下の6桁のコードを入力してください。</p>
                        <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border-radius: 8px;">
                            ${code}
                        </div>
                        <p style="color: #666; font-size: 14px;">※ コードの有効期限は10分間です。</p>
                        <p style="color: #999; font-size: 12px;">※ 本メールに心当たりがない場合は、お手数ですが無視してください。</p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                        <p style="color: #999; font-size: 12px;">© 2025 Posutto. All rights reserved.</p>
                    </div>
                `
            );
            if (!emailSent) {
                errorMessage = "SMTP送信に失敗しました";
            }
        } catch (error: any) {
            console.error("SMTP Send Error:", error);
            errorMessage = error.message;
        }

        res.json({
            require2FA: true,
            message: emailSent ? "認証コードを送信しました。" : `メール送信エラー: ${errorMessage}`,
        });

    } catch (error: any) {
        console.error("Login Error:", error);
        res.status(500).json({ error: 'ログイン処理中にエラーが発生しました。' });
    }
});

// Auth: Verify 2FA
app.post('/api/auth/verify-2fa', authLimiter, (req, res) => {
    const { email, code } = req.body;
    try {
        const tokenEntry: any = db.prepare('SELECT * FROM two_factor_tokens WHERE email = ?').get(email);

        if (!tokenEntry) {
            return res.status(400).json({ error: "認証コードが見つかりません。再ログインしてください。" });
        }

        if (new Date(tokenEntry.expires_at) < new Date()) {
            return res.status(400).json({ error: "認証コードの有効期限が切れています。" });
        }

        if (tokenEntry.token !== code) {
            return res.status(400).json({ error: "認証コードが正しくありません。" });
        }

        // Cleanup token
        db.prepare('DELETE FROM two_factor_tokens WHERE email = ?').run(email);

        // Return user data (Login Success)
        const user: any = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        if (!user) {
            return res.status(404).json({ error: "ユーザーが見つかりません。" });
        }
        const { password: _password, ...userData } = user;

        // Create session token
        const sessionToken = generateSessionToken();
        sessions.set(sessionToken, { email: user.email, role: user.role, userId: user.id });
        saveSessionToDb(sessionToken, user.id, user.email, user.role);

        res.json({ ...userData, token: sessionToken });

    } catch (error: any) {
        console.error('[ERROR]', error.message); res.status(500).json({ error: 'サーバーエラーが発生しました。' });
    }
});

// Auth: Request Password Reset (sends reset code via SMTP)
app.post('/api/auth/request-reset', authLimiter, async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ error: "メールアドレスは必須です。" });
    }

    try {
        const user: any = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        // Always return success to prevent email enumeration
        if (!user) {
            return res.json({ success: true, message: "リセットコードを送信しました。" });
        }

        // Generate 6-digit reset code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes

        // Store in two_factor_tokens table (reuse for reset)
        db.prepare('INSERT OR REPLACE INTO two_factor_tokens (email, token, expires_at) VALUES (?, ?, ?)').run(email, code, expiresAt);

        // Send reset email via SMTP
        const emailSent = await sendMail(
            email,
            '【Posutto】パスワード再設定コード',
            `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
                    <h2 style="color: #7c3aed;">パスワード再設定</h2>
                    <p>パスワードの再設定が要求されました。以下の6桁のコードを入力してください。</p>
                    <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border-radius: 8px;">
                        ${code}
                    </div>
                    <p style="color: #666; font-size: 14px;">※ コードの有効期限は15分間です。</p>
                    <p style="color: #999; font-size: 12px;">※ このリクエストに心当たりがない場合は、本メールを無視してください。</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="color: #999; font-size: 12px;">© 2025 Posutto. All rights reserved.</p>
                </div>
            `
        );

        console.log(`[AUTH] Password reset code for ${email}: emailSent: ${emailSent}`);

        res.json({
            success: true,
            message: emailSent ? "リセットコードを送信しました。" : "メール送信に問題がありました。",
        });
    } catch (error: any) {
        console.error("Password Reset Request Error:", error);
        console.error('[ERROR]', error.message); res.status(500).json({ error: 'サーバーエラーが発生しました。' });
    }
});

// Auth: Verify Reset Code and Set New Password
app.post('/api/auth/reset-password', async (req, res) => {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
        return res.status(400).json({ error: "すべての項目を入力してください。" });
    }

    if (newPassword.length < 8) {
        return res.status(400).json({ error: "パスワードは8文字以上で設定してください。" });
    }

    try {
        const tokenEntry: any = db.prepare('SELECT * FROM two_factor_tokens WHERE email = ?').get(email);

        if (!tokenEntry) {
            return res.status(400).json({ error: "リセットコードが見つかりません。再度リクエストしてください。" });
        }

        if (new Date(tokenEntry.expires_at) < new Date()) {
            db.prepare('DELETE FROM two_factor_tokens WHERE email = ?').run(email);
            return res.status(400).json({ error: "リセットコードの有効期限が切れています。" });
        }

        if (tokenEntry.token !== code) {
            return res.status(400).json({ error: "リセットコードが正しくありません。" });
        }

        // Update password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        db.prepare('UPDATE users SET password = ? WHERE email = ?').run(hashedPassword, email);

        // Cleanup token
        db.prepare('DELETE FROM two_factor_tokens WHERE email = ?').run(email);

        // Invalidate all existing sessions for this user (security: force re-login)
        const user: any = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (user) {
            const userSessions = db.prepare('SELECT token FROM sessions WHERE user_id = ?').all(user.id);
            for (const sess of userSessions) {
                sessions.delete(sess.token as string);
            }
            db.prepare('DELETE FROM sessions WHERE user_id = ?').run(user.id);
            console.log(`[AUTH] Password reset for ${email}, invalidated ${userSessions.length} sessions`);
        }

        console.log(`[AUTH] Password reset successful for ${email}`);
        res.json({ success: true, message: "パスワードを再設定しました。" });
    } catch (error: any) {
        console.error("Password Reset Error:", error);
        console.error('[ERROR]', error.message); res.status(500).json({ error: 'サーバーエラーが発生しました。' });
    }
});

// Auth: Delete Account (Self-service)
app.delete('/api/auth/account', authenticateRequest, async (req, res) => {
    const session = (req as any).session;
    const password = req.body?.password;

    try {
        const user: any = db.prepare('SELECT * FROM users WHERE email = ?').get(session.email);
        if (!user) {
            return res.status(404).json({ error: "ユーザーが見つかりません。" });
        }

        // Verify password for confirmation
        if (password) {
            const isValid = await bcrypt.compare(password, user.password);
            if (!isValid) {
                return res.status(401).json({ error: "パスワードが正しくありません。" });
            }
        }

        // Cancel Stripe subscription if exists
        const userSub: any = db.prepare('SELECT stripe_subscription_id FROM subscriptions WHERE user_id = ?').get(user.id);
        if (userSub?.stripe_subscription_id) {
            try { await stripe.subscriptions.cancel(userSub.stripe_subscription_id); } catch (e: any) {
                console.warn('[Stripe] Failed to cancel on account deletion:', e.message);
            }
        }

        // Delete related data (order matters for foreign key references)
        db.prepare('DELETE FROM subscriptions WHERE user_id = ?').run(user.id);
        db.prepare('DELETE FROM referral_rewards WHERE referrer_id = ? OR referred_id = ?').run(user.id, user.id);
        db.prepare('DELETE FROM referral_bonus_content WHERE user_id = ?').run(user.id);
        db.prepare('DELETE FROM liked_tweets WHERE bot_id IN (SELECT id FROM bots WHERE user_id = ?)').run(user.id);
        db.prepare('DELETE FROM followed_users WHERE bot_id IN (SELECT id FROM bots WHERE user_id = ?)').run(user.id);
        db.prepare('DELETE FROM posted_tweets WHERE bot_id IN (SELECT id FROM bots WHERE user_id = ?)').run(user.id);
        db.prepare('DELETE FROM bot_logs WHERE bot_id IN (SELECT id FROM bots WHERE user_id = ?)').run(user.id);
        db.prepare('DELETE FROM bots WHERE user_id = ?').run(user.id);
        db.prepare('DELETE FROM accounts WHERE user_id = ?').run(user.id);
        db.prepare('DELETE FROM links WHERE user_id = ?').run(user.id);
        db.prepare('DELETE FROM analytics_events WHERE user_id = ?').run(user.id);
        db.prepare('DELETE FROM daily_metrics WHERE user_id = ?').run(user.id);
        db.prepare('DELETE FROM two_factor_tokens WHERE email = ?').run(session.email);
        db.prepare('DELETE FROM login_attempts WHERE email = ?').run(session.email);
        db.prepare('DELETE FROM sessions WHERE user_id = ?').run(user.id);
        db.prepare('DELETE FROM users WHERE id = ?').run(user.id);

        // Remove session from memory
        for (const [token, sess] of sessions.entries()) {
            if (sess.email === session.email) {
                sessions.delete(token);
            }
        }

        console.log(`[AUTH] Account deleted: ${session.email}`);
        res.json({ success: true, message: "アカウントを削除しました。" });
    } catch (error: any) {
        console.error("Account Delete Error:", error);
        console.error('[ERROR]', error.message); res.status(500).json({ error: 'サーバーエラーが発生しました。' });
    }
});

// Admin: Delete User
app.delete('/api/admin/users/:id', authenticateRequest, requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const user: any = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
        if (!user) {
            return res.status(404).json({ error: "ユーザーが見つかりません。" });
        }

        // Prevent deleting admin users
        if (user.role === 'admin') {
            return res.status(403).json({ error: "管理者アカウントは削除できません。" });
        }

        // Cancel Stripe subscription if exists
        const adminDelSub: any = db.prepare('SELECT stripe_subscription_id FROM subscriptions WHERE user_id = ?').get(user.id);
        if (adminDelSub?.stripe_subscription_id) {
            try { await stripe.subscriptions.cancel(adminDelSub.stripe_subscription_id); } catch (e: any) {
                console.warn('[Stripe] Failed to cancel on admin deletion:', e.message);
            }
        }

        // Delete all related data (order matters for foreign key references)
        db.prepare('DELETE FROM subscriptions WHERE user_id = ?').run(user.id);
        db.prepare('DELETE FROM referral_rewards WHERE referrer_id = ? OR referred_id = ?').run(user.id, user.id);
        db.prepare('DELETE FROM referral_bonus_content WHERE user_id = ?').run(user.id);
        db.prepare('DELETE FROM liked_tweets WHERE bot_id IN (SELECT id FROM bots WHERE user_id = ?)').run(user.id);
        db.prepare('DELETE FROM followed_users WHERE bot_id IN (SELECT id FROM bots WHERE user_id = ?)').run(user.id);
        db.prepare('DELETE FROM posted_tweets WHERE bot_id IN (SELECT id FROM bots WHERE user_id = ?)').run(user.id);
        db.prepare('DELETE FROM bot_logs WHERE bot_id IN (SELECT id FROM bots WHERE user_id = ?)').run(user.id);
        db.prepare('DELETE FROM bots WHERE user_id = ?').run(user.id);
        db.prepare('DELETE FROM accounts WHERE user_id = ?').run(user.id);
        db.prepare('DELETE FROM links WHERE user_id = ?').run(user.id);
        db.prepare('DELETE FROM analytics_events WHERE user_id = ?').run(user.id);
        db.prepare('DELETE FROM daily_metrics WHERE user_id = ?').run(user.id);
        db.prepare('DELETE FROM two_factor_tokens WHERE email = ?').run(user.email);
        db.prepare('DELETE FROM login_attempts WHERE email = ?').run(user.email);
        db.prepare('DELETE FROM sessions WHERE user_id = ?').run(user.id);
        db.prepare('DELETE FROM users WHERE id = ?').run(user.id);

        // Remove sessions from memory
        for (const [token, sess] of sessions.entries()) {
            if (sess.email === user.email) {
                sessions.delete(token);
            }
        }

        console.log(`[ADMIN] User deleted: ${user.email} (ID: ${user.id})`);
        res.json({ success: true, message: `ユーザー ${user.email} を削除しました。` });
    } catch (error: any) {
        console.error("Admin User Delete Error:", error);
        console.error('[ERROR]', error.message); res.status(500).json({ error: 'サーバーエラーが発生しました。' });
    }
});

// Auth: Change Password (authenticated user)
app.post('/api/auth/change-password', authenticateRequest, async (req, res) => {
    const session = (req as any).session;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "現在のパスワードと新しいパスワードを入力してください。" });
    }

    if (newPassword.length < 8) {
        return res.status(400).json({ error: "新しいパスワードは8文字以上で設定してください。" });
    }

    try {
        const user: any = db.prepare('SELECT * FROM users WHERE email = ?').get(session.email);
        if (!user) {
            return res.status(404).json({ error: "ユーザーが見つかりません。" });
        }

        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) {
            return res.status(401).json({ error: "現在のパスワードが正しくありません。" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        db.prepare('UPDATE users SET password = ? WHERE email = ?').run(hashedPassword, session.email);

        // Invalidate all other sessions for this user (keep current session)
        const currentToken = (req as any).sessionToken;
        const userSessions = db.prepare('SELECT token FROM sessions WHERE user_id = ? AND token != ?').all(session.userId, currentToken);
        for (const sess of userSessions) {
            sessions.delete(sess.token as string);
        }
        db.prepare('DELETE FROM sessions WHERE user_id = ? AND token != ?').run(session.userId, currentToken);
        console.log(`[AUTH] Password changed for ${session.email}, invalidated ${userSessions.length} other sessions`);

        res.json({ success: true, message: "パスワードを変更しました。" });
    } catch (error: any) {
        console.error("Change Password Error:", error);
        res.status(500).json({ error: 'パスワード変更中にエラーが発生しました。' });
    }
});

// Auth: Change Email
app.post('/api/auth/change-email', authenticateRequest, async (req, res) => {
    const session = (req as any).session;
    const { newEmail, password } = req.body;

    if (!newEmail || !password) {
        return res.status(400).json({ error: "新しいメールアドレスとパスワードを入力してください。" });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
        return res.status(400).json({ error: "有効なメールアドレスを入力してください。" });
    }

    try {
        const user: any = db.prepare('SELECT * FROM users WHERE email = ?').get(session.email);
        if (!user) {
            return res.status(404).json({ error: "ユーザーが見つかりません。" });
        }

        // Verify password
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ error: "パスワードが正しくありません。" });
        }

        // Check if new email is same as current
        if (newEmail === session.email) {
            return res.status(400).json({ error: "現在と同じメールアドレスです。" });
        }

        // Check if new email is already in use
        const existing: any = db.prepare('SELECT id FROM users WHERE email = ?').get(newEmail);
        if (existing) {
            return res.status(409).json({ error: "このメールアドレスは既に使用されています。" });
        }

        // Update email in all related tables
        const oldEmail = session.email;
        db.prepare('UPDATE users SET email = ? WHERE email = ?').run(newEmail, oldEmail);
        db.prepare('UPDATE two_factor_tokens SET email = ? WHERE email = ?').run(newEmail, oldEmail);

        // Update session
        session.email = newEmail;

        // Return updated user data
        const updatedUser: any = db.prepare('SELECT * FROM users WHERE email = ?').get(newEmail);
        const { password: _pw, ...userData } = updatedUser;

        console.log(`[AUTH] Email changed: ${oldEmail} -> ${newEmail}`);
        res.json({ success: true, message: "メールアドレスを変更しました。", user: userData });
    } catch (error: any) {
        console.error("Change Email Error:", error);
        console.error('[ERROR]', error.message); res.status(500).json({ error: 'サーバーエラーが発生しました。' });
    }
});

// Helper: Record Login Attempt
const recordLoginAttempt = (ip: string, email: string, isSuccess: boolean) => {
    const now = new Date();
    const existing: any = db.prepare('SELECT * FROM login_attempts WHERE ip_address = ? AND email = ?').get(ip, email);

    if (isSuccess) {
        if (existing) {
            db.prepare('UPDATE login_attempts SET attempts = 0, locked_until = NULL, updated_at = ? WHERE ip_address = ? AND email = ?').run(now.toISOString(), ip, email);
        }
    } else {
        const attempts = existing ? existing.attempts + 1 : 1;
        let lockedUntil: string | null = existing?.locked_until ?? null;

        // Lock for 15 minutes after 5 failures
        if (attempts >= 5) {
            const lockTime = new Date(now.getTime() + 15 * 60 * 1000);
            lockedUntil = lockTime.toISOString();
        }

        if (existing) {
            db.prepare('UPDATE login_attempts SET attempts = ?, locked_until = ?, updated_at = ? WHERE ip_address = ? AND email = ?').run(attempts, lockedUntil, now.toISOString(), ip, email);
        } else {
            db.prepare('INSERT INTO login_attempts (ip_address, email, attempts, locked_until, updated_at) VALUES (?, ?, ?, ?, ?)').run(ip, email, attempts, lockedUntil, now.toISOString());
        }
    }
};

// Auth: Profile (Fetch current user state)
app.get('/api/auth/profile/:email', authenticateRequest, verifyEmailOwnership, (req, res) => {
    const { email } = req.params;
    try {
        const user: any = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        if (!user) return res.status(404).json({ error: "User not found" });

        const { password: _password, ...userData } = user;
        res.json(userData);
    } catch (error: any) {
        console.error('[ERROR]', error.message); res.status(500).json({ error: 'サーバーエラーが発生しました。' });
    }
});

// Admin: List Users (with referrer info)
app.get('/api/admin/users', authenticateRequest, requireAdmin, (req, res) => {
    try {
        const users = db.prepare(`
            SELECT u.id, u.email, u.role, u.plan, u.name, u.created_at, u.referred_by,
                   r.name as referrer_name, r.email as referrer_email
            FROM users u
            LEFT JOIN users r ON u.referred_by = r.id
            ORDER BY u.id DESC
        `).all();
        res.json(users);
    } catch (error: any) {
        console.error('[ERROR]', error.message); res.status(500).json({ error: 'サーバーエラーが発生しました。' });
    }
});

// Direct plan update: admin-only (users must go through Stripe)
app.post('/api/user/update-plan', authenticateRequest, (req, res) => {
    const { email, plan } = req.body;
    const session = (req as any).session;
    if (session.role !== 'admin') {
        return res.status(403).json({ error: 'プラン変更はショップページから行ってください。' });
    }
    try {
        db.prepare('UPDATE users SET plan = ? WHERE email = ?').run(plan, email);
        res.json({ success: true, plan });
    } catch (error) {
        console.error('[API] plan update failed:', error);
        res.status(500).json({ error: 'プラン更新に失敗しました。' });
    }
});

// Bots: List for User
app.get('/api/bots/:email', authenticateRequest, verifyEmailOwnership, (req, res) => {
    const { email } = req.params;
    try {
        const user: any = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (!user) return res.status(404).json({ error: "User not found" });

        const bots = db.prepare('SELECT * FROM bots WHERE user_id = ?').all(user.id);
        const formattedBots = bots.map((b: any) => {
            // Lookup screen_name from accounts table
            const account: any = b.account_id
                ? db.prepare('SELECT screen_name FROM accounts WHERE id = ?').get(b.account_id)
                : null;
            // Lookup last run time from posted_tweets
            const lastPost: any = db.prepare(
                'SELECT created_at FROM posted_tweets WHERE bot_id = ? ORDER BY created_at DESC LIMIT 1'
            ).get(b.id);
            let lastRun = '';
            if (lastPost?.created_at) {
                const d = new Date(lastPost.created_at + 'Z');
                lastRun = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
            }
            // Lookup cumulative likes and follows
            const totalLikes: any = db.prepare(
                'SELECT COUNT(*) as count FROM liked_tweets WHERE bot_id = ?'
            ).get(b.id);
            const totalFollows: any = db.prepare(
                'SELECT COUNT(*) as count FROM followed_users WHERE bot_id = ?'
            ).get(b.id);
            return {
                ...b,
                accountId: b.account_id,  // camelCase mapping for frontend
                screenName: account?.screen_name || '',
                settings: JSON.parse(b.settings || '{}'),
                schedule: JSON.parse(b.schedule || '[]'),
                lastRun,
                metrics: {
                    likes: totalLikes?.count || 0,
                    follows: totalFollows?.count || 0,
                },
            };
        });
        res.json(formattedBots);
    } catch (error: any) {
        console.error('[ERROR]', error.message); res.status(500).json({ error: 'サーバーエラーが発生しました。' });
    }
});

// Bots: Save/Update
app.post('/api/bots/save', authenticateRequest, (req, res) => {
    const { email, bot } = req.body;
    const session = (req as any).session;
    if (session.role !== 'admin' && session.email !== email) {
        return res.status(403).json({ error: '他のユーザーのBotを操作する権限がありません。' });
    }
    try {
        const user: any = db.prepare('SELECT id, plan FROM users WHERE email = ?').get(email);
        if (!user) return res.status(404).json({ error: "User not found" });

        // Check limits if creating a new bot
        if (!bot.id) {
            const count: any = db.prepare('SELECT COUNT(*) as count FROM bots WHERE user_id = ?').get(user.id);
            // Sync with PLAN_DETAILS in src/types/plans.ts
            const botLimits: any = {
                'free': 1,
                'starter': 10,
                'advanced': 30,
                'advanced_20': 50,
                'advanced_70': 100,
                'advanced_170': 200
            };
            const limit = botLimits[user.plan] || 0;
            if (count.count >= limit) {
                return res.status(403).json({ error: `プラン作成上限（${limit}個）に達しています。` });
            }
        }

        // Check schedule slot limits (tweets per day)
        const tweetLimits: any = {
            'free': 5,
            'starter': 25,
            'advanced': 25,
            'advanced_20': 25,
            'advanced_70': 25,
            'advanced_170': 25
        };
        const maxTweets = tweetLimits[user.plan] || 0;
        const scheduleCount = Array.isArray(bot.schedule) ? bot.schedule.length : 0;

        if (scheduleCount > maxTweets) {
            return res.status(403).json({ error: `1日あたりの投稿上限（${maxTweets}回）を超えています。現在: ${scheduleCount}回` });
        }

        // Sanitize: SQLite cannot bind undefined values
        const botName = bot.name || '';
        const botAccountId = bot.accountId || '';
        const botSettings = JSON.stringify(bot.settings || {});
        const botSchedule = JSON.stringify(bot.schedule || []);
        const botStatus = bot.status || 'inactive';

        let botId = bot.id;
        if (!botId) {
            botId = crypto.randomUUID();
            db.prepare('INSERT INTO bots (id, user_id, name, account_id, settings, schedule, status) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
                botId,
                user.id,
                botName,
                botAccountId,
                botSettings,
                botSchedule,
                botStatus
            );
        } else {
            db.prepare('UPDATE bots SET name = ?, account_id = ?, settings = ?, schedule = ?, status = ? WHERE id = ? AND user_id = ?').run(
                botName,
                botAccountId,
                botSettings,
                botSchedule,
                botStatus,
                bot.id,
                user.id
            );
        }

        res.json({ success: true, botId });
    } catch (error: any) {
        console.error("Bot Save Error:", error);
        console.error('[ERROR]', error.message); res.status(500).json({ error: 'サーバーエラーが発生しました。' });
    }
});

// Accounts: Test X API connection
app.post('/api/accounts/test', authenticateRequest, async (req, res) => {
    const { apiKey, apiSecret, accessToken, accessTokenSecret } = req.body;

    if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret) {
        return res.status(400).json({ error: '4つのAPIキーがすべて必要です。' });
    }

    try {
        const testClient = new TwitterApi({
            appKey: apiKey,
            appSecret: apiSecret,
            accessToken: accessToken,
            accessSecret: accessTokenSecret,
        });

        const me = await testClient.v2.me({
            'user.fields': ['name', 'username', 'profile_image_url']
        });

        res.json({
            success: true,
            user: {
                id: me.data.id,
                name: me.data.name,
                username: me.data.username,
                profileImageUrl: me.data.profile_image_url
            }
        });
    } catch (error: any) {
        console.error('[API Test] X API connection failed:', error.message);
        // Always return 400 (not 401) to avoid triggering frontend's global 401→login redirect
        let errorMsg = 'X APIへの接続に失敗しました。';
        if (error?.code === 401 || error?.data?.status === 401) {
            errorMsg = 'APIキーまたはトークンが無効です。Developer Portalで確認してください。';
        } else if (error?.code === 403 || error?.data?.status === 403) {
            errorMsg = 'APIの権限が不足しています。App permissionsが「Read and Write」になっているか確認してください。';
        } else if (error?.code === 429 || error?.data?.status === 429) {
            errorMsg = 'APIのレート制限に達しました。しばらく待ってから再試行してください。';
        }
        res.status(400).json({ error: errorMsg, detail: error.message });
    }
});

// Accounts: Test X API connection by account ID (uses stored keys from DB)
app.post('/api/accounts/test-by-id', authenticateRequest, async (req, res) => {
    const { accountId } = req.body;
    const session = (req as any).session;

    if (!accountId) {
        return res.status(400).json({ error: 'アカウントIDが必要です。' });
    }

    try {
        const account: any = db.prepare('SELECT * FROM accounts WHERE id = ? AND user_id = ?').get(accountId, session.userId);
        if (!account) return res.status(404).json({ error: 'アカウントが見つかりません。' });

        if (!account.api_key || !account.api_secret || !account.access_token || !account.access_secret) {
            return res.status(400).json({ error: 'APIキーが未設定です。編集画面から4つのキーをすべて入力してください。' });
        }

        const testClient = new TwitterApi({
            appKey: decryptValue(account.api_key),
            appSecret: decryptValue(account.api_secret),
            accessToken: decryptValue(account.access_token),
            accessSecret: decryptValue(account.access_secret),
        });

        const me = await testClient.v2.me({
            'user.fields': ['name', 'username', 'profile_image_url']
        });

        res.json({
            success: true,
            user: {
                id: me.data.id,
                name: me.data.name,
                username: me.data.username,
                profileImageUrl: me.data.profile_image_url
            }
        });
    } catch (error: any) {
        console.error('[API Test by ID] X API connection failed:', error.message);
        let errorMsg = 'X APIへの接続に失敗しました。';
        if (error?.code === 401 || error?.data?.status === 401) {
            errorMsg = 'APIキーまたはトークンが無効です。Developer Portalで確認してください。';
        } else if (error?.code === 403 || error?.data?.status === 403) {
            errorMsg = 'APIの権限が不足しています。App permissionsが「Read and Write」になっているか確認してください。';
        } else if (error?.code === 429 || error?.data?.status === 429) {
            errorMsg = 'APIのレート制限に達しました。しばらく待ってから再試行してください。';
        }
        res.status(400).json({ error: errorMsg });
    }
});

// Accounts: Fetch X profile by account ID (uses stored API keys)
app.get('/api/accounts/profile/:id', authenticateRequest, async (req, res) => {
    const { id } = req.params;
    const session = (req as any).session;

    try {
        const account: any = db.prepare('SELECT * FROM accounts WHERE id = ? AND user_id = ?').get(id, session.userId);
        if (!account) return res.status(404).json({ error: 'アカウントが見つかりません。' });

        if (!account.api_key || !account.api_secret || !account.access_token || !account.access_secret) {
            // No API keys — return basic info only
            return res.json({
                name: account.name,
                screenName: account.screen_name,
                description: '',
                profileImageUrl: account.profile_image_url || '',
                profileBannerUrl: null,
                followersCount: 0,
                followingCount: 0,
                tweetCount: 0,
                verified: false,
                hasApiKeys: false,
            });
        }

        const client = new TwitterApi({
            appKey: decryptValue(account.api_key),
            appSecret: decryptValue(account.api_secret),
            accessToken: decryptValue(account.access_token),
            accessSecret: decryptValue(account.access_secret),
        });

        const me = await client.v2.me({
            'user.fields': ['description', 'profile_image_url', 'public_metrics', 'verified'],
        });

        // v1 API for banner (not available in v2)
        let profileBannerUrl: string | null = null;
        try {
            const v1User = await client.v1.user({ screen_name: account.screen_name });
            profileBannerUrl = v1User.profile_banner_url || null;
        } catch {
            // v1 may not be available, that's fine
        }

        const data = me.data;
        const metrics = data.public_metrics;

        // Update stored profile image if changed
        const newProfileImage = data.profile_image_url?.replace('_normal', '') || '';
        if (newProfileImage && newProfileImage !== account.profile_image_url) {
            db.prepare('UPDATE accounts SET profile_image_url = ? WHERE id = ?').run(newProfileImage, id);
        }

        res.json({
            name: data.name,
            screenName: data.username,
            description: data.description || '',
            profileImageUrl: newProfileImage,
            profileBannerUrl,
            followersCount: metrics?.followers_count || 0,
            followingCount: metrics?.following_count || 0,
            tweetCount: metrics?.tweet_count || 0,
            verified: data.verified || false,
            hasApiKeys: true,
        });
    } catch (error: any) {
        console.error('[Account Profile] Error:', error.message);
        res.status(400).json({ error: 'プロフィール取得に失敗しました。', detail: error.message });
    }
});

// Dashboard: Get Stats
app.get('/api/dashboard/stats/:email', authenticateRequest, verifyEmailOwnership, (req, res) => {
    const { email } = req.params;
    try {
        const user: any = db.prepare('SELECT id, plan FROM users WHERE email = ?').get(email);
        if (!user) return res.status(404).json({ error: "User not found" });

        // 1. Active Bots
        const activeBotsCount: any = db.prepare('SELECT COUNT(*) as count FROM bots WHERE user_id = ? AND status = \'active\'').get(user.id);

        // Bot Limits (Sync with bot save logic)
        const botLimits: any = {
            'free': 1,
            'starter': 10,
            'advanced': 30,
            'advanced_20': 50,
            'advanced_70': 100,
            'advanced_170': 200
        };
        const totalBotsLimit = botLimits[user.plan] || 0;

        // 2. Today's Tweets & Monthly Impressions
        const today = new Date().toISOString().split('T')[0];
        const monthStart = today.substring(0, 7) + '-01';

        const metrics: any = db.prepare(`
            SELECT 
                SUM(CASE WHEN date = ? THEN tweets ELSE 0 END) as todayTweets,
                SUM(impressions) as monthlyImpressions
            FROM daily_metrics 
            WHERE user_id = ? AND date >= ?
        `).get(today, user.id, monthStart);

        // 3. Next Tweet Time
        const bots = db.prepare('SELECT schedule FROM bots WHERE user_id = ? AND status = \'active\'').all(user.id);
        let nextTime = '--:--';
        let nextBotName = '予定なし';

        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        // Find the next scheduled time today
        bots.forEach((b: any) => {
            const schedule = JSON.parse(b.schedule || '[]');
            schedule.forEach((time: string) => {
                if (time > currentTime && (nextTime === '--:--' || time < nextTime)) {
                    nextTime = time;
                    nextBotName = b.name || 'Bot';
                }
            });
        });

        res.json({
            activeBots: activeBotsCount.count,
            totalBotsLimit: totalBotsLimit,
            todayTweets: metrics?.todayTweets || 0,
            monthlyImpressions: metrics?.monthlyImpressions || 0,
            nextTweetTime: nextTime,
            nextBotName: nextBotName
        });
    } catch (error: any) {
        console.error("Dashboard Stats Error:", {
            message: error.message,
            stack: error.stack,
            code: error.code,

        });
        console.error('[ERROR]', error.message); res.status(500).json({ error: 'サーバーエラーが発生しました。' });
    }
});

// Bots: Get Single (with ownership check)
app.get('/api/bot/:id', authenticateRequest, (req, res) => {
    const { id } = req.params;
    const session = (req as any).session;
    try {
        const bot: any = db.prepare('SELECT * FROM bots WHERE id = ?').get(id);
        if (!bot) return res.status(404).json({ error: "Bot not found" });

        // Verify ownership (admin can access any bot)
        if (session.role !== 'admin' && bot.user_id !== session.userId) {
            return res.status(403).json({ error: 'このBotにアクセスする権限がありません。' });
        }

        // Lookup screen_name from accounts table
        const account: any = bot.account_id
            ? db.prepare('SELECT screen_name FROM accounts WHERE id = ?').get(bot.account_id)
            : null;
        const formattedBot = {
            ...bot,
            accountId: bot.account_id,  // camelCase mapping for frontend
            screenName: account?.screen_name || '',
            settings: JSON.parse(bot.settings || '{}'),
            schedule: JSON.parse(bot.schedule || '[]'),
        };
        res.json(formattedBot);
    } catch (error) {
        console.error('[API] bot fetch failed:', error);
        res.status(500).json({ error: 'Bot情報の取得に失敗しました。' });
    }
});

// 1. Send Signup Email (via SMTP) — Admin only
app.post('/api/send-email', authenticateRequest, requireAdmin, async (req, res) => {
    const { toEmail } = req.body;

    if (!toEmail) {
        return res.status(400).json({ error: "Missing toEmail" });
    }

    try {
        const sent = await sendMail(
            toEmail,
            '【Posutto】会員登録完了のお知らせ',
            `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
                    <h2 style="color: #7c3aed;">Posuttoへようこそ！</h2>
                    <p>この度はPosuttoにご登録いただき、誠にありがとうございます。</p>
                    <p>アカウントの作成が正常に完了いたしました。</p>
                    <p style="color: #666; font-size: 14px;">※ 本メールに心当たりがない場合は、お手数ですが破棄をお願いいたします。</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="color: #999; font-size: 12px;">© 2025 Posutto. All rights reserved.</p>
                </div>
            `
        );

        if (sent) {
            res.json({ message: "Email sent successfully" });
        } else {
            res.status(500).json({ error: "SMTP送信に失敗しました" });
        }
    } catch (error: any) {
        console.error("SMTP Error:", error);
        console.error('[ERROR]', error.message); res.status(500).json({ error: 'サーバーエラーが発生しました。' });
    }
});

// ---------------------------------------------------------------------------
// Contact Form (Public — rate-limited, CAPTCHA required)
// ---------------------------------------------------------------------------
app.post('/api/contact', contactLimiter, async (req, res) => {
    const { email, category, subject, content, captchaId, captchaAnswer } = req.body;

    // Validate required fields
    if (!email || !subject || !content || !captchaId || !captchaAnswer) {
        return res.status(400).json({ error: '全ての項目を入力してください。' });
    }

    // Validate field lengths
    if (email.length > 255 || subject.length > 200 || content.length > 5000) {
        return res.status(400).json({ error: '入力内容が長すぎます。' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'メールアドレスの形式が正しくありません。' });
    }

    // Verify CAPTCHA
    try {
        const captcha: any = db.prepare('SELECT answer, expires_at FROM captchas WHERE id = ?').get(captchaId);
        if (!captcha) {
            return res.status(400).json({ error: 'CAPTCHAの有効期限が切れています。再度お試しください。' });
        }

        if (new Date(captcha.expires_at) < new Date()) {
            db.prepare('DELETE FROM captchas WHERE id = ?').run(captchaId);
            return res.status(400).json({ error: 'CAPTCHAの有効期限が切れています。再度お試しください。' });
        }

        if (captcha.answer !== String(captchaAnswer)) {
            return res.status(400).json({ error: 'CAPTCHAの回答が正しくありません。' });
        }

        // Delete used CAPTCHA
        db.prepare('DELETE FROM captchas WHERE id = ?').run(captchaId);
    } catch (err) {
        console.error('[CONTACT] CAPTCHA verification error:', err);
        return res.status(500).json({ error: 'サーバーエラーが発生しました。' });
    }

    // Category label mapping
    const categoryLabels: Record<string, string> = {
        feedback: '機能改善',
        bug: '不具合報告',
        question: '一般的な質問',
        other: 'その他'
    };
    const categoryLabel = categoryLabels[category] || category || '未分類';

    try {
        // Send to admin
        const adminSent = await sendMail(
            MAIL_FROM,
            `【Posutto お問い合わせ】[${categoryLabel}] ${subject}`,
            `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
                <h2 style="color: #7c3aed;">新規お問い合わせ</h2>
                <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                    <tr><td style="padding: 8px; font-weight: bold; color: #555; border-bottom: 1px solid #f0f0f0;">カテゴリ</td><td style="padding: 8px; border-bottom: 1px solid #f0f0f0;">${categoryLabel}</td></tr>
                    <tr><td style="padding: 8px; font-weight: bold; color: #555; border-bottom: 1px solid #f0f0f0;">メールアドレス</td><td style="padding: 8px; border-bottom: 1px solid #f0f0f0;">${email}</td></tr>
                    <tr><td style="padding: 8px; font-weight: bold; color: #555; border-bottom: 1px solid #f0f0f0;">件名</td><td style="padding: 8px; border-bottom: 1px solid #f0f0f0;">${subject}</td></tr>
                </table>
                <h3 style="color: #333; margin-top: 20px;">お問い合わせ内容:</h3>
                <div style="background: #f9f9f9; padding: 16px; border-radius: 8px; white-space: pre-wrap; line-height: 1.6;">${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="color: #999; font-size: 12px;">送信日時: ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}</p>
            </div>
            `
        );

        // Send auto-reply to user
        await sendMail(
            email,
            '【Posutto】お問い合わせを受け付けました',
            `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
                <h2 style="color: #7c3aed;">お問い合わせありがとうございます</h2>
                <p>以下の内容でお問い合わせを受け付けました。</p>
                <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                    <tr><td style="padding: 8px; font-weight: bold; color: #555; border-bottom: 1px solid #f0f0f0;">カテゴリ</td><td style="padding: 8px; border-bottom: 1px solid #f0f0f0;">${categoryLabel}</td></tr>
                    <tr><td style="padding: 8px; font-weight: bold; color: #555; border-bottom: 1px solid #f0f0f0;">件名</td><td style="padding: 8px; border-bottom: 1px solid #f0f0f0;">${subject}</td></tr>
                </table>
                <p>内容を確認次第、担当者よりご連絡させていただきます。<br>通常2〜3営業日以内に返信いたします。</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="color: #999; font-size: 12px;">© 2025 Posutto. All rights reserved.</p>
            </div>
            `
        );

        if (adminSent) {
            console.log(`[CONTACT] Inquiry received from ${email}: [${categoryLabel}] ${subject}`);
            res.json({ success: true, message: 'お問い合わせを送信しました。' });
        } else {
            res.status(500).json({ error: 'メール送信に失敗しました。しばらくしてから再度お試しください。' });
        }
    } catch (error: any) {
        console.error('[CONTACT] Error:', error.message);
        res.status(500).json({ error: 'サーバーエラーが発生しました。' });
    }
});

// 2. Fetch X User Profile (requires auth to prevent external abuse of X API rate limits)
app.get('/api/x/profile/:screenName', authenticateRequest, async (req, res) => {
    const screenName = req.params.screenName as string;

    if (!xClient) {
        return res.status(500).json({ error: "X API not configured" });
    }

    try {
        const cleanName = screenName.startsWith('@') ? screenName.slice(1) : screenName;
        const user = await xClient.v2.userByUsername(cleanName, {
            "user.fields": ["description", "profile_image_url", "public_metrics", "verified"]
        });

        if (!user || user.errors) {
            return res.status(404).json({ error: "User not found or API error", details: user.errors });
        }

        const data = user.data;
        const metrics = data.public_metrics;

        res.json({
            name: data.name,
            screenName: data.username,
            description: data.description || '',
            profileImageUrl: data.profile_image_url?.replace('_normal', '') || '',
            followersCount: metrics?.followers_count || 0,
            followingCount: metrics?.following_count || 0,
            tweetCount: metrics?.tweet_count || 0,
            verified: data.verified || false,
        });
    } catch (error: any) {
        console.error("X API Error:", error);
        console.error('[ERROR]', error.message); res.status(500).json({ error: 'サーバーエラーが発生しました。' });
    }
});

// --- Announcements ---

// Get all active announcements (User)
app.get('/api/announcements', (req, res) => {
    try {
        const announcements = db.prepare('SELECT * FROM announcements WHERE is_active = 1 ORDER BY created_at DESC').all();
        res.json(announcements);
    } catch (error: any) {
        console.error('[ERROR]', error.message); res.status(500).json({ error: 'サーバーエラーが発生しました。' });
    }
});

// Admin: Get all announcements
app.get('/api/admin/announcements', authenticateRequest, requireAdmin, (req, res) => {
    try {
        const announcements = db.prepare('SELECT * FROM announcements ORDER BY created_at DESC').all();
        res.json(announcements);
    } catch (error: any) {
        console.error('[ERROR]', error.message); res.status(500).json({ error: 'サーバーエラーが発生しました。' });
    }
});

// Admin: Create announcement
app.post('/api/admin/announcements', authenticateRequest, requireAdmin, (req, res) => {
    const { title, content, type } = req.body;
    try {
        const result = db.prepare('INSERT INTO announcements (title, content, type) VALUES (?, ?, ?)').run(title, content, type || 'info');
        res.json({ id: result.lastInsertRowid, message: "Announcement created successfully" });
    } catch (error: any) {
        console.error('[ERROR]', error.message); res.status(500).json({ error: 'サーバーエラーが発生しました。' });
    }
});

app.put('/api/admin/announcements/:id', authenticateRequest, requireAdmin, (req, res) => {
    const { id } = req.params;
    const { title, content, type } = req.body;
    try {
        db.prepare('UPDATE announcements SET title = ?, content = ?, type = ? WHERE id = ?').run(title, content, type, id);
        res.json({ message: "Announcement updated successfully" });
    } catch (error: any) {
        console.error('[ERROR]', error.message); res.status(500).json({ error: 'サーバーエラーが発生しました。' });
    }
});

// Admin: Toggle active status
app.put('/api/admin/announcements/:id/toggle', authenticateRequest, requireAdmin, (req, res) => {
    const { id } = req.params;
    try {
        const announcement: any = db.prepare('SELECT is_active FROM announcements WHERE id = ?').get(id);
        if (!announcement) return res.status(404).json({ error: "Not found" });

        const newStatus = announcement.is_active === 1 ? 0 : 1;
        db.prepare('UPDATE announcements SET is_active = ? WHERE id = ?').run(newStatus, id);
        res.json({ message: "Status updated", is_active: newStatus });
    } catch (error: any) {
        console.error('[ERROR]', error.message); res.status(500).json({ error: 'サーバーエラーが発生しました。' });
    }
});

// Admin: Delete announcement
app.delete('/api/admin/announcements/:id', authenticateRequest, requireAdmin, (req, res) => {
    const { id } = req.params;
    try {
        db.prepare('DELETE FROM announcements WHERE id = ?').run(id);
        res.json({ message: "Announcement deleted" });
    } catch (error: any) {
        console.error('[ERROR]', error.message); res.status(500).json({ error: 'サーバーエラーが発生しました。' });
    }
});

// 3. Background Shadowban Check (requires auth)
app.get('/api/x/shadowban/:screenName', authenticateRequest, async (req, res) => {
    const screenName = req.params.screenName as string;
    const cleanName = screenName.startsWith('@') ? screenName.slice(1) : screenName;

    // --- Mock Fallback if API not configured ---
    if (!xClient) {
        console.warn(`X API not configured. Returning mock shadowban result for ${cleanName}`);

        return res.json({
            screenName: cleanName,
            status: {
                searchBan: false,
                suggestionBan: false,
                ghostBan: false,
                replyDeboosting: false,
            },
            timestamp: Math.floor(Date.now() / 1000),
            isMock: true
        });
    }

    try {
        // 1. Check if user exists
        const user = await xClient.v2.userByUsername(cleanName, {
            "user.fields": ["public_metrics"]
        });

        if (!user || user.errors) {
            return res.status(404).json({ error: "User not found" });
        }

        const metrics = user.data.public_metrics;

        // 2. Search check
        let searchBan = false;
        try {
            const search = await xClient.v2.search(`from:${cleanName}`, { max_results: 10 });
            searchBan = search.meta.result_count === 0 && (metrics?.tweet_count || 0) > 0;
        } catch (e) {
            console.warn("Search check failed:", e);
        }

        const suggestionBan = false;
        const ghostBan = false;
        const replyDeboosting = false;

        res.json({
            screenName: cleanName,
            status: {
                searchBan,
                suggestionBan,
                ghostBan,
                replyDeboosting,
            },
            timestamp: Math.floor(Date.now() / 1000)
        });
    } catch (error: any) {
        console.error("Shadowban Check Error:", error);
        console.error('[ERROR]', error.message); res.status(500).json({ error: 'サーバーエラーが発生しました。' });
    }
});

// 4. Update Automation Bots (Admin only — overrides in-memory active bot list)
app.post('/api/automation/bots', authenticateRequest, requireAdmin, (req, res) => {
    const { bots } = req.body;
    updateActiveBots(bots);
    res.json({ message: "Active bots updated successfully", count: bots.length });
});

// 5. Get posted tweets history for a bot
app.get('/api/bot/:id/posts', authenticateRequest, (req, res) => {
    const { id } = req.params;
    const session = (req as any).session;
    try {
        // Verify ownership
        const bot: any = db.prepare('SELECT user_id FROM bots WHERE id = ?').get(id);
        if (!bot) return res.status(404).json({ error: "Bot not found" });
        if (session.role !== 'admin' && bot.user_id !== session.userId) {
            return res.status(403).json({ error: 'このBotの投稿履歴を閲覧する権限がありません。' });
        }

        const limit = parseInt(req.query.limit as string) || 50;
        const posts = db.prepare(
            'SELECT * FROM posted_tweets WHERE bot_id = ? ORDER BY created_at DESC LIMIT ?'
        ).all(id, limit);
        res.json(posts);
    } catch (error: any) {
        console.error('[ERROR]', error.message); res.status(500).json({ error: 'サーバーエラーが発生しました。' });
    }
});

// Get execution logs for a bot
app.get('/api/bot/:id/logs', authenticateRequest, (req, res) => {
    const { id } = req.params;
    const session = (req as any).session;
    try {
        // Verify ownership
        const bot: any = db.prepare('SELECT user_id FROM bots WHERE id = ?').get(id);
        if (!bot) return res.status(404).json({ error: "Bot not found" });
        if (session.role !== 'admin' && bot.user_id !== session.userId) {
            return res.status(403).json({ error: 'このBotのログを閲覧する権限がありません。' });
        }

        const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
        const logType = req.query.type as string;

        let query = 'SELECT * FROM bot_logs WHERE bot_id = ?';
        const params: any[] = [id];

        if (logType && ['info', 'success', 'error', 'warning'].includes(logType)) {
            query += ' AND log_type = ?';
            params.push(logType);
        }

        query += ' ORDER BY created_at DESC LIMIT ?';
        params.push(limit);

        const logs = db.prepare(query).all(...params);
        res.json(logs);
    } catch (error: any) {
        console.error('[ERROR]', error.message); res.status(500).json({ error: 'サーバーエラーが発生しました。' });
    }
});

// ===========================================================================
// Stripe Endpoints
// ===========================================================================

// Create Checkout Session
app.post('/api/stripe/create-checkout-session', authenticateRequest, async (req, res) => {
    const session = (req as any).session;
    const { plan } = req.body;

    if (!plan || plan === 'free' || !PLAN_PRICE_MAP[plan]) {
        return res.status(400).json({ error: '無効なプランです。' });
    }

    try {
        const user: any = db.prepare('SELECT * FROM users WHERE email = ?').get(session.email);
        if (!user) return res.status(404).json({ error: 'ユーザーが見つかりません。' });

        // Get or create Stripe customer
        let stripeCustomerId = user.stripe_customer_id;
        if (!stripeCustomerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                name: user.name || undefined,
                metadata: { posutto_user_id: String(user.id) },
            });
            stripeCustomerId = customer.id;
            db.prepare('UPDATE users SET stripe_customer_id = ? WHERE id = ?').run(stripeCustomerId, user.id);
        }

        // Check existing active subscription
        const existingSub: any = db.prepare(
            "SELECT * FROM subscriptions WHERE user_id = ? AND status = 'active'"
        ).get(user.id);

        if (existingSub?.stripe_subscription_id) {
            // Has active subscription — redirect to proration preview flow instead
            return res.json({
                requiresProration: true,
                message: '既存のサブスクリプションがあります。プラン変更画面で差額を確認してください。',
            });
        }

        // No existing subscription -> create Checkout Session
        const frontendBase = process.env.NODE_ENV === 'production'
            ? 'https://sns-tool.online/posutto'
            : 'http://localhost:5173/posutto';

        const checkoutSession = await stripe.checkout.sessions.create({
            customer: stripeCustomerId,
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [{
                price: PLAN_PRICE_MAP[plan],
                quantity: 1,
            }],
            success_url: `${frontendBase}/dashboard/shop?success=true`,
            cancel_url: `${frontendBase}/dashboard/shop?canceled=true`,
            metadata: {
                posutto_user_id: String(user.id),
                posutto_plan: plan,
            },
            subscription_data: {
                metadata: {
                    posutto_user_id: String(user.id),
                    posutto_plan: plan,
                },
            },
            locale: 'ja',
        });

        res.json({ url: checkoutSession.url });
    } catch (error: any) {
        console.error('[Stripe] Checkout Session Error:', error?.message || error);
        const detail = error?.message || 'Unknown error';
        res.status(500).json({ error: `チェックアウトの作成に失敗しました。(${detail})` });
    }
});

// ---------------------------------------------------------------------------
// Stripe: Preview Proration (差額プレビュー)
// ---------------------------------------------------------------------------
app.post('/api/stripe/preview-proration', authenticateRequest, async (req, res) => {
    const session = (req as any).session;
    const { plan } = req.body;

    if (!plan || plan === 'free' || !PLAN_PRICE_MAP[plan]) {
        return res.status(400).json({ error: '無効なプランです。' });
    }

    try {
        const user: any = db.prepare('SELECT * FROM users WHERE email = ?').get(session.email);
        if (!user) return res.status(404).json({ error: 'ユーザーが見つかりません。' });

        const existingSub: any = db.prepare(
            "SELECT * FROM subscriptions WHERE user_id = ? AND status = 'active'"
        ).get(user.id);

        if (!existingSub?.stripe_subscription_id) {
            return res.status(400).json({ error: 'アクティブなサブスクリプションがありません。' });
        }

        // Retrieve current subscription from Stripe
        const subscription = await stripe.subscriptions.retrieve(existingSub.stripe_subscription_id);
        const currentItem = subscription.items.data[0];

        if (!currentItem) {
            return res.status(400).json({ error: 'サブスクリプション情報を取得できません。' });
        }

        // Create upcoming invoice preview with proration
        const proration_date = Math.floor(Date.now() / 1000);
        const invoice = await stripe.invoices.createPreview({
            customer: user.stripe_customer_id,
            subscription: existingSub.stripe_subscription_id,
            subscription_details: {
                items: [{
                    id: currentItem.id,
                    price: PLAN_PRICE_MAP[plan],
                }],
                proration_date: proration_date,
            },
        });

        // Extract proration line items
        const prorationItems = invoice.lines.data.filter(
            (line: any) => line.proration === true
        );

        // Calculate amounts
        const currentPlanName = existingSub.plan;
        const currentPrice = invoice.lines.data.find(
            (line: any) => line.proration && line.amount < 0
        );
        const newPrice = invoice.lines.data.find(
            (line: any) => line.proration && line.amount > 0
        );

        // Total proration amount (what user pays now)
        const prorationAmount = prorationItems.reduce(
            (sum: number, item: any) => sum + item.amount, 0
        );

        // Remaining days in current period
        const periodEnd = (subscription as any).current_period_end;
        const remainingDays = Math.ceil((periodEnd - proration_date) / (60 * 60 * 24));
        const totalDays = Math.ceil(
            (periodEnd - (subscription as any).current_period_start) / (60 * 60 * 24)
        );

        res.json({
            currentPlan: currentPlanName,
            newPlan: plan,
            currentPlanPrice: existingSub.stripe_price_id ? (PLAN_PRICE_MAP[currentPlanName] ?
                Object.entries(PLAN_PRICE_MAP).find(([k]) => k === currentPlanName)?.[0] : null) : null,
            // Amounts in JPY (zero-decimal)
            creditAmount: currentPrice ? Math.abs(currentPrice.amount) : 0,   // 現プランの未使用分（返金クレジット）
            chargeAmount: newPrice ? newPrice.amount : 0,                       // 新プランの日割り料金
            prorationAmount: Math.max(prorationAmount, 0),                      // 差額（実際にユーザーが支払う額）
            nextMonthlyAmount: PLAN_PRICE_MAP[plan] ? (() => {
                // Get new plan full price from our definitions
                const plans: Record<string, number> = {
                    starter: 2980, advanced: 4980, advanced_20: 6980,
                    advanced_70: 10980, advanced_170: 19800,
                };
                return plans[plan] || 0;
            })() : 0,
            remainingDays,
            totalDays,
            periodEnd: new Date(periodEnd * 1000).toISOString(),
            invoiceTotal: invoice.total,       // 請求書合計
            invoiceSubtotal: invoice.subtotal, // 小計
        });
    } catch (error: any) {
        console.error('[Stripe] Proration preview error:', error);
        res.status(500).json({ error: 'プロレーション計算に失敗しました。' });
    }
});

// ---------------------------------------------------------------------------
// Stripe: Confirm Upgrade (差額確認後のプラン変更実行)
// ---------------------------------------------------------------------------
app.post('/api/stripe/confirm-upgrade', authenticateRequest, async (req, res) => {
    const session = (req as any).session;
    const { plan } = req.body;

    if (!plan || plan === 'free' || !PLAN_PRICE_MAP[plan]) {
        return res.status(400).json({ error: '無効なプランです。' });
    }

    try {
        const user: any = db.prepare('SELECT * FROM users WHERE email = ?').get(session.email);
        if (!user) return res.status(404).json({ error: 'ユーザーが見つかりません。' });

        const existingSub: any = db.prepare(
            "SELECT * FROM subscriptions WHERE user_id = ? AND status = 'active'"
        ).get(user.id);

        if (!existingSub?.stripe_subscription_id) {
            return res.status(400).json({ error: 'アクティブなサブスクリプションがありません。' });
        }

        // Retrieve and update subscription with proration
        const subscription = await stripe.subscriptions.retrieve(existingSub.stripe_subscription_id);
        const currentItem = subscription.items.data[0];

        if (!currentItem) {
            return res.status(400).json({ error: 'サブスクリプション情報を取得できません。' });
        }

        await stripe.subscriptions.update(existingSub.stripe_subscription_id, {
            items: [{
                id: currentItem.id,
                price: PLAN_PRICE_MAP[plan],
            }],
            proration_behavior: 'create_prorations',
        });

        // Update local DB
        db.prepare(
            'UPDATE subscriptions SET stripe_price_id = ?, plan = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
        ).run(PLAN_PRICE_MAP[plan], plan, existingSub.id);
        db.prepare('UPDATE users SET plan = ? WHERE id = ?').run(plan, user.id);

        console.log(`[Stripe] Plan upgraded: user=${user.id}, plan=${plan} (proration applied)`);

        res.json({ success: true, plan, message: 'プランを変更しました。日割り差額が次回請求に反映されます。' });
    } catch (error: any) {
        console.error('[Stripe] Confirm upgrade error:', error);
        res.status(500).json({ error: 'プラン変更に失敗しました。' });
    }
});

// Stripe Webhook
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;

    let event: Stripe.Event;

    if (!WEBHOOK_SECRET) {
        console.error('[Stripe Webhook] WEBHOOK_SECRET not configured. Rejecting all webhooks for security.');
        return res.status(500).send('Webhook secret not configured.');
    }

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, WEBHOOK_SECRET);
    } catch (err: any) {
        console.error('[Stripe Webhook] Signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log(`[Stripe Webhook] Received: ${event.type}`);

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const checkoutSession = event.data.object as Stripe.Checkout.Session;
                const userId = checkoutSession.metadata?.posutto_user_id;
                const plan = checkoutSession.metadata?.posutto_plan;

                if (!userId || !plan) {
                    console.error('[Stripe] Missing metadata in checkout session');
                    break;
                }

                const subscriptionId = checkoutSession.subscription as string;
                const customerId = checkoutSession.customer as string;
                const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                const priceId = subscription.items.data[0]?.price.id;

                // Upsert subscription
                const existingSubRow: any = db.prepare('SELECT id FROM subscriptions WHERE user_id = ?').get(Number(userId));

                if (existingSubRow) {
                    db.prepare(`
                        UPDATE subscriptions SET
                            stripe_customer_id = ?, stripe_subscription_id = ?, stripe_price_id = ?,
                            plan = ?, status = 'active',
                            current_period_start = ?, current_period_end = ?,
                            cancel_at_period_end = 0, updated_at = CURRENT_TIMESTAMP
                        WHERE user_id = ?
                    `).run(
                        customerId, subscriptionId, priceId, plan,
                        new Date((subscription as any).current_period_start * 1000).toISOString(),
                        new Date((subscription as any).current_period_end * 1000).toISOString(),
                        Number(userId)
                    );
                } else {
                    db.prepare(`
                        INSERT INTO subscriptions (
                            user_id, stripe_customer_id, stripe_subscription_id,
                            stripe_price_id, plan, status,
                            current_period_start, current_period_end
                        ) VALUES (?, ?, ?, ?, ?, 'active', ?, ?)
                    `).run(
                        Number(userId), customerId, subscriptionId, priceId, plan,
                        new Date((subscription as any).current_period_start * 1000).toISOString(),
                        new Date((subscription as any).current_period_end * 1000).toISOString()
                    );
                }

                db.prepare('UPDATE users SET plan = ?, stripe_customer_id = ? WHERE id = ?').run(plan, customerId, Number(userId));
                console.log(`[Stripe] Plan activated: user=${userId}, plan=${plan}`);

                // Note: Referral rewards are now handled by the 'invoice.paid' event handler
                // This covers both initial and recurring payments automatically

                break;
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription;
                const userId = subscription.metadata?.posutto_user_id;
                if (!userId) break;

                const priceId = subscription.items.data[0]?.price.id;
                const plan = PRICE_PLAN_MAP[priceId] || 'free';

                db.prepare(`
                    UPDATE subscriptions SET
                        stripe_price_id = ?, plan = ?, status = ?,
                        current_period_start = ?, current_period_end = ?,
                        cancel_at_period_end = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE stripe_subscription_id = ?
                `).run(
                    priceId, plan,
                    subscription.status === 'active' ? 'active' : subscription.status,
                    new Date((subscription as any).current_period_start * 1000).toISOString(),
                    new Date((subscription as any).current_period_end * 1000).toISOString(),
                    subscription.cancel_at_period_end ? 1 : 0,
                    subscription.id
                );

                if (subscription.status === 'active') {
                    db.prepare('UPDATE users SET plan = ? WHERE id = ?').run(plan, Number(userId));
                }

                console.log(`[Stripe] Subscription updated: user=${userId}, plan=${plan}, status=${subscription.status}`);
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                const userId = subscription.metadata?.posutto_user_id;
                if (!userId) break;

                db.prepare(`
                    UPDATE subscriptions SET status = 'canceled', updated_at = CURRENT_TIMESTAMP
                    WHERE stripe_subscription_id = ?
                `).run(subscription.id);

                db.prepare("UPDATE users SET plan = 'free' WHERE id = ?").run(Number(userId));
                console.log(`[Stripe] Subscription canceled, downgraded to free: user=${userId}`);
                break;
            }

            case 'invoice.payment_failed': {
                const invoice = event.data.object as Stripe.Invoice;
                const customerId = invoice.customer as string;
                const user: any = db.prepare('SELECT id FROM users WHERE stripe_customer_id = ?').get(customerId);
                if (user) {
                    console.log(`[Stripe] Payment failed for user=${user.id}, customer=${customerId}`);
                }
                break;
            }

            case 'invoice.paid': {
                // Recurring referral reward: generate reward on every successful invoice payment
                const paidInvoice = event.data.object as any;
                const paidCustomerId = paidInvoice.customer as string;
                const invoiceId = paidInvoice.id as string;

                // Only process subscription invoices (not one-time charges)
                if (!paidInvoice.subscription) break;

                try {
                    const paidUser: any = db.prepare(
                        'SELECT id, referred_by, plan FROM users WHERE stripe_customer_id = ?'
                    ).get(paidCustomerId);

                    if (!paidUser || !paidUser.referred_by) break;

                    // Check if reward already exists for this specific invoice (prevent duplicates)
                    const existingInvoiceReward: any = db.prepare(
                        'SELECT id FROM referral_rewards WHERE stripe_invoice_id = ?'
                    ).get(invoiceId);

                    if (existingInvoiceReward) {
                        console.log(`[Referral] Reward already exists for invoice ${invoiceId}, skipping`);
                        break;
                    }

                    // Determine reward type: first invoice = initial, subsequent = recurring
                    const existingRewards: any = db.prepare(
                        'SELECT COUNT(*) as count FROM referral_rewards WHERE referrer_id = ? AND referred_id = ?'
                    ).get(paidUser.referred_by, paidUser.id);

                    const rewardType = existingRewards.count === 0 ? 'initial' : 'recurring';

                    // Create reward (500 yen for both initial and recurring)
                    db.prepare(
                        'INSERT INTO referral_rewards (referrer_id, referred_id, plan, amount, reward_type, stripe_invoice_id) VALUES (?, ?, ?, 500, ?, ?)'
                    ).run(paidUser.referred_by, paidUser.id, paidUser.plan, rewardType, invoiceId);

                    console.log(`[Referral] ${rewardType} reward created: referrer=${paidUser.referred_by}, referred=${paidUser.id}, invoice=${invoiceId}`);
                } catch (refErr) {
                    console.error('[Referral] Failed to create recurring reward:', refErr);
                }
                break;
            }

            default:
                console.log(`[Stripe Webhook] Unhandled event: ${event.type}`);
        }

        res.json({ received: true });
    } catch (error: any) {
        console.error('[Stripe Webhook] Handler error:', error);
        res.status(500).json({ error: 'Webhook handler failed.' });
    }
});

// Get subscription status
app.get('/api/stripe/subscription-status', authenticateRequest, (req, res) => {
    const session = (req as any).session;
    try {
        const user: any = db.prepare('SELECT id, plan FROM users WHERE email = ?').get(session.email);
        if (!user) return res.status(404).json({ error: 'ユーザーが見つかりません。' });

        const sub: any = db.prepare('SELECT * FROM subscriptions WHERE user_id = ?').get(user.id);

        res.json({
            plan: user.plan,
            subscription: sub ? {
                status: sub.status,
                plan: sub.plan,
                currentPeriodEnd: sub.current_period_end,
                cancelAtPeriodEnd: sub.cancel_at_period_end === 1,
            } : null,
        });
    } catch (error: any) {
        console.error('[ERROR]', error.message); res.status(500).json({ error: 'サーバーエラーが発生しました。' });
    }
});

// Cancel subscription (at period end)
app.post('/api/stripe/cancel-subscription', authenticateRequest, async (req, res) => {
    const session = (req as any).session;
    try {
        const user: any = db.prepare('SELECT id FROM users WHERE email = ?').get(session.email);
        if (!user) return res.status(404).json({ error: 'ユーザーが見つかりません。' });

        const sub: any = db.prepare(
            "SELECT * FROM subscriptions WHERE user_id = ? AND status = 'active'"
        ).get(user.id);

        if (!sub?.stripe_subscription_id) {
            return res.status(400).json({ error: '有効なサブスクリプションがありません。' });
        }

        await stripe.subscriptions.update(sub.stripe_subscription_id, {
            cancel_at_period_end: true,
        });

        db.prepare(
            'UPDATE subscriptions SET cancel_at_period_end = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
        ).run(sub.id);

        res.json({
            success: true,
            message: '現在の請求期間の終了時にサブスクリプションがキャンセルされます。',
            periodEnd: sub.current_period_end,
        });
    } catch (error: any) {
        console.error('[Stripe] Cancel Error:', error);
        res.status(500).json({ error: 'キャンセルに失敗しました。' });
    }
});

// Reactivate subscription (undo cancellation)
app.post('/api/stripe/reactivate-subscription', authenticateRequest, async (req, res) => {
    const session = (req as any).session;
    try {
        const user: any = db.prepare('SELECT id FROM users WHERE email = ?').get(session.email);
        if (!user) return res.status(404).json({ error: 'ユーザーが見つかりません。' });

        const sub: any = db.prepare(
            'SELECT * FROM subscriptions WHERE user_id = ? AND cancel_at_period_end = 1'
        ).get(user.id);

        if (!sub?.stripe_subscription_id) {
            return res.status(400).json({ error: 'キャンセル予定のサブスクリプションがありません。' });
        }

        await stripe.subscriptions.update(sub.stripe_subscription_id, {
            cancel_at_period_end: false,
        });

        db.prepare(
            'UPDATE subscriptions SET cancel_at_period_end = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
        ).run(sub.id);

        res.json({ success: true, message: 'サブスクリプションを再開しました。' });
    } catch (error: any) {
        console.error('[Stripe] Reactivate Error:', error);
        res.status(500).json({ error: '再開に失敗しました。' });
    }
});

// --- Accounts Endpoints ---

app.get('/api/accounts/:email', authenticateRequest, verifyEmailOwnership, (req, res) => {
    const { email } = req.params;
    try {
        const user: any = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (!user) return res.status(404).json({ error: "User not found" });

        const accounts = db.prepare('SELECT * FROM accounts WHERE user_id = ?').all(user.id);
        // Exclude sensitive fields from response
        const safeAccounts = accounts.map((acc: any) => ({
            ...acc,
            api_key: acc.api_key ? '••••••••' : null,
            api_secret: acc.api_secret ? '••••••••' : null,
            access_token: acc.access_token ? '••••••••' : null,
            access_secret: acc.access_secret ? '••••••••' : null,
            bearer_token: acc.bearer_token ? '••••••••' : null,
        }));
        res.json(safeAccounts);
    } catch (error: any) {
        console.error('[ERROR]', error.message); res.status(500).json({ error: 'サーバーエラーが発生しました。' });
    }
});

app.post('/api/accounts/save', authenticateRequest, (req, res) => {
    const { email, account } = req.body;
    const session = (req as any).session;
    if (session.role !== 'admin' && session.email !== email) {
        return res.status(403).json({ error: '他のユーザーのアカウントを操作する権限がありません。' });
    }
    try {
        const user: any = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (!user) return res.status(404).json({ error: "User not found" });

        // Support both accessSecret and accessTokenSecret (frontend uses accessTokenSecret)
        const accessSecretValue = account.accessTokenSecret || account.accessSecret || null;

        // Mask value used by GET API - don't overwrite real values with mask
        const MASK = '••••••••';
        const isMasked = (v: string | undefined | null) => v === MASK;

        if (!account.id) {
            account.id = crypto.randomUUID();
            db.prepare(`
                INSERT INTO accounts (
                    id, user_id, name, screen_name, username, password, email,
                    phone_number, status, profile_image_url, api_key, api_secret,
                    access_token, access_secret, bearer_token
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
                account.id,
                user.id,
                account.name?.substring(0, 100),
                account.screenName?.substring(0, 50),
                account.username?.substring(0, 50) || null,
                account.password || null,
                account.email?.substring(0, 255) || null,
                account.phoneNumber?.substring(0, 30) || null,
                account.status || 'active',
                account.profileImageUrl || null,
                isMasked(account.apiKey) ? null : encryptIfNeeded(account.apiKey || null),
                isMasked(account.apiSecret) ? null : encryptIfNeeded(account.apiSecret || null),
                isMasked(account.accessToken) ? null : encryptIfNeeded(account.accessToken || null),
                isMasked(accessSecretValue) ? null : encryptIfNeeded(accessSecretValue),
                isMasked(account.bearerToken) ? null : encryptIfNeeded(account.bearerToken || null)
            );
        } else {
            // For UPDATE, if masked values are sent, keep existing DB values
            const existing: any = db.prepare('SELECT * FROM accounts WHERE id = ? AND user_id = ?').get(account.id, user.id);
            if (!existing) return res.status(404).json({ error: 'アカウントが見つかりません。' });

            db.prepare(`
                UPDATE accounts SET
                    name = ?, screen_name = ?, username = ?, password = ?,
                    email = ?, phone_number = ?, status = ?, profile_image_url = ?,
                    api_key = ?, api_secret = ?, access_token = ?,
                    access_secret = ?, bearer_token = ?
                WHERE id = ? AND user_id = ?
            `).run(
                account.name?.substring(0, 100),
                account.screenName?.substring(0, 50),
                account.username?.substring(0, 50) || null,
                isMasked(account.password) || !account.password ? existing.password : account.password,
                account.email?.substring(0, 255) || null,
                account.phoneNumber?.substring(0, 30) || null,
                account.status || 'active',
                account.profileImageUrl || null,
                isMasked(account.apiKey) || !account.apiKey ? existing.api_key : encryptIfNeeded(account.apiKey),
                isMasked(account.apiSecret) || !account.apiSecret ? existing.api_secret : encryptIfNeeded(account.apiSecret),
                isMasked(account.accessToken) || !account.accessToken ? existing.access_token : encryptIfNeeded(account.accessToken),
                isMasked(accessSecretValue) || !accessSecretValue ? existing.access_secret : encryptIfNeeded(accessSecretValue),
                isMasked(account.bearerToken) || !account.bearerToken ? existing.bearer_token : encryptIfNeeded(account.bearerToken),
                account.id,
                user.id
            );
        }
        res.json({ success: true, accountId: account.id });
    } catch (error: any) {
        // Handle UNIQUE constraint errors with user-friendly message
        if (error.message && error.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'このスクリーン名は既に登録されています。' });
        }
        console.error('[ERROR]', error.message); res.status(500).json({ error: 'サーバーエラーが発生しました。' });
    }
});

app.delete('/api/accounts/:id', authenticateRequest, (req, res) => {
    const { id } = req.params;
    const session = (req as any).session;
    try {
        // Verify ownership
        const account: any = db.prepare('SELECT user_id FROM accounts WHERE id = ?').get(id);
        if (!account) return res.status(404).json({ error: "Account not found" });
        if (account.user_id !== session.userId) {
            return res.status(403).json({ error: "このアカウントを削除する権限がありません。" });
        }
        db.prepare('DELETE FROM accounts WHERE id = ?').run(id);
        res.json({ success: true });
    } catch (error: any) {
        console.error('[ERROR]', error.message); res.status(500).json({ error: 'サーバーエラーが発生しました。' });
    }
});

// --- Links Endpoints ---

app.get('/api/links/:email', authenticateRequest, verifyEmailOwnership, (req, res) => {
    const { email } = req.params;
    try {
        const user: any = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (!user) return res.status(404).json({ error: "User not found" });

        const links: any[] = db.prepare('SELECT * FROM links WHERE user_id = ?').all(user.id);

        // Get click counts from analytics_events
        const clickCounts: any[] = db.prepare(
            `SELECT link_id, COUNT(*) as clicks FROM analytics_events
             WHERE user_id = ? AND link_id IS NOT NULL AND event_type = 'click'
             GROUP BY link_id`
        ).all(user.id);
        const clickMap: Record<string, number> = {};
        for (const c of clickCounts) {
            clickMap[c.link_id] = c.clicks;
        }

        // Get active bots that use each link (match by URL in bot settings JSON)
        const bots: any[] = db.prepare(
            `SELECT id, name, settings FROM bots WHERE user_id = ?`
        ).all(user.id);

        const enrichedLinks = links.map((link: any) => {
            // Find bots using this link's URL
            const activeBots: string[] = [];
            for (const bot of bots) {
                try {
                    const settings = typeof bot.settings === 'string' ? JSON.parse(bot.settings) : bot.settings;
                    if (settings?.affiliateLink && settings.affiliateLink === link.url) {
                        activeBots.push(bot.name || bot.id);
                    }
                } catch { /* ignore parse errors */ }
            }

            return {
                id: link.id,
                name: link.name,
                url: link.url,
                type: link.type || 'Custom',
                status: link.status || 'active',
                clicks: clickMap[link.id] || 0,
                activeBots,
            };
        });

        res.json(enrichedLinks);
    } catch (error: any) {
        console.error('[ERROR]', error.message); res.status(500).json({ error: 'サーバーエラーが発生しました。' });
    }
});

app.post('/api/links/save', authenticateRequest, (req, res) => {
    const { email, link } = req.body;
    const session = (req as any).session;
    if (session.role !== 'admin' && session.email !== email) {
        return res.status(403).json({ error: '他のユーザーのリンクを操作する権限がありません。' });
    }
    try {
        const user: any = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (!user) return res.status(404).json({ error: "User not found" });

        if (!link.id) {
            link.id = crypto.randomUUID();
            db.prepare('INSERT INTO links (id, user_id, name, url, type, status) VALUES (?, ?, ?, ?, ?, ?)').run(
                link.id,
                user.id,
                link.name,
                link.url,
                link.type,
                link.status || 'active'
            );
        } else {
            db.prepare('UPDATE links SET name = ?, url = ?, type = ?, status = ? WHERE id = ? AND user_id = ?').run(
                link.name,
                link.url,
                link.type,
                link.status,
                link.id,
                user.id
            );
        }
        res.json({ success: true, linkId: link.id });
    } catch (error: any) {
        console.error('[ERROR]', error.message); res.status(500).json({ error: 'サーバーエラーが発生しました。' });
    }
});

app.delete('/api/links/:id', authenticateRequest, (req, res) => {
    const { id } = req.params;
    const session = (req as any).session;
    try {
        // Verify ownership
        const link: any = db.prepare('SELECT user_id FROM links WHERE id = ?').get(id);
        if (!link) return res.status(404).json({ error: "Link not found" });
        if (link.user_id !== session.userId) {
            return res.status(403).json({ error: "このリンクを削除する権限がありません。" });
        }
        db.prepare('DELETE FROM links WHERE id = ?').run(id);
        res.json({ success: true });
    } catch (error: any) {
        console.error('[ERROR]', error.message); res.status(500).json({ error: 'サーバーエラーが発生しました。' });
    }
});

// --- Analytics Endpoints ---

app.post('/api/analytics/record', authenticateRequest, (req, res) => {
    const { email, accountId, linkId, eventType } = req.body;
    const session = (req as any).session;
    if (session.role !== 'admin' && session.email !== email) {
        return res.status(403).json({ error: '権限がありません。' });
    }
    try {
        const user: any = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (!user) return res.status(404).json({ error: "User not found" });

        db.prepare('INSERT INTO analytics_events (user_id, account_id, link_id, event_type) VALUES (?, ?, ?, ?)').run(
            user.id,
            accountId || null,
            linkId || null,
            eventType
        );

        // Update daily_metrics cache
        const today = new Date().toISOString().split('T')[0];
        if (accountId) {
            const existingMetric: any = db.prepare('SELECT id FROM daily_metrics WHERE user_id = ? AND account_id = ? AND date = ?').get(user.id, accountId, today);
            if (existingMetric) {
                if (eventType === 'impression') {
                    db.prepare('UPDATE daily_metrics SET impressions = impressions + 1 WHERE id = ?').run(existingMetric.id);
                } else if (eventType === 'click' || eventType === 'engagement') {
                    db.prepare('UPDATE daily_metrics SET engagement = engagement + 1 WHERE id = ?').run(existingMetric.id);
                }
            } else {
                db.prepare('INSERT INTO daily_metrics (user_id, account_id, date, impressions, engagement) VALUES (?, ?, ?, ?, ?)').run(
                    user.id,
                    accountId,
                    today,
                    eventType === 'impression' ? 1 : 0,
                    (eventType === 'click' || eventType === 'engagement') ? 1 : 0
                );
            }
        }

        res.json({ success: true });
    } catch (error: any) {
        console.error('[ERROR]', error.message); res.status(500).json({ error: 'サーバーエラーが発生しました。' });
    }
});

app.get('/api/analytics/stats/:email', authenticateRequest, verifyEmailOwnership, (req, res) => {
    const { email } = req.params;
    try {
        const user: any = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (!user) return res.status(404).json({ error: "User not found" });

        const history = db.prepare('SELECT * FROM daily_metrics WHERE user_id = ? ORDER BY date DESC LIMIT 30').all(user.id);

        const topLinks = db.prepare(`
            SELECT l.name, COUNT(ae.id) as clicks 
            FROM links l 
            JOIN analytics_events ae ON l.id = ae.link_id 
            WHERE l.user_id = ? AND ae.event_type = 'click'
            GROUP BY l.id
            ORDER BY clicks DESC
            LIMIT 5
        `).all(user.id);

        res.json({ history, topLinks });
    } catch (error: any) {
        console.error('[ERROR]', error.message); res.status(500).json({ error: 'サーバーエラーが発生しました。' });
    }
});

// --- Admin: System Settings ---

app.get('/api/admin/settings', authenticateRequest, requireAdmin, (req, res) => {
    try {
        const settings = db.prepare('SELECT * FROM system_settings').all();
        const settingsMap = settings.reduce((acc: any, s: any) => ({ ...acc, [s.key]: s.value }), {});
        res.json(settingsMap);
    } catch (error: any) {
        console.error('[ERROR]', error.message); res.status(500).json({ error: 'サーバーエラーが発生しました。' });
    }
});

app.post('/api/admin/settings', authenticateRequest, requireAdmin, (req, res) => {
    const { settings } = req.body;
    try {
        for (const [key, value] of Object.entries(settings)) {
            db.prepare('INSERT OR REPLACE INTO system_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)').run(key, String(value));
        }
        res.json({ success: true });
    } catch (error: any) {
        console.error('[ERROR]', error.message); res.status(500).json({ error: 'サーバーエラーが発生しました。' });
    }
});

app.get('/api/admin/system-stats', authenticateRequest, requireAdmin, (req, res) => {
    try {
        const userCount: any = db.prepare('SELECT COUNT(*) as count FROM users').get();
        const botCount: any = db.prepare('SELECT COUNT(*) as count FROM bots WHERE status = \'active\'').get();
        const tweetCount: any = db.prepare('SELECT COUNT(*) as count FROM posted_tweets').get();

        res.json({
            totalUsers: userCount.count,
            activeBots: botCount.count,
            totalTweets: tweetCount.count || 0,
            status: 'healthy'
        });
    } catch (error: any) {
        console.error('[ERROR]', error.message); res.status(500).json({ error: 'サーバーエラーが発生しました。' });
    }
});

// ---------------------------------------------------------------------------
// Admin: Database Backup Management
// ---------------------------------------------------------------------------

// Get backup list
app.get('/api/admin/backups', authenticateRequest, requireAdmin, (req, res) => {
    try {
        const backupDir = path.join(__dirname, 'data', 'backups');
        if (!fs.existsSync(backupDir)) {
            return res.json({ backups: [] });
        }

        const files = fs.readdirSync(backupDir)
            .filter(f => f.startsWith('posutto_') && f.endsWith('.db'))
            .sort()
            .reverse(); // newest first

        const backups = files.map(f => {
            const stats = fs.statSync(path.join(backupDir, f));
            return {
                filename: f,
                size: stats.size,
                created_at: stats.mtime.toISOString(),
            };
        });

        res.json({ backups });
    } catch (error: any) {
        console.error('[ERROR]', error.message); res.status(500).json({ error: 'サーバーエラーが発生しました。' });
    }
});

// Trigger manual backup
app.post('/api/admin/backups', authenticateRequest, requireAdmin, (req, res) => {
    try {
        const dbFilePath = path.join(__dirname, 'data', 'posutto.db');
        const backupDir = path.join(__dirname, 'data', 'backups');

        if (!fs.existsSync(dbFilePath)) {
            return res.status(404).json({ error: 'データベースファイルが見つかりません。' });
        }

        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        const now = new Date();
        const timestamp = now.toISOString().replace('T', '_').replace(/:/g, '-').split('.')[0];
        const backupFileName = `posutto_${timestamp}_manual.db`;
        const backupPath = path.join(backupDir, backupFileName);

        fs.copyFileSync(dbFilePath, backupPath);

        const stats = fs.statSync(backupPath);
        res.json({
            success: true,
            backup: {
                filename: backupFileName,
                size: stats.size,
                created_at: stats.mtime.toISOString(),
            }
        });
    } catch (error: any) {
        console.error('[ERROR]', error.message); res.status(500).json({ error: 'サーバーエラーが発生しました。' });
    }
});

// ---------------------------------------------------------------------------
// Referral / Affiliate API
// ---------------------------------------------------------------------------

// Get my referral code (auto-generate if not exists)
app.get('/api/referral/my-code', authenticateRequest, (req, res) => {
    const session = (req as any).session;
    try {
        const user: any = db.prepare('SELECT id, referral_code FROM users WHERE email = ?').get(session.email);
        if (!user) return res.status(404).json({ error: 'ユーザーが見つかりません。' });

        let code = user.referral_code;
        if (!code) {
            code = crypto.randomBytes(4).toString('hex');
            db.prepare('UPDATE users SET referral_code = ? WHERE id = ?').run(code, user.id);
        }

        res.json({ referralCode: code });
    } catch (error: any) {
        console.error('[ERROR]', error.message); res.status(500).json({ error: 'サーバーエラーが発生しました。' });
    }
});

// Get referral stats
app.get('/api/referral/stats', authenticateRequest, (req, res) => {
    const session = (req as any).session;
    try {
        const user: any = db.prepare('SELECT id FROM users WHERE email = ?').get(session.email);
        if (!user) return res.status(404).json({ error: 'ユーザーが見つかりません。' });

        // Total referred users
        const totalReferred: any = db.prepare(
            'SELECT COUNT(*) as count FROM users WHERE referred_by = ?'
        ).get(user.id);

        // Paid conversions count (distinct referred users who generated any reward)
        const paidConversions: any = db.prepare(
            'SELECT COUNT(DISTINCT referred_id) as count FROM referral_rewards WHERE referrer_id = ?'
        ).get(user.id);

        // Total pending reward
        const pendingReward: any = db.prepare(
            "SELECT COALESCE(SUM(amount), 0) as total FROM referral_rewards WHERE referrer_id = ? AND status = 'pending'"
        ).get(user.id);

        // Total paid reward
        const paidReward: any = db.prepare(
            "SELECT COALESCE(SUM(amount), 0) as total FROM referral_rewards WHERE referrer_id = ? AND status = 'paid'"
        ).get(user.id);

        // Detail list
        const rewards: any[] = db.prepare(`
            SELECT rr.*, u.email as referred_email, u.name as referred_name
            FROM referral_rewards rr
            JOIN users u ON u.id = rr.referred_id
            WHERE rr.referrer_id = ?
            ORDER BY rr.created_at DESC
        `).all(user.id);

        // Mask emails for privacy
        const maskedRewards = rewards.map(r => ({
            ...r,
            referred_email: r.referred_email
                ? r.referred_email.substring(0, 3) + '***@' + r.referred_email.split('@')[1]
                : '',
        }));

        res.json({
            totalReferred: totalReferred.count,
            paidConversions: paidConversions.count,
            pendingReward: pendingReward.total,
            paidReward: paidReward.total,
            rewards: maskedRewards,
        });
    } catch (error: any) {
        console.error('[ERROR]', error.message); res.status(500).json({ error: 'サーバーエラーが発生しました。' });
    }
});

// Get/Save referral bonus content
app.get('/api/referral/bonus', authenticateRequest, (req, res) => {
    const session = (req as any).session;
    try {
        const user: any = db.prepare('SELECT id FROM users WHERE email = ?').get(session.email);
        if (!user) return res.status(404).json({ error: 'ユーザーが見つかりません。' });

        const bonus: any = db.prepare(
            'SELECT id, title, description, file_name, file_type, created_at, updated_at FROM referral_bonus_content WHERE user_id = ?'
        ).get(user.id);

        res.json({ bonus: bonus || null });
    } catch (error: any) {
        console.error('[ERROR]', error.message); res.status(500).json({ error: 'サーバーエラーが発生しました。' });
    }
});

app.post('/api/referral/bonus', authenticateRequest, (req, res) => {
    const session = (req as any).session;
    console.log('[Bonus Save] Request received from:', session.email, 'body keys:', Object.keys(req.body || {}));
    try {
        const user: any = db.prepare('SELECT id FROM users WHERE email = ?').get(session.email);
        if (!user) {
            console.log('[Bonus Save] User not found for email:', session.email);
            return res.status(404).json({ error: 'ユーザーが見つかりません。' });
        }

        const { title, description, fileName, fileData, fileType } = req.body;

        // Input validation
        if (title && title.length > 200) {
            return res.status(400).json({ error: 'タイトルは200文字以内で入力してください。' });
        }
        if (description && description.length > 2000) {
            return res.status(400).json({ error: '説明は2000文字以内で入力してください。' });
        }

        // File upload validation
        if (fileData) {
            // Validate file size (max 5MB as base64 = ~6.67MB string)
            const fileSizeBytes = Buffer.from(fileData, 'base64').length;
            const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
            if (fileSizeBytes > MAX_FILE_SIZE) {
                return res.status(400).json({ error: 'ファイルサイズは5MB以内にしてください。' });
            }

            // Validate file type (whitelist)
            const ALLOWED_TYPES = ['application/pdf', 'application/zip', 'application/x-zip-compressed',
                'image/jpeg', 'image/png', 'image/gif', 'image/webp',
                'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            const ALLOWED_EXTENSIONS = ['.pdf', '.zip', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.txt', '.docx'];

            if (fileType && !ALLOWED_TYPES.includes(fileType)) {
                return res.status(400).json({ error: '許可されていないファイル形式です。PDF, ZIP, 画像ファイルのみアップロード可能です。' });
            }
            if (fileName) {
                const ext = path.extname(fileName).toLowerCase();
                if (!ALLOWED_EXTENSIONS.includes(ext)) {
                    return res.status(400).json({ error: '許可されていないファイル拡張子です。' });
                }
                // Sanitize filename (remove path separators)
                if (fileName.includes('/') || fileName.includes('\\') || fileName.includes('..')) {
                    return res.status(400).json({ error: '不正なファイル名です。' });
                }
            }
        }

        const existing: any = db.prepare('SELECT id FROM referral_bonus_content WHERE user_id = ?').get(user.id);

        if (existing) {
            if (fileData) {
                db.prepare(`
                    UPDATE referral_bonus_content
                    SET title = ?, description = ?, file_name = ?, file_data = ?, file_type = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE user_id = ?
                `).run(title || '', description || '', fileName || null, Buffer.from(fileData, 'base64'), fileType || null, user.id);
            } else {
                db.prepare(`
                    UPDATE referral_bonus_content
                    SET title = ?, description = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE user_id = ?
                `).run(title || '', description || '', user.id);
            }
        } else {
            db.prepare(`
                INSERT INTO referral_bonus_content (user_id, title, description, file_name, file_data, file_type)
                VALUES (?, ?, ?, ?, ?, ?)
            `).run(
                user.id,
                title || '',
                description || '',
                fileName || null,
                fileData ? Buffer.from(fileData, 'base64') : null,
                fileType || null
            );
        }

        console.log('[Bonus Save] Successfully saved for user:', user.id);
        res.json({ success: true });
    } catch (error: any) {
        console.error('[Bonus Save] Error:', error.message);
        console.error('[ERROR]', error.message); res.status(500).json({ error: 'サーバーエラーが発生しました。' });
    }
});

// Public: Get bonus content by referral code (only if referrer has active paid plan)
app.get('/api/referral/bonus/:code', (req, res) => {
    try {
        const code = req.params.code;
        const user: any = db.prepare('SELECT id, name, plan FROM users WHERE referral_code = ?').get(code);
        if (!user) return res.status(404).json({ error: '紹介コードが見つかりません。' });

        // Block access if referrer's subscription is canceled (free plan)
        if (!user.plan || user.plan === 'free') {
            return res.status(403).json({ error: 'この紹介特典は現在ご利用いただけません。' });
        }

        const bonus: any = db.prepare(
            'SELECT title, description, file_name, file_type FROM referral_bonus_content WHERE user_id = ?'
        ).get(user.id);

        if (!bonus) return res.status(404).json({ error: '特典が設定されていません。' });

        res.json({
            referrerName: user.name || '紹介者',
            title: bonus.title,
            description: bonus.description,
            fileName: bonus.file_name,
            hasFile: !!bonus.file_name,
        });
    } catch (error: any) {
        console.error('[ERROR]', error.message); res.status(500).json({ error: 'サーバーエラーが発生しました。' });
    }
});

// Public: Download bonus file by referral code (only if referrer has active paid plan)
app.get('/api/referral/bonus/download/:code', (req, res) => {
    try {
        const code = req.params.code;
        const user: any = db.prepare('SELECT id, plan FROM users WHERE referral_code = ?').get(code);
        if (!user) return res.status(404).json({ error: '紹介コードが見つかりません。' });

        // Block download if referrer's subscription is canceled (free plan)
        if (!user.plan || user.plan === 'free') {
            return res.status(403).json({ error: 'この紹介特典は現在ご利用いただけません。' });
        }

        const bonus: any = db.prepare(
            'SELECT file_name, file_data, file_type FROM referral_bonus_content WHERE user_id = ?'
        ).get(user.id);

        if (!bonus || !bonus.file_data) return res.status(404).json({ error: 'ファイルが見つかりません。' });

        res.setHeader('Content-Type', bonus.file_type || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(bonus.file_name)}"`);
        res.send(bonus.file_data);
    } catch (error: any) {
        console.error('[ERROR]', error.message); res.status(500).json({ error: 'サーバーエラーが発生しました。' });
    }
});

// Dashboard: Get my referrer's bonus content (for referred users)
app.get('/api/referral/my-bonus', authenticateRequest, (req, res) => {
    const session = (req as any).session;
    try {
        const user: any = db.prepare('SELECT id, referred_by FROM users WHERE email = ?').get(session.email);
        if (!user) return res.status(404).json({ error: 'ユーザーが見つかりません。' });

        if (!user.referred_by) {
            return res.json({ bonus: null, message: '紹介者がいません。' });
        }

        const referrer: any = db.prepare('SELECT id, name, email, plan, referral_code FROM users WHERE id = ?').get(user.referred_by);
        if (!referrer) {
            return res.json({ bonus: null, message: '紹介者が見つかりません。' });
        }

        // Check if referrer has a paid plan
        if (!referrer.plan || referrer.plan === 'free') {
            return res.json({ bonus: null, message: '紹介者の特典は現在ご利用いただけません。' });
        }

        const bonus: any = db.prepare(
            'SELECT title, description, file_name, file_type FROM referral_bonus_content WHERE user_id = ?'
        ).get(referrer.id);

        if (!bonus) {
            return res.json({ bonus: null, message: '紹介者が特典を設定していません。' });
        }

        res.json({
            bonus: {
                referrerName: referrer.name || '紹介者',
                referralCode: referrer.referral_code,
                title: bonus.title,
                description: bonus.description,
                fileName: bonus.file_name,
                hasFile: !!bonus.file_name,
            },
        });
    } catch (error: any) {
        console.error('[ERROR]', error.message); res.status(500).json({ error: 'サーバーエラーが発生しました。' });
    }
});

// ---------------------------------------------------------------------------
// Withdrawal Requests API
// ---------------------------------------------------------------------------

// Get my withdrawal requests
app.get('/api/referral/withdrawals', authenticateRequest, (req, res) => {
    const session = (req as any).session;
    try {
        const user: any = db.prepare('SELECT id FROM users WHERE email = ?').get(session.email);
        if (!user) return res.status(404).json({ error: 'ユーザーが見つかりません。' });

        const withdrawals: any[] = db.prepare(
            'SELECT id, amount, status, bank_info, notes, admin_note, processed_at, created_at FROM withdrawal_requests WHERE user_id = ? ORDER BY created_at DESC'
        ).all(user.id);

        res.json({ withdrawals });
    } catch (error: any) {
        console.error('[ERROR]', error.message); res.status(500).json({ error: 'サーバーエラーが発生しました。' });
    }
});

// Submit withdrawal request (minimum ¥5,000)
app.post('/api/referral/withdraw', authenticateRequest, (req, res) => {
    const session = (req as any).session;
    try {
        const user: any = db.prepare('SELECT id FROM users WHERE email = ?').get(session.email);
        if (!user) return res.status(404).json({ error: 'ユーザーが見つかりません。' });

        const { amount, bankInfo, notes } = req.body;

        // Validate amount
        const requestAmount = Number(amount);
        if (!requestAmount || requestAmount < 5000) {
            return res.status(400).json({ error: '出金申請は5,000円以上から可能です。' });
        }

        // Check available balance (pending rewards that haven't been withdrawn)
        const pendingReward: any = db.prepare(
            "SELECT COALESCE(SUM(amount), 0) as total FROM referral_rewards WHERE referrer_id = ? AND status = 'pending'"
        ).get(user.id);

        // Also check already-requested withdrawal amounts that are still pending
        const pendingWithdrawals: any = db.prepare(
            "SELECT COALESCE(SUM(amount), 0) as total FROM withdrawal_requests WHERE user_id = ? AND status = 'pending'"
        ).get(user.id);

        const availableBalance = pendingReward.total - pendingWithdrawals.total;

        if (requestAmount > availableBalance) {
            return res.status(400).json({
                error: `申請可能な金額を超えています。現在の申請可能額: ¥${availableBalance.toLocaleString()}`
            });
        }

        // Validate bank info
        if (!bankInfo || bankInfo.trim().length < 10) {
            return res.status(400).json({ error: '振込先情報を正しく入力してください。' });
        }
        if (bankInfo.length > 500) {
            return res.status(400).json({ error: '振込先情報は500文字以内で入力してください。' });
        }

        // Check for duplicate pending request
        const existingPending: any = db.prepare(
            "SELECT id FROM withdrawal_requests WHERE user_id = ? AND status = 'pending' LIMIT 1"
        ).get(user.id);
        if (existingPending) {
            return res.status(400).json({ error: '処理中の出金申請があります。前回の申請が完了するまでお待ちください。' });
        }

        // Create withdrawal request
        const result = db.prepare(
            'INSERT INTO withdrawal_requests (user_id, amount, bank_info, notes) VALUES (?, ?, ?, ?)'
        ).run(user.id, requestAmount, bankInfo.trim(), notes?.trim() || null);

        console.log(`[Withdrawal] User ${user.id} requested withdrawal of ¥${requestAmount}`);

        res.json({
            success: true,
            withdrawal: {
                id: result.lastInsertRowid,
                amount: requestAmount,
                status: 'pending',
            }
        });
    } catch (error: any) {
        console.error('[ERROR]', error.message); res.status(500).json({ error: 'サーバーエラーが発生しました。' });
    }
});

// Admin: Get all withdrawal requests
app.get('/api/admin/withdrawals', authenticateRequest, requireAdmin, (req, res) => {
    try {
        const withdrawals: any[] = db.prepare(`
            SELECT wr.*, u.email, u.name
            FROM withdrawal_requests wr
            JOIN users u ON u.id = wr.user_id
            ORDER BY
                CASE wr.status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END,
                wr.created_at DESC
        `).all();

        res.json(withdrawals);
    } catch (error: any) {
        console.error('[ERROR]', error.message); res.status(500).json({ error: 'サーバーエラーが発生しました。' });
    }
});

// Admin: Process withdrawal request (approve/reject)
app.post('/api/admin/withdrawals/:id/process', authenticateRequest, requireAdmin, (req, res) => {
    try {
        const id = req.params.id;
        const { action, adminNote } = req.body;

        if (!['approved', 'rejected'].includes(action)) {
            return res.status(400).json({ error: '無効なアクションです。' });
        }

        const withdrawal: any = db.prepare('SELECT * FROM withdrawal_requests WHERE id = ?').get(id);
        if (!withdrawal) return res.status(404).json({ error: '出金申請が見つかりません。' });
        if (withdrawal.status !== 'pending') return res.status(400).json({ error: 'この申請は既に処理済みです。' });

        db.prepare(
            'UPDATE withdrawal_requests SET status = ?, admin_note = ?, processed_at = CURRENT_TIMESTAMP WHERE id = ?'
        ).run(action, adminNote || null, id);

        // If approved, mark the corresponding referral rewards as paid
        if (action === 'approved') {
            // Mark pending rewards as paid up to the withdrawal amount
            const pendingRewards: any[] = db.prepare(
                "SELECT id, amount FROM referral_rewards WHERE referrer_id = ? AND status = 'pending' ORDER BY created_at ASC"
            ).all(withdrawal.user_id);

            let remaining = withdrawal.amount;
            for (const reward of pendingRewards) {
                if (remaining <= 0) break;
                db.prepare("UPDATE referral_rewards SET status = 'paid', paid_at = CURRENT_TIMESTAMP WHERE id = ?").run(reward.id);
                remaining -= reward.amount;
            }
        }

        console.log(`[Withdrawal] Admin ${action} withdrawal #${id} (¥${withdrawal.amount})`);

        res.json({ success: true });
    } catch (error: any) {
        console.error('[ERROR]', error.message); res.status(500).json({ error: 'サーバーエラーが発生しました。' });
    }
});

// Admin: Get all referral rewards
app.get('/api/admin/referrals', authenticateRequest, requireAdmin, (req, res) => {
    try {
        const rewards: any[] = db.prepare(`
            SELECT rr.*,
                   referrer.email as referrer_email, referrer.name as referrer_name,
                   referred.email as referred_email, referred.name as referred_name
            FROM referral_rewards rr
            JOIN users referrer ON referrer.id = rr.referrer_id
            JOIN users referred ON referred.id = rr.referred_id
            ORDER BY rr.created_at DESC
        `).all();

        res.json(rewards);
    } catch (error: any) {
        console.error('[ERROR]', error.message); res.status(500).json({ error: 'サーバーエラーが発生しました。' });
    }
});

// Admin: Mark referral reward as paid
app.post('/api/admin/referrals/:id/pay', authenticateRequest, requireAdmin, (req, res) => {
    try {
        const rewardId = req.params.id;
        db.prepare(
            "UPDATE referral_rewards SET status = 'paid', paid_at = CURRENT_TIMESTAMP WHERE id = ?"
        ).run(rewardId);

        res.json({ success: true });
    } catch (error: any) {
        console.error('[ERROR]', error.message); res.status(500).json({ error: 'サーバーエラーが発生しました。' });
    }
});

// Admin: Get all subscriptions with user info
app.get('/api/admin/subscriptions', authenticateRequest, requireAdmin, async (req, res) => {
    try {
        // Get all subscriptions joined with user info
        const subscriptions: any[] = db.prepare(`
            SELECT s.*,
                   u.email, u.name, u.plan as user_plan, u.stripe_customer_id,
                   u.created_at as user_created_at
            FROM subscriptions s
            JOIN users u ON s.user_id = u.id
            ORDER BY s.updated_at DESC
        `).all();

        // Also get users who have a paid plan but might not be in subscriptions table
        const paidUsersWithoutSub: any[] = db.prepare(`
            SELECT u.id, u.email, u.name, u.plan, u.stripe_customer_id, u.created_at
            FROM users u
            LEFT JOIN subscriptions s ON u.id = s.user_id
            WHERE u.plan != 'free' AND s.id IS NULL
        `).all();

        // Summary stats
        const stats = {
            totalActive: subscriptions.filter(s => s.status === 'active' && s.cancel_at_period_end === 0).length,
            totalCanceling: subscriptions.filter(s => s.status === 'active' && s.cancel_at_period_end === 1).length,
            totalCanceled: subscriptions.filter(s => s.status === 'canceled').length,
            totalPastDue: subscriptions.filter(s => s.status === 'past_due').length,
            totalRevenue: 0,
        };

        // Calculate monthly revenue from active plans
        const planPrices: Record<string, number> = {
            starter: 2980, advanced: 4980, advanced_20: 6980,
            advanced_70: 10980, advanced_170: 19800
        };
        subscriptions.forEach(s => {
            if (s.status === 'active') {
                stats.totalRevenue += planPrices[s.plan] || 0;
            }
        });

        // Sync with Stripe for real-time status (optional, for latest invoice info)
        const enrichedSubs = [];
        for (const sub of subscriptions) {
            let latestInvoice = null;
            let latestPaymentStatus = null;
            if (sub.stripe_subscription_id) {
                try {
                    const stripeSub = await stripe.subscriptions.retrieve(sub.stripe_subscription_id, {
                        expand: ['latest_invoice']
                    });
                    const invoice = stripeSub.latest_invoice as Stripe.Invoice;
                    if (invoice) {
                        const isPaid = (invoice as any).paid ?? (invoice.status === 'paid');
                        latestInvoice = {
                            id: invoice.id,
                            amount: invoice.amount_paid,
                            currency: invoice.currency,
                            status: invoice.status,
                            paid: isPaid,
                            created: invoice.created,
                            hostedUrl: invoice.hosted_invoice_url,
                        };
                        latestPaymentStatus = isPaid ? 'paid' : invoice.status;
                    }
                } catch (e: any) {
                    console.warn(`[Admin Subs] Failed to fetch Stripe data for ${sub.stripe_subscription_id}:`, e.message);
                }
            }
            enrichedSubs.push({
                ...sub,
                latestInvoice,
                latestPaymentStatus,
            });
        }

        res.json({
            stats,
            subscriptions: enrichedSubs,
            orphanedPaidUsers: paidUsersWithoutSub,
        });
    } catch (error: any) {
        console.error('[Admin Subscriptions] Error:', error);
        console.error('[ERROR]', error.message); res.status(500).json({ error: 'サーバーエラーが発生しました。' });
    }
});

// --- Start Server ---
// Migrate existing unencrypted API keys to encrypted format
function migrateApiKeysToEncrypted() {
    try {
        const accounts: any[] = db.prepare('SELECT id, api_key, api_secret, access_token, access_secret, bearer_token FROM accounts').all();
        let migrated = 0;
        for (const acc of accounts) {
            let needsUpdate = false;
            const updates: any = {};

            for (const field of ['api_key', 'api_secret', 'access_token', 'access_secret', 'bearer_token'] as const) {
                const val = acc[field];
                if (val && !isEncrypted(val)) {
                    updates[field] = encryptValue(val);
                    needsUpdate = true;
                } else {
                    updates[field] = val;
                }
            }

            if (needsUpdate) {
                db.prepare(`
                    UPDATE accounts SET api_key = ?, api_secret = ?, access_token = ?, access_secret = ?, bearer_token = ?
                    WHERE id = ?
                `).run(updates.api_key, updates.api_secret, updates.access_token, updates.access_secret, updates.bearer_token, acc.id);
                migrated++;
            }
        }
        if (migrated > 0) {
            console.log(`[Security] Encrypted API keys for ${migrated} account(s).`);
        }
    } catch (err) {
        console.error('[Security] API key migration error:', err);
    }
}

async function startServer() {
    try {
        await initializeDatabase();
        console.log('[Server] Database initialized successfully.');

        // Restore sessions from DB (persist across server restarts)
        restoreSessionsFromDb();

        // Seed master account after DB is ready
        await seedMasterAccount();

        // Migrate unencrypted API keys
        migrateApiKeysToEncrypted();

        // Initialize Stripe products & prices
        await initializeStripePrices();

        // Startup: verify encryption key can decrypt stored account credentials
        if (ENCRYPTION_AVAILABLE) {
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const accounts: any[] = db.prepare('SELECT id, screen_name, api_key FROM accounts LIMIT 10').all();
                let okCount = 0;
                let failCount = 0;
                for (const acct of accounts) {
                    if (!acct.api_key) continue;
                    const parts = acct.api_key.split(':');
                    if (parts.length !== 3) { okCount++; continue; } // Legacy unencrypted
                    try {
                        const [ivHex, authTagHex, encrypted] = parts;
                        const iv = Buffer.from(ivHex, 'hex');
                        const authTag = Buffer.from(authTagHex, 'hex');
                        const decipher = crypto.createDecipheriv('aes-256-gcm', ENC_KEY_BUF, iv);
                        decipher.setAuthTag(authTag);
                        decipher.update(encrypted, 'hex', 'utf8');
                        decipher.final('utf8');
                        okCount++;
                    } catch {
                        failCount++;
                        console.error(`[CRITICAL] Account @${acct.screen_name} (${acct.id}): API key decryption FAILED! Keys may be corrupted.`);
                    }
                }
                console.log(`[Startup] Encryption check: ${okCount} accounts OK, ${failCount} accounts FAILED.`);
                if (failCount > 0) {
                    console.error(`[CRITICAL] ${failCount} account(s) have corrupted API keys. Re-save their credentials in the dashboard.`);
                }
            } catch (err) {
                console.error('[Startup] Encryption check error:', err);
            }
        } else {
            console.error('[CRITICAL] ENCRYPTION_KEY not available. All encrypted API key operations will fail!');
        }

        // Initialize Bot Runner with current client
        initBotRunner(xClient);

        app.listen(port, () => {
            console.log(`Backend server running at http://localhost:${port}`);
        });
    } catch (error) {
        console.error('[Server] Failed to initialize database:', error);
        process.exit(1);
    }
}

startServer();
