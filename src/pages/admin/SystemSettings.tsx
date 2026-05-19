import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Save, Loader2, AlertCircle, CheckCircle2, ShieldCheck, Mail, Globe } from 'lucide-react';
import { API_BASE } from '../../config';
import { authFetch, authJsonFetch } from '../../lib/authFetch';

interface SystemSettingsMap {
    [key: string]: string;
}

export default function SystemSettings() {
    const [settings, setSettings] = useState<SystemSettingsMap>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setIsLoading(true);
        try {
            const res = await authFetch(`${API_BASE}/api/admin/settings`);
            if (!res.ok) throw new Error('設定の取得に失敗しました');
            const data = await res.json();
            setSettings(data);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'エラーが発生しました');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError(null);
        setSuccess(false);

        try {
            const res = await authJsonFetch(`${API_BASE}/api/admin/settings`, 'POST', { settings });

            if (!res.ok) throw new Error('設定の保存に失敗しました');
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'エラーが発生しました');
        } finally {
            setIsSaving(false);
        }
    };

    const handleChange = (key: string, value: string) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-gray-500 font-medium">設定を読み込み中...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl space-y-6 sm:space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">システム設定</h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">アプリケーション全体の動作やAPI連携の設定を行います。</p>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl flex items-center shadow-sm">
                    <AlertCircle className="h-5 w-5 mr-3 shrink-0" />
                    <span className="font-medium text-sm">{error}</span>
                </div>
            )}

            {success && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl flex items-center shadow-sm">
                    <CheckCircle2 className="h-5 w-5 mr-3 shrink-0" />
                    <span className="font-medium text-sm">システム設定を保存しました。</span>
                </div>
            )}

            <form onSubmit={handleSave} className="space-y-6 sm:space-y-8">
                {/* X (Twitter) API Settings */}
                <div className="bg-white rounded-2xl sm:rounded-[2rem] border border-gray-100 shadow-xl overflow-hidden">
                    <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-gray-50 flex items-center gap-3 bg-gray-50/50">
                        <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-sky-50 text-sky-500 flex items-center justify-center shrink-0">
                            <ShieldCheck size={18} className="sm:hidden" />
                            <ShieldCheck size={20} className="hidden sm:block" />
                        </div>
                        <h2 className="text-base sm:text-lg font-bold text-gray-900">X (Twitter) API設定</h2>
                    </div>
                    <div className="p-4 sm:p-8 space-y-4 sm:space-y-6">
                        <p className="text-xs sm:text-sm text-gray-500 bg-blue-50/50 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-blue-100 font-medium">
                            ここで設定するAPIキーは、システム全体のシャドウバンチェックや、個別にAPIキーを持っていないユーザーの動作に使用されます。
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] sm:text-xs font-bold text-gray-600 uppercase tracking-wider ml-1">Consumer Key (API Key)</label>
                                <Input
                                    className="rounded-lg sm:rounded-xl border-gray-200"
                                    value={settings['X_API_KEY'] || ''}
                                    onChange={e => handleChange('X_API_KEY', e.target.value)}
                                    placeholder="Enter Consumer Key"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] sm:text-xs font-bold text-gray-600 uppercase tracking-wider ml-1">Consumer Secret (API Secret)</label>
                                <Input
                                    type="password"
                                    className="rounded-lg sm:rounded-xl border-gray-200"
                                    value={settings['X_API_SECRET'] || ''}
                                    onChange={e => handleChange('X_API_SECRET', e.target.value)}
                                    placeholder="Enter Consumer Secret"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] sm:text-xs font-bold text-gray-600 uppercase tracking-wider ml-1">Access Token</label>
                                <Input
                                    className="rounded-lg sm:rounded-xl border-gray-200"
                                    value={settings['X_ACCESS_TOKEN'] || ''}
                                    onChange={e => handleChange('X_ACCESS_TOKEN', e.target.value)}
                                    placeholder="Enter Access Token"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] sm:text-xs font-bold text-gray-600 uppercase tracking-wider ml-1">Access Token Secret</label>
                                <Input
                                    type="password"
                                    className="rounded-lg sm:rounded-xl border-gray-200"
                                    value={settings['X_ACCESS_TOKEN_SECRET'] || ''}
                                    onChange={e => handleChange('X_ACCESS_TOKEN_SECRET', e.target.value)}
                                    placeholder="Enter Access Token Secret"
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-[10px] sm:text-xs font-bold text-gray-600 uppercase tracking-wider ml-1">Bearer Token</label>
                                <Input
                                    className="rounded-lg sm:rounded-xl border-gray-200"
                                    value={settings['X_BEARER_TOKEN'] || ''}
                                    onChange={e => handleChange('X_BEARER_TOKEN', e.target.value)}
                                    placeholder="Enter Bearer Token"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Email (SMTP) Settings */}
                <div className="bg-white rounded-2xl sm:rounded-[2rem] border border-gray-100 shadow-xl overflow-hidden">
                    <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-gray-50 flex items-center gap-3 bg-gray-50/50">
                        <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center shrink-0">
                            <Mail size={18} className="sm:hidden" />
                            <Mail size={20} className="hidden sm:block" />
                        </div>
                        <h2 className="text-base sm:text-lg font-bold text-gray-900">メール配送設定 (SMTP)</h2>
                    </div>
                    <div className="p-4 sm:p-8 space-y-4 sm:space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] sm:text-xs font-bold text-gray-600 uppercase tracking-wider ml-1">送信元メール</label>
                                <Input
                                    className="rounded-lg sm:rounded-xl border-gray-200"
                                    value={settings['SMTP_FROM'] || ''}
                                    onChange={e => handleChange('SMTP_FROM', e.target.value)}
                                    placeholder="E.g., info@sns-tool.online"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] sm:text-xs font-bold text-gray-600 uppercase tracking-wider ml-1">SMTPホスト</label>
                                <Input
                                    className="rounded-lg sm:rounded-xl border-gray-200"
                                    value={settings['SMTP_HOST'] || ''}
                                    onChange={e => handleChange('SMTP_HOST', e.target.value)}
                                    placeholder="E.g., sv16817.xserver.jp"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* General System Settings */}
                <div className="bg-white rounded-2xl sm:rounded-[2rem] border border-gray-100 shadow-xl overflow-hidden">
                    <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-gray-50 flex items-center gap-3 bg-gray-50/50">
                        <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
                            <Globe size={18} className="sm:hidden" />
                            <Globe size={20} className="hidden sm:block" />
                        </div>
                        <h2 className="text-base sm:text-lg font-bold text-gray-900">システム基本設定</h2>
                    </div>
                    <div className="p-4 sm:p-8 space-y-4 sm:space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] sm:text-xs font-bold text-gray-600 uppercase tracking-wider ml-1">メンテナンスモード</label>
                            <select
                                className="w-full h-11 px-4 rounded-lg sm:rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                                value={settings['MAINTENANCE_MODE'] || 'false'}
                                onChange={e => handleChange('MAINTENANCE_MODE', e.target.value)}
                            >
                                <option value="false">OFF (通常稼働)</option>
                                <option value="true">ON (メンテナンス中)</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-2 sm:pt-4 pb-6 sm:pb-10">
                    <Button
                        type="submit"
                        className="w-full sm:w-auto h-12 sm:h-14 px-6 sm:px-10 rounded-xl sm:rounded-2xl shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 transition-all font-bold text-sm sm:text-base"
                        isLoading={isSaving}
                    >
                        {!isSaving && <Save className="mr-2 h-5 w-5" />}
                        設定を保存する
                    </Button>
                </div>
            </form>
        </div>
    );
}
