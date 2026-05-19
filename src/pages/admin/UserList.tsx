import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Search, Shield, Loader2, Trash2, X, UserPlus } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { type PlanType, PLAN_DETAILS } from '../../types/plans';
import { API_BASE } from '../../config';
import { authFetch, authJsonFetch } from '../../lib/authFetch';

interface User {
    id: number;
    email: string;
    role: string;
    plan: PlanType;
    name: string | null;
    created_at: string;
    referred_by: number | null;
    referrer_name: string | null;
    referrer_email: string | null;
}

export default function UserList() {
    const [searchTerm, setSearchTerm] = useState('');
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const res = await authFetch(`${API_BASE}/api/admin/users`);
            if (!res.ok) throw new Error('ユーザー情報の取得に失敗しました');
            const data = await res.json();
            setUsers(data);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'エラーが発生しました');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handlePlanChange = async (email: string, newPlan: PlanType) => {
        try {
            const res = await authJsonFetch(`${API_BASE}/api/user/update-plan`, 'POST', { email, plan: newPlan });
            if (!res.ok) throw new Error('プランの更新に失敗しました');
            setUsers(users.map(u => u.email === email ? { ...u, plan: newPlan } : u));
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : 'エラーが発生しました');
        }
    };

    const handleDeleteUser = async (userId: number) => {
        setDeletingId(userId);
        try {
            const res = await authFetch(`${API_BASE}/api/admin/users/${userId}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || '削除に失敗しました');

            setUsers(users.filter(u => u.id !== userId));
            setShowDeleteConfirm(null);
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : 'エラーが発生しました');
        } finally {
            setDeletingId(null);
        }
    };

    const filteredUsers = users.filter(user =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">ユーザー管理</h1>
                    <p className="text-xs text-gray-500 mt-1">全{users.length}件のユーザー</p>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900">ユーザー削除の確認</h3>
                            <button onClick={() => setShowDeleteConfirm(null)} className="text-gray-400 hover:text-gray-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="mb-6">
                            <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-4">
                                <p className="text-sm font-bold text-red-700 mb-1">この操作は取り消せません</p>
                                <p className="text-xs text-red-600">
                                    ユーザーの全データ（Bot設定・投稿履歴・アカウント情報）が完全に削除されます。
                                </p>
                            </div>
                            {(() => {
                                const targetUser = users.find(u => u.id === showDeleteConfirm);
                                return targetUser ? (
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <p className="text-sm font-bold text-gray-900">{targetUser.name || '未設定'}</p>
                                        <p className="text-xs text-gray-500">{targetUser.email}</p>
                                    </div>
                                ) : null;
                            })()}
                        </div>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => setShowDeleteConfirm(null)}
                            >
                                キャンセル
                            </Button>
                            <Button
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                onClick={() => handleDeleteUser(showDeleteConfirm)}
                                isLoading={deletingId === showDeleteConfirm}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                削除する
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="p-3 sm:p-4 border-b border-gray-200 bg-gray-50">
                    <div className="relative w-full">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <Input
                            className="pl-10 w-full"
                            placeholder="名前またはメールアドレスで検索..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {isLoading ? (
                    <div className="p-12 flex flex-col items-center justify-center text-gray-500">
                        <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
                        <p>ユーザー情報を読み込み中...</p>
                    </div>
                ) : error ? (
                    <div className="p-12 text-center text-red-500">
                        {error}
                        <Button variant="outline" className="mt-4" onClick={fetchUsers}>再試行</Button>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            ユーザー
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            権限
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            プラン
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            紹介者
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            登録日
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            操作
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredUsers.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10">
                                                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 font-bold">
                                                            {(user.name || user.email).charAt(0).toUpperCase()}
                                                        </div>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">{user.name || '未設定'}</div>
                                                        <div className="text-sm text-gray-500">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {user.role === 'admin' ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                        <Shield className="w-3 h-3 mr-1" />
                                                        Admin
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                        User
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <select
                                                    value={user.plan}
                                                    onChange={(e) => handlePlanChange(user.email, e.target.value as PlanType)}
                                                    className="block w-full rounded-md border-gray-300 py-1.5 text-xs shadow-sm focus:border-primary focus:ring-primary sm:text-xs bg-gray-50 hover:bg-white transition-colors cursor-pointer"
                                                >
                                                    {Object.keys(PLAN_DETAILS).map((planKey) => (
                                                        <option key={planKey} value={planKey}>
                                                            {PLAN_DETAILS[planKey as PlanType].name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {user.referrer_name || user.referrer_email ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <UserPlus className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                                                        <div>
                                                            <div className="text-xs font-medium text-gray-900">{user.referrer_name || '未設定'}</div>
                                                            <div className="text-[10px] text-gray-400">{user.referrer_email}</div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-300">—</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(user.created_at).toLocaleDateString('ja-JP')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                {user.role !== 'admin' && (
                                                    <button
                                                        onClick={() => setShowDeleteConfirm(user.id)}
                                                        className="text-gray-400 hover:text-red-600 transition-colors"
                                                        title="ユーザーを削除"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card List */}
                        <div className="md:hidden divide-y divide-gray-100">
                            {filteredUsers.length === 0 ? (
                                <div className="p-8 text-center text-gray-500 text-sm">ユーザーが見つかりません</div>
                            ) : (
                                filteredUsers.map((user) => (
                                    <div key={user.id} className="p-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-start gap-3">
                                            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 font-bold shrink-0">
                                                {(user.name || user.email).charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <p className="text-sm font-bold text-gray-900 truncate">{user.name || '未設定'}</p>
                                                    {user.role === 'admin' ? (
                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-800 shrink-0">
                                                            <Shield className="w-2.5 h-2.5 mr-0.5" />
                                                            Admin
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 shrink-0">
                                                            User
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                                {user.referrer_name || user.referrer_email ? (
                                                    <div className="flex items-center gap-1 mt-1">
                                                        <UserPlus className="w-3 h-3 text-violet-400 shrink-0" />
                                                        <span className="text-[10px] text-violet-600 font-medium">
                                                            {user.referrer_name || user.referrer_email} の紹介
                                                        </span>
                                                    </div>
                                                ) : null}
                                                <div className="flex items-center gap-3 mt-2">
                                                    <select
                                                        value={user.plan}
                                                        onChange={(e) => handlePlanChange(user.email, e.target.value as PlanType)}
                                                        className="rounded-md border-gray-300 py-1 px-2 text-xs shadow-sm focus:border-primary focus:ring-primary bg-gray-50 hover:bg-white transition-colors cursor-pointer"
                                                    >
                                                        {Object.keys(PLAN_DETAILS).map((planKey) => (
                                                            <option key={planKey} value={planKey}>
                                                                {PLAN_DETAILS[planKey as PlanType].name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <span className="text-[10px] text-gray-400">
                                                        {new Date(user.created_at).toLocaleDateString('ja-JP')}
                                                    </span>
                                                </div>
                                            </div>
                                            {user.role !== 'admin' && (
                                                <button
                                                    onClick={() => setShowDeleteConfirm(user.id)}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 transition-colors shrink-0 mt-1"
                                                    title="ユーザーを削除"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
