import {
    Plus,
    Activity,
    Zap,
    BarChart3,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { API_BASE } from '../config';
import { authFetch } from '../lib/authFetch';
import { cn } from '../lib/utils';
import { useAuth } from '../lib/auth';

interface DashboardStats {
    activeBots: number;
    totalBotsLimit: number;
    todayTweets: number;
    monthlyImpressions: number;
}

interface Announcement {
    id: number;
    title: string;
    content: string;
    type: 'info' | 'warning' | 'critical';
    created_at: string;
}

export default function Dashboard() {
    const { user } = useAuth();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [stats, setStats] = useState<any[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!user?.email) return;

            try {
                // Fetch Stats
                const statsRes = await authFetch(`${API_BASE}/api/dashboard/stats/${user.email}`);
                if (!statsRes.ok) {
                    throw new Error(`Stats API failed: ${statsRes.status}`);
                }
                const statsData: DashboardStats = await statsRes.json();

                // Fetch Announcements
                const annRes = await authFetch(`${API_BASE}/api/announcements`);
                const annData = await annRes.json();

                if (Array.isArray(annData)) {
                    setAnnouncements(annData);
                }

                // Format stats for UI
                setStats([
                    {
                        name: '稼働中のBot',
                        stat: (statsData?.activeBots || 0).toString(),
                        total: `/ ${statsData?.totalBotsLimit || 0}`,
                        icon: Activity,
                        color: 'bg-emerald-500',
                        change: (statsData?.activeBots || 0) > 0 ? '+1' : '0',
                        changeType: 'increase'
                    },
                    {
                        name: '本日の投稿数',
                        stat: (statsData?.todayTweets || 0).toString(),
                        icon: Zap,
                        color: 'bg-blue-500',
                        change: '最新',
                        changeType: 'neutral'
                    },
                    {
                        name: '今月のインプレッション',
                        stat: (statsData?.monthlyImpressions || 0) >= 1000
                            ? ((statsData?.monthlyImpressions || 0) / 1000).toFixed(1) + 'K'
                            : (statsData?.monthlyImpressions || 0).toString(),
                        icon: BarChart3,
                        color: 'bg-purple-500',
                        change: 'リアルタイム',
                        changeType: 'increase'
                    },
                ]);
            } catch (err) {
                console.error('Failed to fetch dashboard data:', err);
            }
        };

        fetchDashboardData();
    }, [user?.email]);

    const steps = [
        { title: 'APIキーの取得', desc: 'Twitter Developer Portalで取得', status: 'done', link: '/dashboard/settings/account' },
        { title: 'Botの作成', desc: '独自の投稿ルールを設定', status: 'current', link: '/dashboard/bots/new' },
        { title: 'Twitter認証', desc: 'アカウントを連携', status: 'pending' },
        { title: '稼働開始', desc: 'スイッチをONにするだけ', status: 'pending' },
    ];

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Welcome Banner */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8 shadow-lg sm:px-12 sm:py-10">
                <div className="relative z-10">
                    <h2 className="text-2xl font-bold text-white sm:text-3xl">
                        ようこそ、ポスットへ！
                    </h2>
                    <p className="mt-2 text-blue-100 max-w-2xl">
                        あなたのSNS運用を自動化し、エンゲージメントを最大化しましょう。まずはAPIキーの設定から始めてください。
                    </p>
                    <div className="mt-6 flex gap-4">
                        <Link
                            to="/dashboard/bots/new"
                            className="inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-blue-600 shadow-sm hover:bg-blue-50 transition-colors"
                        >
                            <Plus className="-ml-1 mr-2 h-5 w-5" />
                            新規Bot作成
                        </Link>
                        <Link
                            to="/dashboard/guide"
                            className="inline-flex items-center rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 transition-colors ring-1 ring-inset ring-blue-500"
                        >
                            使い方ガイド
                        </Link>
                    </div>
                </div>
                {/* Decorative background pattern */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {stats.map((item) => (
                    <div key={item.name} className="relative overflow-hidden rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5 hover:shadow-md transition-shadow">
                        <dt>
                            <div className={`absolute rounded-md p-3 ${item.color} bg-opacity-10`}>
                                <item.icon className={`h-6 w-6 ${item.color.replace('bg-', 'text-')}`} aria-hidden="true" />
                            </div>
                            <p className="ml-16 truncate text-sm font-medium text-gray-500">{item.name}</p>
                        </dt>
                        <dd className="ml-16 flex items-baseline pb-1 sm:pb-2">
                            <p className="text-2xl font-semibold text-gray-900">{item.stat}</p>
                            {item.total && (
                                <p className="ml-2 flex items-baseline text-sm font-semibold text-gray-400">
                                    {item.total}
                                </p>
                            )}
                            {item.desc && (
                                <p className="ml-2 truncate text-xs text-gray-400">
                                    {item.desc}
                                </p>
                            )}
                        </dd>
                        <dd className="ml-16">
                            <div className={`inline-flex items-baseline rounded-full px-2.5 py-0.5 text-sm font-medium md:mt-2 lg:mt-0 ${item.changeType === 'increase' ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-600'
                                }`}>
                                {item.changeType === 'increase' && (
                                    <svg className="-ml-1 mr-0.5 h-4 w-4 flex-shrink-0 self-center text-green-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                                        <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                    </svg>
                                )}
                                <span className="sr-only"> {item.changeType === 'increase' ? 'Increased by' : 'Info'} </span>
                                {item.change}
                            </div>
                        </dd>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                {/* Getting Started Steps */}
                <div className="lg:col-span-2 rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
                    <div className="border-b border-gray-200 px-6 py-5">
                        <h3 className="text-base font-semibold leading-6 text-gray-900">セットアップ手順</h3>
                    </div>
                    <div className="p-6">
                        <nav aria-label="Progress">
                            <ol role="list" className="overflow-hidden md:flex md:gap-x-8 md:border-b md:border-gray-200 md:pb-8">
                                {steps.map((step) => (
                                    <li key={step.title} className="relative md:flex-1">
                                        {step.status === 'done' ? (
                                            <div className="group flex flex-col border-l-4 border-primary py-2 pl-4 md:border-l-0 md:border-t-4 md:pl-0 md:pt-4 md:pb-0">
                                                <span className="text-sm font-medium text-primary ">{step.title}</span>
                                                <span className="text-sm font-medium text-gray-500">{step.desc}</span>
                                            </div>
                                        ) : step.status === 'current' ? (
                                            <div className="group flex flex-col border-l-4 border-gray-200 py-2 pl-4 md:border-l-0 md:border-t-4 md:pl-0 md:pt-4 md:pb-0" aria-current="step">
                                                <span className="text-sm font-bold text-gray-900">{step.title}</span>
                                                <span className="text-sm font-medium text-gray-500">{step.desc}</span>
                                            </div>
                                        ) : (
                                            <div className="group flex flex-col border-l-4 border-gray-100 py-2 pl-4 md:border-l-0 md:border-t-4 md:pl-0 md:pt-4 md:pb-0">
                                                <span className="text-sm font-medium text-gray-500">{step.title}</span>
                                                <span className="text-sm font-medium text-gray-500">{step.desc}</span>
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ol>
                        </nav>
                        <div className="mt-8 flex justify-end">
                            <Link to="/dashboard/settings/account" className="text-sm font-semibold leading-6 text-primary hover:text-primary/80">
                                設定を続ける <span aria-hidden="true">&rarr;</span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Announcements / News */}
                <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
                    <div className="border-b border-gray-200 px-6 py-5 flex items-center justify-between">
                        <h3 className="text-base font-semibold leading-6 text-gray-900">お知らせ</h3>
                        <Link to="/dashboard/news" className="text-xs font-medium text-primary hover:text-primary/80">すべて見る</Link>
                    </div>
                    <ul className="divide-y divide-gray-100">
                        {announcements.length > 0 ? (
                            announcements.slice(0, 3).map((item) => (
                                <li key={item.id} className="flex gap-x-4 px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors">
                                    <div className="flex-auto">
                                        <div className="flex items-baseline justify-between gap-x-4">
                                            <p className={cn(
                                                "text-sm font-semibold leading-6",
                                                item.type === 'critical' ? 'text-red-600' : 'text-gray-900'
                                            )}>
                                                {item.title}
                                            </p>
                                            <p className="flex-none text-xs text-gray-500">
                                                <time dateTime={item.created_at}>
                                                    {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                </time>
                                            </p>
                                        </div>
                                        <p className="mt-1 line-clamp-2 text-sm leading-6 text-gray-600">
                                            {item.content}
                                        </p>
                                    </div>
                                </li>
                            ))
                        ) : (
                            <li className="px-6 py-10 text-center text-sm text-gray-500">
                                現在お知らせはありません
                            </li>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
}
