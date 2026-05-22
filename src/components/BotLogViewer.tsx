import { useState, useEffect, useCallback } from 'react';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle, RefreshCw } from 'lucide-react';
import { authFetch } from '../lib/authFetch';
import { API_BASE } from '../config';

interface BotLog {
    id: number;
    bot_id: string;
    log_type: 'info' | 'success' | 'error' | 'warning';
    message: string;
    created_at: string;
}

interface BotLogViewerProps {
    botId: string | null;
    botName: string;
    isOpen: boolean;
    onClose: () => void;
}

const LOG_TYPE_CONFIG = {
    info: {
        icon: Info,
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-700',
        iconColor: 'text-blue-500',
        badge: 'bg-blue-100 text-blue-700',
        label: 'INFO',
    },
    success: {
        icon: CheckCircle,
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-700',
        iconColor: 'text-green-500',
        badge: 'bg-green-100 text-green-700',
        label: 'OK',
    },
    warning: {
        icon: AlertTriangle,
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        text: 'text-yellow-700',
        iconColor: 'text-yellow-500',
        badge: 'bg-yellow-100 text-yellow-700',
        label: 'WARN',
    },
    error: {
        icon: AlertCircle,
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-700',
        iconColor: 'text-red-500',
        badge: 'bg-red-100 text-red-700',
        label: 'ERROR',
    },
};

const FILTER_OPTIONS = [
    { key: 'all', label: 'すべて' },
    { key: 'info', label: 'Info' },
    { key: 'success', label: '成功' },
    { key: 'warning', label: '警告' },
    { key: 'error', label: 'エラー' },
] as const;

function formatTimestamp(dateStr: string): string {
    const date = new Date(dateStr + (dateStr.includes('Z') || dateStr.includes('+') ? '' : 'Z'));
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${month}/${day} ${hours}:${minutes}`;
}

export default function BotLogViewer({ botId, botName, isOpen, onClose }: BotLogViewerProps) {
    const [logs, setLogs] = useState<BotLog[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [filterType, setFilterType] = useState<string>('all');

    const fetchLogs = useCallback(async () => {
        if (!botId) return;
        setIsLoading(true);
        try {
            const typeParam = filterType !== 'all' ? `&type=${filterType}` : '';
            const response = await authFetch(`${API_BASE}/api/bot/${botId}/logs?limit=200${typeParam}`);
            if (response.ok) {
                const data = await response.json();
                setLogs(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error('Failed to fetch logs:', error);
        } finally {
            setIsLoading(false);
        }
    }, [botId, filterType]);

    useEffect(() => {
        if (!isOpen || !botId) return;
        fetchLogs();
    }, [isOpen, botId, fetchLogs]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-2xl max-h-[80vh] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gray-50">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">実行ログ</h3>
                        <p className="text-sm text-gray-500 mt-0.5">{botName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={fetchLogs}
                            disabled={isLoading}
                            className="p-2 rounded-lg text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors disabled:opacity-50"
                            title="更新"
                        >
                            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Filter */}
                <div className="px-5 py-3 border-b border-gray-100 flex gap-2 flex-wrap">
                    {FILTER_OPTIONS.map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => setFilterType(key)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                filterType === key
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* Log List */}
                <div className="flex-1 overflow-y-auto px-5 py-3">
                    {isLoading && logs.length === 0 ? (
                        <div className="flex items-center justify-center py-12 text-gray-400">
                            <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                            読み込み中...
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>ログがまだありません</p>
                            <p className="text-xs mt-1">Botが実行されるとログが表示されます</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {logs.map((log) => {
                                const config = LOG_TYPE_CONFIG[log.log_type] || LOG_TYPE_CONFIG.info;
                                const Icon = config.icon;
                                return (
                                    <div
                                        key={log.id}
                                        className={`flex items-start gap-3 p-3 rounded-lg border ${config.bg} ${config.border}`}
                                    >
                                        <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${config.iconColor}`} />
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm ${config.text} break-all`}>{log.message}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs text-gray-400">
                                                    {formatTimestamp(log.created_at)}
                                                </span>
                                                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${config.badge}`}>
                                                    {config.label}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {logs.length > 0 && (
                    <div className="px-5 py-2 border-t border-gray-100 bg-gray-50 text-xs text-gray-400 text-center">
                        {logs.length}件のログを表示中（最大30日分保存）
                    </div>
                )}
            </div>
        </div>
    );
}
