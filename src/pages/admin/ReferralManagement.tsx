import { useState, useEffect } from 'react';
import { Gift, CheckCircle, Wallet, DollarSign, RefreshCw, Star, ArrowDownToLine, Clock, Ban, X } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { API_BASE } from '../../config';
import { authFetch, authJsonFetch } from '../../lib/authFetch';

interface Reward {
    id: number;
    referrer_id: number;
    referrer_email: string;
    referrer_name: string;
    referred_id: number;
    referred_email: string;
    referred_name: string;
    plan: string;
    amount: number;
    status: string;
    reward_type: 'initial' | 'recurring';
    paid_at: string | null;
    created_at: string;
}

interface WithdrawalRequest {
    id: number;
    user_id: number;
    email: string;
    name: string;
    amount: number;
    status: 'pending' | 'approved' | 'rejected';
    bank_info: string;
    notes: string | null;
    admin_note: string | null;
    processed_at: string | null;
    created_at: string;
}

export default function ReferralManagement() {
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('all');
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [tab, setTab] = useState<'rewards' | 'withdrawals'>('rewards');
    const [processingWdId, setProcessingWdId] = useState<number | null>(null);
    const [adminNoteInput, setAdminNoteInput] = useState('');
    const [showNoteFor, setShowNoteFor] = useState<number | null>(null);

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [rewRes, wdRes] = await Promise.all([
                authFetch(`${API_BASE}/api/admin/referrals`),
                authFetch(`${API_BASE}/api/admin/withdrawals`),
            ]);
            if (rewRes.ok) setRewards(await rewRes.json());
            if (wdRes.ok) setWithdrawals(await wdRes.json());
        } catch (err) {
            console.error('Failed to fetch referral data:', err);
        } finally {
            setLoading(false);
        }
    };

    const markAsPaid = async (rewardId: number) => {
        if (!confirm('この報酬を「支払い済み」にしますか？')) return;
        setProcessingId(rewardId);
        try {
            const res = await authJsonFetch(`${API_BASE}/api/admin/referrals/${rewardId}/pay`, 'POST', {});
            if (res.ok) {
                setRewards(prev => prev.map(r =>
                    r.id === rewardId
                        ? { ...r, status: 'paid', paid_at: new Date().toISOString() }
                        : r
                ));
            }
        } catch (err) {
            console.error('Failed to mark as paid:', err);
            alert('処理に失敗しました。');
        } finally {
            setProcessingId(null);
        }
    };

    const processWithdrawal = async (id: number, action: 'approved' | 'rejected') => {
        const label = action === 'approved' ? '承認' : '却下';
        if (!confirm(`この出金申請を「${label}」しますか？`)) return;
        setProcessingWdId(id);
        try {
            const res = await authJsonFetch(`${API_BASE}/api/admin/withdrawals/${id}/process`, 'POST', {
                action,
                adminNote: adminNoteInput.trim() || undefined,
            });
            if (res.ok) {
                setWithdrawals(prev => prev.map(w =>
                    w.id === id
                        ? { ...w, status: action, admin_note: adminNoteInput.trim() || null, processed_at: new Date().toISOString() }
                        : w
                ));
                setAdminNoteInput('');
                setShowNoteFor(null);
                // Also refresh rewards if approved (rewards get marked as paid)
                if (action === 'approved') {
                    const rewRes = await authFetch(`${API_BASE}/api/admin/referrals`);
                    if (rewRes.ok) setRewards(await rewRes.json());
                }
            }
        } catch (err) {
            console.error('Failed to process withdrawal:', err);
            alert('処理に失敗しました。');
        } finally {
            setProcessingWdId(null);
        }
    };

    const filtered = rewards.filter(r => {
        if (filter === 'pending') return r.status === 'pending';
        if (filter === 'paid') return r.status === 'paid';
        return true;
    });

    const totalPending = rewards.filter(r => r.status === 'pending').reduce((sum, r) => sum + r.amount, 0);
    const totalPaid = rewards.filter(r => r.status === 'paid').reduce((sum, r) => sum + r.amount, 0);
    const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending');

    if (loading) {
        return <div className="py-20 text-center text-gray-500">読み込み中...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-[#7c3aed] to-[#6d28d9] rounded-xl">
                    <Gift className="h-6 w-6 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">紹介報酬管理</h1>
                    <p className="text-sm text-gray-500">アフィリエイト報酬の確認と支払い管理</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="h-4 w-4 text-gray-500" />
                        <span className="text-xs text-gray-500">総報酬件数</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{rewards.length}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <Wallet className="h-4 w-4 text-orange-500" />
                        <span className="text-xs text-gray-500">未払い合計</span>
                    </div>
                    <p className="text-2xl font-bold text-orange-600">¥{totalPending.toLocaleString()}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        <span className="text-xs text-gray-500">支払い済み合計</span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-600">¥{totalPaid.toLocaleString()}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <ArrowDownToLine className="h-4 w-4 text-purple-500" />
                        <span className="text-xs text-gray-500">出金申請（未処理）</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-600">{pendingWithdrawals.length}</p>
                </div>
            </div>

            {/* Main Tabs */}
            <div className="flex gap-2 border-b border-gray-200 pb-0">
                <button
                    onClick={() => setTab('rewards')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                        tab === 'rewards'
                            ? 'border-[#7c3aed] text-[#7c3aed]'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    報酬一覧
                </button>
                <button
                    onClick={() => setTab('withdrawals')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1 ${
                        tab === 'withdrawals'
                            ? 'border-[#7c3aed] text-[#7c3aed]'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    出金申請
                    {pendingWithdrawals.length > 0 && (
                        <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full min-w-[18px]">
                            {pendingWithdrawals.length}
                        </span>
                    )}
                </button>
            </div>

            {tab === 'rewards' && (
                <>
                    {/* Filter Tabs */}
                    <div className="flex gap-2">
                        {(['all', 'pending', 'paid'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    filter === f
                                        ? 'bg-[#7c3aed] text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                {f === 'all' ? 'すべて' : f === 'pending' ? '未払い' : '支払い済み'}
                                {f === 'pending' && ` (${rewards.filter(r => r.status === 'pending').length})`}
                            </button>
                        ))}
                    </div>

                    {/* Rewards Table */}
                    {filtered.length === 0 ? (
                        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                            <Gift className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 text-sm">該当する報酬がありません</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">紹介者</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">紹介された人</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">プラン</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">報酬</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">種別</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">ステータス</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">発生日</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">操作</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filtered.map((reward) => (
                                            <tr key={reward.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3">
                                                    <div className="text-gray-900 font-medium">{reward.referrer_name || '-'}</div>
                                                    <div className="text-xs text-gray-500">{reward.referrer_email}</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="text-gray-900">{reward.referred_name || '-'}</div>
                                                    <div className="text-xs text-gray-500">{reward.referred_email}</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                                                        {reward.plan}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 font-medium text-gray-900">¥{reward.amount}</td>
                                                <td className="px-4 py-3">
                                                    {reward.reward_type === 'recurring' ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
                                                            <RefreshCw className="h-2.5 w-2.5" /> 継続
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100">
                                                            <Star className="h-2.5 w-2.5" /> 初回
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {reward.status === 'paid' ? (
                                                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                                                            <CheckCircle className="h-3 w-3" /> 支払い済み
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-600">
                                                            <Wallet className="h-3 w-3" /> 未払い
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-gray-500 text-xs">
                                                    {new Date(reward.created_at).toLocaleDateString('ja-JP')}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {reward.status === 'pending' && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => markAsPaid(reward.id)}
                                                            isLoading={processingId === reward.id}
                                                        >
                                                            <CheckCircle className="h-3 w-3 mr-1" />
                                                            支払い済みにする
                                                        </Button>
                                                    )}
                                                    {reward.status === 'paid' && reward.paid_at && (
                                                        <span className="text-xs text-gray-400">
                                                            {new Date(reward.paid_at).toLocaleDateString('ja-JP')}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}

            {tab === 'withdrawals' && (
                <>
                    {withdrawals.length === 0 ? (
                        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                            <ArrowDownToLine className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 text-sm">出金申請はまだありません</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {withdrawals.map((w) => (
                                <div key={w.id} className={`bg-white rounded-xl border p-4 ${
                                    w.status === 'pending' ? 'border-orange-200' : 'border-gray-200'
                                }`}>
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg font-bold text-gray-900">¥{w.amount.toLocaleString()}</span>
                                                {w.status === 'pending' && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-600 border border-orange-100">
                                                        <Clock className="h-2.5 w-2.5" /> 未処理
                                                    </span>
                                                )}
                                                {w.status === 'approved' && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                        <CheckCircle className="h-2.5 w-2.5" /> 承認済み
                                                    </span>
                                                )}
                                                {w.status === 'rejected' && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-100">
                                                        <Ban className="h-2.5 w-2.5" /> 却下
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-700">{w.name || '-'} ({w.email})</p>
                                            <p className="text-xs text-gray-400">申請日: {new Date(w.created_at).toLocaleString('ja-JP')}</p>
                                            {w.processed_at && (
                                                <p className="text-xs text-gray-400">処理日: {new Date(w.processed_at).toLocaleString('ja-JP')}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Bank info */}
                                    <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm">
                                        <p className="text-xs font-medium text-gray-500 mb-1">振込先情報</p>
                                        <pre className="text-gray-700 whitespace-pre-wrap text-xs">{w.bank_info}</pre>
                                    </div>

                                    {w.notes && (
                                        <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
                                            <strong>備考:</strong> {w.notes}
                                        </div>
                                    )}

                                    {w.admin_note && (
                                        <div className="mt-2 p-2 bg-gray-100 rounded text-xs text-gray-600">
                                            <strong>管理者メモ:</strong> {w.admin_note}
                                        </div>
                                    )}

                                    {/* Actions for pending */}
                                    {w.status === 'pending' && (
                                        <div className="mt-3 pt-3 border-t border-gray-100">
                                            {showNoteFor === w.id ? (
                                                <div className="space-y-2">
                                                    <input
                                                        type="text"
                                                        placeholder="管理者メモ（任意）"
                                                        value={adminNoteInput}
                                                        onChange={(e) => setAdminNoteInput(e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                                    />
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            size="sm"
                                                            onClick={() => processWithdrawal(w.id, 'approved')}
                                                            isLoading={processingWdId === w.id}
                                                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                                        >
                                                            <CheckCircle className="h-3 w-3 mr-1" /> 承認
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => processWithdrawal(w.id, 'rejected')}
                                                            isLoading={processingWdId === w.id}
                                                            className="border-red-200 text-red-600 hover:bg-red-50"
                                                        >
                                                            <X className="h-3 w-3 mr-1" /> 却下
                                                        </Button>
                                                        <button
                                                            onClick={() => { setShowNoteFor(null); setAdminNoteInput(''); }}
                                                            className="text-xs text-gray-400 hover:text-gray-600"
                                                        >
                                                            キャンセル
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => setShowNoteFor(w.id)}
                                                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                                    >
                                                        <CheckCircle className="h-3 w-3 mr-1" /> 処理する
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
