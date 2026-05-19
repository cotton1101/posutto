import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Plus, Trash2, Eye, EyeOff, AlertCircle, Pencil } from 'lucide-react';
import { API_BASE } from '../../config';
import { authFetch } from '../../lib/authFetch';
import { cn } from '../../lib/utils';

interface Announcement {
    id: number;
    title: string;
    content: string;
    type: 'info' | 'warning' | 'critical';
    is_active: number;
    created_at: string;
}

export default function AnnouncementList() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [type, setType] = useState<'info' | 'warning' | 'critical'>('info');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        setIsLoading(true);
        try {
            const res = await authFetch(`${API_BASE}/api/admin/announcements`);
            if (!res.ok) throw new Error('お知らせの取得に失敗しました');
            const data = await res.json();
            setAnnouncements(data);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'エラーが発生しました');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            const url = editingId
                ? `${API_BASE}/api/admin/announcements/${editingId}`
                : `${API_BASE}/api/admin/announcements`;

            const res = await authFetch(url, {
                method: editingId ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, content, type }),
            });

            if (!res.ok) throw new Error(editingId ? 'お知らせの更新に失敗しました' : 'お知らせの作成に失敗しました');

            setTitle('');
            setContent('');
            setType('info');
            setShowForm(false);
            setEditingId(null);
            fetchAnnouncements();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'エラーが発生しました');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (announcement: Announcement) => {
        setTitle(announcement.title);
        setContent(announcement.content);
        setType(announcement.type);
        setEditingId(announcement.id);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancel = () => {
        setTitle('');
        setContent('');
        setType('info');
        setShowForm(false);
        setEditingId(null);
    };

    const toggleStatus = async (id: number) => {
        try {
            const res = await authFetch(`${API_BASE}/api/admin/announcements/${id}/toggle`, {
                method: 'PUT',
            });
            if (!res.ok) throw new Error('ステータスの更新に失敗しました');
            fetchAnnouncements();
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : 'エラーが発生しました');
        }
    };

    const deleteAnnouncement = async (id: number) => {
        if (!confirm('本当に削除しますか？')) return;
        try {
            const res = await authFetch(`${API_BASE}/api/admin/announcements/${id}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('削除に失敗しました');
            fetchAnnouncements();
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : 'エラーが発生しました');
        }
    };

    return (
        <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">お知らせ管理</h1>
                <Button className="w-full sm:w-auto" onClick={() => showForm ? handleCancel() : setShowForm(true)}>
                    {showForm ? 'キャンセル' : <><Plus className="w-4 h-4 mr-2" /> 新規作成</>}
                </Button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-3 rounded-lg flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2 shrink-0" />
                    <span className="text-sm">{error}</span>
                </div>
            )}

            {showForm && (
                <div className="bg-white p-4 sm:p-6 shadow rounded-lg border border-gray-200 animate-in fade-in slide-in-from-top-4">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">タイトル</label>
                            <Input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                placeholder="例: システムメンテナンスのお知らせ"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">内容</label>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                required
                                rows={3}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                placeholder="お知らせの詳細内容を入力してください..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">タイプ</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value as 'info' | 'warning' | 'critical')}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            >
                                <option value="info">情報 (Info)</option>
                                <option value="warning">注意 (Warning)</option>
                                <option value="critical">緊急 (Critical)</option>
                            </select>
                        </div>
                        <div className="flex justify-end">
                            <Button type="submit" className="w-full sm:w-auto" isLoading={isSubmitting}>
                                {editingId ? '更新する' : '作成する'}
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white shadow rounded-lg overflow-hidden">
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">タイプ</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">タイトル</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状態</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">作成日</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-gray-500">読み込み中...</td>
                                </tr>
                            ) : announcements.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-gray-500">お知らせはありません</td>
                                </tr>
                            ) : (
                                announcements.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={cn(
                                                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                                                {
                                                    'bg-blue-100 text-blue-800': item.type === 'info',
                                                    'bg-amber-100 text-amber-800': item.type === 'warning',
                                                    'bg-red-100 text-red-800': item.type === 'critical',
                                                }
                                            )}>
                                                {item.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">{item.title}</div>
                                            <div className="text-sm text-gray-500 truncate max-w-xs">{item.content}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button
                                                onClick={() => toggleStatus(item.id)}
                                                className={cn(
                                                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors",
                                                    item.is_active
                                                        ? "bg-green-100 text-green-800 hover:bg-green-200"
                                                        : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                                                )}
                                            >
                                                {item.is_active ? <><Eye className="w-3 h-3 mr-1" /> 公開中</> : <><EyeOff className="w-3 h-3 mr-1" /> 非公開</>}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(item.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleEdit(item)}
                                                className="text-primary hover:text-primary/80 transition-colors"
                                            >
                                                編集
                                            </button>
                                            <button
                                                onClick={() => deleteAnnouncement(item.id)}
                                                className="text-gray-400 hover:text-red-600 transition-colors ml-4"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card List */}
                <div className="md:hidden divide-y divide-gray-100">
                    {isLoading ? (
                        <div className="p-8 text-center text-gray-500 text-sm">読み込み中...</div>
                    ) : announcements.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 text-sm">お知らせはありません</div>
                    ) : (
                        announcements.map((item) => (
                            <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-start justify-between gap-3 mb-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className={cn(
                                            "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0",
                                            {
                                                'bg-blue-100 text-blue-800': item.type === 'info',
                                                'bg-amber-100 text-amber-800': item.type === 'warning',
                                                'bg-red-100 text-red-800': item.type === 'critical',
                                            }
                                        )}>
                                            {item.type}
                                        </span>
                                        <button
                                            onClick={() => toggleStatus(item.id)}
                                            className={cn(
                                                "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium transition-colors shrink-0",
                                                item.is_active
                                                    ? "bg-green-100 text-green-800"
                                                    : "bg-gray-100 text-gray-600"
                                            )}
                                        >
                                            {item.is_active ? <><Eye className="w-3 h-3 mr-0.5" /> 公開</> : <><EyeOff className="w-3 h-3 mr-0.5" /> 非公開</>}
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button
                                            onClick={() => handleEdit(item)}
                                            className="p-1.5 text-gray-400 hover:text-primary rounded transition-colors"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => deleteAnnouncement(item.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-600 rounded transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-sm font-bold text-gray-900 mb-1">{item.title}</p>
                                <p className="text-xs text-gray-500 line-clamp-2 mb-2">{item.content}</p>
                                <p className="text-[10px] text-gray-400">
                                    {new Date(item.created_at).toLocaleDateString('ja-JP')}
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
