import { useState, useEffect } from 'react';
import {
    BarChart3,
    MousePointer2,
    Eye,
    Calendar,
    Filter,
    Download,
    Loader2
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../lib/auth';
import { API_BASE } from '../config';
import { authFetch } from '../lib/authFetch';

interface AnalyticsStats {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    history: Record<string, any>[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    topLinks: Record<string, any>[];
}

export default function PostAnalytics() {
    const { user } = useAuth();
    const [data, setData] = useState<AnalyticsStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            if (!user?.email) return;
            try {
                const res = await authFetch(`${API_BASE}/api/analytics/stats/${user.email}`);
                if (!res.ok) {
                    console.error('Analytics fetch failed:', res.status);
                    return;
                }
                const stats = await res.json();
                setData(stats);
            } catch (error) {
                console.error("Failed to fetch analytics:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAnalytics();
    }, [user?.email]);

    // Calculate aggregate stats from history
    const totalImpressions = data?.history.reduce((sum, day) => sum + (day.impressions || 0), 0) || 0;
    const totalEngagement = data?.history.reduce((sum, day) => sum + (day.engagement || 0), 0) || 0;
    const avgCtr = totalImpressions > 0 ? (totalEngagement / totalImpressions * 100).toFixed(2) : '0.00';

    const stats = [
        {
            name: '総インプレッション',
            value: totalImpressions.toLocaleString(),
            change: '+--',
            trend: 'up',
            icon: Eye,
            color: 'text-blue-600',
            bg: 'bg-blue-50'
        },
        {
            name: '総エンゲージメント',
            value: totalEngagement.toLocaleString(),
            change: '+--',
            trend: 'up',
            icon: MousePointer2,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50'
        },
        {
            name: '平均CTR',
            value: `${avgCtr}%`,
            change: '--',
            trend: 'up',
            icon: BarChart3,
            color: 'text-purple-600',
            bg: 'bg-purple-50'
        },
        {
            name: '対象日数',
            value: data?.history.length || 0,
            change: '直近30日',
            trend: 'up',
            icon: Calendar,
            color: 'text-amber-600',
            bg: 'bg-amber-50'
        },
    ];

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-gray-500 font-medium">分析データを読み込み中...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">投稿分析</h1>
                    <p className="text-sm text-gray-500 mt-1">Botによる投稿のパフォーマンスを詳しく分析します。</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" className="rounded-xl">
                        <Filter className="mr-2 h-4 w-4" />
                        フィルター
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-xl">
                        <Download className="mr-2 h-4 w-4" />
                        エクスポート
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((item) => (
                    <div key={item.name} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-2xl ${item.bg} group-hover:scale-110 transition-transform`}>
                                <item.icon className={`h-5 w-5 ${item.color}`} />
                            </div>
                            <div className={`flex items-center text-xs font-bold ${item.trend === 'up' ? 'text-emerald-600' : 'text-rose-600'
                                }`}>
                                {item.change}
                            </div>
                        </div>
                        <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">{item.name}</p>
                        <p className="text-2xl font-black text-gray-900 mt-1">{item.value}</p>
                    </div>
                ))}
            </div>

            {/* Chart Area */}
            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-lg font-bold text-gray-900">インプレッション推移（過去30日間）</h3>
                    <select className="text-sm font-bold border-gray-100 bg-gray-50 rounded-xl px-4 py-2 focus:ring-primary focus:border-primary outline-none cursor-pointer">
                        <option>直近30日間</option>
                        <option>直近7日間</option>
                    </select>
                </div>
                <div className="h-64 w-full flex items-end justify-between gap-1 px-2">
                    {data?.history.length === 0 ? (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 font-medium">
                            データがまだありません
                        </div>
                    ) : (
                        [...(data?.history || [])].reverse().map((day, i) => {
                            const maxVal = Math.max(...data!.history.map(d => d.impressions)) || 1;
                            const height = (day.impressions / maxVal) * 100;
                            return (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2 group min-w-[10px]">
                                    <div
                                        className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all duration-500 group-hover:from-blue-600 group-hover:to-blue-500 cursor-pointer relative"
                                        style={{ height: `${Math.max(height, 5)}%` }}
                                    >
                                        <div className="hidden group-hover:block absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] py-1.5 px-3 rounded-lg z-10 whitespace-nowrap shadow-xl">
                                            {day.date}: {day.impressions}
                                        </div>
                                    </div>
                                    {i % 5 === 0 && (
                                        <span className="text-[10px] text-gray-400 font-bold tracking-tighter">
                                            {day.date.substring(5)}
                                        </span>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Top Links Table */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl overflow-hidden">
                <div className="p-8 border-b border-gray-50 bg-gray-50/50">
                    <h3 className="text-lg font-bold text-gray-900">リンク別反響（トップ5）</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50/50 text-gray-500 font-bold uppercase tracking-wider border-b border-gray-50">
                            <tr>
                                <th className="px-8 py-4">リンク名</th>
                                <th className="px-8 py-4 text-center">クリック数</th>
                                <th className="px-8 py-4">パフォーマンス</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {data?.topLinks.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-8 py-12 text-center text-gray-400 font-medium">クリックされたリンクはまだありません。</td>
                                </tr>
                            ) : (
                                data?.topLinks.map((link, i) => (
                                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-8 py-5 font-bold text-gray-900">{link.name}</td>
                                        <td className="px-8 py-5 text-center font-black text-gray-700">{link.clicks.toLocaleString()}</td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary rounded-full transition-all duration-1000"
                                                        style={{
                                                            width: `${(link.clicks / (data?.topLinks[0]?.clicks || 1)) * 100}%`
                                                        }}
                                                    />
                                                </div>
                                                <span className="text-xs font-black text-primary">
                                                    {((link.clicks / (data?.topLinks[0]?.clicks || 1)) * 100).toFixed(0)}%
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="p-6 bg-gray-50/30 text-center border-t border-gray-50">
                    <button className="text-sm font-bold text-primary hover:text-primary/80 transition-colors">
                        すべてのリンク分析を表示
                    </button>
                </div>
            </div>
        </div>
    );
}

