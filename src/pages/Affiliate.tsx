import { useState, useEffect, useRef } from 'react';
import { Gift, Copy, Check, Users, TrendingUp, Wallet, CheckCircle, Upload, FileText, Download, Trash2, Eye, RefreshCw, Star, AlertTriangle, Clock, Ban, ArrowDownToLine, Info } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../lib/auth';
import { API_BASE } from '../config';
import { authFetch, authJsonFetch } from '../lib/authFetch';

interface RewardItem {
    id: number;
    referred_email: string;
    referred_name: string;
    plan: string;
    amount: number;
    status: string;
    reward_type: 'initial' | 'recurring';
    created_at: string;
    paid_at: string | null;
}

interface Stats {
    totalReferred: number;
    paidConversions: number;
    pendingReward: number;
    paidReward: number;
    rewards: RewardItem[];
}

interface WithdrawalRequest {
    id: number;
    amount: number;
    status: 'pending' | 'approved' | 'rejected';
    bank_info: string;
    notes: string | null;
    admin_note: string | null;
    processed_at: string | null;
    created_at: string;
}

export default function Affiliate() {
    const { user } = useAuth();
    const [referralCode, setReferralCode] = useState('');
    const [stats, setStats] = useState<Stats | null>(null);
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(true);

    // Bonus content state
    const [bonusTitle, setBonusTitle] = useState('');
    const [bonusDescription, setBonusDescription] = useState('');
    const [bonusFileName, setBonusFileName] = useState<string | null>(null);
    const [bonusFile, setBonusFile] = useState<{ data: string; name: string; type: string } | null>(null);
    const [bonusSaving, setBonusSaving] = useState(false);
    const [bonusSaved, setBonusSaved] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Withdrawal state
    const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
    const [showWithdrawForm, setShowWithdrawForm] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawBankInfo, setWithdrawBankInfo] = useState('');
    const [withdrawNotes, setWithdrawNotes] = useState('');
    const [withdrawSubmitting, setWithdrawSubmitting] = useState(false);
    const [withdrawError, setWithdrawError] = useState('');

    const referralUrl = referralCode
        ? `https://sns-tool.online/posutto/signup?ref=${referralCode}`
        : '';

    const bonusUrl = referralCode
        ? `https://sns-tool.online/posutto/referral-bonus/${referralCode}`
        : '';

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch referral code
            const codeRes = await authFetch(`${API_BASE}/api/referral/my-code`);
            if (codeRes.ok) {
                const codeData = await codeRes.json();
                setReferralCode(codeData.referralCode);
            }

            // Fetch stats
            const statsRes = await authFetch(`${API_BASE}/api/referral/stats`);
            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setStats(statsData);
            }

            // Fetch bonus content
            const bonusRes = await authFetch(`${API_BASE}/api/referral/bonus`);
            if (bonusRes.ok) {
                const bonusData = await bonusRes.json();
                if (bonusData.bonus) {
                    setBonusTitle(bonusData.bonus.title || '');
                    setBonusDescription(bonusData.bonus.description || '');
                    setBonusFileName(bonusData.bonus.file_name || null);
                }
            }

            // Fetch withdrawal requests
            const wRes = await authFetch(`${API_BASE}/api/referral/withdrawals`);
            if (wRes.ok) {
                const wData = await wRes.json();
                setWithdrawals(wData.withdrawals || []);
            }
        } catch (err) {
            console.error('Failed to fetch affiliate data:', err);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            alert('ファイルサイズは5MB以下にしてください。');
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1];
            setBonusFile({ data: base64, name: file.name, type: file.type });
            setBonusFileName(file.name);
        };
        reader.readAsDataURL(file);
    };

    const removeFile = () => {
        setBonusFile(null);
        setBonusFileName(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const saveBonus = async () => {
        setBonusSaving(true);
        setBonusSaved(false);
        try {
            const body: Record<string, string | undefined> = {
                title: bonusTitle,
                description: bonusDescription,
            };
            if (bonusFile) {
                body.fileName = bonusFile.name;
                body.fileData = bonusFile.data;
                body.fileType = bonusFile.type;
            }

            const res = await authJsonFetch(`${API_BASE}/api/referral/bonus`, 'POST', body);
            if (res.ok) {
                setBonusSaved(true);
                setTimeout(() => setBonusSaved(false), 5000);
            } else {
                const errText = await res.text();
                try {
                    const err = JSON.parse(errText);
                    alert('保存に失敗しました: ' + (err.error || errText));
                } catch {
                    alert('保存に失敗しました: ' + errText);
                }
            }
        } catch (err) {
            console.error('Failed to save bonus:', err);
            alert('ネットワークエラーが発生しました。');
        } finally {
            setBonusSaving(false);
        }
    };

    const pendingWithdrawTotal = withdrawals
        .filter(w => w.status === 'pending')
        .reduce((sum, w) => sum + w.amount, 0);
    const availableForWithdraw = (stats?.pendingReward || 0) - pendingWithdrawTotal;

    const submitWithdrawal = async () => {
        setWithdrawError('');
        const amount = Number(withdrawAmount);
        if (!amount || amount < 5000) {
            setWithdrawError('出金申請は5,000円以上から可能です。');
            return;
        }
        if (amount > availableForWithdraw) {
            setWithdrawError(`申請可能な金額を超えています。現在の申請可能額: ¥${availableForWithdraw.toLocaleString()}`);
            return;
        }
        if (!withdrawBankInfo.trim() || withdrawBankInfo.trim().length < 10) {
            setWithdrawError('振込先情報を正しく入力してください（銀行名・支店名・口座種類・口座番号・名義）。');
            return;
        }

        setWithdrawSubmitting(true);
        try {
            const res = await authJsonFetch(`${API_BASE}/api/referral/withdraw`, 'POST', {
                amount,
                bankInfo: withdrawBankInfo.trim(),
                notes: withdrawNotes.trim() || undefined,
            });
            if (res.ok) {
                setShowWithdrawForm(false);
                setWithdrawAmount('');
                setWithdrawBankInfo('');
                setWithdrawNotes('');
                fetchData();
            } else {
                const err = await res.json();
                setWithdrawError(err.error || '申請に失敗しました。');
            }
        } catch {
            setWithdrawError('ネットワークエラーが発生しました。');
        } finally {
            setWithdrawSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="py-20 text-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7c3aed] mx-auto mb-4" />
                読み込み中...
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-[#7c3aed] to-[#6d28d9] rounded-xl">
                    <Gift className="h-6 w-6 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">アフィリエイト</h1>
                    <p className="text-sm text-gray-500">友達を紹介して報酬を獲得しましょう</p>
                </div>
            </div>

            {/* Referral Link Section */}
            <div className="bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] rounded-2xl p-6 text-white">
                <h2 className="text-lg font-bold mb-1">あなたの紹介リンク</h2>
                <p className="text-white/70 text-sm mb-4">
                    このリンクから登録した人が有料プランに加入すると、<strong className="text-white">毎月 ¥500</strong> の報酬が継続的に発生します。紹介された方がプランを続ける限り報酬が入り続けます。
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1 bg-white/10 rounded-lg px-4 py-3 text-sm font-mono break-all backdrop-blur-sm">
                        {referralUrl}
                    </div>
                    <Button
                        onClick={() => copyToClipboard(referralUrl)}
                        className="bg-white text-[#7c3aed] hover:bg-white/90 shrink-0"
                    >
                        {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                        {copied ? 'コピー済み' : 'コピー'}
                    </Button>
                </div>
                <div className="mt-3 flex items-center gap-2 text-sm text-white/60">
                    <span>紹介コード:</span>
                    <code className="bg-white/10 px-2 py-0.5 rounded">{referralCode}</code>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Users className="h-4 w-4 text-blue-500" />
                            <span className="text-xs text-gray-500">紹介人数</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{stats.totalReferred}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="h-4 w-4 text-green-500" />
                            <span className="text-xs text-gray-500">有料転換</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{stats.paidConversions}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Wallet className="h-4 w-4 text-orange-500" />
                            <span className="text-xs text-gray-500">未払い報酬</span>
                        </div>
                        <p className="text-2xl font-bold text-orange-600">¥{stats.pendingReward.toLocaleString()}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="h-4 w-4 text-emerald-500" />
                            <span className="text-xs text-gray-500">支払い済み</span>
                        </div>
                        <p className="text-2xl font-bold text-emerald-600">¥{stats.paidReward.toLocaleString()}</p>
                    </div>
                </div>
            )}

            {/* Rewards Detail Table */}
            {stats && stats.rewards.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h2 className="font-bold text-gray-900">報酬明細</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">紹介された人</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">プラン</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">報酬</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">種別</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">ステータス</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">日時</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {stats.rewards.map((reward) => (
                                    <tr key={reward.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-gray-700">
                                            {reward.referred_name || reward.referred_email}
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
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {stats && stats.rewards.length === 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">まだ報酬の実績がありません</p>
                    <p className="text-gray-400 text-xs mt-1">紹介リンクをシェアして友達を招待しましょう</p>
                </div>
            )}

            {/* Withdrawal Section */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h2 className="font-bold text-gray-900 flex items-center gap-2">
                            <ArrowDownToLine className="h-4 w-4 text-[#7c3aed]" />
                            出金申請
                        </h2>
                        <p className="text-xs text-gray-500 mt-1">
                            未払い報酬が¥5,000以上になると出金を申請できます
                        </p>
                    </div>
                    {!showWithdrawForm && availableForWithdraw >= 5000 && (
                        <Button
                            onClick={() => { setShowWithdrawForm(true); setWithdrawError(''); }}
                            className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white"
                            size="sm"
                        >
                            <Wallet className="h-4 w-4 mr-1" />
                            出金を申請する
                        </Button>
                    )}
                </div>

                <div className="p-6 space-y-4">
                    {/* Available balance info */}
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                        <div>
                            <p className="text-xs text-gray-500">申請可能額</p>
                            <p className={`text-xl font-bold ${availableForWithdraw >= 5000 ? 'text-[#7c3aed]' : 'text-gray-400'}`}>
                                ¥{availableForWithdraw.toLocaleString()}
                            </p>
                        </div>
                        {availableForWithdraw < 5000 && (
                            <p className="text-xs text-gray-400">
                                ¥5,000以上で出金申請が可能になります（あと¥{(5000 - availableForWithdraw).toLocaleString()}）
                            </p>
                        )}
                    </div>

                    {/* Withdraw Form */}
                    {showWithdrawForm && (
                        <div className="border border-[#7c3aed]/20 rounded-lg p-4 bg-purple-50/30 space-y-3">
                            <h3 className="font-medium text-gray-900 text-sm">出金申請フォーム</h3>

                            {withdrawError && (
                                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                                    {withdrawError}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">出金額（円）</label>
                                <Input
                                    type="number"
                                    min={5000}
                                    max={availableForWithdraw}
                                    step={500}
                                    placeholder="5000"
                                    value={withdrawAmount}
                                    onChange={(e) => setWithdrawAmount(e.target.value)}
                                />
                                <p className="text-[11px] text-gray-400 mt-1">最低出金額: ¥5,000 / 最大: ¥{availableForWithdraw.toLocaleString()}</p>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    振込先情報 <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    placeholder={"銀行名: ○○銀行\n支店名: ○○支店\n口座種類: 普通\n口座番号: 1234567\n口座名義: ヤマダ タロウ"}
                                    value={withdrawBankInfo}
                                    onChange={(e) => setWithdrawBankInfo(e.target.value)}
                                    rows={5}
                                    className="flex w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">備考（任意）</label>
                                <Input
                                    placeholder="その他ご要望があれば記入してください"
                                    value={withdrawNotes}
                                    onChange={(e) => setWithdrawNotes(e.target.value)}
                                />
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <Button
                                    onClick={submitWithdrawal}
                                    isLoading={withdrawSubmitting}
                                    className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white"
                                >
                                    {withdrawSubmitting ? '申請中...' : '出金を申請する'}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => { setShowWithdrawForm(false); setWithdrawError(''); }}
                                >
                                    キャンセル
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Withdrawal History */}
                    {withdrawals.length > 0 && (
                        <div>
                            <h3 className="font-medium text-gray-900 text-sm mb-2">申請履歴</h3>
                            <div className="space-y-2">
                                {withdrawals.map((w) => (
                                    <div key={w.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                        <div className="flex items-center gap-3">
                                            {w.status === 'pending' && <Clock className="h-4 w-4 text-orange-500" />}
                                            {w.status === 'approved' && <CheckCircle className="h-4 w-4 text-emerald-500" />}
                                            {w.status === 'rejected' && <Ban className="h-4 w-4 text-red-500" />}
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">¥{w.amount.toLocaleString()}</p>
                                                <p className="text-[11px] text-gray-400">
                                                    {new Date(w.created_at).toLocaleDateString('ja-JP')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            {w.status === 'pending' && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-600 border border-orange-100">
                                                    <Clock className="h-2.5 w-2.5" /> 審査中
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
                                            {w.admin_note && (
                                                <p className="text-[11px] text-gray-400 mt-1">{w.admin_note}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Notes / Disclaimers */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                <h3 className="font-bold text-amber-800 flex items-center gap-2 mb-3">
                    <Info className="h-4 w-4" />
                    アフィリエイトに関する注意事項
                </h3>
                <ul className="space-y-2 text-sm text-amber-700">
                    <li className="flex items-start gap-2">
                        <span className="text-amber-500 mt-0.5">&#x2022;</span>
                        <span>出金申請は<strong>¥5,000以上</strong>から可能です。</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-amber-500 mt-0.5">&#x2022;</span>
                        <span>出金申請後、運営が内容を確認し、<strong>通常5営業日以内</strong>にお振込みいたします。</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-amber-500 mt-0.5">&#x2022;</span>
                        <span>振込手数料は報酬額から差し引かれる場合がございます。</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-amber-500 mt-0.5">&#x2022;</span>
                        <span>紹介された方が有料プランを継続している期間中、毎月¥500の報酬が発生します。</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-amber-500 mt-0.5">&#x2022;</span>
                        <span>紹介された方がプランを解約した場合、翌月以降の報酬は発生しません。</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-amber-500 mt-0.5">&#x2022;</span>
                        <span>不正な紹介（自己紹介、虚偽の登録など）が発覚した場合、報酬が取り消される場合がございます。</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-amber-500 mt-0.5">&#x2022;</span>
                        <span>報酬は確定申告の対象となる場合があります。税務に関しては各自でご確認ください。</span>
                    </li>
                </ul>
            </div>

            {/* Bonus Content Section */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h2 className="font-bold text-gray-900">紹介特典コンテンツ</h2>
                        <p className="text-xs text-gray-500 mt-1">
                            あなたの紹介リンクから登録した人に見せる特典を設定できます
                        </p>
                    </div>
                    {(bonusTitle || bonusDescription) && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowPreview(!showPreview)}
                        >
                            <Eye className="h-4 w-4 mr-1" />
                            {showPreview ? '編集に戻る' : 'プレビュー'}
                        </Button>
                    )}
                </div>

                {showPreview ? (
                    // Preview
                    <div className="p-6 bg-gray-50">
                        <div className="max-w-lg mx-auto bg-white rounded-xl border border-gray-200 p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Gift className="h-5 w-5 text-[#7c3aed]" />
                                <span className="text-sm text-gray-500">{user?.name || '紹介者'}からの特典</span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">{bonusTitle || '（タイトル未設定）'}</h3>
                            <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                                {bonusDescription || '（説明未設定）'}
                            </div>
                            {bonusFileName && (
                                <div className="mt-4 flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <FileText className="h-4 w-4 text-gray-500" />
                                    <span className="text-sm text-gray-700">{bonusFileName}</span>
                                    <Download className="h-4 w-4 text-blue-500 ml-auto" />
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-gray-400 text-center mt-3">
                            特典URL: {bonusUrl}
                        </p>
                    </div>
                ) : (
                    // Edit form
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">特典タイトル</label>
                            <Input
                                placeholder="例: 限定ノウハウPDFプレゼント"
                                value={bonusTitle}
                                onChange={(e) => setBonusTitle(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">特典の説明</label>
                            <textarea
                                placeholder="特典の内容を詳しく説明してください..."
                                value={bonusDescription}
                                onChange={(e) => setBonusDescription(e.target.value)}
                                rows={5}
                                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                添付ファイル <span className="text-gray-400 font-normal">（最大5MB）</span>
                            </label>
                            {bonusFileName ? (
                                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <FileText className="h-4 w-4 text-gray-500" />
                                    <span className="text-sm text-gray-700 flex-1">{bonusFileName}</span>
                                    <button
                                        onClick={removeFile}
                                        className="text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#7c3aed] hover:bg-purple-50/50 transition-colors text-sm text-gray-500"
                                >
                                    <Upload className="h-4 w-4" />
                                    ファイルを選択
                                </button>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                onChange={handleFileSelect}
                                accept=".pdf,.zip,.txt,.png,.jpg,.jpeg,.gif,.mp4,.doc,.docx,.xls,.xlsx"
                            />
                        </div>

                        <div className="flex items-center gap-3 pt-4 border-t border-gray-200 mt-4">
                            <Button
                                onClick={saveBonus}
                                isLoading={bonusSaving}
                                className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white px-6 py-2.5 text-sm font-bold shadow-md"
                            >
                                {bonusSaving ? '保存中...' : '特典を保存する'}
                            </Button>
                            {bonusSaved && (
                                <span className="text-sm text-emerald-600 flex items-center gap-1 font-medium">
                                    <Check className="h-4 w-4" /> 保存しました！
                                </span>
                            )}
                        </div>

                        {referralCode && (
                            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                <p className="text-xs text-blue-700">
                                    <strong>特典ページURL:</strong>{' '}
                                    <a href={bonusUrl} target="_blank" rel="noopener noreferrer" className="underline break-all">
                                        {bonusUrl}
                                    </a>
                                </p>
                                <p className="text-xs text-blue-500 mt-1">
                                    紹介された方がこのURLにアクセスすると、設定した特典を閲覧できます。
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
