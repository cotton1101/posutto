export type Account = {
    id: string;
    screenName: string; // @username
    name: string;
    avatarUrl?: string;
    profileImageUrl?: string;
    // Login Credentials
    username?: string;
    password?: string;
    email?: string;
    phoneNumber?: string;
    status?: 'active' | 'suspended' | 'locked';
    // X API Credentials
    apiKey?: string;
    apiSecret?: string;
    accessToken?: string;
    accessTokenSecret?: string;
    bearerToken?: string;
};

export type Schedule = {
    id: string;
    type: 'interval' | 'cron';
    value: string; // e.g. "30m" or "0 9 * * *"
    active: boolean;
};

export type BotType = 'video_quote' | 'reply_to_championship';

export type Bot = {
    id: string;
    name: string;
    accountId: string;
    screenName?: string;
    status: 'active' | 'paused' | 'error';
    schedule: Schedule;
    tweetsCount: number;
    lastRun?: string;
    nextRun?: string;
    // Bot Type
    botType?: BotType;
    // Video Quote Bot fields
    referenceAccounts?: string[]; // List of screenNames or IDs
    affiliateLink?: string;
    linkPlacement?: 'post' | 'reply';
    targetVideoKeywords?: string[]; // Optional: filter videos by keywords
    randomTexts?: string[]; // 投稿時にランダムで1行選ばれる文章リスト
    // Affiliate Settings
    affiliateType?: 'dmm' | 'mgs' | 'custom';
    dmmAffiliateId?: string; // e.g. "myid-001"
    mgsAffiliateId?: string; // e.g. "mycode123"
    // Championship Reply Bot fields
    championshipAccounts?: string[]; // 監視する選手権アカウント名リスト
    replyTexts?: string[]; // リプライ時のランダムテキスト
    // Automation Settings
    automationType?: 'none' | 'likes_follows';
    likeKeywords?: string[];
    followTargetAccount?: string;
    dailyLikeLimit?: number;
    followIntervals?: ('morning' | 'noon' | 'evening')[];
    metrics?: {
        likes: number;
        follows: number;
    };
};

export type Tweet = {
    id: string;
    botId: string;
    content: string;
    mediaUrls: string[];
    status: 'pending' | 'posted' | 'failed';
    scheduledAt?: string;
};
