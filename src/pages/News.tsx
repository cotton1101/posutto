import { useState, useEffect } from 'react';
import { API_BASE } from '../config';
import { authFetch } from '../lib/authFetch';
import { cn } from '../lib/utils';
import { ChevronLeft, Info, AlertTriangle, AlertCircle, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Announcement {
    id: number;
    title: string;
    content: string;
    type: 'info' | 'warning' | 'critical';
    created_at: string;
}

export default function News() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAnnouncements = async () => {
            try {
                const res = await authFetch(`${API_BASE}/api/announcements`);
                if (!res.ok) throw new Error();
                const data = await res.json();
                setAnnouncements(data);
            } catch {
                console.error('Failed to fetch announcements');
            } finally {
                setIsLoading(false);
            }
        };
        fetchAnnouncements();
    }, []);

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
            case 'critical': return <AlertCircle className="w-5 h-5 text-red-500" />;
            default: return <Info className="w-5 h-5 text-blue-500" />;
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
                <Link
                    to="/dashboard"
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ChevronLeft className="w-6 h-6 text-gray-600" />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">お知らせ一覧</h1>
            </div>

            {isLoading ? (
                <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-900/5 p-12 text-center text-gray-500">
                    読み込み中...
                </div>
            ) : announcements.length > 0 ? (
                <div className="space-y-4">
                    {announcements.map((item) => (
                        <div
                            key={item.id}
                            className="bg-white rounded-xl shadow-sm ring-1 ring-gray-900/5 overflow-hidden border-l-4 transition-shadow hover:shadow-md"
                            style={{
                                borderLeftColor: item.type === 'critical' ? '#ef4444' : item.type === 'warning' ? '#f59e0b' : '#3b82f6'
                            }}
                        >
                            <div className="p-6">
                                <div className="flex items-start justify-between gap-4 mb-3">
                                    <div className="flex items-center gap-2">
                                        {getTypeIcon(item.type)}
                                        <h3 className={cn(
                                            "text-lg font-bold leading-tight",
                                            item.type === 'critical' ? 'text-red-700' : 'text-gray-900'
                                        )}>
                                            {item.title}
                                        </h3>
                                    </div>
                                    <div className="flex items-center text-sm text-gray-500 shrink-0">
                                        <Calendar className="w-4 h-4 mr-1" />
                                        <time dateTime={item.created_at}>
                                            {new Date(item.created_at).toLocaleDateString('ja-JP', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </time>
                                    </div>
                                </div>
                                <div className="prose prose-sm max-w-none text-gray-600 whitespace-pre-wrap">
                                    {item.content}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-900/5 p-12 text-center text-gray-500">
                    現在お知らせはありません
                </div>
            )}
        </div>
    );
}
