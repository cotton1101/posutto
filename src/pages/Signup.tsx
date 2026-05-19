import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export default function Signup() {
    const navigate = useNavigate();
    const { register } = useAuth();
    const [searchParams] = useSearchParams();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [referralCode, setReferralCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Pre-fill referral code from URL parameter ?ref=XXXXXXXX
    useEffect(() => {
        const ref = searchParams.get('ref');
        if (ref) setReferralCode(ref);
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            await register(email, password, name, referralCode || undefined);
            navigate('/dashboard');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'エラーが発生しました');
            console.error('Registration failed:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                    新規アカウント登録
                </h2>
                <p className="text-sm text-gray-500 mt-2">
                    必要な情報を入力してアカウントを作成しましょう。
                </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
                {error && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600 animate-shake">
                        {error}
                    </div>
                )}
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        お名前
                    </label>
                    <Input
                        id="name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        required
                        placeholder="山田 太郎"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>

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
                        autoComplete="new-password"
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                <div>
                    <label htmlFor="referralCode" className="block text-sm font-medium text-gray-700 mb-1">
                        紹介コード <span className="text-gray-400 font-normal">（任意）</span>
                    </label>
                    <Input
                        id="referralCode"
                        name="referralCode"
                        type="text"
                        placeholder="例: a1b2c3d4"
                        value={referralCode}
                        onChange={(e) => setReferralCode(e.target.value)}
                    />
                    <p className="text-xs text-gray-400 mt-1">紹介者から受け取ったコードがあれば入力してください</p>
                </div>

                <Button type="submit" className="w-full" isLoading={isLoading}>
                    アカウント作成
                </Button>
            </form>

            <div className="text-center text-sm">
                <span className="text-gray-500">すでにアカウントをお持ちですか？ </span>
                <Link to="/login" className="font-medium text-primary hover:text-primary/80 hover:underline">
                    ログイン
                </Link>
            </div>
        </div>
    );
}
