// ネットワーク通信のベースURL設定
// 開発環境と本番環境（サブディレクトリ /posutto/）を切り替えます

export const API_BASE = (typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
    ? 'http://localhost:3001'
    : 'https://sns-tool.online/posutto';
