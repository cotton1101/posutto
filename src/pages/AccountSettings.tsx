import React, { useState } from 'react';
import {
    UserPlus,
    Shield,
    Mail,
    CheckCircle2,
    AlertTriangle,
    Eye,
    EyeOff,
    Trash2,
    Edit3,
    ArrowLeft,
    Zap,
    Loader2,
    XCircle,
    User,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import type { Account } from '../types';
import AccountPreview from '../components/AccountPreview';

// Mock Data

import { useAuth } from '../lib/auth';
import { authFetch, authJsonFetch } from '../lib/authFetch';
import { API_BASE } from '../config';

export default function AccountSettings() {
    const { user } = useAuth();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapAccountFromDb = (dbAcc: any): Account => ({
        id: dbAcc.id,
        name: dbAcc.name,
        screenName: dbAcc.screen_name,
        username: dbAcc.username,
        password: dbAcc.password,
        email: dbAcc.email,
        phoneNumber: dbAcc.phone_number,
        status: dbAcc.status,
        avatarUrl: dbAcc.profile_image_url,
        apiKey: dbAcc.api_key,
        apiSecret: dbAcc.api_secret,
        accessToken: dbAcc.access_token,
        accessTokenSecret: dbAcc.access_secret,
        bearerToken: dbAcc.bearer_token
    });

    const fetchAccounts = async () => {
        if (!user?.email) return;
        setIsLoading(true);
        try {
            const res = await authFetch(`${API_BASE}/api/accounts/${user.email}`);
            if (res.ok) {
                const data = await res.json();
                setAccounts(data.map(mapAccountFromDb));
            }
        } catch (error) {
            console.error('Failed to fetch accounts:', error);
        } finally {
            setIsLoading(false);
        }
    };

    React.useEffect(() => {
        fetchAccounts();
    }, [user?.email]);

    // API Test State
    const [testingAccountId, setTestingAccountId] = useState<string | null>(null);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string; username?: string } | null>(null);

    const handleTestConnection = async (account: Account) => {
        setTestingAccountId(account.id);
        setTestResult(null);
        try {
            // Use test-by-id endpoint (reads real keys from DB, not masked values)
            const res = await authJsonFetch(`${API_BASE}/api/accounts/test-by-id`, 'POST', {
                accountId: account.id,
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setTestResult({ success: true, message: `接続成功！ @${data.user.username} (${data.user.name})`, username: data.user.username });
            } else {
                setTestResult({ success: false, message: data.error || '接続に失敗しました。' });
            }
        } catch {
            setTestResult({ success: false, message: 'ネットワークエラーが発生しました。' });
        }
    };

    const handleTestFormKeys = async () => {
        if (!formData.apiKey || !formData.apiSecret || !formData.accessToken || !formData.accessTokenSecret) {
            setTestResult({ success: false, message: '4つのAPIキーをすべて入力してからテストしてください。' });
            setTestingAccountId('form');
            return;
        }
        setTestingAccountId('form');
        setTestResult(null);
        try {
            const res = await authJsonFetch(`${API_BASE}/api/accounts/test`, 'POST', {
                apiKey: formData.apiKey,
                apiSecret: formData.apiSecret,
                accessToken: formData.accessToken,
                accessTokenSecret: formData.accessTokenSecret,
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setTestResult({ success: true, message: `接続成功！ @${data.user.username} (${data.user.name})`, username: data.user.username });
            } else {
                setTestResult({ success: false, message: data.error || '接続に失敗しました。' });
            }
        } catch {
            setTestResult({ success: false, message: 'ネットワークエラーが発生しました。' });
        }
    };

    // Preview State
    const [previewAccount, setPreviewAccount] = useState<Account | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const openPreview = (account: Account) => {
        setPreviewAccount(account);
        setIsPreviewOpen(true);
    };

    // Form State
    const [formData, setFormData] = useState<Partial<Account>>({
        name: '',
        screenName: '',
        username: '',
        password: '',
        email: '',
        phoneNumber: '',
        status: 'active',
        apiKey: '',
        apiSecret: '',
        accessToken: '',
        accessTokenSecret: '',
        bearerToken: ''
    });

    const MASK = '••••••••';
    const handleEdit = (account: Account) => {
        setEditingAccount(account);
        // Clear masked values so user sees empty fields instead of mask characters
        setFormData({
            ...account,
            password: account.password === MASK ? '' : (account.password || ''),
            apiKey: account.apiKey === MASK ? '' : (account.apiKey || ''),
            apiSecret: account.apiSecret === MASK ? '' : (account.apiSecret || ''),
            accessToken: account.accessToken === MASK ? '' : (account.accessToken || ''),
            accessTokenSecret: account.accessTokenSecret === MASK ? '' : (account.accessTokenSecret || ''),
            bearerToken: account.bearerToken === MASK ? '' : (account.bearerToken || ''),
        });
        setIsAdding(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('このアカウントを削除してもよろしいですか？')) {
            try {
                const res = await authFetch(`${API_BASE}/api/accounts/${id}`, { method: 'DELETE' });
                if (res.ok) {
                    setAccounts(accounts.filter(a => a.id !== id));
                }
            } catch {
                alert('削除に失敗しました');
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await authJsonFetch(`${API_BASE}/api/accounts/save`, 'POST', {
                    email: user?.email,
                    account: editingAccount ? { ...formData, id: editingAccount.id } : formData
            });

            if (res.ok) {
                fetchAccounts();
                setIsAdding(false);
                setEditingAccount(null);
                setFormData({
                    name: '',
                    screenName: '',
                    username: '',
                    password: '',
                    email: '',
                    phoneNumber: '',
                    status: 'active',
                    apiKey: '',
                    apiSecret: '',
                    accessToken: '',
                    accessTokenSecret: '',
                    bearerToken: ''
                });
            } else {
                const data = await res.json();
                alert(data.error || '保存に失敗しました');
            }
        } catch {
            alert('通信エラーが発生しました');
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">アカウント設定</h1>
                    <p className="text-sm text-gray-500 mt-1">X（Twitter）アカウントのログイン情報を管理します。</p>
                </div>
                {!isAdding && (
                    <Button onClick={() => setIsAdding(true)} className="shadow-lg shadow-primary/20">
                        <UserPlus className="mr-2 h-4 w-4" />
                        アカウントを追加
                    </Button>
                )}
            </div>

            {isAdding ? (
                /* Account Form */
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => { setIsAdding(false); setEditingAccount(null); }}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <ArrowLeft size={18} />
                            </button>
                            <h3 className="font-semibold text-gray-900">
                                {editingAccount ? 'アカウントを編集' : '新規アカウント登録'}
                            </h3>
                        </div>
                    </div>
                    <form onSubmit={handleSubmit} className="p-8 space-y-8 max-w-4xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">表示名</label>
                                <Input
                                    placeholder="例: Sora Official"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">スクリーン名 (@無)</label>
                                <Input
                                    placeholder="例: sorabcjanne1"
                                    value={formData.screenName}
                                    onChange={e => setFormData({ ...formData, screenName: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">ログインユーザー名</label>
                                <Input
                                    placeholder="ユーザー名または電話番号"
                                    value={formData.username}
                                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">パスワード</label>
                                <div className="relative">
                                    <Input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder={editingAccount ? '変更する場合のみ入力' : 'パスワード'}
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        required={!editingAccount}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* API Settings Section */}
                        <div className="pt-8 border-t border-gray-100">
                            <h4 className="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <Shield className="text-primary" size={16} />
                                API設定 (X Developer Portal)
                            </h4>
                            {editingAccount && (editingAccount.apiKey === MASK || editingAccount.accessToken === MASK) && (
                                <p className="mb-4 text-xs text-blue-600 bg-blue-50 p-3 rounded-lg border border-blue-100 flex items-center gap-2">
                                    <CheckCircle2 size={14} className="shrink-0" />
                                    APIキーは設定済みです。変更する場合のみ新しい値を入力してください。空欄のまま保存すると既存の設定が維持されます。
                                </p>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">API Key</label>
                                    <Input
                                        type="password"
                                        placeholder={editingAccount ? '変更する場合のみ入力' : 'API Key'}
                                        value={formData.apiKey || ''}
                                        onChange={e => setFormData({ ...formData, apiKey: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">API Key Secret</label>
                                    <Input
                                        type="password"
                                        placeholder={editingAccount ? '変更する場合のみ入力' : 'API Key Secret'}
                                        value={formData.apiSecret || ''}
                                        onChange={e => setFormData({ ...formData, apiSecret: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Access Token</label>
                                    <Input
                                        type="password"
                                        placeholder={editingAccount ? '変更する場合のみ入力' : 'Access Token'}
                                        value={formData.accessToken || ''}
                                        onChange={e => setFormData({ ...formData, accessToken: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Access Token Secret</label>
                                    <Input
                                        type="password"
                                        placeholder={editingAccount ? '変更する場合のみ入力' : 'Access Token Secret'}
                                        value={formData.accessTokenSecret || ''}
                                        onChange={e => setFormData({ ...formData, accessTokenSecret: e.target.value })}
                                    />
                                </div>
                                <div className="col-span-1 md:col-span-2 space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Bearer Token</label>
                                    <Input
                                        type="password"
                                        placeholder={editingAccount ? '変更する場合のみ入力' : 'Bearer Token'}
                                        value={formData.bearerToken || ''}
                                        onChange={e => setFormData({ ...formData, bearerToken: e.target.value })}
                                    />
                                </div>
                            </div>
                            <p className="mt-4 text-[10px] text-gray-500 bg-gray-50/50 p-4 rounded-lg border border-gray-100 italic leading-relaxed">
                                ※ このアカウントをBot運用に使用する場合のみ必須です。Developer Portalで対象のアカウントを連携し、キーを発行してください。
                            </p>

                            {/* API Test Button */}
                            <div className="mt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleTestFormKeys}
                                    disabled={testingAccountId === 'form' && testResult === null}
                                    className="w-full sm:w-auto"
                                >
                                    {testingAccountId === 'form' && testResult === null ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />テスト中...</>
                                    ) : (
                                        <><Zap className="mr-2 h-4 w-4" />API接続テスト</>
                                    )}
                                </Button>
                                {testingAccountId === 'form' && testResult && (
                                    <div className={`mt-3 p-3 rounded-lg text-sm flex items-start gap-2 ${
                                        testResult.success
                                            ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                                            : 'bg-rose-50 border border-rose-200 text-rose-700'
                                    }`}>
                                        {testResult.success ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <XCircle size={16} className="mt-0.5 shrink-0" />}
                                        <span>{testResult.message}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
                            <Button type="button" variant="outline" onClick={() => { setIsAdding(false); setEditingAccount(null); setTestResult(null); setTestingAccountId(null); }}>
                                キャンセル
                            </Button>
                            <Button type="submit">
                                {editingAccount ? '更新する' : '保存する'}
                            </Button>
                        </div>
                    </form>
                </div>
            ) : (
                /* Account List & Notice */
                <div className="space-y-8">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4">アカウント</th>
                                        <th className="px-6 py-4">ログイン情報</th>
                                        <th className="px-6 py-4">ステータス</th>
                                        <th className="px-6 py-4 text-right">操作</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                                                読み込み中...
                                            </td>
                                        </tr>
                                    ) : accounts.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-gray-400 italic">
                                                登録されているアカウントはありません。
                                            </td>
                                        </tr>
                                    ) : (
                                        accounts.map((account) => (
                                            <tr key={account.id} className="hover:bg-gray-50/50 transition-colors group">
                                                <td className="px-6 py-5">
                                                    <button
                                                        onClick={() => openPreview(account)}
                                                        className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity"
                                                    >
                                                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-500 border border-gray-200">
                                                            <span className="text-sm font-bold">{account.name.charAt(0)}</span>
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-900 group-hover:text-primary transition-colors">{account.name}</p>
                                                            <p className="text-xs text-gray-500">@{account.screenName}</p>
                                                        </div>
                                                    </button>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2 text-gray-600">
                                                            <Shield size={14} className="text-gray-400" />
                                                            <span className="text-xs">{account.username}</span>
                                                        </div>
                                                        {account.email && (
                                                            <div className="flex items-center gap-2 text-gray-600">
                                                                <Mail size={14} className="text-gray-400" />
                                                                <span className="text-xs">{account.email}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    {account.status === 'active' ? (
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                            <CheckCircle2 size={10} className="mr-1" />
                                                            正常
                                                        </span>
                                                    ) : account.status === 'locked' ? (
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100">
                                                            <AlertTriangle size={10} className="mr-1" />
                                                            制限中
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-100">
                                                            <AlertTriangle size={10} className="mr-1" />
                                                            停止中
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button
                                                            onClick={() => openPreview(account)}
                                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                            title="プロフィール表示"
                                                        >
                                                            <User size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleTestConnection(account)}
                                                            disabled={testingAccountId === account.id && testResult === null}
                                                            className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                                                            title="API接続テスト"
                                                        >
                                                            {testingAccountId === account.id && testResult === null
                                                                ? <Loader2 size={16} className="animate-spin" />
                                                                : <Zap size={16} />
                                                            }
                                                        </button>
                                                        <button
                                                            onClick={() => handleEdit(account)}
                                                            className="p-2 text-gray-400 hover:text-primary hover:bg-gray-100 rounded-lg transition-all"
                                                            title="編集"
                                                        >
                                                            <Edit3 size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(account.id)}
                                                            className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                                            title="削除"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                    {testingAccountId === account.id && testResult && (
                                                        <div className={`mt-2 p-2 rounded-lg text-xs text-left flex items-start gap-1.5 ${
                                                            testResult.success
                                                                ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                                                                : 'bg-rose-50 border border-rose-200 text-rose-700'
                                                        }`}>
                                                            {testResult.success ? <CheckCircle2 size={12} className="mt-0.5 shrink-0" /> : <XCircle size={12} className="mt-0.5 shrink-0" />}
                                                            <span>{testResult.message}</span>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-6 flex gap-4">
                        <div className="p-2 bg-amber-100 rounded-lg h-fit text-amber-600">
                            <Shield size={20} />
                        </div>
                        <div>
                            <h4 className="font-semibold text-amber-900">セキュリティに関するご注意</h4>
                            <p className="text-sm text-amber-800 mt-1 leading-relaxed">
                                保存されたパスワードやAPIキーは高度に管理されますが、共用PCでの利用には十分ご注意ください。
                                2要素認証（2FA）が有効なアカウントの場合、Botの動作に別途設定が必要になる場合があります。
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <AccountPreview
                account={previewAccount}
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
            />
        </div>
    );
}
