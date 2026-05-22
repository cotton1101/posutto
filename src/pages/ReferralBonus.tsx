import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Gift, Download, FileText, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { API_BASE } from '../config';
import { parseJson } from '../lib/authFetch';

interface BonusData {
    referrerName: string;
    title: string;
    description: string;
    fileName: string | null;
    hasFile: boolean;
}

export default function ReferralBonus() {
    const { code } = useParams<{ code: string }>();
    const [bonus, setBonus] = useState<BonusData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!code) return;
        fetchBonus();
    }, [code]);

    const fetchBonus = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/referral/bonus/${code}`);
            const data = await parseJson(res);
            if (res.ok) {
                setBonus(data);
            } else {
                setError(data.error || '特典が見つかりませんでした。');
            }
        } catch {
            setError('読み込みに失敗しました。');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        window.open(`${API_BASE}/api/referral/bonus/download/${code}`, '_blank');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7c3aed]" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 max-w-md w-full text-center">
                    <Gift className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h1 className="text-lg font-bold text-gray-900 mb-2">特典が見つかりません</h1>
                    <p className="text-sm text-gray-500 mb-6">{error}</p>
                    <Link to="/">
                        <Button variant="outline">
                            トップページへ
                            <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex items-center justify-center p-4">
            <div className="w-full max-w-lg">
                {/* Header */}
                <div className="text-center mb-6">
                    <Link to="/" className="inline-flex items-center gap-2 mb-4">
                        <img src="/posutto/assets/logo.png" alt="Posutto" className="h-8" />
                    </Link>
                </div>

                {/* Bonus Card */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                    {/* Top banner */}
                    <div className="bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] px-6 py-4">
                        <div className="flex items-center gap-2 text-white/70 text-sm mb-1">
                            <Gift className="h-4 w-4" />
                            <span>{bonus?.referrerName}からの紹介特典</span>
                        </div>
                        <h1 className="text-xl font-bold text-white">{bonus?.title || '特典'}</h1>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {bonus?.description && (
                            <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed mb-6">
                                {bonus.description}
                            </div>
                        )}

                        {bonus?.hasFile && bonus?.fileName && (
                            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white rounded-lg border border-gray-200">
                                        <FileText className="h-5 w-5 text-[#7c3aed]" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">{bonus.fileName}</p>
                                        <p className="text-xs text-gray-500">添付ファイル</p>
                                    </div>
                                    <Button onClick={handleDownload} size="sm">
                                        <Download className="h-4 w-4 mr-1" />
                                        ダウンロード
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* CTA */}
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                        <Link to={`/signup?ref=${code}`}>
                            <Button className="w-full">
                                Posuttoに無料登録する
                                <ArrowRight className="h-4 w-4 ml-1" />
                            </Button>
                        </Link>
                        <p className="text-xs text-gray-400 text-center mt-2">
                            登録すると紹介者の特典が適用されます
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-xs text-gray-400 text-center mt-4">
                    &copy; {new Date().getFullYear()} Posutto. All rights reserved.
                </p>
            </div>
        </div>
    );
}
