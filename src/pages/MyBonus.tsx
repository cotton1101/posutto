import { useState, useEffect } from 'react';
import { Gift, Download, FileText, ExternalLink, Inbox } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { API_BASE } from '../config';
import { authFetch } from '../lib/authFetch';

interface BonusData {
    referrerName: string;
    referralCode: string;
    title: string;
    description: string;
    fileName: string | null;
    hasFile: boolean;
}

export default function MyBonus() {
    const [bonus, setBonus] = useState<BonusData | null>(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<string | null>(null);

    useEffect(() => {
        fetchMyBonus();
    }, []);

    const fetchMyBonus = async () => {
        try {
            const res = await authFetch(`${API_BASE}/api/referral/my-bonus`);
            if (res.ok) {
                const data = await res.json();
                if (data.bonus) {
                    setBonus(data.bonus);
                } else {
                    setMessage(data.message || '特典はありません。');
                }
            } else {
                setMessage('特典の取得に失敗しました。');
            }
        } catch {
            setMessage('読み込みに失敗しました。');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        if (bonus?.referralCode) {
            window.open(`${API_BASE}/api/referral/bonus/download/${bonus.referralCode}`, '_blank');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7c3aed]" />
            </div>
        );
    }

    // No bonus available
    if (!bonus) {
        return (
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-purple-100 rounded-xl">
                        <Gift className="h-6 w-6 text-[#7c3aed]" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">紹介特典</h1>
                        <p className="text-sm text-gray-500">紹介者からの特典コンテンツ</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
                    <Inbox className="h-16 w-16 text-gray-200 mx-auto mb-4" />
                    <h2 className="text-lg font-semibold text-gray-700 mb-2">特典はありません</h2>
                    <p className="text-sm text-gray-500 leading-relaxed">
                        {message}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-100 rounded-xl">
                    <Gift className="h-6 w-6 text-[#7c3aed]" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-gray-900">紹介特典</h1>
                    <p className="text-sm text-gray-500">{bonus.referrerName}からの特典コンテンツ</p>
                </div>
            </div>

            {/* Bonus Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Top banner */}
                <div className="bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] px-6 py-5">
                    <div className="flex items-center gap-2 text-white/70 text-sm mb-1">
                        <Gift className="h-4 w-4" />
                        <span>{bonus.referrerName}からの紹介特典</span>
                    </div>
                    <h2 className="text-xl font-bold text-white">{bonus.title || '特典'}</h2>
                </div>

                {/* Content */}
                <div className="p-6">
                    {bonus.description && (
                        <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed mb-6 bg-gray-50 rounded-xl p-4 border border-gray-100">
                            {bonus.description}
                        </div>
                    )}

                    {/* File download */}
                    {bonus.hasFile && bonus.fileName && (
                        <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-white rounded-lg border border-gray-200">
                                    <FileText className="h-5 w-5 text-[#7c3aed]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{bonus.fileName}</p>
                                    <p className="text-xs text-gray-500">添付ファイル</p>
                                </div>
                                <Button onClick={handleDownload} size="sm" className="bg-[#7c3aed] hover:bg-[#6d28d9]">
                                    <Download className="h-4 w-4 mr-1" />
                                    ダウンロード
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* No file but has content */}
                    {!bonus.hasFile && !bonus.description && (
                        <p className="text-sm text-gray-400 text-center py-4">
                            特典の詳細はまだ設定されていません。
                        </p>
                    )}
                </div>
            </div>

            {/* Link to public bonus page */}
            <div className="mt-4 text-center">
                <a
                    href={`/posutto/referral-bonus/${bonus.referralCode}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-[#7c3aed] transition-colors"
                >
                    <ExternalLink className="h-3 w-3" />
                    特典ページを別タブで開く
                </a>
            </div>
        </div>
    );
}
