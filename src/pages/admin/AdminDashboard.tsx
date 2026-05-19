import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Activity, AlertTriangle, TrendingUp, Loader2 } from 'lucide-react';
import { API_BASE } from '../../config';
import { authFetch } from '../../lib/authFetch';

interface SystemStats {
    totalUsers: number;
    activeBots: number;
    totalTweets: number;
    status: string;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<SystemStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [recentUsers, setRecentUsers] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const statsRes = await authFetch(`${API_BASE}/api/admin/system-stats`);
                if (statsRes.ok) {
                    const statsData = await statsRes.json();
                    setStats(statsData);
                } else {
                    console.error("Failed to fetch system stats:", statsRes.status);
                }

                const usersRes = await authFetch(`${API_BASE}/api/admin/users`);
                if (usersRes.ok) {
                    const usersData = await usersRes.json();
                    // Sort by ID descending to get "recent" users (assuming ID is autoincrement)
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const sortedUsers = Array.isArray(usersData) ? [...usersData].sort((a: any, b: any) => b.id - a.id).slice(0, 5) : [];
                    setRecentUsers(sortedUsers);
                } else {
                    console.error("Failed to fetch users:", usersRes.status);
                }
            } catch (error) {
                console.error("Failed to fetch admin dashboard data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-gray-500 font-medium tracking-wide">データを読み込み中...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">管理者ダッシュボード</h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">システム全体の稼働状況を把握します。</p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
                {/* Total Users */}
                <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Users size={20} className="sm:hidden" />
                            <Users size={24} className="hidden sm:block" />
                        </div>
                        <div>
                            <dt className="text-[10px] sm:text-sm font-bold text-gray-500 uppercase tracking-wider">総ユーザー数</dt>
                            <dd className="text-xl sm:text-2xl font-black text-gray-900 mt-0.5 sm:mt-1">{stats?.totalUsers.toLocaleString() || 0}</dd>
                        </div>
                    </div>
                </div>

                {/* Active Bots */}
                <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Activity size={20} className="sm:hidden" />
                            <Activity size={24} className="hidden sm:block" />
                        </div>
                        <div>
                            <dt className="text-[10px] sm:text-sm font-bold text-gray-500 uppercase tracking-wider">稼働中Bot</dt>
                            <dd className="text-xl sm:text-2xl font-black text-gray-900 mt-0.5 sm:mt-1">{stats?.activeBots.toLocaleString() || 0}</dd>
                        </div>
                    </div>
                </div>

                {/* Total Tweets */}
                <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-sky-50 text-sky-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <TrendingUp size={20} className="sm:hidden" />
                            <TrendingUp size={24} className="hidden sm:block" />
                        </div>
                        <div>
                            <dt className="text-[10px] sm:text-sm font-bold text-gray-500 uppercase tracking-wider">累計投稿数</dt>
                            <dd className="text-xl sm:text-2xl font-black text-gray-900 mt-0.5 sm:mt-1">{stats?.totalTweets.toLocaleString() || 0}</dd>
                        </div>
                    </div>
                </div>

                {/* System Status */}
                <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <AlertTriangle size={20} className="sm:hidden" />
                            <AlertTriangle size={24} className="hidden sm:block" />
                        </div>
                        <div>
                            <dt className="text-[10px] sm:text-sm font-bold text-gray-500 uppercase tracking-wider">システム状態</dt>
                            <dd className="text-base sm:text-lg font-bold text-emerald-600 mt-0.5 sm:mt-1 uppercase">Healthy</dd>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl sm:rounded-[2rem] border border-gray-100 shadow-xl overflow-hidden">
                <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-gray-50 bg-gray-50/50">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900">
                        最近の登録ユーザー
                    </h3>
                </div>
                <div className="p-2 sm:p-4">
                    <ul className="divide-y divide-gray-100">
                        {recentUsers.map((user) => (
                            <li key={user.id} className="p-3 sm:p-4 hover:bg-gray-50/80 rounded-xl sm:rounded-2xl transition-colors">
                                <div className="flex items-center gap-3 sm:gap-4">
                                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-gray-100 flex items-center justify-center font-bold text-gray-400 text-sm sm:text-base shrink-0">
                                        {(user.name || user.email).charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-900 truncate">
                                            {user.name || '未設定'}
                                        </p>
                                        <p className="text-xs sm:text-sm text-gray-500 truncate font-medium">
                                            {user.email}
                                        </p>
                                    </div>
                                    <div className="hidden sm:block">
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100">
                                            Active
                                        </span>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="p-4 sm:p-6 bg-gray-50/50 text-center border-t border-gray-50">
                    <Link to="/admin/users" className="text-sm font-bold text-primary hover:text-primary/80 transition-colors">
                        すべてのユーザーを表示
                    </Link>
                </div>
            </div>
        </div>
    );
}
