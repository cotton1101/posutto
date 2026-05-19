import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { LayoutDashboard, Users, LogOut, Settings, ArrowLeft, Megaphone, Menu, X, Gift, CreditCard } from 'lucide-react';
import { cn } from '../lib/utils';

export default function AdminLayout() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navigation = [
        { name: 'ダッシュボード', href: '/admin', icon: LayoutDashboard },
        { name: 'ユーザー管理', href: '/admin/users', icon: Users },
        { name: 'お知らせ管理', href: '/admin/announcements', icon: Megaphone },
        { name: 'サブスク管理', href: '/admin/subscriptions', icon: CreditCard },
        { name: '紹介報酬管理', href: '/admin/referrals', icon: Gift },
        { name: 'システム設定', href: '/admin/settings', icon: Settings },
    ];

    const handleNavClick = () => {
        setSidebarOpen(false);
    };

    const sidebarContent = (
        <>
            <div className="h-16 flex items-center px-6 font-bold text-xl tracking-wider shrink-0">
                POSUTTO <span className="text-xs ml-2 text-slate-400 bg-slate-800 px-1 py-0.5 rounded">ADMIN</span>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                {navigation.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            to={item.href}
                            onClick={handleNavClick}
                            className={cn(
                                "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                                isActive
                                    ? "bg-slate-800 text-white"
                                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                            )}
                        >
                            <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            <div className="px-4 py-4 border-t border-slate-800 shrink-0">
                <Link
                    to="/dashboard"
                    onClick={handleNavClick}
                    className="group flex items-center px-2 py-2 text-sm font-medium text-slate-300 rounded-md hover:bg-slate-800 hover:text-white transition-colors"
                >
                    <ArrowLeft className="mr-3 h-5 w-5 flex-shrink-0" />
                    ダッシュボードに戻る
                </Link>
            </div>

            <div className="p-4 border-t border-slate-800 shrink-0">
                <button
                    onClick={handleLogout}
                    className="flex w-full items-center px-2 py-2 text-sm font-medium text-slate-300 rounded-md hover:bg-slate-800 hover:text-white transition-colors"
                >
                    <LogOut className="mr-3 h-5 w-5" />
                    ログアウト
                </button>
            </div>
        </>
    );

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Mobile Sidebar (slide-in) */}
            <div className={cn(
                "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col transform transition-transform duration-300 ease-in-out lg:hidden",
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                {/* Close Button */}
                <button
                    onClick={() => setSidebarOpen(false)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white"
                >
                    <X className="h-6 w-6" />
                </button>
                {sidebarContent}
            </div>

            {/* Desktop Sidebar (always visible) */}
            <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:w-64 lg:bg-slate-900 lg:text-white lg:flex lg:flex-col">
                {sidebarContent}
            </div>

            {/* Main Content */}
            <div className="lg:ml-64 flex flex-col min-h-screen">
                {/* Mobile Header */}
                <div className="sticky top-0 z-30 bg-white border-b border-gray-200 lg:hidden">
                    <div className="flex items-center h-14 px-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="p-2 -ml-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                        >
                            <Menu className="h-6 w-6" />
                        </button>
                        <span className="ml-3 font-bold text-gray-900 tracking-tight">
                            POSUTTO <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded ml-1">ADMIN</span>
                        </span>
                    </div>
                </div>

                <main className="flex-1 py-6 px-4 sm:px-6 lg:py-10 lg:px-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
