import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { API_BASE } from '../config';
import { parseJson } from '../lib/authFetch';

export default function Login() {
    const navigate = useNavigate();
    const { login, verify2FA } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [captcha, setCaptcha] = useState<{ id: string; question: string } | null>(null);
    const [captchaAnswer, setCaptchaAnswer] = useState('');
    const [require2FA, setRequire2FA] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [error, setError] = useState<string | null>(null);

    const fetchCaptcha = async () => {
        try {
            const response = await fetch(`${API_BASE}/api/auth/captcha`);
            if (response.ok) {
                const data = await parseJson(response);
                setCaptcha(data);
            }
        } catch (error) {
            console.error('Failed to fetch CAPTCHA:', error);
        }
    };

    useEffect(() => {
        fetchCaptcha();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            if (require2FA) {
                await verify2FA(email, otpCode);
                navigate('/dashboard');
            } else {
                const result = await login(email, password, captcha?.id, captchaAnswer);
                if (result.require2FA) {
                    setRequire2FA(true);
                } else {
                    navigate('/dashboard');
                }
            }
        } catch (_err: unknown) {
            setError(_err instanceof Error ? _err.message : 'エラーが発生しました');
            if (!require2FA) {
                fetchCaptcha();
                setCaptchaAnswer('');
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (require2FA) {
        return (
            <div className="space-y-6">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                        二段階認証
                    </h2>
                    <p className="text-sm text-gray-500 mt-2">
                        {email} に送信された6桁の認証コードを入力してください。
                    </p>
                </div>

                <form className="space-y-4" onSubmit={handleSubmit}>
                    {error && (
                        <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600 animate-shake">
                            {error}
                        </div>
                    )}
                    <div>
                        <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
                            認証コード
                        </label>
                        <Input
                            id="otp"
                            name="otp"
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            required
                            placeholder="123456"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value)}
                            className="text-center text-2xl tracking-widest"
                        />
                    </div>

                    <Button type="submit" className="w-full" isLoading={isLoading}>
                        認証する
                    </Button>
                </form>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                    おかえりなさい
                </h2>
                <p className="text-sm text-gray-500 mt-2">
                    ポスットにログインして管理を続けましょう。
                </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
                {error && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600 animate-shake">
                        {error}
                    </div>
                )}
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        メールアドレス
                    </label>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                        パスワード
                    </label>
                    <Input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                {captcha && (
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            セキュリティ認証: <span className="text-primary font-bold">{captcha.question} = ?</span>
                        </label>
                        <Input
                            type="text"
                            placeholder="答えを入力"
                            required
                            value={captchaAnswer}
                            onChange={(e) => setCaptchaAnswer(e.target.value)}
                        />
                        <p className="text-[10px] text-gray-400 mt-2 italic text-left w-full">
                            ※ボットによる自動ログインを防ぐための確認です。
                        </p>
                    </div>
                )}

                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <input
                            id="remember-me"
                            name="remember-me"
                            type="checkbox"
                            className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                            保存する
                        </label>
                    </div>

                    <div className="text-sm">
                        <Link to="/forgot-password" className="font-medium text-primary hover:text-primary/80 hover:underline">
                            パスワードをお忘れですか？
                        </Link>
                    </div>
                </div>

                <Button type="submit" className="w-full" isLoading={isLoading} disabled={isLoading}>
                    ログイン
                </Button>
            </form>

            <div className="text-center text-sm">
                <span className="text-gray-500">アカウントをお持ちでないですか？ </span>
                <Link to="/signup" className="font-medium text-primary hover:text-primary/80 hover:underline">
                    新規登録
                </Link>
            </div>
        </div>
    );
}
