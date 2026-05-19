import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { API_BASE } from '../config';
import { ArrowLeft, Mail, KeyRound, CheckCircle2 } from 'lucide-react';

type Step = 'email' | 'code' | 'done';

export default function ForgotPassword() {
    const navigate = useNavigate();
    const [step, setStep] = useState<Step>('email');
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleRequestReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch(`${API_BASE}/api/auth/request-reset`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'エラーが発生しました');

            setStep('code');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'エラーが発生しました');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (newPassword !== confirmPassword) {
            setError('パスワードが一致しません。');
            return;
        }

        if (newPassword.length < 8) {
            setError('パスワードは8文字以上で設定してください。');
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code, newPassword }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'エラーが発生しました');

            setStep('done');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'エラーが発生しました');
        } finally {
            setIsLoading(false);
        }
    };

    // Step 3: Complete
    if (step === 'done') {
        return (
            <div className="space-y-6 text-center">
                <div className="flex justify-center">
                    <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
                        <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                    </div>
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">パスワード再設定完了</h2>
                    <p className="text-sm text-gray-500 mt-2">
                        新しいパスワードでログインできます。
                    </p>
                </div>
                <Button className="w-full" onClick={() => navigate('/login')}>
                    ログインページへ
                </Button>
            </div>
        );
    }

    // Step 2: Enter code and new password
    if (step === 'code') {
        return (
            <div className="space-y-6">
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <div className="h-14 w-14 rounded-full bg-purple-100 flex items-center justify-center">
                            <KeyRound className="h-7 w-7 text-purple-600" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                        新しいパスワードを設定
                    </h2>
                    <p className="text-sm text-gray-500 mt-2">
                        {email} に送信された6桁のコードと新しいパスワードを入力してください。
                    </p>
                </div>

                <form className="space-y-4" onSubmit={handleResetPassword}>
                    {error && (
                        <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            リセットコード
                        </label>
                        <Input
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            required
                            placeholder="123456"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            className="text-center text-2xl tracking-widest"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            新しいパスワード
                        </label>
                        <Input
                            type="password"
                            required
                            placeholder="8文字以上"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            minLength={8}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            パスワード確認
                        </label>
                        <Input
                            type="password"
                            required
                            placeholder="もう一度入力"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            minLength={8}
                        />
                    </div>

                    <Button type="submit" className="w-full" isLoading={isLoading}>
                        パスワードを再設定
                    </Button>
                </form>

                <div className="text-center">
                    <button
                        onClick={() => { setStep('email'); setError(null); }}
                        className="text-sm text-gray-500 hover:text-gray-700"
                    >
                        <ArrowLeft className="inline h-4 w-4 mr-1" />
                        メールアドレスを変更
                    </button>
                </div>
            </div>
        );
    }

    // Step 1: Enter email
    return (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <div className="flex justify-center mb-4">
                    <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center">
                        <Mail className="h-7 w-7 text-blue-600" />
                    </div>
                </div>
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                    パスワードをお忘れですか？
                </h2>
                <p className="text-sm text-gray-500 mt-2">
                    登録済みのメールアドレスにリセットコードを送信します。
                </p>
            </div>

            <form className="space-y-4" onSubmit={handleRequestReset}>
                {error && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600">
                        {error}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        メールアドレス
                    </label>
                    <Input
                        type="email"
                        autoComplete="email"
                        required
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <Button type="submit" className="w-full" isLoading={isLoading}>
                    リセットコードを送信
                </Button>
            </form>

            <div className="text-center text-sm">
                <Link to="/login" className="font-medium text-primary hover:text-primary/80 hover:underline">
                    <ArrowLeft className="inline h-4 w-4 mr-1" />
                    ログインに戻る
                </Link>
            </div>
        </div>
    );
}
