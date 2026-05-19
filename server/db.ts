// @ts-expect-error - Using ASM.js version to avoid WASM memory issues on shared hosting
import initSqlJs from 'sql.js/dist/sql-asm.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure the data directory exists
const dbPath = path.join(__dirname, 'data/posutto.db');
if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}

// --- sql.js wrapper providing better-sqlite3 compatible API ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let sqlDb: any;

function saveToDisk() {
    const data = sqlDb.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
}

interface RunResult {
    changes: number;
    lastInsertRowid: number | bigint;
}

interface PreparedStatement {
    get(...params: any[]): any;
    all(...params: any[]): any[];
    run(...params: any[]): RunResult;
}

function createStatement(sql: string): PreparedStatement {
    return {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        get(...params: any[]): any {
            const stmt = sqlDb.prepare(sql);
            if (params.length > 0) {
                stmt.bind(params);
            }
            if (stmt.step()) {
                const row = stmt.getAsObject();
                stmt.free();
                return row;
            }
            stmt.free();
            return undefined;
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        all(...params: any[]): any[] {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const results: any[] = [];
            const stmt = sqlDb.prepare(sql);
            if (params.length > 0) {
                stmt.bind(params);
            }
            while (stmt.step()) {
                results.push(stmt.getAsObject());
            }
            stmt.free();
            return results;
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        run(...params: any[]): RunResult {
            sqlDb.run(sql, params);
            const changes = sqlDb.getRowsModified();
            const lastIdResult = sqlDb.exec("SELECT last_insert_rowid() as id");
            const lastInsertRowid = lastIdResult.length > 0 && lastIdResult[0].values.length > 0
                ? lastIdResult[0].values[0][0] as number
                : 0;
            saveToDisk();
            return { changes, lastInsertRowid };
        }
    };
}

// Compatible DB interface
const db = {
    prepare(sql: string): PreparedStatement {
        return createStatement(sql);
    },
    exec(sql: string): void {
        sqlDb.run(sql);
        saveToDisk();
    }
};

// --- Initialize ---

async function initializeDatabase(): Promise<typeof db> {
    const SQL = await initSqlJs();

    // Load existing DB file or create new
    if (fs.existsSync(dbPath)) {
        const fileBuffer = fs.readFileSync(dbPath);
        sqlDb = new SQL.Database(fileBuffer);
        console.log('[DB] Loaded existing database from disk.');
    } else {
        sqlDb = new SQL.Database();
        console.log('[DB] Created new database.');
    }

    // Initialize schema
    sqlDb.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT,
            role TEXT DEFAULT 'user',
            plan TEXT DEFAULT 'free',
            name TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS bots (
            id TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            account_id TEXT NOT NULL,
            status TEXT DEFAULT 'inactive',
            settings TEXT,
            schedule TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        );

        CREATE TABLE IF NOT EXISTS accounts (
            id TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            screen_name TEXT UNIQUE NOT NULL,
            username TEXT,
            password TEXT,
            email TEXT,
            phone_number TEXT,
            status TEXT DEFAULT 'active',
            profile_image_url TEXT,
            api_key TEXT,
            api_secret TEXT,
            access_token TEXT,
            access_secret TEXT,
            bearer_token TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        );

        CREATE TABLE IF NOT EXISTS links (
            id TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            url TEXT NOT NULL,
            type TEXT,
            status TEXT DEFAULT 'active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        );

        CREATE TABLE IF NOT EXISTS system_settings (
            key TEXT PRIMARY KEY,
            value TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS analytics_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            account_id TEXT,
            link_id TEXT,
            event_type TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (account_id) REFERENCES accounts (id),
            FOREIGN KEY (link_id) REFERENCES links (id)
        );

        CREATE TABLE IF NOT EXISTS captchas (
            id TEXT PRIMARY KEY,
            answer TEXT NOT NULL,
            expires_at DATETIME NOT NULL
        );

        CREATE TABLE IF NOT EXISTS login_attempts (
            ip_address TEXT,
            email TEXT,
            attempts INTEGER DEFAULT 0,
            locked_until DATETIME,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (ip_address, email)
        );

        CREATE TABLE IF NOT EXISTS two_factor_tokens (
            email TEXT PRIMARY KEY,
            token TEXT NOT NULL,
            expires_at DATETIME NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS announcements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            type TEXT DEFAULT 'info',
            is_active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS daily_metrics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            account_id TEXT NOT NULL,
            date DATE DEFAULT (CURRENT_DATE),
            impressions INTEGER DEFAULT 0,
            engagement INTEGER DEFAULT 0,
            tweets INTEGER DEFAULT 0,
            followers INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, account_id, date),
            FOREIGN KEY (user_id) REFERENCES users (id)
        );

        CREATE TABLE IF NOT EXISTS posted_tweets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bot_id TEXT NOT NULL,
            source_tweet_id TEXT NOT NULL,
            posted_tweet_id TEXT,
            content TEXT,
            affiliate_url TEXT,
            status TEXT DEFAULT 'posted',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (bot_id) REFERENCES bots (id)
        );

        CREATE INDEX IF NOT EXISTS idx_posted_tweets_bot ON posted_tweets (bot_id);
        CREATE INDEX IF NOT EXISTS idx_posted_tweets_source ON posted_tweets (source_tweet_id);

        CREATE TABLE IF NOT EXISTS bot_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bot_id TEXT NOT NULL,
            log_type TEXT NOT NULL DEFAULT 'info',
            message TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (bot_id) REFERENCES bots (id)
        );

        CREATE INDEX IF NOT EXISTS idx_bot_logs_bot_id ON bot_logs (bot_id);
        CREATE INDEX IF NOT EXISTS idx_bot_logs_created_at ON bot_logs (created_at);

        CREATE TABLE IF NOT EXISTS subscriptions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL UNIQUE,
            stripe_customer_id TEXT,
            stripe_subscription_id TEXT,
            stripe_price_id TEXT,
            plan TEXT NOT NULL DEFAULT 'free',
            status TEXT NOT NULL DEFAULT 'inactive',
            current_period_start DATETIME,
            current_period_end DATETIME,
            cancel_at_period_end INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        );

        CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions (user_id);
        CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions (stripe_customer_id);

        CREATE TABLE IF NOT EXISTS followed_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bot_id TEXT NOT NULL,
            target_user_id TEXT NOT NULL,
            target_username TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(bot_id, target_user_id),
            FOREIGN KEY (bot_id) REFERENCES bots (id)
        );

        CREATE INDEX IF NOT EXISTS idx_followed_users_bot ON followed_users (bot_id);

        CREATE TABLE IF NOT EXISTS liked_tweets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bot_id TEXT NOT NULL,
            tweet_id TEXT NOT NULL,
            keyword TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(bot_id, tweet_id),
            FOREIGN KEY (bot_id) REFERENCES bots (id)
        );

        CREATE INDEX IF NOT EXISTS idx_liked_tweets_bot ON liked_tweets (bot_id);

        CREATE TABLE IF NOT EXISTS sessions (
            token TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            email TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'user',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            expires_at DATETIME NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users (id)
        );

        CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions (user_id);

        CREATE TABLE IF NOT EXISTS referral_rewards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            referrer_id INTEGER NOT NULL,
            referred_id INTEGER NOT NULL,
            plan TEXT NOT NULL,
            amount INTEGER NOT NULL DEFAULT 500,
            status TEXT DEFAULT 'pending',
            paid_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (referrer_id) REFERENCES users (id),
            FOREIGN KEY (referred_id) REFERENCES users (id)
        );

        CREATE INDEX IF NOT EXISTS idx_referral_rewards_referrer ON referral_rewards (referrer_id);

        CREATE TABLE IF NOT EXISTS referral_bonus_content (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL UNIQUE,
            title TEXT,
            description TEXT,
            file_name TEXT,
            file_data BLOB,
            file_type TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        );

        CREATE TABLE IF NOT EXISTS withdrawal_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            amount INTEGER NOT NULL,
            status TEXT DEFAULT 'pending',
            bank_info TEXT,
            notes TEXT,
            admin_note TEXT,
            processed_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        );

        CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user ON withdrawal_requests (user_id);
        CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON withdrawal_requests (status);
    `);
    saveToDisk();

    // Migration: add stripe_customer_id to users table if not exists
    try {
        sqlDb.run('ALTER TABLE users ADD COLUMN stripe_customer_id TEXT');
        saveToDisk();
        console.log('[DB] Added stripe_customer_id column to users.');
    } catch {
        // Column already exists, ignore
    }

    // Migration: add Twitter API credential columns to accounts (for pre-existing DBs)
    const accountsColumnMigrations: Array<[string, string]> = [
        ['username', 'TEXT'],
        ['password', 'TEXT'],
        ['email', 'TEXT'],
        ['phone_number', 'TEXT'],
        ['status', "TEXT DEFAULT 'active'"],
        ['profile_image_url', 'TEXT'],
        ['api_key', 'TEXT'],
        ['api_secret', 'TEXT'],
        ['access_token', 'TEXT'],
        ['access_secret', 'TEXT'],
        ['bearer_token', 'TEXT'],
    ];
    for (const [col, type] of accountsColumnMigrations) {
        try {
            sqlDb.run(`ALTER TABLE accounts ADD COLUMN ${col} ${type}`);
            saveToDisk();
            console.log(`[DB] Added ${col} column to accounts.`);
        } catch {
            // Column already exists, ignore
        }
    }

    // Migration: add referral_code to users table
    try {
        sqlDb.run('ALTER TABLE users ADD COLUMN referral_code TEXT');
        saveToDisk();
        console.log('[DB] Added referral_code column to users.');
    } catch {
        // Column already exists, ignore
    }

    // Create unique index for referral_code (separate from ALTER TABLE since UNIQUE constraint not supported)
    try {
        sqlDb.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_referral_code ON users (referral_code)');
        saveToDisk();
        console.log('[DB] Created unique index on referral_code.');
    } catch {
        // Index already exists, ignore
    }

    // Migration: add referred_by to users table
    try {
        sqlDb.run('ALTER TABLE users ADD COLUMN referred_by INTEGER');
        saveToDisk();
        console.log('[DB] Added referred_by column to users.');
    } catch {
        // Column already exists, ignore
    }

    // Migration: add expires_at to sessions table
    try {
        sqlDb.run("ALTER TABLE sessions ADD COLUMN expires_at DATETIME NOT NULL DEFAULT '2026-12-31T00:00:00.000Z'");
        saveToDisk();
        console.log('[DB] Added expires_at column to sessions.');
    } catch {
        // Column already exists, ignore
    }

    // Migration: add reward_type and stripe_invoice_id to referral_rewards (for recurring rewards)
    try {
        sqlDb.run("ALTER TABLE referral_rewards ADD COLUMN reward_type TEXT NOT NULL DEFAULT 'initial'");
        saveToDisk();
        console.log('[DB] Added reward_type column to referral_rewards.');
    } catch {
        // Column already exists, ignore
    }
    try {
        sqlDb.run("ALTER TABLE referral_rewards ADD COLUMN stripe_invoice_id TEXT");
        saveToDisk();
        console.log('[DB] Added stripe_invoice_id column to referral_rewards.');
    } catch {
        // Column already exists, ignore
    }

    // Migration: fix users who were incorrectly assigned 'starter' plan without a Stripe subscription
    try {
        const fixed = sqlDb.run(`
            UPDATE users SET plan = 'free'
            WHERE plan = 'starter'
            AND role != 'admin'
            AND id NOT IN (SELECT DISTINCT user_id FROM subscriptions WHERE status = 'active')
        `);
        if (fixed.changes > 0) {
            saveToDisk();
            console.log(`[DB] Fixed ${fixed.changes} user(s) incorrectly on starter plan → free.`);
        }
    } catch (e) {
        console.error('[DB] Migration fix starter→free error:', e);
    }

    console.log('[DB] Schema initialized.');

    return db;
}

export { initializeDatabase };
export default db;
