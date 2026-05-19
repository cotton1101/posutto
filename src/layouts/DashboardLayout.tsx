import { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useAuth } from '../lib/auth';

export default function DashboardLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-gray-50/50">
            {/* Demo Mode Banner */}
            {user?.isDemo && (
                <div className="fixed top-0 inset-x-0 z-[60] bg-gradient-to-r from-yellow-500 to-orange-500 text-black text-center py-2 px-4 text-sm font-bold shadow-lg">
                    🎯 デモモードで閲覧中です。全ての機能を使うには
                    <Link to="/signup" className="underline ml-1 hover:text-white transition-colors">
                        無料アカウントを作成
                    </Link>
                    してください。
                </div>
            )}

            {/* Sidebar: Fixed position, full height. 
                - Mobile: controlled by sidebarOpen state via Sidebar component.
                - Desktop: always visible, fixed width (w-72).
            */}
            <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            {/* Main Content Wrapper: 
                - Desktop: pushed to the right by w-72 (lg:pl-72).
                - This ensures header and main content do not overlap the fixed sidebar.
            */}
            <div className={`lg:pl-72 flex flex-col min-h-screen transition-all duration-300 ${user?.isDemo ? 'pt-10' : ''}`}>
                <Header onMenuClick={() => setSidebarOpen(true)} />

                <main className="flex-1 py-10">
                    <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
