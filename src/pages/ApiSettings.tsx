import { useState } from 'react';
import {
    Key,
    Shield,
    Lock,
    Copy,
    Check,
    Eye,
    EyeOff,
    Save,
    Info,
    ExternalLink,
    RefreshCw,
    AlertCircle
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

interface ApiCredential {
    id: string;
    label: string;
    value: string;
    type: 'password' | 'text';
    isVisible: boolean;
    description: string;
}

const INITIAL_CREDENTIALS: ApiCredential[] = [
    {
        id: 'apiKey',
        label: 'API Key',
        value: 'zR7k9P2m5L1V8q3N4j6X0w9Y',
        type: 'password',
        isVisible: false,
        description: 'X(Twitter) Developer Portalで発行されたConsumer Keyです。'
    },
    {
        id: 'apiSecret',
        label: 'API Key Secret',
        value: 'hB4s8N5x2K9v1W3q6M0r7T8z1P4y5R2d6S9f0G1h3J2',
        type: 'password',
        isVisible: false,
        description: 'API Keyに対応するSecret鍵です。外部に漏洩しないよう注意してください。'
    },
    {
        id: 'accessToken',
        label: 'Access Token',
        value: '1425364758697081920-uN7v8C6x5B4n3M2m1L0k9J8h7G6f5D',
        type: 'password',
        isVisible: false,
        description: '特定のXアカウントとして操作するためのトークンです。'
    },
    {
        id: 'accessTokenSecret',
        label: 'Access Token Secret',
        value: 'vB9n8M7m6L5k4J3h2G1f0D9s8A7p6O5i4U3y2T1r0E',
        type: 'password',
        isVisible: false,
        description: 'Access Tokenに対応するSecret鍵です。'
    },
    {
        id: 'bearerToken',
        label: 'Bearer Token',
        value: 'AAAAAAAAAAAAAAAAAAAAAL3KzAEAAAAA9w7s6d5f4g3h2j1k0l9i8u7y6t5r4e3w2q1',
        type: 'password',
        isVisible: false,
        description: 'App-only認証（ツイートの検索など）に使用されるトークンです。'
    }
];

export default function ApiSettings() {
    const [credentials, setCredentials] = useState<ApiCredential[]>(INITIAL_CREDENTIALS);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const toggleVisibility = (id: string) => {
        setCredentials(prev => prev.map(cred =>
            cred.id === id ? { ...cred, isVisible: !cred.isVisible } : cred
        ));
    };

    const handleCopy = (id: string, value: string) => {
        navigator.clipboard.writeText(value);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleValueChange = (id: string, newValue: string) => {
        setCredentials(prev => prev.map(cred =>
            cred.id === id ? { ...cred, value: newValue } : cred
        ));
    };

    const handleSave = () => {
        setIsSaving(true);
        // Simulate API call
        setTimeout(() => {
            setIsSaving(false);
            alert('API設定を保存しました。');
        }, 1000);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">API設定</h1>
                    <p className="text-sm text-gray-500 mt-1">X（Twitter）APIの認証情報を管理します。Botの動作に必要です。</p>
                </div>
                <div className="flex gap-3">
                    <a
                        href="https://developer.x.com/en/portal/dashboard"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center px-4 py-2 border border-gray-200 bg-white text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Developer Portal
                    </a>
                    <Button onClick={handleSave} disabled={isSaving} className="shadow-lg shadow-primary/20">
                        {isSaving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        設定を保存
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Settings Form */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-200 bg-gray-50/50 flex items-center gap-2">
                            <Lock className="text-gray-400" size={18} />
                            <h3 className="font-semibold text-gray-900">API認証資格情報</h3>
                        </div>
                        <div className="p-8 space-y-8">
                            {credentials.map((cred) => (
                                <div key={cred.id} className="space-y-3 group">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                            {cred.label}
                                            <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono">
                                                {cred.id}
                                            </span>
                                        </label>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => toggleVisibility(cred.id)}
                                                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-all"
                                                title={cred.isVisible ? '非表示' : '表示'}
                                            >
                                                {cred.isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                            <button
                                                onClick={() => handleCopy(cred.id, cred.value)}
                                                className={`p-1.5 rounded-md transition-all ${copiedId === cred.id
                                                    ? 'text-emerald-500 bg-emerald-50'
                                                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                                                    }`}
                                                title="コピー"
                                            >
                                                {copiedId === cred.id ? <Check size={16} /> : <Copy size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <Input
                                            type={cred.isVisible ? 'text' : 'password'}
                                            value={cred.value}
                                            onChange={(e) => handleValueChange(cred.id, e.target.value)}
                                            className="font-mono text-sm pr-20 bg-gray-50/30 focus:bg-white transition-all"
                                            placeholder={`Enter ${cred.label}`}
                                        />
                                        {!cred.isVisible && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1 pointer-events-none">
                                                {[1, 2, 3].map(i => (
                                                    <div key={i} className="h-1 w-1 bg-gray-300 rounded-full" />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 flex items-center gap-1.5 ml-1">
                                        <Info size={12} className="text-gray-400" />
                                        {cred.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* App Usage Notice */}
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 flex gap-4">
                        <div className="p-2 bg-blue-100 rounded-lg h-fit text-blue-600">
                            <Shield size={20} />
                        </div>
                        <div>
                            <h4 className="font-semibold text-blue-900">API利用に関する重要な情報</h4>
                            <p className="text-sm text-blue-800 mt-1 leading-relaxed">
                                X API Freeプランでは月間1,500ポストまでの制限があります。大量のBotを運用する場合や、より高度な機能（メディアアップロード等）を利用する場合は、Basic以上の有料プランの契約を推奨します。
                            </p>
                        </div>
                    </div>
                </div>

                {/* Sidebar Info/Docs */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
                        <h4 className="font-bold text-gray-900 flex items-center gap-2">
                            <AlertCircle size={18} className="text-primary" />
                            設定のポイント
                        </h4>
                        <ul className="space-y-3">
                            <li className="flex gap-3 text-sm text-gray-600">
                                <span className="flex-shrink-0 h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">1</span>
                                <p>Consumer KeyとAccess Tokenの両方が必要です。</p>
                            </li>
                            <li className="flex gap-3 text-sm text-gray-600">
                                <span className="flex-shrink-0 h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">2</span>
                                <p>権限は「Read and Write」以上に設定してください。</p>
                            </li>
                            <li className="flex gap-3 text-sm text-gray-600">
                                <span className="flex-shrink-0 h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">3</span>
                                <p>Bearer Tokenは画像取得などの読み取り専用動作に使用されます。</p>
                            </li>
                        </ul>
                    </div>

                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 text-white space-y-4 shadow-xl">
                        <div className="h-10 w-10 bg-white/10 rounded-lg flex items-center justify-center">
                            <Key size={20} className="text-primary" />
                        </div>
                        <h4 className="font-bold">セキュリティについて</h4>
                        <p className="text-sm text-gray-300 leading-relaxed">
                            これらのキーは非常に強力です。共有したり、公開設定のBotに含めたりしないでください。弊社サーバー側でも情報は高度に暗号化されて保管されます。
                        </p>
                        <Button variant="outline" className="w-full bg-white/5 border-white/10 hover:bg-white/10 text-white">
                            詳しくはこちら
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
