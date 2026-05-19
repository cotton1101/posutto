import { X, CheckCircle2, AlertTriangle, ExternalLink, Loader2, WifiOff, Users, UserPlus, MessageSquare } from 'lucide-react';
import type { Account } from '../types';
import { fetchXUserProfileByAccountId, type XUserProfile } from '../lib/xService';
import { useState, useEffect } from 'react';

interface AccountPreviewProps {
    account: Account | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function AccountPreview({ account, isOpen, onClose }: AccountPreviewProps) {
    const [realTimeData, setRealTimeData] = useState<XUserProfile | null>(null);
    const [isFetching, setIsFetching] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        if (isOpen && account?.id) {
            const fetchData = async () => {
                setIsFetching(true);
                setFetchError(null);
                const data = await fetchXUserProfileByAccountId(account.id);
                if (!cancelled) {
                    if (data) {
                        setRealTimeData(data);
                    } else {
                        setFetchError('プロフィール情報の取得に失敗しました。APIキーが正しく設定されているか確認してください。');
                    }
                    setIsFetching(false);
                }
            };
            fetchData();
        }
        return () => {
            cancelled = true;
            setRealTimeData(null);
            setFetchError(null);
        };
    }, [isOpen, account?.id]);

    if (!account && !isOpen) return null;

    const displayName = realTimeData?.name || account?.name || '';
    const displayScreenName = realTimeData?.screenName || account?.screenName || '';
    // Use high-res profile image (remove _normal suffix for full size)
    const profileImage = (() => {
        const img = realTimeData?.profileImageUrl || account?.profileImageUrl || account?.avatarUrl;
        if (!img) return null;
        return img.replace('_normal.', '_400x400.');
    })();

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/30 backdrop-blur-[2px] z-[60] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />
            {/* Slide-over container */}
            <div className={`fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-[70] transform transition-transform duration-500 ease-in-out border-l border-gray-200 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                {account ? (
                    <div className="h-full flex flex-col">
                        {/* Top Action Bar */}
                        <div className="absolute top-4 left-4 z-30">
                            <button
                                onClick={onClose}
                                className="p-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition-all hover:scale-110 active:scale-95 backdrop-blur-sm"
                                title="閉じる"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Hero Section — taller banner */}
                        <div className="relative h-40 bg-gray-900 overflow-hidden flex-shrink-0">
                            {/* Banner */}
                            {realTimeData?.profileBannerUrl ? (
                                <img
                                    src={`${realTimeData.profileBannerUrl}/1500x500`}
                                    alt="Banner"
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        // Fallback: try without size suffix
                                        const img = e.target as HTMLImageElement;
                                        if (img.src.includes('/1500x500')) {
                                            img.src = realTimeData.profileBannerUrl!;
                                        }
                                    }}
                                />
                            ) : (
                                <div className="absolute inset-0 bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700" />
                            )}

                            {/* Loading Overlay */}
                            {isFetching && (
                                <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center z-10">
                                    <Loader2 className="text-white animate-spin" size={24} />
                                </div>
                            )}
                        </div>

                        {/* Avatar — positioned between banner and content */}
                        <div className="relative flex-shrink-0 px-6">
                            <div className="absolute -top-12 border-4 border-white rounded-full bg-gray-50 h-24 w-24 flex items-center justify-center text-gray-400 overflow-hidden shadow-lg z-20">
                                {profileImage ? (
                                    <img
                                        src={profileImage}
                                        alt={displayName}
                                        className="h-full w-full object-cover"
                                        onError={(e) => {
                                            // Fallback: try original URL without size modification
                                            const img = e.target as HTMLImageElement;
                                            const original = realTimeData?.profileImageUrl || account?.profileImageUrl || account?.avatarUrl;
                                            if (original && img.src !== original) {
                                                img.src = original;
                                            }
                                        }}
                                    />
                                ) : (
                                    <span className="text-3xl font-bold uppercase text-primary/40">{displayName.charAt(0)}</span>
                                )}
                            </div>
                        </div>

                        {/* Content Scroll Area */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar pt-14 px-6 pb-10">
                            <div className="space-y-6">
                                {/* Error Message */}
                                {fetchError && !isFetching && (
                                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 flex items-start gap-2">
                                        <WifiOff size={14} className="mt-0.5 shrink-0" />
                                        <span>{fetchError}</span>
                                    </div>
                                )}

                                {/* Profile Identity */}
                                <div className="flex items-start justify-between">
                                    <div className="min-w-0 flex-1 mr-3">
                                        <div className="flex items-center gap-1.5">
                                            <h3 className="text-xl font-bold text-gray-900 truncate">{displayName}</h3>
                                            {realTimeData?.verified && (
                                                <CheckCircle2 className="text-blue-500 shrink-0" size={18} fill="currentColor" fillOpacity={0.1} />
                                            )}
                                        </div>
                                        <p className="text-gray-500 text-sm">@{displayScreenName}</p>
                                    </div>
                                    <a
                                        href={`https://x.com/${displayScreenName}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white rounded-full text-xs font-bold hover:bg-black transition-colors shrink-0 shadow-sm"
                                    >
                                        <ExternalLink size={12} />
                                        Xで開く
                                    </a>
                                </div>

                                {/* Bio */}
                                {realTimeData?.description ? (
                                    <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        {realTimeData.description}
                                    </p>
                                ) : !isFetching && !fetchError ? (
                                    <p className="text-sm text-gray-400 italic bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        プロフィール説明はありません。
                                    </p>
                                ) : null}

                                {/* Stats Bar */}
                                {realTimeData && (
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-center">
                                            <UserPlus size={14} className="mx-auto text-gray-400 mb-1.5" />
                                            <p className="text-lg font-bold text-gray-900">
                                                {realTimeData.followingCount.toLocaleString()}
                                            </p>
                                            <p className="text-[10px] text-gray-500 font-medium">フォロー中</p>
                                        </div>
                                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-center">
                                            <Users size={14} className="mx-auto text-gray-400 mb-1.5" />
                                            <p className="text-lg font-bold text-gray-900">
                                                {realTimeData.followersCount.toLocaleString()}
                                            </p>
                                            <p className="text-[10px] text-gray-500 font-medium">フォロワー</p>
                                        </div>
                                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-center">
                                            <MessageSquare size={14} className="mx-auto text-gray-400 mb-1.5" />
                                            <p className="text-lg font-bold text-gray-900">
                                                {realTimeData.tweetCount.toLocaleString()}
                                            </p>
                                            <p className="text-[10px] text-gray-500 font-medium">ポスト</p>
                                        </div>
                                    </div>
                                )}

                                {/* Loading placeholder for stats */}
                                {isFetching && !realTimeData && (
                                    <div className="grid grid-cols-3 gap-3">
                                        {['フォロー中', 'フォロワー', 'ポスト'].map(label => (
                                            <div key={label} className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-center">
                                                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse mx-auto mb-1.5" />
                                                <div className="h-6 w-12 bg-gray-200 rounded animate-pulse mx-auto mb-1" />
                                                <p className="text-[10px] text-gray-500 font-medium">{label}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Metadata Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                                        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Status</p>
                                        <div className="flex items-center gap-1.5">
                                            {account.status === 'active' ? (
                                                <>
                                                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                                    <span className="text-xs font-bold text-emerald-600">正常稼働中</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                                                    <span className="text-xs font-bold text-rose-500">制限あり</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                                        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">認証</p>
                                        <div className="flex items-center gap-1.5">
                                            {realTimeData?.verified ? (
                                                <>
                                                    <CheckCircle2 size={12} className="text-blue-500" />
                                                    <span className="text-xs font-bold text-blue-600">認証済み</span>
                                                </>
                                            ) : (
                                                <span className="text-xs font-bold text-gray-500">未認証</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Info */}
                        <div className="p-6 bg-gray-50 border-t border-gray-100 flex-shrink-0">
                            <div className="flex items-center gap-3 text-gray-400 mb-4">
                                <AlertTriangle size={14} className="shrink-0" />
                                <span className="text-[10px] font-medium leading-tight">
                                    プレビューデータは反映に時間がかかる場合があります。正確な情報は公式アプリをご確認ください。
                                </span>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-full py-3 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-100 hover:border-gray-300 transition-all shadow-sm"
                            >
                                閉じる
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center">
                        <p className="text-gray-400">読み込み中...</p>
                    </div>
                )}
            </div>
        </>
    );
}
