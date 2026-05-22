
import { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    LogOut,
    CreditCard,
    HelpCircle,
    X,
    MessageSquare,
    BarChart3,
    Shield,
    Activity,
    UserCog,
    Gift
} from 'lucide-react';
import XLogo from './icons/XLogo';
import { cn } from '../lib/utils';
import { useAuth } from '../lib/auth';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const { logout, isAdmin } = useAuth();
    const location = useLocation();

    // モバイルでページ遷移した時にサイドバーを自動的に閉じる
    useEffect(() => {
        onClose();
    }, [location.pathname, onClose]);

    const navigation = [
        { name: 'ダッシュボード', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Bot管理', href: '/dashboard/bots', icon: XLogo },
        { name: '投稿分析', href: '/dashboard/analytics', icon: BarChart3 },
{ name: 'アカウント状況', href: '/dashboard/accounts/status', icon: Activity },
    ];

    const settingsNavigation = [
        { name: 'Xアカウント設定', href: '/dashboard/settings/account', icon: XLogo },
        { name: 'マイアカウント', href: '/dashboard/settings/my-account', icon: UserCog },
    ];

    const supportNavigation = [
        { name: 'ショップ', href: '/dashboard/shop', icon: CreditCard },
        { name: 'アフィリエイト', href: '/dashboard/affiliate', icon: Gift },
        { name: '紹介特典', href: '/dashboard/my-bonus', icon: Gift },
        { name: 'ご利用ガイド', href: '/dashboard/guide', icon: HelpCircle },
        { name: 'お問い合わせ', href: '/dashboard/support', icon: MessageSquare },
    ];

    return (
        <>
            {/* Mobile backdrop - Z-index 40 */}
            <div
                className={cn(
                    "fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm transition-opacity lg:hidden",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            {/* Sidebar container - Z-index 50/40
                Desktop: Fixed at Z-40 to sit below potential modals but above regular content
                Mobile: Fixed at Z-50 to sit above everything
            */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 shadow-[4px_0_24px_rgba(0,0,0,0.02)] transform transition-transform duration-300 ease-in-out lg:z-40 lg:translate-x-0 flex flex-col",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* Header / Logo */}
                <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100 bg-white/50 backdrop-blur-xl sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <img src={`${import.meta.env.BASE_URL}assets/logo.png`} alt="Posutto Logo" className="h-10 w-10 object-contain rounded-lg shadow-sm" />
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 tracking-tight">Posutto</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="lg:hidden p-2 -mr-2 text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation Content */}
                <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                    {/* Main Menu */}
                    <div>
                        <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                            メインメニュー
                        </h3>
                        <nav className="space-y-1">
                            {navigation.map((item) => (
                                <NavLink
                                    key={item.href}
                                    to={item.href}
                                    className={({ isActive }) => cn(
                                        "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group relative overflow-hidden",
                                        isActive
                                            ? "bg-[#7c3aed] text-white shadow-md shadow-[#7c3aed]/25"
                                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                    )}
                                >
                                    <item.icon size={18} className="relative z-10" />
                                    <span className="relative z-10">{item.name}</span>
                                </NavLink>
                            ))}
                        </nav>
                    </div>

                    {/* Settings */}
                    <div>
                        <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                            設定
                        </h3>
                        <nav className="space-y-1">
                            {settingsNavigation.map((item) => (
                                <NavLink
                                    key={item.href}
                                    to={item.href}
                                    className={({ isActive }) => cn(
                                        "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                                        isActive
                                            ? "bg-[#7c3aed]/10 text-[#7c3aed]"
                                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                    )}
                                >
                                    <item.icon size={18} />
                                    {item.name}
                                </NavLink>
                            ))}
                        </nav>
                    </div>

                    {/* Support */}
                    <div>
                        <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                            サポート
                        </h3>
                        <nav className="space-y-1">
                            {supportNavigation.map((item) => (
                                <NavLink
                                    key={item.href}
                                    to={item.href}
                                    className={({ isActive }) => cn(
                                        "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                                        isActive
                                            ? "bg-primary/10 text-primary"
                                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                    )}
                                >
                                    <item.icon size={18} />
                                    {item.name}
                                </NavLink>
                            ))}
                        </nav>
                    </div>

                    {/* Admin Section */}
                    {isAdmin && (
                        <div>
                            <h3 className="px-3 text-xs font-semibold text-purple-500 uppercase tracking-wider mb-3">
                                管理者メニュー
                            </h3>
                            <nav className="space-y-1">
                                <NavLink
                                    to="/admin"
                                    className={({ isActive }) => cn(
                                        "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                                        isActive
                                            ? "bg-purple-50 text-purple-700 font-semibold"
                                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                    )}
                                >
                                    <Shield size={18} className="text-purple-500" />
                                    <span>管理者ダッシュボード</span>
                                </NavLink>
                            </nav>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 bg-gray-50/50">
                    <button
                        onClick={() => logout()}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-600 rounded-lg hover:bg-red-50 hover:text-red-600 transition-all duration-200 group"
                    >
                        <LogOut size={18} className="group-hover:text-red-600 transition-colors" />
                        ログアウト
                    </button>
                    <div className="mt-4 flex items-center justify-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
                        <p className="text-xs text-gray-400 font-medium">System Status: Online</p>
                    </div>
                </div>
            </aside>
        </>
    );
}
