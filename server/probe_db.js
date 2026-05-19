const Database = require('better-sqlite3');
const path = require('path');
const db = new Database('data/posutto.db');

const today = new Date().toISOString().split('T')[0];
const monthStart = today.substring(0, 7) + '-01';
const email = 'sorabcjanne1@gmail.com';

try {
    const user = db.prepare('SELECT id, plan FROM users WHERE email = ?').get(email);
    console.log('User found:', user);
    if (!user) {
        console.log('User not found. Tables in DB:');
        const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
        console.log(tables);
        process.exit(1);
    }

    console.log('Running metrics query...');
    const metrics = db.prepare(`
        SELECT 
            SUM(CASE WHEN date = ? THEN tweets ELSE 0 END) as todayTweets,
            SUM(impressions) as monthlyImpressions
        FROM daily_metrics 
        WHERE user_id = ? AND date >= ?
    `).get(today, user.id, monthStart);
    console.log('Metrics result:', metrics);

    console.log('Running bots query...');
    const bots = db.prepare('SELECT schedule FROM bots WHERE user_id = ? AND status = "active"').all(user.id);
    console.log('Bots result count:', bots.length);

    console.log('Success!');
} catch (error) {
    console.error('PROBE ERROR:', error);
}
