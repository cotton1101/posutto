import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { API_BASE } from '../config';
import { authFetch, authJsonFetch } from '../lib/authFetch';
import { PLAN_DETAILS, type PlanType, type SubscriptionInfo } from '../types/plans';
import { User, Mail, Calendar, CreditCard, Lock, AlertTriangle, Trash2, CheckCircle2, Pencil, Loader2, ExternalLink } from 'lucide-react';

export default function MyAccount() {
    const { user, logout, updateUser } = useAuth();
    const navigate = useNavigate();

    // Email change
    const [showEmailChange, setShowEmailChange] = useState(false);
    const [newEmail, setNewEmail] = useState('');
    const [emailPassword, setEmailPassword] = useState('');
    const [emailLoading, setEmailLoading] = useState(false);
    const [emailError, setEmailError] = useState<string | null>(null);
    const [emailSuccess, setEmailSuccess] = useState(false);

    // Password change
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [pwLoading, setPwLoading] = useState(false);
    const [pwError, setPwError] = useState<string | null>(null);
    const [pwSuccess, setPwSuccess] = useState(false);

    // Account deletion
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    // Subscription
    const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
    const [subLoading, setSubLoading] = useState(true);
    const [subActionLoading, setSubActionLoading] = useState(false);
    const [subMessage, setSubMessage] = useState<string | null>(null);
    const [subError, setSubError] = useState<string | null>(null);

    const fetchSubscriptionStatus = useCallback(async () => {
        if (!user?.email) return;
        try {
            const res = await authFetch(`${API_BASE}/api/stripe/subscription-status`);
            if (res.ok) {
                const data = await res.json();
                setSubscription(data);
                if (data.plan && data.plan !== user.plan) {
                    updateUser({ plan: data.plan });
                }
            }
        } catch (err) {
            console.error('Failed to fetch subscription:', err);
        } finally {
            setSubLoading(false);
        }
    }, [user, updateUser]);

    useEffect(() => {
        fetchSubscriptionStatus();
    }, [fetchSubscriptionStatus]);

    const handleCancelSubscription = async () => {
        if (!confirm('サブスクリプションをキャンセルしますか？\n現在の請求期間の終了時にフリープランに戻ります。')) return;
        setSubError(null);
        setSubMessage(null);
        setSubActionLoading(true);
        try {
            const res = await authJsonFetch(`${API_BASE}/api/stripe/cancel-subscription`, 'POST', {});
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'キャンセルに失敗しました。');
            setSubMessage('請求期間の終了時にフリープランに戻ります。');
            await fetchSubscriptionStatus();
        } catch (err: unknown) {
            setSubError(err instanceof Error ? err.message : 'エラーが発生しました');
        } finally {
            setSubActionLoading(false);
        }
    };

    const handleReactivateSubscription = async () => {
        setSubError(null);
        setSubMessage(null);
        setSubActionLoading(true);
        try {
            const res = await authJsonFetch(`${API_BASE}/api/stripe/reactivate-subscription`, 'POST', {});
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || '再開に失敗しました。');
            setSubMessage('サブスクリプションを再開しました！');
            await fetchSubscriptionStatus();
        } catch (err: unknown) {
            setSubError(err instanceof Error ? err.message : 'エラーが発生しました');
        } finally {
            setSubActionLoading(false);
        }
    };

    const handleChangeEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setEmailError(null);
        setEmailSuccess(false);

        if (!newEmail || !emailPassword) {
            setEmailError('新しいメールアドレスとパスワードを入力してください。');
            return;
        }

        setEmailLoading(true);
        try {
            const res = await authJsonFetch(`${API_BASE}/api/auth/change-email`, 'POST', {
                newEmail,
                password: emailPassword,
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'エラーが発生しました');

            // Update local user state with new email
            updateUser({ email: newEmail });

            setEmailSuccess(true);
            setNewEmail('');
            setEmailPassword('');
            setShowEmailChange(false);
            setTimeout(() => setEmailSuccess(false), 5000);
        } catch (err: unknown) {
            setEmailError(err instanceof Error ? err.message : 'エラーが発生しました');
        } finally {
            setEmailLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPwError(null);
        setPwSuccess(false);

        if (newPassword !== confirmPassword) {
            setPwError('新しいパスワードが一致しません。');
            return;
        }
        if (newPassword.length < 8) {
            setPwError('パスワードは8文字以上で設定してください。');
            return;
        }

        setPwLoading(true);
        try {
            const res = await authJsonFetch(`${API_BASE}/api/auth/change-password`, 'POST', {
                currentPassword,
                newPassword,
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'エラーが発生しました');

            setPwSuccess(true);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => setPwSuccess(false), 5000);
        } catch (err: unknown) {
            setPwError(err instanceof Error ? err.message : 'エラーが発生しました');
        } finally {
            setPwLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        setDeleteError(null);
        setDeleteLoading(true);

        try {
            const res = await authJsonFetch(`${API_BASE}/api/auth/account`, 'DELETE', {
                password: deletePassword,
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'エラーが発生しました');

            logout();
            navigate('/login');
        } catch (err: unknown) {
            setDeleteError(err instanceof Error ? err.message : 'エラーが発生しました');
        } finally {
            setDeleteLoading(false);
        }
    };

    const planName = user?.plan ? (PLAN_DETAILS[user.plan as PlanType]?.name || user.plan) : '未設定';
    const isSubscribed = subscription && subscription.status === 'active' && user?.plan !== 'free';
    const isCancelPending = subscription?.cancelAtPeriodEnd === true;

    return (
        <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8">
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">アカウント設定</h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">アカウント情報の確認・パスワード変更・解約ができます。</p>
            </div>

            {/* User Info Card */}
            <div className="bg-white rounded-2xl sm:rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-gray-50 bg-gray-50/50">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900">アカウント情報</h2>
                </div>
                <div className="p-4 sm:p-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 p-3 sm:p-4 bg-gray-50 rounded-xl">
                            <User className="h-5 w-5 text-gray-400 shrink-0" />
                            <div className="min-w-0">
                                <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">名前</p>
                                <p className="text-sm sm:text-base font-medium text-gray-900 truncate">{user?.name || '未設定'}</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-xl">
                            <div className="flex items-center gap-3 min-w-0">
                                <Mail className="h-5 w-5 text-gray-400 shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">メールアドレス</p>
                                    <p className="text-sm sm:text-base font-medium text-gray-900 truncate">{user?.email || '---'}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => { setShowEmailChange(!showEmailChange); setEmailError(null); setEmailSuccess(false); }}
                                className="flex items-center gap-1 text-xs font-medium text-[#7c3aed] hover:text-[#6d28d9] transition-colors shrink-0 ml-2"
                            >
                                <Pencil className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">変更</span>
                            </button>
                        </div>

                        {emailSuccess && (
                            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 text-sm text-emerald-600 flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 shrink-0" />
                                メールアドレスを変更しました。
                            </div>
                        )}

                        <div className="flex items-center gap-3 p-3 sm:p-4 bg-gray-50 rounded-xl">
                            <Lock className="h-5 w-5 text-gray-400 shrink-0" />
                            <div className="min-w-0">
                                <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">パスワード</p>
                                <p className="text-sm sm:text-base font-medium text-gray-900">••••••••</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 sm:p-4 bg-gray-50 rounded-xl">
                            <CreditCard className="h-5 w-5 text-gray-400 shrink-0" />
                            <div className="min-w-0">
                                <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">現在のプラン</p>
                                <p className="text-sm sm:text-base font-medium text-gray-900">{planName}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 sm:p-4 bg-gray-50 rounded-xl">
                            <Calendar className="h-5 w-5 text-gray-400 shrink-0" />
                            <div className="min-w-0">
                                <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">登録日</p>
                                <p className="text-sm sm:text-base font-medium text-gray-900">
                                    {(user as { created_at?: string })?.created_at
                                        ? new Date((user as { created_at?: string }).created_at!).toLocaleDateString('ja-JP')
                                        : '---'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Subscription Management Card */}
            <div className="bg-white rounded-2xl sm:rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-gray-50 bg-gray-50/50">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900">サブスクリプション管理</h2>
                </div>
                <div className="p-4 sm:p-8">
                    {subLoading ? (
                        <div className="flex items-center justify-center py-8 text-gray-400">
                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                            読み込み中...
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {subMessage && (
                                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 text-sm text-emerald-600 flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                                    {subMessage}
                                </div>
                            )}
                            {subError && (
                                <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600">
                                    {subError}
                                </div>
                            )}

                            <div className="flex items-center gap-3 p-3 sm:p-4 bg-gray-50 rounded-xl">
                                <CreditCard className="h-5 w-5 text-gray-400 shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">プラン</p>
                                    <p className="text-sm sm:text-base font-medium text-gray-900">{planName}</p>
                                </div>
                                {isSubscribed && (
                                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${isCancelPending ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                        {isCancelPending ? 'キャンセル予定' : '有効'}
                                    </span>
                                )}
                                {!isSubscribed && user?.plan === 'free' && (
                                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                                        無料
                                    </span>
                                )}
                            </div>

                            {isSubscribed && subscription?.currentPeriodEnd && (
                                <div className="flex items-center gap-3 p-3 sm:p-4 bg-gray-50 rounded-xl">
                                    <Calendar className="h-5 w-5 text-gray-400 shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">
                                            {isCancelPending ? 'プラン終了日' : '次回請求日'}
                                        </p>
                                        <p className="text-sm sm:text-base font-medium text-gray-900">
                                            {new Date(subscription.currentPeriodEnd).toLocaleDateString('ja-JP')}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                <Link to="/dashboard/shop" className="flex-1">
                                    <Button variant="outline" className="w-full gap-2">
                                        <ExternalLink className="h-4 w-4" />
                                        プランを変更する
                                    </Button>
                                </Link>
                                {isSubscribed && !isCancelPending && (
                                    <Button
                                        variant="outline"
                                        className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                                        onClick={handleCancelSubscription}
                                        isLoading={subActionLoading}
                                    >
                                        サブスクリプションをキャンセル
                                    </Button>
                                )}
                                {isSubscribed && isCancelPending && (
                                    <Button
                                        variant="outline"
                                        className="flex-1 border-emerald-300 text-emerald-600 hover:bg-emerald-50"
                                        onClick={handleReactivateSubscription}
                                        isLoading={subActionLoading}
                                    >
                                        キャンセルを取り消す
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Email Change */}
            {showEmailChange && (
                <div className="bg-white rounded-2xl sm:rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-gray-50 bg-gray-50/50">
                        <h2 className="text-base sm:text-lg font-bold text-gray-900">メールアドレス変更</h2>
                    </div>
                    <div className="p-4 sm:p-8">
                        <form onSubmit={handleChangeEmail} className="space-y-4">
                            {emailError && (
                                <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600">
                                    {emailError}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">現在のメールアドレス</label>
                                <p className="text-sm text-gray-500 bg-gray-50 px-3 py-2.5 rounded-lg border border-gray-200">{user?.email}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">新しいメールアドレス</label>
                                <Input
                                    type="email"
                                    required
                                    placeholder="new@example.com"
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">パスワード（確認用）</label>
                                <Input
                                    type="password"
                                    required
                                    placeholder="現在のパスワードを入力"
                                    value={emailPassword}
                                    onChange={(e) => setEmailPassword(e.target.value)}
                                />
                            </div>
                            <p className="text-xs text-gray-400">
                                ※ 変更後は新しいメールアドレスでログインしてください。
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 justify-end">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full sm:w-auto"
                                    onClick={() => { setShowEmailChange(false); setEmailError(null); setNewEmail(''); setEmailPassword(''); }}
                                >
                                    キャンセル
                                </Button>
                                <Button type="submit" className="w-full sm:w-auto" isLoading={emailLoading}>
                                    メールアドレスを変更
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Password Change */}
            <div className="bg-white rounded-2xl sm:rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-gray-50 bg-gray-50/50">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900">パスワード変更</h2>
                </div>
                <div className="p-4 sm:p-8">
                    <form onSubmit={handleChangePassword} className="space-y-4">
                        {pwError && (
                            <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600">
                                {pwError}
                            </div>
                        )}
                        {pwSuccess && (
                            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 text-sm text-emerald-600 flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 shrink-0" />
                                パスワードを変更しました。
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">現在のパスワード</label>
                            <Input
                                type="password"
                                required
                                placeholder="現在のパスワード"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">新しいパスワード</label>
                            <Input
                                type="password"
                                required
                                placeholder="8文字以上"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                minLength={8}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">新しいパスワード（確認）</label>
                            <Input
                                type="password"
                                required
                                placeholder="もう一度入力"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                minLength={8}
                            />
                        </div>
                        <div className="flex justify-end">
                            <Button type="submit" className="w-full sm:w-auto" isLoading={pwLoading}>
                                パスワードを変更
                            </Button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Account Deletion (解約) */}
            <div className="bg-white rounded-2xl sm:rounded-[2rem] border border-red-200 shadow-sm overflow-hidden">
                <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-red-100 bg-red-50/50">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
                        <h2 className="text-base sm:text-lg font-bold text-red-700">解約・アカウント削除</h2>
                    </div>
                </div>
                <div className="p-4 sm:p-8">
                    {!showDeleteConfirm ? (
                        <div className="space-y-4">
                            <p className="text-sm text-gray-600">
                                アカウントを削除すると、Bot設定・投稿履歴・アカウント情報など全てのデータが完全に削除されます。
                                この操作は取り消すことができません。
                                {isSubscribed && ' サブスクリプションも自動的にキャンセルされます。'}
                            </p>
                            <Button
                                variant="outline"
                                className="w-full sm:w-auto border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                                onClick={() => setShowDeleteConfirm(true)}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                アカウントを削除する
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                                <p className="text-sm font-bold text-red-700 mb-2">
                                    本当に削除しますか？
                                </p>
                                <p className="text-xs text-red-600">
                                    全てのBot・投稿履歴・Xアカウント情報・リンクデータが完全に削除されます。
                                    {isSubscribed && ' Stripeサブスクリプションも即座にキャンセルされます。'}
                                </p>
                            </div>

                            {deleteError && (
                                <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600">
                                    {deleteError}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    確認のためパスワードを入力
                                </label>
                                <Input
                                    type="password"
                                    required
                                    placeholder="パスワードを入力"
                                    value={deletePassword}
                                    onChange={(e) => setDeletePassword(e.target.value)}
                                />
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <Button
                                    variant="outline"
                                    className="w-full sm:w-auto"
                                    onClick={() => { setShowDeleteConfirm(false); setDeleteError(null); setDeletePassword(''); }}
                                >
                                    キャンセル
                                </Button>
                                <Button
                                    className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
                                    onClick={handleDeleteAccount}
                                    isLoading={deleteLoading}
                                    disabled={!deletePassword}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    完全に削除する
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
