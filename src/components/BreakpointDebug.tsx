import { useEffect, useState } from 'react';

export default function BreakpointDebug() {
    const [width, setWidth] = useState(window.innerWidth);

    useEffect(() => {
        const handleResize = () => setWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="fixed top-0 left-0 z-[100] bg-black text-white p-2 text-xs font-mono pointer-events-none opacity-80">
            <div className="font-bold mb-1">
                <span className="block sm:hidden text-red-500">XS (&lt;640px)</span>
                <span className="hidden sm:block md:hidden text-orange-500">SM (640-768px)</span>
                <span className="hidden md:block lg:hidden text-yellow-500">MD (768-1024px)</span>
                <span className="hidden lg:block xl:hidden text-green-500">LG (1024-1280px)</span>
                <span className="hidden xl:block 2xl:hidden text-blue-500">XL (1280-1536px)</span>
                <span className="hidden 2xl:block text-purple-500">2XL (&gt;1536px)</span>
            </div>
            <div>
                Real Width: <span className="text-white font-bold">{width}px</span>
            </div>
        </div>
    );
}
