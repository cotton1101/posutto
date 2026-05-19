import { useState, useEffect } from 'react';
import {
    Activity,
    TrendingUp,
    TrendingDown,
    Users,
    RefreshCw,
    ShieldAlert
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import type { Account } from '../types';
import { fetchXUserProfileByAccountId, checkShadowban, type ShadowbanStatus } from '../lib/xService';

// localStorage key for follower history
const FOLLOWER_HISTORY_KEY = 'posutto_follower_history';

interface FollowerHistory {
    [screenName: string]: {
        count: number;
        lastUpdate: string;
    };
}

import { useAuth } from '../lib/auth';
import { authFetch } from '../lib/authFetch';
import { API_BASE } from '../config';

export default function AccountStatus() {
    const { user } = useAuth();
    const [accounts, setAccounts] = useState<Account[]>([]);
    // Profile data keyed by account ID
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [profiles, setProfiles] = useState<{ [accountId: string]: any }>({});
    const [history, setHistory] = useState<FollowerHistory>({});
    const [loading, setLoading] = useState<{ [accountId: string]: boolean }>({});
    const [shadowbanResults, setShadowbanResults] = useState<{ [screenName: string]: ShadowbanStatus }>({});
    const [checkingShadowban, setCheckingShadowban] = useState<{ [screenName: string]: boolean }>({});

    useEffect(() => {
        const fetchAccounts = async () => {
            if (!user?.email) return;
            try {
                const res = await authFetch(`${API_BASE}/api/accounts/${user.email}`);
                if (res.ok) {
                    const data = await res.json();
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const mappedAccounts = data.map((dbAcc: any) => ({
                        id: dbAcc.id,
                        name: dbAcc.name,
                        screenName: dbAcc.screen_name,
                        profileImageUrl: dbAcc.profile_image_url
                    }));
                    setAccounts(mappedAccounts);

                    // Fetch initial profiles using account ID (uses account's own API keys)
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    mappedAccounts.forEach((acc: any) => fetchProfile(acc.id, acc.screenName));
                }
            } catch (error) {
                console.error('Failed to fetch accounts:', error);
            }
        };

        fetchAccounts();

        // Load history from localStorage
        const storedHistory = localStorage.getItem(FOLLOWER_HISTORY_KEY);
        if (storedHistory) {
            setHistory(JSON.parse(storedHistory));
        }
    }, [user?.email]);

    const fetchProfile = async (accountId: string, screenName: string) => {
        setLoading(prev => ({ ...prev, [accountId]: true }));
        try {
            const data = await fetchXUserProfileByAccountId(accountId);
            if (!data) throw new Error("Failed to fetch profile");

            setProfiles(prev => ({ ...prev, [accountId]: data }));

            // Update history if it's a new day or first time (keyed by screenName for consistency)
            updateHistory(screenName, data.followersCount);
        } catch (error) {
            console.error(`Error fetching profile for ${screenName} (id: ${accountId}):`, error);
        } finally {
            setLoading(prev => ({ ...prev, [accountId]: false }));
        }
    };

    const handleCheckShadowban = async (screenName: string) => {
        setCheckingShadowban(prev => ({ ...prev, [screenName]: true }));
        try {
            const result = await checkShadowban(screenName);
            if (result) {
                setShadowbanResults(prev => ({ ...prev, [screenName]: result }));
            }
        } catch (error) {
            console.error(`Error checking shadowban for ${screenName}:`, error);
        } finally {
            setCheckingShadowban(prev => ({ ...prev, [screenName]: false }));
        }
    };

    const updateHistory = (screenName: string, currentCount: number) => {
        setHistory(prev => {
            const lastData = prev[screenName];
            const today = new Date().toISOString().split('T')[0];

            // If no history or last update was before today, keep the old count as the baseline for "daily change"
            // and update the lastUpdate to today but we need to keep the "previous" count for calculation.
            // Simplified: if lastUpdate !== today, the current "count" in history is yesterday's final count.

            const newHistory = { ...prev };
            if (!lastData) {
                newHistory[screenName] = { count: currentCount, lastUpdate: today };
            } else if (lastData.lastUpdate !== today) {
                // Keep the old count for today's comparison, but mark it as updated today
                // Actually, to show "1 day change", we need the count from roughly 24h ago.
                // For this mock/simple version, we'll just store the count when they first open it each day.
                newHistory[screenName] = { ...lastData, lastUpdate: today };
            }

            localStorage.setItem(FOLLOWER_HISTORY_KEY, JSON.stringify(newHistory));
            return newHistory;
        });
    };

    const getFollowerChange = (screenName: string, currentCount: number) => {
        const h = history[screenName];
        if (!h) return 0;
        return currentCount - h.count;
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">アカウント状況</h1>
                <p className="text-sm text-gray-500 mt-1">登録済みアカウントの稼働状況とフォロワー推移を確認します。</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {accounts.map((account) => {
                    const profile = profiles[account.id];
                    const isLoading = loading[account.id];
                    const change = profile ? getFollowerChange(account.screenName, profile.followersCount) : 0;

                    return (
                        <div key={account.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="h-14 w-14 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-500 border-2 border-white shadow-sm overflow-hidden">
                                            {(profile?.profileImageUrl || account.profileImageUrl) ? (
                                                <img src={profile?.profileImageUrl || account.profileImageUrl} alt="" className="h-full w-full object-cover" />
                                            ) : (
                                                <span className="text-xl font-bold">{account.name.charAt(0)}</span>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-lg">{profile?.name || account.name}</h3>
                                            <p className="text-sm text-gray-500">@{account.screenName}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => fetchProfile(account.id, account.screenName)}
                                        className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${isLoading ? 'animate-spin' : ''}`}
                                        disabled={isLoading}
                                    >
                                        <RefreshCw size={18} className="text-gray-400" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                        <div className="flex items-center gap-2 text-gray-500 mb-1">
                                            <Users size={14} />
                                            <span className="text-xs font-medium">フォロワー</span>
                                        </div>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-2xl font-bold text-gray-900">
                                                {profile ? profile.followersCount.toLocaleString() : '---'}
                                            </span>
                                            {profile && (
                                                <span className={`flex items-center text-xs font-bold ${change >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {change >= 0 ? <TrendingUp size={12} className="mr-0.5" /> : <TrendingDown size={12} className="mr-0.5" />}
                                                    {Math.abs(change)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                        <div className="flex items-center gap-2 text-gray-500 mb-1">
                                            <Activity size={14} />
                                            <span className="text-xs font-medium">1日の増減</span>
                                        </div>
                                        <div className="flex items-baseline gap-2">
                                            <span className={`text-2xl font-bold ${change >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {profile ? (change >= 0 ? `+${change}` : change) : '---'}
                                            </span>
                                            <span className="text-[10px] text-gray-400 font-medium">人</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                        <ShieldAlert size={14} />
                                        アカウントチェック
                                    </h4>

                                    {shadowbanResults[account.screenName] ? (
                                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-600">サーチバン</span>
                                                {shadowbanResults[account.screenName].status.searchBan ? (
                                                    <span className="text-rose-600 font-bold flex items-center gap-1">警告あり</span>
                                                ) : (
                                                    <span className="text-emerald-600 font-bold flex items-center gap-1">正常</span>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-600">サジェストバン</span>
                                                {shadowbanResults[account.screenName].status.suggestionBan ? (
                                                    <span className="text-rose-600 font-bold flex items-center gap-1">警告あり</span>
                                                ) : (
                                                    <span className="text-emerald-600 font-bold flex items-center gap-1">正常</span>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-600">ゴーストバン</span>
                                                {shadowbanResults[account.screenName].status.ghostBan ? (
                                                    <span className="text-rose-600 font-bold flex items-center gap-1">警告あり</span>
                                                ) : (
                                                    <span className="text-emerald-600 font-bold flex items-center gap-1">正常</span>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-600">リプライデブースト</span>
                                                {shadowbanResults[account.screenName].status.replyDeboosting ? (
                                                    <span className="text-rose-600 font-bold flex items-center gap-1">警告あり</span>
                                                ) : (
                                                    <span className="text-emerald-600 font-bold flex items-center gap-1">正常</span>
                                                )}
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full text-xs h-8 border-gray-200"
                                                onClick={() => handleCheckShadowban(account.screenName)}
                                                disabled={checkingShadowban[account.screenName]}
                                            >
                                                {checkingShadowban[account.screenName] ? (
                                                    <>
                                                        <RefreshCw size={12} className="mr-2 animate-spin" />
                                                        再チェック中...
                                                    </>
                                                ) : '再チェックする'}
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button
                                            variant="outline"
                                            className="w-full justify-center h-11 border-gray-200 hover:border-primary hover:text-primary transition-all group"
                                            onClick={() => handleCheckShadowban(account.screenName)}
                                            disabled={checkingShadowban[account.screenName]}
                                        >
                                            {checkingShadowban[account.screenName] ? (
                                                <>
                                                    <RefreshCw size={16} className="mr-2 animate-spin" />
                                                    チェック中...
                                                </>
                                            ) : (
                                                <span className="flex items-center gap-2">
                                                    シャドウバンをチェック
                                                </span>
                                            )}
                                        </Button>
                                    )}
                                    <p className="text-[10px] text-gray-400 leading-relaxed italic">
                                        ※こちらのチェックは簡易的なものです。詳細な状況は外部サイトでもご確認いただけます。
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {accounts.length === 0 && (
                <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <p className="text-gray-500">登録されているアカウントがありません。</p>
                    <p className="text-sm text-gray-400 mt-1">「アカウント設定」から追加してください。</p>
                </div>
            )}
        </div>
    );
}
