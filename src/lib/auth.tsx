import { createContext, useContext, useState, useEffect } from 'react';
import type { PlanType } from '../types/plans';
import { API_BASE } from '../config';
import { parseJson } from './authFetch';

export type UserRole = 'admin' | 'user';

export type User = {
    email: string;
    name?: string;
    role: UserRole;
    plan: PlanType;
    isDemo?: boolean;
};

type AuthContextType = {
    user: User | null;
    login: (email: string, password?: string, captchaId?: string, captchaAnswer?: string) => Promise<{ require2FA: boolean; message?: string }>;
    verify2FA: (email: string, code: string) => Promise<void>;
    register: (email: string, password: string, name?: string, referralCode?: string) => Promise<void>;
    loginAsDemo: () => void;
    logout: () => void;
    updatePlan: (plan: PlanType) => Promise<void>;
    updateUser: (userData: Partial<User>) => void;
    isAuthenticated: boolean;
    isAdmin: boolean;
    isLoading: boolean;
    getAuthHeaders: () => Record<string, string>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function saveToken(token: string) {
    localStorage.setItem('posutto_token', token);
}

function getToken(): string | null {
    return localStorage.getItem('posutto_token');
}

function clearToken() {
    localStorage.removeItem('posutto_token');
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        try {
            const storedUser = localStorage.getItem('posutto_user');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        } catch (error) {
            console.error('Failed to parse stored user:', error);
            localStorage.removeItem('posutto_user');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const getAuthHeaders = (): Record<string, string> => {
        const token = getToken();
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    };

    const login = async (email: string, password?: string, captchaId?: string, captchaAnswer?: string) => {
        try {
            const response = await fetch(`${API_BASE}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, captchaId, captchaAnswer }),
            });

            const data = await parseJson(response);

            if (!response.ok) {
                throw new Error(data.error || 'ログインに失敗しました。');
            }

            if (data.require2FA) {
                return {
                    require2FA: true,
                    message: data.message,
                };
            }

            // Save token and user data separately
            if (data.token) {
                saveToken(data.token);
            }
            const { token: _token, ...userData } = data;
            setUser(userData);
            localStorage.setItem('posutto_user', JSON.stringify(userData));
            return { require2FA: false };
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'ログインに失敗しました。';
            alert(message);
            throw error;
        }
    };

    const verify2FA = async (email: string, code: string) => {
        try {
            const response = await fetch(`${API_BASE}/api/auth/verify-2fa`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code }),
            });

            const data = await parseJson(response);

            if (!response.ok) {
                throw new Error(data.error || '認証に失敗しました。');
            }
            if (data.token) {
                saveToken(data.token);
            }
            const { token: _token, ...userData } = data;
            setUser(userData);
            localStorage.setItem('posutto_user', JSON.stringify(userData));
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : '認証に失敗しました。';
            alert(message);
            throw error;
        }
    };

    const register = async (email: string, password: string, name?: string, referralCode?: string) => {
        try {
            const response = await fetch(`${API_BASE}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name, referralCode: referralCode || undefined }),
            });

            const data = await parseJson(response);

            if (!response.ok) {
                throw new Error(data.error || '登録に失敗しました。');
            }
            if (data.token) {
                saveToken(data.token);
            }
            const { token: _token, ...userData } = data;
            setUser(userData);
            localStorage.setItem('posutto_user', JSON.stringify(userData));
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : '登録に失敗しました。';
            alert(message);
            throw error;
        }
    };

    const loginAsDemo = () => {
        const demoUser: User = {
            email: 'demo@posutto.com',
            name: 'デモユーザー',
            role: 'user',
            plan: 'starter',
            isDemo: true,
        };
        setUser(demoUser);
        localStorage.setItem('posutto_user', JSON.stringify(demoUser));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('posutto_user');
        clearToken();
    };

    const updateUser = (userData: Partial<User>) => {
        if (user) {
            const updatedUser = { ...user, ...userData };
            setUser(updatedUser);
            localStorage.setItem('posutto_user', JSON.stringify(updatedUser));
        }
    };

    const updatePlan = async (plan: PlanType) => {
        if (user) {
            try {
                const response = await fetch(`${API_BASE}/api/user/update-plan`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...getAuthHeaders()
                    },
                    body: JSON.stringify({ email: user.email, plan }),
                });

                const data = await parseJson(response);
                if (response.ok) {
                    const updatedUser = { ...user, plan };
                    setUser(updatedUser);
                    localStorage.setItem('posutto_user', JSON.stringify(updatedUser));
                } else {
                    throw new Error(data.error || 'プラン変更に失敗しました。');
                }
            } catch (error) {
                console.error('Plan update failed:', error);
                throw error;
            }
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            login,
            verify2FA,
            register,
            loginAsDemo,
            logout,
            updatePlan,
            updateUser,
            isAuthenticated: !!user,
            isAdmin: user?.role === 'admin',
            isLoading,
            getAuthHeaders
        }}>
            {children}
        </AuthContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
