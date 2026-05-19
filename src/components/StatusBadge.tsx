import { Play, Square, AlertCircle } from 'lucide-react';

interface StatusBadgeProps {
    status: 'active' | 'paused' | 'error';
}

export default function StatusBadge({ status }: StatusBadgeProps) {
    if (status === 'active') {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                <Play className="h-3 w-3" />
                稼働中
            </span>
        );
    }

    if (status === 'paused') {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                <Square className="h-3 w-3" />
                停止中
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
            <AlertCircle className="h-3 w-3" />
            エラー
        </span>
    );
}
