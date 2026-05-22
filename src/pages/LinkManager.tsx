import { useState, useEffect, useCallback } from 'react';
import {
    Plus,
    Link as LinkIcon,
    ExternalLink,
    Copy,
    MoreVertical,
    TrendingUp,
    MousePointer2,
    CheckCircle2,
    AlertCircle,
    Trash2
} from 'lucide-react';
import { Button } from '../components/ui/Button';

import { useAuth } from '../lib/auth';
import { authFetch, authJsonFetch } from '../lib/authFetch';
import { API_BASE } from '../config';

interface Link {
    id: string;
    name: string;
    url: string;
    type: 'DMM' | 'MGS' | 'Custom';
    activeBots: string[];
    clicks: number;
    status: 'active' | 'inactive';
}

export default function LinkManager() {
    const { user } = useAuth();
    const [links, setLinks] = useState<Link[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchLinks = useCallback(async () => {
        if (!user?.email) return;
        setIsLoading(true);
        try {
            const res = await authFetch(`${API_BASE}/api/links/${user.email}`);
            if (res.ok) {
                setLinks(await res.json());
            }
        } catch (error) {
            console.error('Failed to fetch links:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user?.email]);

    useEffect(() => {
        fetchLinks();
    }, [fetchLinks]);

    const handleDelete = async (id: string) => {
        if (confirm('このリンクを削除してもよろしいですか？')) {
            try {
                const res = await authFetch(`${API_BASE}/api/links/${id}`, { method: 'DELETE' });
                if (res.ok) {
                    setLinks(links.filter(l => l.id !== id));
                }
            } catch {
                alert('削除に失敗しました');
            }
        }
    };

    // Note: In a complete implementation, we'd have a Modal for creating/editing links
    const handleAddLink = async () => {
        const name = prompt('リンク名称');
        const url = prompt('URL');
        const type = prompt('種類 (DMM/MGS/Custom)', 'Custom');

        if (!name || !url) return;

        try {
            const res = await authJsonFetch(`${API_BASE}/api/links/save`, 'POST', {
                    email: user?.email,
                    link: { name, url, type }
            });
            if (res.ok) {
                fetchLinks();
            }
        } catch {
            alert('保存に失敗しました');
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mb-4" />
                <p className="text-gray-500 font-medium">リンクデータを読み込み中...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">リンクマネージャー</h1>
                    <p className="text-sm text-gray-500 mt-1">アフィリエイトリンクの一覧管理とパフォーマンス計測を行います。</p>
                </div>
                <Button onClick={handleAddLink} className="shadow-lg shadow-primary/20">
                    <Plus className="mr-2 h-4 w-4" />
                    新規リンク登録
                </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 rounded-full bg-primary/10 text-primary">
                        <LinkIcon size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">登録済みリンク</p>
                        <p className="text-2xl font-bold text-gray-900">{links.length}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 rounded-full bg-emerald-100 text-emerald-600">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">累計総クリック</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {links.reduce((sum, l) => sum + (l.clicks || 0), 0).toLocaleString()}
                        </p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                        <MousePointer2 size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">アクティブBot</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {new Set(links.flatMap(l => l.activeBots)).size}
                        </p>
                    </div>
                </div>
            </div>

            {/* Link List */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">リンク一覧</h3>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">表示順:</span>
                        <select className="text-xs border-none bg-transparent font-medium text-gray-700 focus:ring-0 cursor-pointer">
                            <option>クリック数（多い順）</option>
                            <option>登録日（新しい順）</option>
                        </select>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3">リンク名称 / URL</th>
                                <th className="px-6 py-3">種類</th>
                                <th className="px-6 py-3">使用中Bot</th>
                                <th className="px-6 py-3">累計クリック</th>
                                <th className="px-6 py-3">ステータス</th>
                                <th className="px-6 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {links.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500">登録されているリンクはありません</td>
                                </tr>
                            ) : (
                                links.map((link) => (
                                    <tr key={link.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-semibold text-gray-900">{link.name}</span>
                                                <div className="flex items-center gap-2 text-xs text-gray-400 max-w-[200px] truncate">
                                                    <span className="truncate">{link.url}</span>
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(link.url);
                                                        }}
                                                        className="hover:text-primary transition-colors"
                                                    >
                                                        <Copy size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${link.type === 'DMM' ? 'bg-indigo-100 text-indigo-700' :
                                                link.type === 'MGS' ? 'bg-orange-100 text-orange-700' :
                                                    'bg-gray-100 text-gray-700'
                                                }`}>
                                                {link.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {link.activeBots.length > 0 ? (
                                                    link.activeBots.map(bot => (
                                                        <span key={bot} className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full border border-blue-100">
                                                            {bot}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-xs text-gray-300">未使用</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-gray-900">
                                            {(link.clicks || 0).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            {link.status === 'active' ? (
                                                <span className="flex items-center text-xs text-emerald-600 font-medium">
                                                    <CheckCircle2 size={14} className="mr-1" />
                                                    稼働中
                                                </span>
                                            ) : (
                                                <span className="flex items-center text-xs text-gray-400 font-medium">
                                                    <AlertCircle size={14} className="mr-1" />
                                                    停止
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button className="p-2 text-gray-400 hover:text-primary hover:bg-gray-100 rounded-lg transition-all">
                                                    <ExternalLink size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(link.id)}
                                                    className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                                                    <MoreVertical size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
