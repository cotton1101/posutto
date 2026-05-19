import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Plus,
    Search,
    Play,
    Square,
    Settings,
    Trash2,
    ExternalLink,
    AlertCircle,
    Clock,
    UserCircle2,
    FileText,
    Copy,
    Loader2
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../lib/auth';
import StatusBadge from '../../components/StatusBadge';
import AccountPreview from '../../components/AccountPreview';
import BotLogViewer from '../../components/BotLogViewer';
import { PLAN_DETAILS } from '../../types/plans';
import type { Bot } from '../../types';
import { API_BASE } from '../../config';
import { authFetch, authJsonFetch } from '../../lib/authFetch';

// Bot type already imported from types
export default function BotList() {
    const { user } = useAuth();
    const [bots, setBots] = useState<Bot[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchBots = async () => {
            if (!user?.email) return;
            try {
                const response = await authFetch(`${API_BASE}/api/bots/${user.email}`);
                if (response.ok) {
                    const data = await response.json();
                    setBots(data);
                }
            } catch (error) {
                console.error('Failed to fetch bots:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchBots();
    }, [user?.email]);

    const maxBots = user?.plan ? PLAN_DETAILS[user.plan].maxBots : 10;
    const isLimitReached = bots.length >= maxBots;

    const [previewAccount, setPreviewAccount] = useState<string | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [logBotId, setLogBotId] = useState<string | null>(null);
    const [logBotName, setLogBotName] = useState<string>('');
    const [isLogViewerOpen, setIsLogViewerOpen] = useState(false);
    const [duplicatingBotId, setDuplicatingBotId] = useState<string | null>(null);

    const openPreview = (accountId: string) => {
        setPreviewAccount(accountId);
        setIsPreviewOpen(true);
    };

    const toggleStatus = async (botId: string) => {
        const bot = bots.find(b => b.id === botId);
        if (!bot) return;

        const newStatus = bot.status === 'active' ? 'paused' : 'active';

        try {
            const response = await authJsonFetch(`${API_BASE}/api/bots/save`, 'POST', {
                    email: user?.email,
                    bot: { ...bot, status: newStatus }
            });

            if (response.ok) {
                setBots(bots.map(b =>
                    b.id === botId ? { ...b, status: newStatus } : b
                ));
            }
        } catch (error) {
            console.error('Failed to toggle bot status:', error);
        }
    };

    const handleDuplicate = async (botId: string) => {
        if (!user?.email) return;
        if (isLimitReached) {
            alert(`プランの作成上限（${maxBots}個）に達しています。コピーするにはプランをアップグレードしてください。`);
            return;
        }

        setDuplicatingBotId(botId);
        try {
            // 既存Botの完全データを取得
            const response = await authFetch(`${API_BASE}/api/bot/${botId}`);
            if (!response.ok) {
                throw new Error('Botデータの取得に失敗しました');
            }
            const botData = await response.json();

            // コピー用データ作成（IDを除去、名前に「（コピー）」追加、停止状態で作成）
            const copiedBot = {
                name: `${botData.name}（コピー）`,
                accountId: botData.account_id || botData.accountId,
                settings: botData.settings || {},
                schedule: botData.schedule || [],
                status: 'paused'
            };

            // 新規Botとして保存
            const saveResponse = await authJsonFetch(`${API_BASE}/api/bots/save`, 'POST', {
                email: user.email,
                bot: copiedBot
            });

            if (!saveResponse.ok) {
                const error = await saveResponse.json();
                throw new Error(error.error || 'Botのコピーに失敗しました');
            }

            // Bot一覧を再取得
            const refreshResponse = await authFetch(`${API_BASE}/api/bots/${user.email}`);
            if (refreshResponse.ok) {
                const data = await refreshResponse.json();
                setBots(data);
            }
        } catch (error) {
            console.error('Failed to duplicate bot:', error);
            alert(error instanceof Error ? error.message : 'Botのコピーに失敗しました。');
        } finally {
            setDuplicatingBotId(null);
        }
    };

    const filteredBots = bots.filter(bot =>
        bot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (bot.screenName || bot.accountId || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="sm:flex sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Bot管理</h1>
                    <p className="mt-2 text-sm text-gray-700">
                        自動投稿ボットの作成、編集、稼働状況の確認ができます。
                    </p>
                </div>
                <div className="mt-4 sm:ml-4 sm:mt-0 sm:flex-none flex flex-col items-end gap-2">
                    <Link
                        to={isLimitReached ? "#" : "/bots/new"}
                        className={`inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm transition-all ${isLimitReached || isLoading
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-primary hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                            }`}
                        onClick={(e) => (isLimitReached || isLoading) && e.preventDefault()}
                    >
                        <Plus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                        新規Bot作成
                    </Link>
                    {isLimitReached && !isLoading && (
                        <div className="flex items-center gap-1 text-xs text-rose-600 font-medium">
                            <AlertCircle className="h-3 w-3" />
                            プランの作成上限（{maxBots}個）に達しています
                        </div>
                    )}
                </div>
            </div>

            {isLoading ? (
                <div className="py-20 text-center text-gray-500">読み込み中...</div>
            ) : (
                <>
                    {/* Filters and Controls */}
                    <div className="flex items-center gap-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <div className="relative flex-1 max-w-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                                placeholder="Botを検索..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Bot Grid/List */}
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredBots.map((bot) => (
                            <div key={bot.id} className="relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md">
                                <div className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                                                <UserCircle2 className="h-7 w-7" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900">{bot.name}</h3>
                                                <button
                                                    onClick={() => openPreview(bot.screenName || bot.accountId)}
                                                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary transition-colors"
                                                >
                                                    @{bot.screenName || bot.accountId}
                                                    <ExternalLink className="h-3 w-3" />
                                                </button>
                                            </div>
                                        </div>
                                        <StatusBadge status={bot.status} />
                                    </div>

                                    <div className="mt-6 grid grid-cols-2 gap-4">
                                        <div className="rounded-lg bg-gray-50 p-3 text-center">
                                            <div className="text-xs font-medium text-gray-500">累計いいね</div>
                                            <div className="mt-1 text-xl font-bold text-gray-900">{bot.metrics?.likes || 0}</div>
                                        </div>
                                        <div className="rounded-lg bg-gray-50 p-3 text-center">
                                            <div className="text-xs font-medium text-gray-500">累計フォロー</div>
                                            <div className="mt-1 text-xl font-bold text-gray-900">{bot.metrics?.follows || 0}</div>
                                        </div>
                                    </div>

                                    <div className="mt-6 flex items-center justify-between text-xs text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            最終実行: {bot.lastRun || 'なし'}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-auto border-t border-gray-100 bg-gray-50/50 p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <Button
                                            variant={bot.status === 'active' ? "outline" : "default"}
                                            size="sm"
                                            className="flex-1 gap-1"
                                            onClick={() => toggleStatus(bot.id)}
                                        >
                                            {bot.status === 'active' ? (
                                                <><Square className="h-4 w-4" /> 停止</>
                                            ) : (
                                                <><Play className="h-4 w-4" /> 開始</>
                                            )}
                                        </Button>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-9 w-9 text-gray-500 hover:text-blue-600"
                                                onClick={() => {
                                                    setLogBotId(bot.id);
                                                    setLogBotName(bot.name);
                                                    setIsLogViewerOpen(true);
                                                }}
                                                title="実行ログ"
                                            >
                                                <FileText className="h-5 w-5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-9 w-9 text-gray-500 hover:text-green-600"
                                                onClick={() => handleDuplicate(bot.id)}
                                                disabled={duplicatingBotId === bot.id}
                                                title="コピー"
                                            >
                                                {duplicatingBotId === bot.id ? (
                                                    <Loader2 className="h-5 w-5 animate-spin" />
                                                ) : (
                                                    <Copy className="h-5 w-5" />
                                                )}
                                            </Button>
                                            <Link to={`/dashboard/bots/${bot.id}/edit`}>
                                                <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-500 hover:text-primary">
                                                    <Settings className="h-5 w-5" />
                                                </Button>
                                            </Link>
                                            <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-500 hover:text-rose-600">
                                                <Trash2 className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Empty State / New Bot Card */}
                        {!isLimitReached && (
                            <Link
                                to="/dashboard/bots/new"
                                className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 p-12 text-center transition-all hover:border-primary/50 hover:bg-gray-50"
                            >
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                                    <Plus className="h-6 w-6" />
                                </div>
                                <h3 className="mt-4 text-sm font-semibold text-gray-900">新しいBotを作成</h3>
                                <p className="mt-1 text-xs text-gray-500">
                                    Xアカウントを連携して自動化を開始
                                </p>
                            </Link>
                        )}
                    </div>
                </>
            )}

            {/* Account Preview Dialog */}
            <AccountPreview
                account={previewAccount ? { id: previewAccount, name: previewAccount, screenName: previewAccount } : null}
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
            />

            {/* Bot Log Viewer */}
            <BotLogViewer
                botId={logBotId}
                botName={logBotName}
                isOpen={isLogViewerOpen}
                onClose={() => setIsLogViewerOpen(false)}
            />
        </div>
    );
}
