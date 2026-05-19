import { useState, useEffect } from 'react';
import {
    CreditCard, RefreshCw, CheckCircle, XCircle, AlertTriangle,
    Clock, ExternalLink, TrendingUp, Ban
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { API_BASE } from '../../config';
import { authFetch } from '../../lib/authFetch';

const PLAN_NAMES: Record<string, string> = {
    free: 'フリー',
    starter: 'スターター',
    advanced: 'アドバンス',
    advanced_20: 'アドバンス20',
    advanced_70: 'アドバンス70',
    advanced_170: 'アドバンス170',
};

const PLAN_PRICES: Record<string, number> = {
    free: 0,
    starter: 2980,
    advanced: 4980,
    advanced_20: 6980,
    advanced_70: 10980,
    advanced_170: 19800,
};

interface LatestInvoice {
    id: string;
    amount: number;
    currency: string;
    status: string;
    paid: boolean;
    created: number;
    hostedUrl: string | null;
}

interface Subscription {
    id: number;
    user_id: number;
    email: string;
    name: string;
    user_plan: string;
    plan: string;
    status: string;
    stripe_subscription_id: string;
    stripe_customer_id: string;
    current_period_start: string;
    current_period_end: string;
    cancel_at_period_end: number;
    updated_at: string;
    latestInvoice: LatestInvoice | null;
    latestPaymentStatus: string | null;
}

interface OrphanedUser {
    id: number;
    email: string;
    name: string;
    plan: string;
    created_at: string;
}

interface Stats {
    totalActive: number;
    totalCanceling: number;
    totalCanceled: number;
    totalPastDue: number;
    totalRevenue: number;
}

export default function SubscriptionManagement() {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [orphanedUsers, setOrphanedUsers] = useState<OrphanedUser[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<'all' | 'active' | 'canceling' | 'past_due' | 'canceled'>('all');

    useEffect(() => {
        fetchSubscriptions();
    }, []);

    const fetchSubscriptions = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        try {
            const res = await authFetch(`${API_BASE}/api/admin/subscriptions`);
            if (res.ok) {
                const data = await res.json();
                setSubscriptions(data.subscriptions);
                setOrphanedUsers(data.orphanedPaidUsers);
                setStats(data.stats);
            }
        } catch (err) {
            console.error('Failed to fetch subscriptions:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const filteredSubs = subscriptions.filter(sub => {
        if (filter === 'all') return true;
        if (filter === 'active') return sub.status === 'active' && sub.cancel_at_period_end === 0;
        if (filter === 'canceling') return sub.status === 'active' && sub.cancel_at_period_end === 1;
        if (filter === 'past_due') return sub.status === 'past_due';
        if (filter === 'canceled') return sub.status === 'canceled';
        return true;
    });

    const formatDate = (dateStr: string | number | null) => {
        if (!dateStr) return '-';
        const d = typeof dateStr === 'number' ? new Date(dateStr * 1000) : new Date(dateStr);
        return d.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' });
    };

    const getStatusBadge = (sub: Subscription) => {
        if (sub.status === 'active' && sub.cancel_at_period_end === 1) {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                    <Clock className="h-3 w-3" /> キャンセル予定
                </span>
            );
        }
        switch (sub.status) {
            case 'active':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3" /> 有効
                    </span>
                );
            case 'past_due':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <AlertTriangle className="h-3 w-3" /> 支払い遅延
                    </span>
                );
            case 'canceled':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        <XCircle className="h-3 w-3" /> 解約済み
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                        {sub.status}
                    </span>
                );
        }
    };

    const getPaymentBadge = (sub: Subscription) => {
        if (!sub.latestPaymentStatus) return <span className="text-xs text-gray-400">-</span>;
        if (sub.latestPaymentStatus === 'paid' || sub.latestInvoice?.paid) {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                    <CheckCircle className="h-3 w-3" /> 決済済
                </span>
            );
        }
        if (sub.latestPaymentStatus === 'open') {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                    <Clock className="h-3 w-3" /> 未決済
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
                <AlertTriangle className="h-3 w-3" /> {sub.latestPaymentStatus}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="py-20 text-center text-gray-500">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-3 text-gray-400" />
                <p>サブスクリプション情報を取得中...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">サブスクリプション管理</h1>
                    <p className="text-sm text-gray-500 mt-1">毎月の決済状況を確認できます</p>
                </div>
                <Button
                    variant="outline"
                    onClick={() => fetchSubscriptions(true)}
                    isLoading={refreshing}
                >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    更新
                </Button>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <div className="flex items-center gap-2 text-green-600 mb-1">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-xs font-medium">有効</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{stats.totalActive}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <div className="flex items-center gap-2 text-amber-600 mb-1">
                            <Clock className="h-4 w-4" />
                            <span className="text-xs font-medium">キャンセル予定</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{stats.totalCanceling}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <div className="flex items-center gap-2 text-red-600 mb-1">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="text-xs font-medium">支払い遅延</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{stats.totalPastDue}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <div className="flex items-center gap-2 text-gray-500 mb-1">
                            <Ban className="h-4 w-4" />
                            <span className="text-xs font-medium">解約済み</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{stats.totalCanceled}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-4 col-span-2 lg:col-span-1">
                        <div className="flex items-center gap-2 text-[#7c3aed] mb-1">
                            <TrendingUp className="h-4 w-4" />
                            <span className="text-xs font-medium">月間収益</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">¥{stats.totalRevenue.toLocaleString()}</p>
                    </div>
                </div>
            )}

            {/* Filter Tabs */}
            <div className="flex gap-2 flex-wrap">
                {[
                    { key: 'all', label: '全て', count: subscriptions.length },
                    { key: 'active', label: '有効', count: stats?.totalActive || 0 },
                    { key: 'canceling', label: 'キャンセル予定', count: stats?.totalCanceling || 0 },
                    { key: 'past_due', label: '支払い遅延', count: stats?.totalPastDue || 0 },
                    { key: 'canceled', label: '解約済み', count: stats?.totalCanceled || 0 },
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setFilter(tab.key as typeof filter)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                            filter === tab.key
                                ? 'bg-slate-900 text-white'
                                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                        {tab.label} ({tab.count})
                    </button>
                ))}
            </div>

            {/* Subscription Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">ユーザー</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">プラン</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">月額</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">ステータス</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">最新決済</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">次回請求日</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredSubs.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                                        該当するサブスクリプションがありません
                                    </td>
                                </tr>
                            ) : (
                                filteredSubs.map(sub => (
                                    <tr key={sub.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{sub.name || '名前未設定'}</p>
                                                <p className="text-xs text-gray-500">{sub.email}</p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#7c3aed]/10 text-[#7c3aed]">
                                                {PLAN_NAMES[sub.plan] || sub.plan}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-sm font-semibold text-gray-900">
                                                ¥{(PLAN_PRICES[sub.plan] || 0).toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {getStatusBadge(sub)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col gap-0.5">
                                                {getPaymentBadge(sub)}
                                                {sub.latestInvoice && (
                                                    <span className="text-[10px] text-gray-400">
                                                        {formatDate(sub.latestInvoice.created)}
                                                        {sub.latestInvoice.amount > 0 && ` / ¥${sub.latestInvoice.amount.toLocaleString()}`}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-sm text-gray-700">
                                                {sub.cancel_at_period_end === 1
                                                    ? <span className="text-amber-600">{formatDate(sub.current_period_end)}で終了</span>
                                                    : formatDate(sub.current_period_end)
                                                }
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1">
                                                {sub.latestInvoice?.hostedUrl && (
                                                    <a
                                                        href={sub.latestInvoice.hostedUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                                                    >
                                                        <ExternalLink className="h-3 w-3" />
                                                        請求書
                                                    </a>
                                                )}
                                                {sub.stripe_subscription_id && (
                                                    <a
                                                        href={`https://dashboard.stripe.com/subscriptions/${sub.stripe_subscription_id}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                                                    >
                                                        <CreditCard className="h-3 w-3" />
                                                        Stripe
                                                    </a>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Orphaned Users Warning */}
            {orphanedUsers.length > 0 && (
                <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                        <h3 className="font-bold text-amber-900">
                            サブスクリプション未登録の有料プランユーザー ({orphanedUsers.length}件)
                        </h3>
                    </div>
                    <p className="text-xs text-amber-700 mb-3">
                        Stripe連携なしで手動プラン変更されたユーザーです。決済が行われていない可能性があります。
                    </p>
                    <div className="space-y-2">
                        {orphanedUsers.map(u => (
                            <div key={u.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-amber-100">
                                <div>
                                    <span className="text-sm font-medium text-gray-900">{u.name || '名前未設定'}</span>
                                    <span className="text-xs text-gray-500 ml-2">{u.email}</span>
                                </div>
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                                    {PLAN_NAMES[u.plan] || u.plan}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
