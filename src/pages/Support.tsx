import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    MessageSquare,
    Send,
    CheckCircle2,
    HelpCircle,
    AlertCircle,
    Zap,
    Mail,
    ArrowRight,
    RefreshCw
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { API_BASE } from '../config';
import { parseJson } from '../lib/authFetch';

type InquiryCategory = 'feedback' | 'bug' | 'question' | 'other';

export default function Support() {
    const [submitted, setSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [captcha, setCaptcha] = useState<{ id: string; question: string } | null>(null);
    const [captchaAnswer, setCaptchaAnswer] = useState('');
    const [formData, setFormData] = useState({
        category: 'feedback' as InquiryCategory,
        subject: '',
        content: '',
        email: ''
    });

    const fetchCaptcha = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/auth/captcha`);
            if (res.ok) {
                const data = await parseJson(res);
                setCaptcha(data);
                setCaptchaAnswer('');
            }
        } catch (err) {
            console.error('Failed to fetch captcha:', err);
        }
    };

    useEffect(() => {
        fetchCaptcha();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!captcha || !captchaAnswer) {
            setError('認証の計算結果を入力してください。');
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch(`${API_BASE}/api/contact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email,
                    category: formData.category,
                    subject: formData.subject,
                    content: formData.content,
                    captchaId: captcha.id,
                    captchaAnswer: captchaAnswer
                })
            });

            const result = await parseJson(res);

            if (res.ok && result.success) {
                setSubmitted(true);
            } else {
                setError(result.error || '送信に失敗しました。再度お試しください。');
                fetchCaptcha();
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'ネットワークエラーが発生しました。再度お試しください。');
            fetchCaptcha();
        } finally {
            setIsLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="max-w-2xl mx-auto pt-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden text-center p-12">
                    <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-emerald-50 text-emerald-500 mb-6 ring-8 ring-emerald-50/50">
                        <CheckCircle2 size={40} />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">送信完了いたしました</h2>
                    <p className="text-gray-500 leading-relaxed mb-10 max-w-sm mx-auto">
                        お問い合わせありがとうございます。内容を確認次第、担当者よりご連絡させていただきます。通常2〜3営業日以内に返信いたします。
                    </p>
                    <Button
                        onClick={() => {
                            setSubmitted(false);
                            setFormData({ category: 'feedback', subject: '', content: '', email: '' });
                            setCaptchaAnswer('');
                            fetchCaptcha();
                        }}
                        variant="outline"
                        className="rounded-xl px-8"
                    >
                        トップに戻る
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Section */}
            <div className="flex flex-col gap-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold w-fit">
                    <Zap size={12} />
                    <span>Support Center</span>
                </div>
                <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
                    お問い合わせ
                </h1>
                <p className="text-lg text-gray-500 max-w-2xl">
                    Posuttoをご利用いただきありがとうございます。不具合の報告、機能の改善要望、またはご質問など、お気軽にお寄せください。
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden p-8 md:p-10">
                        <form onSubmit={handleSubmit} className="space-y-8">
                            {/* Category Selection */}
                            <div className="space-y-4">
                                <label className="text-sm font-bold text-gray-900 uppercase tracking-wider">カテゴリ</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {[
                                        { id: 'feedback', label: '機能改善', icon: Zap },
                                        { id: 'bug', label: '不具合報告', icon: AlertCircle },
                                        { id: 'question', label: '一般的な質問', icon: HelpCircle },
                                        { id: 'other', label: 'その他', icon: MessageSquare },
                                    ].map((cat) => (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, category: cat.id as InquiryCategory })}
                                            className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-200 ${formData.category === cat.id
                                                    ? 'border-primary bg-primary/5 text-primary ring-4 ring-primary/5'
                                                    : 'border-gray-100 bg-gray-50/50 text-gray-500 hover:border-gray-200 hover:bg-gray-50'
                                                }`}
                                        >
                                            <cat.icon size={20} />
                                            <span className="text-xs font-bold">{cat.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Contact Details */}
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-900 uppercase tracking-wider">返信用メールアドレス</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                            <Mail size={18} />
                                        </div>
                                        <Input
                                            type="email"
                                            placeholder="your@email.com"
                                            className="pl-12 rounded-xl h-12"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-900 uppercase tracking-wider">件名</label>
                                    <Input
                                        placeholder="お問い合わせ内容の要約"
                                        className="rounded-xl h-12"
                                        value={formData.subject}
                                        onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-900 uppercase tracking-wider">詳細内容</label>
                                    <textarea
                                        className="w-full min-h-[160px] p-4 rounded-2xl border border-gray-200 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all resize-none text-sm placeholder:text-gray-400"
                                        placeholder="詳細な内容をこちらにご記入ください。不具合の場合は、発生した状況や再現手順をご教示いただけますと幸いです。"
                                        value={formData.content}
                                        onChange={e => setFormData({ ...formData, content: e.target.value })}
                                        required
                                    />
                                </div>

                                {/* CAPTCHA */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-900 uppercase tracking-wider">スパム防止認証</label>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                                            <span className="text-lg font-bold text-gray-700 select-none">
                                                {captcha ? `${captcha.question} = ?` : '...'}
                                            </span>
                                        </div>
                                        <Input
                                            type="number"
                                            placeholder="答え"
                                            className="rounded-xl h-12 w-24"
                                            value={captchaAnswer}
                                            onChange={e => setCaptchaAnswer(e.target.value)}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={fetchCaptcha}
                                            className="p-3 text-gray-400 hover:text-primary transition-colors"
                                            title="別の問題に変更"
                                        >
                                            <RefreshCw size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm font-medium flex items-center gap-2">
                                    <AlertCircle size={16} />
                                    {error}
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full h-14 rounded-2xl text-md font-bold shadow-xl shadow-primary/20 group"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        送信中...
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center gap-2">
                                        <Send size={18} />
                                        送信する
                                        <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                )}
                            </Button>
                        </form>
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <div className="bg-primary/5 rounded-3xl p-8 border border-primary/10">
                        <h4 className="font-bold text-primary mb-4 flex items-center gap-2">
                            <HelpCircle size={18} />
                            よくあるご質問
                        </h4>
                        <ul className="space-y-4">
                            {[
                                'ログインできない場合は？',
                                'Botが停止してしまった',
                                'プランの変更方法',
                                '解約について'
                            ].map((q, i) => (
                                <li key={i}>
                                    <Link to="/dashboard/guide" className="text-sm text-gray-600 hover:text-primary hover:underline flex items-center gap-2">
                                        <div className="h-1.5 w-1.5 rounded-full bg-primary/40" />
                                        {q}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="bg-gray-900 rounded-3xl p-8 text-white">
                        <h4 className="font-bold mb-4">システム状況</h4>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.5)]" />
                            <span className="text-sm font-medium">All systems operational</span>
                        </div>
                        <p className="text-xs text-gray-400 leading-relaxed">
                            不具合の修正やサーバーのメンテナンス情報は、ダッシュボードのお知らせ欄でも随時発信しております。
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
