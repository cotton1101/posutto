import React, { useState, useEffect, useCallback } from 'react';
import { Check, Bot, Zap, Crown, Star, Loader2, AlertCircle, CheckCircle2, X, ArrowRight, ArrowDown, Calendar } from 'lucide-react';
import { useAuth } from '../lib/auth';
import type { PlanType, SubscriptionInfo } from '../types/plans';
import { PLAN_DETAILS } from '../types/plans';
import { Button } from '../components/ui/Button';
import { API_BASE } from '../config';
import { authFetch, authJsonFetch } from '../lib/authFetch';

// ---------------------------------------------------------------------------
// Proration preview data type
// ---------------------------------------------------------------------------
interface ProrationPreview {
    currentPlan: string;
    newPlan: string;
    creditAmount: number;
    chargeAmount: number;
    prorationAmount: number;
    nextMonthlyAmount: number;
    remainingDays: number;
    totalDays: number;
    periodEnd: string;
    invoiceTotal: number;
    invoiceSubtotal: number;
}

export default function Shop() {
    const { user, updateUser } = useAuth();
    const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [processingPlan, setProcessingPlan] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Proration modal state
    const [prorationModal, setProrationModal] = useState(false);
    const [prorationData, setProrationData] = useState<ProrationPreview | null>(null);
    const [prorationLoading, setProrationLoading] = useState(false);
    const [prorationTargetPlan, setProrationTargetPlan] = useState<PlanType | null>(null);
    const [upgradeProcessing, setUpgradeProcessing] = useState(false);

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
            console.error('Failed to fetch subscription status:', err);
        } finally {
            setIsLoading(false);
        }
    }, [user, updateUser]);

    // Check URL params for success/cancel callbacks from Stripe
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('success') === 'true') {
            setSuccessMessage('決済が完了しました！プランが有効化されています。');
            window.history.replaceState({}, '', window.location.pathname);
            setTimeout(() => fetchSubscriptionStatus(), 2000);
        }
        if (params.get('canceled') === 'true') {
            setError('決済がキャンセルされました。');
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, [fetchSubscriptionStatus]);

    useEffect(() => {
        fetchSubscriptionStatus();
    }, [fetchSubscriptionStatus]);

    // -----------------------------------------------------------------------
    // Plan selection handler
    // -----------------------------------------------------------------------
    const handleSelectPlan = async (plan: PlanType) => {
        if (plan === 'free') return;
        setError(null);
        setProcessingPlan(plan);

        try {
            const res = await authJsonFetch(`${API_BASE}/api/stripe/create-checkout-session`, 'POST', { plan });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || '決済セッションの作成に失敗しました。');
            }

            if (data.url) {
                // New subscription → redirect to Stripe Checkout
                window.location.href = data.url;
            } else if (data.requiresProration) {
                // Existing subscription → open proration preview modal
                await openProrationModal(plan);
            } else if (data.message) {
                setSuccessMessage(data.message);
                await fetchSubscriptionStatus();
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : '決済処理に失敗しました。');
        } finally {
            setProcessingPlan(null);
        }
    };

    // -----------------------------------------------------------------------
    // Open proration preview modal
    // -----------------------------------------------------------------------
    const openProrationModal = async (plan: PlanType) => {
        setProrationTargetPlan(plan);
        setProrationLoading(true);
        setProrationModal(true);
        setProrationData(null);

        try {
            const res = await authJsonFetch(`${API_BASE}/api/stripe/preview-proration`, 'POST', { plan });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || '差額の計算に失敗しました。');
            }

            setProrationData(data);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : '差額の計算に失敗しました。');
            setProrationModal(false);
        } finally {
            setProrationLoading(false);
        }
    };

    // -----------------------------------------------------------------------
    // Confirm upgrade with proration
    // -----------------------------------------------------------------------
    const confirmUpgrade = async () => {
        if (!prorationTargetPlan) return;
        setUpgradeProcessing(true);

        try {
            const res = await authJsonFetch(`${API_BASE}/api/stripe/confirm-upgrade`, 'POST', {
                plan: prorationTargetPlan,
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'プラン変更に失敗しました。');
            }

            setSuccessMessage(data.message || 'プランを変更しました！');
            setProrationModal(false);
            setProrationData(null);
            setProrationTargetPlan(null);
            await fetchSubscriptionStatus();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'プラン変更に失敗しました。');
            setProrationModal(false);
        } finally {
            setUpgradeProcessing(false);
        }
    };

    // -----------------------------------------------------------------------
    // Cancel / Reactivate
    // -----------------------------------------------------------------------
    const handleDowngradeToFree = async () => {
        if (!confirm('フリープランに戻しますか？\n現在の請求期間の終了時にダウングレードされます。')) return;
        setError(null);
        setProcessingPlan('free');

        try {
            const res = await authJsonFetch(`${API_BASE}/api/stripe/cancel-subscription`, 'POST', {});
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'サブスクリプションのキャンセルに失敗しました。');
            setSuccessMessage('請求期間の終了時にフリープランに戻ります。');
            await fetchSubscriptionStatus();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'キャンセルに失敗しました。');
        } finally {
            setProcessingPlan(null);
        }
    };

    const handleReactivate = async () => {
        setError(null);
        setProcessingPlan('reactivate');

        try {
            const res = await authJsonFetch(`${API_BASE}/api/stripe/reactivate-subscription`, 'POST', {});
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'サブスクリプションの再開に失敗しました。');
            setSuccessMessage('サブスクリプションを再開しました！');
            await fetchSubscriptionStatus();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : '再開に失敗しました。');
        } finally {
            setProcessingPlan(null);
        }
    };

    // -----------------------------------------------------------------------
    // Plan card definitions
    // -----------------------------------------------------------------------
    const plans: { type: PlanType; icon: React.ReactNode; color: string; bgColor: string; borderColor: string }[] = [
        { type: 'free', icon: <Bot className="h-6 w-6" />, color: 'text-gray-600', bgColor: 'bg-gray-50', borderColor: 'border-gray-200' },
        { type: 'starter', icon: <Star className="h-6 w-6" />, color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
        { type: 'advanced', icon: <Zap className="h-6 w-6" />, color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' },
        { type: 'advanced_20', icon: <Bot className="h-6 w-6" />, color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200' },
        { type: 'advanced_70', icon: <Crown className="h-6 w-6" />, color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' },
        { type: 'advanced_170', icon: <Crown className="h-6 w-6" />, color: 'text-rose-600', bgColor: 'bg-rose-50', borderColor: 'border-rose-200' },
    ];

    const currentPlan = user?.plan || 'free';
    const isSubscribed = subscription && subscription.status === 'active' && currentPlan !== 'free';
    const isCancelPending = subscription?.cancelAtPeriodEnd === true;

    // -----------------------------------------------------------------------
    // Format currency
    // -----------------------------------------------------------------------
    const fmtYen = (n: number) => `¥${n.toLocaleString()}`;

    return (
        <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
                <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
                    ポスット ショップ
                </h1>
                <p className="mt-5 text-xl text-gray-500 max-w-2xl mx-auto">
                    あなたの運用スタイルに合わせた最適なプランをお選びください。
                </p>
                <div className="mt-4 inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                    現在のご契約: {PLAN_DETAILS[currentPlan]?.name || '未設定'}
                </div>
                {isCancelPending && subscription?.currentPeriodEnd && (
                    <div className="mt-3 block">
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 text-amber-700 font-medium text-sm">
                            <AlertCircle className="h-4 w-4" />
                            {new Date(subscription.currentPeriodEnd).toLocaleDateString('ja-JP')} にフリープランに戻ります
                        </span>
                    </div>
                )}
            </div>

            {/* Messages */}
            {error && (
                <div className="mb-8 max-w-2xl mx-auto p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                    <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">&times;</button>
                </div>
            )}
            {successMessage && (
                <div className="mb-8 max-w-2xl mx-auto p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                    <span className="text-sm">{successMessage}</span>
                    <button onClick={() => setSuccessMessage(null)} className="ml-auto text-emerald-400 hover:text-emerald-600">&times;</button>
                </div>
            )}

            {/* Plan Cards */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                        {plans.map((p) => {
                            const details = PLAN_DETAILS[p.type];
                            const isCurrent = currentPlan === p.type;
                            const isProcessing = processingPlan === p.type;
                            const isDowngrade = details.price < (PLAN_DETAILS[currentPlan]?.price || 0);
                            const isUpgrade = details.price > (PLAN_DETAILS[currentPlan]?.price || 0);
                            const isFree = p.type === 'free';

                            let buttonLabel = 'プランを選択';
                            let buttonAction: () => void = () => handleSelectPlan(p.type);

                            if (isCurrent && !isCancelPending) {
                                buttonLabel = '現在のプラン';
                            } else if (isCurrent && isCancelPending) {
                                buttonLabel = 'キャンセル取消';
                                buttonAction = handleReactivate;
                            } else if (isFree && isSubscribed) {
                                buttonLabel = 'フリーに戻す';
                                buttonAction = handleDowngradeToFree;
                            } else if (isUpgrade) {
                                buttonLabel = 'アップグレード';
                            } else if (isDowngrade && !isFree) {
                                buttonLabel = 'プラン変更';
                            }

                            return (
                                <div
                                    key={p.type}
                                    className={`relative flex flex-col rounded-2xl border ${isCurrent && !isCancelPending ? 'ring-2 ring-primary border-primary' : 'border-gray-200'} bg-white shadow-xl transition-all hover:scale-105 hover:shadow-2xl overflow-hidden`}
                                >
                                    {isCurrent && !isCancelPending && (
                                        <div className="absolute top-0 right-0 -mr-1 -mt-1 w-24 h-24 overflow-hidden pointer-events-none">
                                            <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold py-1 px-8 transform rotate-45 translate-x-1/4 translate-y-1/4 shadow-sm">
                                                利用中
                                            </div>
                                        </div>
                                    )}

                                    <div className="p-6 flex-1">
                                        <div className={`inline-flex p-3 rounded-xl ${p.bgColor} ${p.color} mb-4`}>
                                            {p.icon}
                                        </div>
                                        <h3 className="text-base font-bold text-gray-900 mb-2">{details.name}</h3>
                                        <div className="flex items-baseline mb-5">
                                            <span className="text-2xl font-extrabold text-gray-900">
                                                {isFree ? '無料' : `¥${details.price.toLocaleString()}`}
                                            </span>
                                            {!isFree && <span className="ml-1 text-gray-500 text-sm">/月</span>}
                                        </div>

                                        <ul className="space-y-3 mb-6">
                                            <li className="flex items-start">
                                                <Check className="h-4 w-4 text-primary flex-shrink-0 mr-2 mt-0.5" />
                                                <span className="text-xs text-gray-600">Bot数: <strong className="text-gray-900">{details.maxBots}個</strong></span>
                                            </li>
                                            <li className="flex items-start">
                                                <Check className="h-4 w-4 text-primary flex-shrink-0 mr-2 mt-0.5" />
                                                <span className="text-xs text-gray-600">投稿上限: <strong className="text-gray-900">{details.maxTweetsPerDayPerBot}回/日</strong></span>
                                            </li>
                                            <li className="flex items-start">
                                                <Check className="h-4 w-4 text-primary flex-shrink-0 mr-2 mt-0.5" />
                                                <span className="text-xs text-gray-600">全自動運用</span>
                                            </li>
                                        </ul>
                                    </div>

                                    <div className="p-6 pt-0 mt-auto">
                                        <Button
                                            onClick={buttonAction}
                                            disabled={(isCurrent && !isCancelPending) || isProcessing || !!processingPlan}
                                            variant={isCurrent && !isCancelPending ? 'outline' : 'default'}
                                            className="w-full rounded-xl py-5 text-sm font-bold shadow-lg transition-all"
                                        >
                                            {isProcessing ? (
                                                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> 処理中...</>
                                            ) : (
                                                buttonLabel
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Subscription info */}
                    {isSubscribed && subscription?.currentPeriodEnd && (
                        <div className="mt-8 max-w-2xl mx-auto text-center text-sm text-gray-500">
                            次回請求日: {new Date(subscription.currentPeriodEnd).toLocaleDateString('ja-JP')}
                        </div>
                    )}
                </>
            )}

            {/* CTA Banner */}
            <div className="mt-16 bg-gradient-to-br from-primary to-purple-600 rounded-3xl p-8 md:p-12 shadow-2xl overflow-hidden relative">
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="text-white">
                        <h2 className="text-3xl font-bold mb-4">法人・大規模運用の方へ</h2>
                        <p className="text-lg opacity-90 max-w-xl">
                            さらに大規模なBot運用や、専用のカスタマイズが必要な場合は、個別にお見積もりをさせていただきます。お気軽にお問い合わせください。
                        </p>
                    </div>
                    <Button variant="secondary" className="bg-white text-primary hover:bg-gray-100 px-8 py-6 rounded-2xl font-bold text-lg shadow-xl">
                        お問い合わせはこちら
                    </Button>
                </div>
                <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-64 h-64 rounded-full bg-white/10 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-96 h-96 rounded-full bg-purple-400/20 blur-3xl"></div>
            </div>

            {/* Payment note */}
            <div className="mt-8 text-center text-xs text-gray-400 space-y-1">
                <p>決済はStripeを通じて安全に処理されます。</p>
                <p>サブスクリプションはいつでもキャンセルできます。</p>
            </div>

            {/* ================================================================= */}
            {/* Proration Confirmation Modal                                       */}
            {/* ================================================================= */}
            {prorationModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => { if (!upgradeProcessing) { setProrationModal(false); setProrationData(null); setProrationTargetPlan(null); } }}
                    />

                    {/* Modal content */}
                    <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-primary/5 to-purple-50">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">プラン変更の確認</h3>
                                <p className="text-xs text-gray-500 mt-0.5">日割り差額を確認してください</p>
                            </div>
                            {!upgradeProcessing && (
                                <button
                                    onClick={() => { setProrationModal(false); setProrationData(null); setProrationTargetPlan(null); }}
                                    className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            )}
                        </div>

                        {/* Body */}
                        <div className="px-6 py-6">
                            {prorationLoading ? (
                                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                    <Loader2 className="h-8 w-8 animate-spin mb-3" />
                                    <p className="text-sm">差額を計算中...</p>
                                </div>
                            ) : prorationData ? (
                                <div className="space-y-5">
                                    {/* Plan Change Arrow */}
                                    <div className="flex items-center justify-center gap-4">
                                        <div className="flex-1 text-center p-4 rounded-xl bg-gray-50 border border-gray-200">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">現在のプラン</p>
                                            <p className="text-sm font-bold text-gray-900">
                                                {PLAN_DETAILS[prorationData.currentPlan as PlanType]?.name || prorationData.currentPlan}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {fmtYen(PLAN_DETAILS[prorationData.currentPlan as PlanType]?.price || 0)}/月
                                            </p>
                                        </div>
                                        <ArrowRight className="h-6 w-6 text-primary flex-shrink-0 hidden sm:block" />
                                        <ArrowDown className="h-6 w-6 text-primary flex-shrink-0 sm:hidden" />
                                        <div className="flex-1 text-center p-4 rounded-xl bg-primary/5 border-2 border-primary">
                                            <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">変更後のプラン</p>
                                            <p className="text-sm font-bold text-gray-900">
                                                {PLAN_DETAILS[prorationData.newPlan as PlanType]?.name || prorationData.newPlan}
                                            </p>
                                            <p className="text-xs text-primary mt-0.5">
                                                {fmtYen(prorationData.nextMonthlyAmount)}/月
                                            </p>
                                        </div>
                                    </div>

                                    {/* Proration Breakdown */}
                                    <div className="bg-gray-50 rounded-xl p-5 space-y-3">
                                        <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-gray-400" />
                                            日割り計算の内訳
                                        </h4>
                                        <div className="text-xs space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-500">請求期間の残り日数</span>
                                                <span className="font-medium text-gray-700">{prorationData.remainingDays}日 / {prorationData.totalDays}日</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-500">現プランの未使用分（クレジット）</span>
                                                <span className="font-medium text-emerald-600">- {fmtYen(prorationData.creditAmount)}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-500">新プランの日割り料金</span>
                                                <span className="font-medium text-gray-700">+ {fmtYen(prorationData.chargeAmount)}</span>
                                            </div>
                                            <div className="border-t border-gray-200 pt-2 mt-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="font-bold text-gray-700">今回の差額請求</span>
                                                    <span className="font-extrabold text-lg text-primary">
                                                        {prorationData.prorationAmount >= 0
                                                            ? fmtYen(prorationData.prorationAmount)
                                                            : `- ${fmtYen(Math.abs(prorationData.prorationAmount))}`}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Next billing info */}
                                    <div className="bg-blue-50 rounded-xl p-4 text-xs text-blue-700 space-y-1">
                                        <p className="font-medium">
                                            次回以降の請求: 月額 {fmtYen(prorationData.nextMonthlyAmount)}
                                        </p>
                                        <p className="text-blue-500">
                                            現在の請求期間終了日: {new Date(prorationData.periodEnd).toLocaleDateString('ja-JP')}
                                        </p>
                                        {prorationData.prorationAmount > 0 && (
                                            <p className="text-blue-500">
                                                ※ 差額 {fmtYen(prorationData.prorationAmount)} は次回の請求書に加算されます。
                                            </p>
                                        )}
                                        {prorationData.prorationAmount < 0 && (
                                            <p className="text-blue-500">
                                                ※ クレジット {fmtYen(Math.abs(prorationData.prorationAmount))} が次回の請求書から差し引かれます。
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        {/* Footer */}
                        {prorationData && (
                            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row gap-3">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    disabled={upgradeProcessing}
                                    onClick={() => { setProrationModal(false); setProrationData(null); setProrationTargetPlan(null); }}
                                >
                                    キャンセル
                                </Button>
                                <Button
                                    className="flex-1 gap-2"
                                    onClick={confirmUpgrade}
                                    disabled={upgradeProcessing}
                                >
                                    {upgradeProcessing ? (
                                        <><Loader2 className="h-4 w-4 animate-spin" /> 処理中...</>
                                    ) : (
                                        <>プランを変更する</>
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
