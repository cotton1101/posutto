import { useEffect, useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Bot,
    Shield,
    Zap,
    Check,
    ArrowRight,
    Crown,
    Video,
    Heart,
    UserPlus,
    Link2,
    Eye,
    ChevronDown,
    Play,
    Sparkles,
    Type,
    CreditCard,
    FileText,
    Clock,
    Activity,
    Search,
    TrendingUp,
    Lock,
    BarChart3,
    CheckCircle,
    AlertTriangle,
    Info,
    Gift,
    Database,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../lib/auth';

// ---------------------------------------------------------------------------
// Plan data
// ---------------------------------------------------------------------------
const PLANS = [
    { name: 'フリー', price: 0, bots: 1, tweets: 5, color: 'gray', popular: false },
    { name: 'スターター', price: 2980, bots: 10, tweets: 25, color: 'blue', popular: false },
    { name: 'アドバンス', price: 4980, bots: 30, tweets: 25, color: 'purple', popular: true },
    { name: 'アドバンス＋20', price: 6980, bots: 50, tweets: 25, color: 'emerald', popular: false },
    { name: 'アドバンス＋70', price: 10980, bots: 100, tweets: 25, color: 'amber', popular: false },
    { name: 'アドバンス＋170', price: 19800, bots: 200, tweets: 25, color: 'rose', popular: false },
];

// ---------------------------------------------------------------------------
// Animated counter hook (IntersectionObserver + requestAnimationFrame)
// ---------------------------------------------------------------------------
function useCountUp(target: number, duration = 2000) {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLDivElement>(null);
    const started = useRef(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !started.current) {
                    started.current = true;
                    const start = performance.now();
                    const animate = (now: number) => {
                        const elapsed = now - start;
                        const progress = Math.min(elapsed / duration, 1);
                        // ease-out
                        const eased = 1 - Math.pow(1 - progress, 3);
                        setCount(Math.round(eased * target));
                        if (progress < 1) requestAnimationFrame(animate);
                    };
                    requestAnimationFrame(animate);
                }
            },
            { threshold: 0.3 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [target, duration]);

    return { count, ref };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function LandingPage() {
    const [activeFaq, setActiveFaq] = useState<number | null>(null);
    const { loginAsDemo } = useAuth();
    const navigate = useNavigate();

    useEffect(() => { window.scrollTo(0, 0); }, []);

    const toggleFaq = useCallback((index: number) => {
        setActiveFaq(prev => prev === index ? null : index);
    }, []);

    const handleDemoLogin = () => {
        loginAsDemo();
        navigate('/dashboard');
    };

    // Counters
    const c1 = useCountUp(50000, 2200);
    const c2 = useCountUp(200, 1800);
    const c3 = useCountUp(99.9, 2000);
    const c4 = useCountUp(24, 1400);

    return (
        <div className="min-h-screen bg-white text-gray-900 font-sans overflow-x-hidden selection:bg-purple-500 selection:text-white antialiased">
            {/* ============================================================ */}
            {/* Header — dark liquid glass pill nav                           */}
            {/* ============================================================ */}
            <header className="fixed top-2 sm:top-3 inset-x-0 z-50 px-2 sm:px-6">
                <div className="mx-auto max-w-5xl glass-surface-dark rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
                    <div className="px-3 sm:px-6 h-12 sm:h-14 flex items-center justify-between gap-2">
                        <Link to="/" className="flex items-center gap-2 group shrink-0">
                            <img src="/posutto/assets/logo.png" alt="Posutto" className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg shadow-[0_0_12px_rgba(168,85,247,0.6)] transition-transform group-hover:scale-105" />
                            <span className="text-sm sm:text-base font-bold tracking-tight text-white">Posutto</span>
                        </Link>
                        <nav className="hidden md:flex items-center gap-7 text-[13px] font-medium text-white/70">
                            <a href="#features" className="hover:text-white transition-colors">機能</a>
                            <a href="#how-it-works" className="hover:text-white transition-colors">使い方</a>
                            <a href="#pricing" className="hover:text-white transition-colors">料金</a>
                            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
                        </nav>
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            <Link to="/login" className="hidden sm:inline-flex text-[13px] font-medium text-white/70 hover:text-white px-3 py-1.5 transition-colors">
                                ログイン
                            </Link>
                            <Link to="/signup" className="cta-shimmer rounded-full">
                                <Button size="sm" className="rounded-full px-3 sm:px-4 h-8 sm:h-9 text-[12px] sm:text-[13px] font-bold bg-white hover:bg-white text-gray-900 shadow-[0_0_20px_rgba(255,255,255,0.25)] transition-all whitespace-nowrap">
                                    無料で始める
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* ============================================================ */}
            {/* Hero — FULL DARK with glowing orbs + mesh aurora              */}
            {/* ============================================================ */}
            <section className="relative pt-36 pb-28 lg:pt-52 lg:pb-40 overflow-hidden bg-[#050510] text-white">
                {/* Floating glowing orbs (2 only, lighter) */}
                <div aria-hidden="true" className="orb orb-purple w-[480px] h-[480px] -top-32 -left-32" style={{ animationDelay: '0s' }} />
                <div aria-hidden="true" className="orb orb-blue w-[540px] h-[540px] -bottom-40 -right-32" style={{ animationDelay: '4s' }} />
                {/* Aurora mesh (static) */}
                <div aria-hidden="true" className="absolute inset-0 mesh-bg opacity-35 mix-blend-screen" />

                <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center reveal z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-surface-dark text-[12px] font-bold text-white/90 mb-10 tracking-wider">
                        <Sparkles size={13} className="text-pink-400" />
                        X (Twitter) 完全自動化プラットフォーム
                    </div>

                    <h1 className="text-[40px] xs:text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-[120px] font-black tracking-[-0.045em] leading-[0.95] mb-6 sm:mb-8 text-balance px-1">
                        収益化を、<br />
                        <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent animate-gradient-x">完全自動で。</span>
                    </h1>

                    <p className="max-w-xl sm:max-w-2xl mx-auto text-base sm:text-xl md:text-2xl text-white/70 mb-10 sm:mb-14 leading-relaxed text-pretty font-light px-2">
                        動画引用ポスト、アフィリエイトURL自動変換、スケジュール投稿。<br className="hidden sm:inline" />
                        Xの収益化に必要なすべてを、<span className="text-white font-semibold">最短10分で稼働</span>。
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-16 sm:mb-24 px-4">
                        <Link to="/signup" className="w-full sm:w-auto cta-shimmer rounded-full">
                            <Button size="lg" className="w-full sm:w-auto rounded-full px-8 sm:px-10 h-12 sm:h-14 text-sm sm:text-base font-bold bg-white hover:bg-white text-gray-900 shadow-[0_0_40px_rgba(255,255,255,0.35)] transition-all hover:scale-[1.04] active:scale-[0.97]">
                                無料で始める <ArrowRight className="ml-1.5 h-4 w-4" />
                            </Button>
                        </Link>
                        <Button
                            variant="outline"
                            size="lg"
                            onClick={handleDemoLogin}
                            className="w-full sm:w-auto rounded-full px-8 sm:px-10 h-12 sm:h-14 text-sm sm:text-base font-semibold glass-surface-dark !text-white hover:!bg-white/10 transition-all"
                        >
                            <Play className="mr-1.5 h-4 w-4" />
                            デモを見る
                        </Button>
                    </div>

                    {/* Visual: Flow Diagram (dark glass) */}
                    <div className="max-w-3xl mx-auto px-2 sm:px-0">
                        <div className="glass-surface-dark rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-[0_30px_80px_rgba(168,85,247,0.25)]">
                            <p className="text-[10px] font-bold text-pink-300 uppercase tracking-[0.2em] mb-5 sm:mb-6">AUTOMATION FLOW</p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-3">
                                {[
                                    { icon: Video, label: '動画取得', sub: '参照アカウントから', color: 'from-purple-500 to-fuchsia-500' },
                                    { icon: Link2, label: 'URL変換', sub: 'アフィリエイトID', color: 'from-emerald-500 to-teal-500' },
                                    { icon: Type, label: 'テキスト生成', sub: '毎回違う文章', color: 'from-blue-500 to-cyan-500' },
                                    { icon: Zap, label: '自動投稿', sub: 'スケジュール通り', color: 'from-amber-500 to-orange-500' },
                                ].map((step, i) => (
                                    <div key={i} className="flex flex-col items-center gap-2.5 relative">
                                        <div className={`h-12 w-12 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shrink-0 shadow-lg text-white`}>
                                            <step.icon size={22} />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs sm:text-sm font-bold text-white">{step.label}</p>
                                            <p className="text-[10px] sm:text-[11px] text-white/50">{step.sub}</p>
                                        </div>
                                        {i < 3 && <ArrowRight size={16} className="hidden sm:block absolute -right-3 top-5 text-white/30" />}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ============================================================ */}
            {/* Numbers / Stats — animated count-up                          */}
            {/* ============================================================ */}
            <section className="py-24 sm:py-32 bg-[#050510] text-white relative overflow-hidden noise">
                <div aria-hidden="true" className="orb orb-purple w-[400px] h-[400px] -top-40 left-10" style={{ animationDelay: '1s' }} />
                <div aria-hidden="true" className="orb orb-cyan w-[500px] h-[500px] -bottom-60 right-0" style={{ animationDelay: '3s' }} />
                <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
                    <div className="text-center mb-16 reveal">
                        <p className="text-[11px] font-bold text-pink-400 uppercase tracking-[0.2em] mb-3">BY THE NUMBERS</p>
                        <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-[-0.03em]">
                            <span className="bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent animate-gradient-x">数字で見るPosutto</span>
                        </h2>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                        {[
                            { ref: c1.ref, value: c1.count.toLocaleString() + '+', label: '累計自動投稿数', icon: BarChart3, suffix: '', gradient: 'from-purple-500/30 to-fuchsia-500/30', iconColor: 'text-fuchsia-400' },
                            { ref: c2.ref, value: c2.count.toString(), label: '最大Bot同時稼働', icon: Bot, suffix: '個', gradient: 'from-blue-500/30 to-cyan-500/30', iconColor: 'text-cyan-400' },
                            { ref: c3.ref, value: c3.count.toFixed(1), label: 'サーバー稼働率', icon: Activity, suffix: '%', gradient: 'from-emerald-500/30 to-teal-500/30', iconColor: 'text-emerald-400' },
                            { ref: c4.ref, value: c4.count.toString(), label: '完全自動運用', icon: Clock, suffix: '時間', gradient: 'from-amber-500/30 to-pink-500/30', iconColor: 'text-pink-400' },
                        ].map((stat, i) => (
                            <div key={i} ref={stat.ref} className={`relative text-center p-5 sm:p-7 rounded-2xl sm:rounded-3xl glass-surface-dark overflow-hidden group hover:scale-[1.03] transition-all duration-500`}>
                                <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-50 group-hover:opacity-80 transition-opacity`} />
                                <div className="relative">
                                    <stat.icon className={`h-7 w-7 sm:h-9 sm:w-9 mx-auto mb-3 sm:mb-4 ${stat.iconColor}`} />
                                    <p className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-1 tracking-tight">
                                        {stat.value}<span className="text-base sm:text-xl text-white/70">{stat.suffix}</span>
                                    </p>
                                    <p className="text-xs sm:text-sm text-white/60 font-medium">{stat.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ============================================================ */}
            {/* Features — 6 core features                                   */}
            {/* ============================================================ */}
            <section id="features" className="py-24 sm:py-36">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <div className="text-center mb-20 reveal">
                        <p className="text-[11px] font-bold text-purple-600 uppercase tracking-[0.18em] mb-4">FEATURES</p>
                        <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 tracking-[-0.03em] leading-[1.05] mb-5 text-balance">
                            ひとつのプラットフォームで、<br className="hidden sm:inline" />
                            <span className="bg-gradient-to-r from-gray-900 to-gray-500 bg-clip-text text-transparent">すべて自動化。</span>
                        </h2>
                        <p className="text-lg text-gray-500 max-w-xl mx-auto text-pretty">面倒な手作業をゼロに。あなたは戦略だけに集中できます。</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { icon: Video, title: '動画引用ポスト', desc: '指定した参照アカウントのタイムラインから動画付きツイートを自動取得し、引用ツイートとして投稿します。', color: 'bg-purple-50 text-purple-600 border-purple-100' },
                            { icon: Link2, title: 'アフィリエイトURL自動変換', desc: 'ツイート内のDMM/FANZAやMGSのURLを、あなたのアフィリエイトIDに自動で書き換えて投稿します。', color: 'bg-green-50 text-green-600 border-green-100' },
                            { icon: Type, title: 'ランダムテキスト', desc: '事前に登録した複数の文章からランダムに1つ選んで投稿。毎回違う内容で凍結リスクを軽減します。', color: 'bg-blue-50 text-blue-600 border-blue-100' },
                            { icon: Heart, title: '自動いいね', desc: 'キーワードで検索したツイートに自動でいいね。エンゲージメントを上げてフォロワー獲得に繋げます。', color: 'bg-rose-50 text-rose-600 border-rose-100' },
                            { icon: UserPlus, title: '自動フォロー', desc: 'ターゲットアカウントのフォロワーを自動フォロー。1日3回に分散して凍結リスクを抑えます。', color: 'bg-sky-50 text-sky-600 border-sky-100' },
                            { icon: Eye, title: 'シャドウバン自動検出', desc: '毎日深夜4時に全アカウントをチェック。サーチバン等の制限をいち早く検知して通知します。', color: 'bg-amber-50 text-amber-600 border-amber-100' },
                            { icon: Gift, title: '紹介プログラム', desc: '友達を紹介して毎月報酬をGET。紹介した人が有料プランを続ける限り、毎月¥500の報酬が継続的に発生します。', color: 'bg-violet-50 text-violet-600 border-violet-100' },
                        ].map((feature, i) => (
                            <div key={i} className={`p-6 rounded-2xl border ${feature.color} hover:shadow-lg transition-shadow duration-300`}>
                                <div className="h-11 w-11 rounded-xl bg-white flex items-center justify-center mb-4 shadow-sm">
                                    <feature.icon size={22} />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                                <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ============================================================ */}
            {/* How It Works — 3 steps                                       */}
            {/* ============================================================ */}
            <section id="how-it-works" className="py-24 sm:py-36 bg-gradient-to-b from-gray-50 via-white to-gray-50">
                <div className="max-w-5xl mx-auto px-4 sm:px-6">
                    <div className="text-center mb-20 reveal">
                        <p className="text-[11px] font-bold text-purple-600 uppercase tracking-[0.18em] mb-4">HOW IT WORKS</p>
                        <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 tracking-[-0.03em] leading-[1.05] mb-5 text-balance">
                            3ステップ、<span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">最短10分。</span>
                        </h2>
                        <p className="text-lg text-gray-500 text-pretty">難しい設定は一切ありません。</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { step: '01', title: 'アカウント登録 & API設定', desc: 'Xアカウントを追加し、Developer PortalのAPIキーを入力します。投稿に必要な認証はこれだけです。', color: 'from-purple-500 to-purple-600', detail: 'API Key / Secret + Access Token / Secret の4つを入力' },
                            { step: '02', title: 'Botを作成して設定', desc: '参照アカウント・アフィリエイトID・ランダムテキストを入力。引用元と投稿内容を自由にカスタマイズ。', color: 'from-blue-500 to-blue-600', detail: '参照先・テキスト・DMM/MGS ID を設定するだけ' },
                            { step: '03', title: 'スケジュールを選んで稼働', desc: '投稿したい時間帯をクリックで選択し、ステータスを「稼働」に。あとは完全自動で投稿されます。', color: 'from-emerald-500 to-emerald-600', detail: 'ステータスを「稼働」にした瞬間から自動運用開始' },
                        ].map((item, i) => (
                            <div key={i} className="relative">
                                <div className="bg-white rounded-2xl p-7 border border-gray-100 shadow-sm hover:shadow-xl transition-shadow duration-300 h-full flex flex-col">
                                    <div className={`inline-flex h-12 w-12 rounded-xl bg-gradient-to-br ${item.color} items-center justify-center text-white text-lg font-black mb-5 shadow-lg`}>
                                        {item.step}
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                                    <p className="text-sm text-gray-500 leading-relaxed mb-4 flex-1">{item.desc}</p>
                                    <div className="bg-gray-50 rounded-lg px-4 py-2.5 text-xs font-medium text-gray-600 border border-gray-100">
                                        {item.detail}
                                    </div>
                                </div>
                                {i < 2 && (
                                    <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                                        <ArrowRight className="h-6 w-6 text-gray-300" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="text-center mt-14">
                        <Link to="/signup">
                            <Button size="lg" className="rounded-full px-10 h-14 text-base font-bold bg-gray-900 hover:bg-gray-800 text-white shadow-xl shadow-gray-900/15 transition-all hover:scale-[1.02]">
                                無料で始める <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                        <p className="text-xs text-gray-400 mt-3">クレジットカード不要・1分で登録完了</p>
                    </div>
                </div>
            </section>

            {/* ============================================================ */}
            {/* Dashboard Preview — mock UI                                  */}
            {/* ============================================================ */}
            <section className="py-20 sm:py-28 overflow-hidden">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <div className="text-center mb-16">
                        <p className="text-sm font-bold text-purple-600 uppercase tracking-wider mb-3">Dashboard</p>
                        <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">使いやすい管理画面</h2>
                        <p className="text-gray-500 max-w-xl mx-auto">
                            Botの稼働状況、投稿実績、実行ログまで。すべてをリアルタイムで把握できます。
                        </p>
                    </div>

                    <div className="bg-gray-900 rounded-3xl p-3 sm:p-4 shadow-2xl">
                        {/* Window chrome */}
                        <div className="flex items-center gap-2 px-3 py-2 mb-3">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                                <div className="w-3 h-3 rounded-full bg-green-500/80" />
                            </div>
                            <div className="flex-1 text-center">
                                <span className="text-xs text-gray-500 font-mono">sns-tool.online/posutto/dashboard</span>
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-2xl p-4 sm:p-6">
                            {/* Top stats */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                                {[
                                    { label: '稼働中Bot', value: '12', icon: Bot, color: 'text-green-500', bg: 'bg-green-50' },
                                    { label: '本日の投稿', value: '87', icon: BarChart3, color: 'text-blue-500', bg: 'bg-blue-50' },
                                    { label: '累計いいね', value: '4,521', icon: Heart, color: 'text-rose-500', bg: 'bg-rose-50' },
                                    { label: '累計フォロー', value: '2,130', icon: UserPlus, color: 'text-purple-500', bg: 'bg-purple-50' },
                                ].map((stat, i) => (
                                    <div key={i} className="bg-white rounded-xl p-4 border border-gray-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className={`h-8 w-8 rounded-lg ${stat.bg} flex items-center justify-center`}>
                                                <stat.icon size={16} className={stat.color} />
                                            </div>
                                            <span className="text-xs text-gray-400">{stat.label}</span>
                                        </div>
                                        <p className="text-2xl font-black text-gray-900">{stat.value}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Bot card mock + Log viewer mock */}
                            <div className="grid lg:grid-cols-2 gap-4">
                                {/* Bot card */}
                                <div className="bg-white rounded-xl p-5 border border-gray-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                                                <Bot size={18} className="text-purple-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">メインBot #1</p>
                                                <p className="text-xs text-gray-400">@your_account</p>
                                            </div>
                                        </div>
                                        <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">稼働中</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-gray-50 rounded-lg p-3 text-center">
                                            <p className="text-xs text-gray-400">累計いいね</p>
                                            <p className="text-lg font-bold text-gray-900">1,234</p>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-3 text-center">
                                            <p className="text-xs text-gray-400">累計フォロー</p>
                                            <p className="text-lg font-bold text-gray-900">567</p>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex items-center gap-1 text-xs text-gray-400">
                                        <Clock size={12} />
                                        最終実行: 3分前
                                    </div>
                                </div>

                                {/* Log viewer mock */}
                                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">実行ログ</p>
                                            <p className="text-xs text-gray-400">リアルタイムで確認</p>
                                        </div>
                                        <FileText size={16} className="text-gray-400" />
                                    </div>
                                    <div className="p-3 space-y-2">
                                        {[
                                            { type: 'success', icon: CheckCircle, msg: '動画を引用ツイートしました', time: '14:32', color: 'bg-green-50 border-green-200 text-green-700' },
                                            { type: 'info', icon: Info, msg: 'アフィリエイトURL変換完了 (DMM)', time: '14:32', color: 'bg-blue-50 border-blue-200 text-blue-700' },
                                            { type: 'success', icon: CheckCircle, msg: '自動いいね: 5件実行', time: '14:15', color: 'bg-green-50 border-green-200 text-green-700' },
                                            { type: 'warning', icon: AlertTriangle, msg: 'レート制限に近づいています', time: '13:50', color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
                                        ].map((log, i) => (
                                            <div key={i} className={`flex items-start gap-2 p-2.5 rounded-lg border text-xs ${log.color}`}>
                                                <log.icon size={14} className="mt-0.5 shrink-0" />
                                                <span className="flex-1">{log.msg}</span>
                                                <span className="text-[10px] opacity-60 shrink-0">{log.time}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ============================================================ */}
            {/* Detailed Feature Showcase — alternating layout               */}
            {/* ============================================================ */}
            <section className="py-20 sm:py-28 bg-gray-50">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-24">
                    {/* Feature 1: Video Quote */}
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-bold mb-4">
                                <Video size={12} /> CORE FEATURE
                            </div>
                            <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mb-4 leading-tight">
                                参照アカウントの動画を<br />自動で引用ツイート
                            </h3>
                            <p className="text-gray-500 mb-6 leading-relaxed">
                                指定した複数のアカウントのタイムラインを10分ごとにチェック。
                                動画付きツイートだけをフィルタリングし、まだ投稿していない新しい動画をランダムに選んで自動で引用ツイートします。
                            </p>
                            <ul className="space-y-3">
                                {['複数の参照アカウントに対応', '動画のみを自動フィルタリング', '重複投稿を完全に防止', '引用ツイートで原文の動画が再生可能'].map(text => (
                                    <li key={text} className="flex items-center gap-3 text-sm text-gray-700">
                                        <div className="h-5 w-5 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                                            <Check size={12} className="text-purple-600" />
                                        </div>
                                        {text}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
                            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 space-y-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                                        <Bot size={16} className="text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold">あなたのBot</p>
                                        <p className="text-xs text-gray-400">@your_account</p>
                                    </div>
                                    <span className="ml-auto text-xs text-gray-400">たった今</span>
                                </div>
                                <p className="text-sm text-gray-800">めっちゃ面白い！見て！</p>
                                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 flex items-center gap-3">
                                    <div className="h-12 w-16 rounded bg-purple-200 flex items-center justify-center shrink-0">
                                        <Play size={16} className="text-purple-600" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-gray-700 truncate">@reference_account の動画</p>
                                        <p className="text-xs text-gray-400">引用ツイート</p>
                                    </div>
                                </div>
                                <p className="text-xs text-blue-500 truncate">https://fanza.co.jp/...?id=<span className="font-bold text-green-600">あなたのID</span></p>
                            </div>
                        </div>
                    </div>

                    {/* Feature 2: Affiliate URL */}
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="order-2 lg:order-1">
                            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">URL自動変換の例</p>
                                <div className="space-y-3">
                                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                        <p className="text-xs text-gray-400 mb-1">変換前（参照元のURL）</p>
                                        <p className="text-sm font-mono text-gray-600 break-all">
                                            https://www.dmm.co.jp/digital/...?id=<span className="text-red-500 line-through">other_id</span>
                                        </p>
                                    </div>
                                    <div className="flex justify-center">
                                        <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                                            <ArrowRight size={14} className="text-green-600 rotate-90" />
                                        </div>
                                    </div>
                                    <div className="bg-white rounded-xl p-4 border-2 border-green-200">
                                        <p className="text-xs text-green-600 font-bold mb-1">変換後（あなたのIDで投稿）</p>
                                        <p className="text-sm font-mono text-gray-800 break-all">
                                            https://www.dmm.co.jp/digital/...?id=<span className="text-green-600 font-bold">your_aff_id</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-4 flex gap-2">
                                    <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded font-bold">DMM対応</span>
                                    <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded font-bold">FANZA対応</span>
                                    <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded font-bold">MGS対応</span>
                                </div>
                            </div>
                        </div>
                        <div className="order-1 lg:order-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold mb-4">
                                <Link2 size={12} /> AFFILIATE
                            </div>
                            <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mb-4 leading-tight">
                                アフィリエイトURLを<br />自動であなたのIDに変換
                            </h3>
                            <p className="text-gray-500 mb-6 leading-relaxed">
                                参照元ツイートに含まれるDMM/FANZAやMGSのURLを検出し、
                                アフィリエイトIDパラメータをあなたのIDに自動置換します。
                                カスタムURLにも対応。本文かリプライか配置場所も選べます。
                            </p>
                            <ul className="space-y-3">
                                {['DMM / FANZA の id= パラメータを自動置換', 'MGS の c= パラメータを自動置換', 'リプライに分離して投稿も可能', 'カスタムアフィリエイトURLにも対応'].map(text => (
                                    <li key={text} className="flex items-center gap-3 text-sm text-gray-700">
                                        <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                            <Check size={12} className="text-green-600" />
                                        </div>
                                        {text}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Feature 3: Auto Like & Follow */}
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-bold mb-4">
                                <Heart size={12} /> ENGAGEMENT
                            </div>
                            <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mb-4 leading-tight">
                                自動いいね＆フォローで<br />エンゲージメントを最大化
                            </h3>
                            <p className="text-gray-500 mb-6 leading-relaxed">
                                キーワード検索で見つけたツイートへの自動いいねと、ターゲットアカウントのフォロワーへの自動フォロー。
                                凍結リスクを抑えるため、1日3回に分散して実行します。
                            </p>
                            <ul className="space-y-3">
                                {['キーワードベースの自動いいね', 'ターゲットアカウントのフォロワーを自動フォロー', '1日3回に分散実行で凍結対策', 'いいね・フォロー数を自動カウント'].map(text => (
                                    <li key={text} className="flex items-center gap-3 text-sm text-gray-700">
                                        <div className="h-5 w-5 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                                            <Check size={12} className="text-rose-600" />
                                        </div>
                                        {text}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">自動エンゲージメントの流れ</p>
                            <div className="space-y-4">
                                {/* Step 1 */}
                                <div className="flex items-center gap-4 p-4 bg-rose-50 rounded-xl border border-rose-100">
                                    <div className="h-10 w-10 rounded-lg bg-rose-100 flex items-center justify-center shrink-0">
                                        <Search size={18} className="text-rose-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-800">キーワード検索</p>
                                        <p className="text-xs text-gray-500">設定したキーワードでツイートを検索</p>
                                    </div>
                                </div>
                                {/* Arrow */}
                                <div className="flex justify-center"><ArrowRight size={16} className="text-gray-300 rotate-90" /></div>
                                {/* Step 2 */}
                                <div className="flex items-center gap-4 p-4 bg-pink-50 rounded-xl border border-pink-100">
                                    <div className="h-10 w-10 rounded-lg bg-pink-100 flex items-center justify-center shrink-0">
                                        <Heart size={18} className="text-pink-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-800">自動いいね実行</p>
                                        <p className="text-xs text-gray-500">1回あたり最大5件に分散いいね</p>
                                    </div>
                                </div>
                                <div className="flex justify-center"><ArrowRight size={16} className="text-gray-300 rotate-90" /></div>
                                {/* Step 3 */}
                                <div className="flex items-center gap-4 p-4 bg-sky-50 rounded-xl border border-sky-100">
                                    <div className="h-10 w-10 rounded-lg bg-sky-100 flex items-center justify-center shrink-0">
                                        <UserPlus size={18} className="text-sky-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-800">自動フォロー</p>
                                        <p className="text-xs text-gray-500">ターゲットのフォロワーを1日3回に分散</p>
                                    </div>
                                </div>
                                <div className="flex justify-center"><ArrowRight size={16} className="text-gray-300 rotate-90" /></div>
                                {/* Result */}
                                <div className="flex items-center gap-4 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                                    <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                                        <TrendingUp size={18} className="text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-emerald-700">エンゲージメント向上</p>
                                        <p className="text-xs text-emerald-600">フォロワー増加＆インプレッション拡大</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ============================================================ */}
            {/* Social Proof / Reviews                                       */}
            {/* ============================================================ */}
            <section className="py-20">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <div className="text-center mb-12">
                        <p className="text-sm font-bold text-purple-600 uppercase tracking-wider mb-3">Reviews</p>
                        <h2 className="text-3xl font-black text-gray-900 mb-3">利用者の声</h2>
                        <p className="text-gray-500 text-sm">Posuttoをご利用いただいている方々の感想です</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { name: "K.S", role: "アフィリエイター歴3年", text: "手動で10アカウント運用していましたが、導入後は100アカウントまで拡大。収益は3倍に。空いた時間で新ジャンルの開拓もできるようになりました。", avatar: "https://i.pravatar.cc/80?img=11" },
                            { name: "M.T", role: "副業アフィリエイター", text: "本業が忙しく投稿が追いつかなかったのが、完全自動で収益が発生する仕組みが作れました。動画引用の自動化が特に便利です。", avatar: "https://i.pravatar.cc/80?img=12" },
                            { name: "Y.O", role: "専業アフィリエイター", text: "凍結対策がしっかりしているのがありがたい。ランダムテキストとシャドウバン検出のおかげで、安心してアカウントを増やせています。", avatar: "https://i.pravatar.cc/80?img=33" },
                            { name: "R.I", role: "マーケター", text: "管理画面がとにかく見やすい。Bot数が多くなっても一括管理できるし、ログもリアルタイムで確認できるので安心感があります。", avatar: "https://i.pravatar.cc/80?img=53" },
                            { name: "A.K", role: "フリーランス", text: "自動いいね＆フォロー機能でフォロワーが着実に増えています。1日3回に分散して実行してくれるので、アカウント凍結の不安もありません。", avatar: "https://i.pravatar.cc/80?img=47" },
                            { name: "H.N", role: "副業ブロガー", text: "紹介プログラムも魅力的。友人に勧めたら毎月の報酬が発生するようになり、Posuttoの利用料を余裕でカバーできています。", avatar: "https://i.pravatar.cc/80?img=60" },
                        ].map((review, i) => (
                            <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-shadow duration-300">
                                <div className="text-amber-400 mb-3 text-sm">{'★'.repeat(5)}</div>
                                <p className="text-sm text-gray-600 mb-5 leading-relaxed">{review.text}</p>
                                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                                    <img
                                        src={review.avatar}
                                        alt={review.name}
                                        className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-100"
                                    />
                                    <div>
                                        <div className="font-bold text-gray-900 text-sm">{review.name}さん</div>
                                        <div className="text-xs text-gray-400">{review.role}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ============================================================ */}
            {/* Security & Trust                                             */}
            {/* ============================================================ */}
            <section className="py-20 sm:py-28 bg-gray-50">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <div className="text-center mb-16">
                        <p className="text-sm font-bold text-purple-600 uppercase tracking-wider mb-3">Security & Trust</p>
                        <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">安心・安全の運用体制</h2>
                        <p className="text-gray-500 max-w-xl mx-auto">
                            アカウント保護、安全な決済、リアルタイム監視、自動バックアップ。安心して運用に集中できます。
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Shadowban Detection */}
                        <div className="bg-white rounded-2xl p-7 border border-gray-100 shadow-sm hover:shadow-xl transition-shadow duration-300 text-center">
                            <div className="h-16 w-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-5">
                                <Shield size={30} className="text-amber-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-3">シャドウバン自動検出</h3>
                            <p className="text-sm text-gray-500 leading-relaxed mb-4">
                                毎日深夜4:00に全アカウントを自動チェック。サーチバン・ゴーストバンなどの制限をいち早く検知し、ダッシュボードに通知します。
                            </p>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 text-xs font-bold">
                                <Clock size={12} /> 毎日 AM 4:00 自動実行
                            </div>
                        </div>

                        {/* Stripe Payment */}
                        <div className="bg-white rounded-2xl p-7 border border-gray-100 shadow-sm hover:shadow-xl transition-shadow duration-300 text-center">
                            <div className="h-16 w-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-5">
                                <CreditCard size={30} className="text-blue-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-3">Stripeで安全決済</h3>
                            <p className="text-sm text-gray-500 leading-relaxed mb-4">
                                決済はStripeを通じて安全に処理。SSL暗号化でカード情報を保護。プランのアップグレードは日割り計算で即時反映されます。
                            </p>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
                                <Lock size={12} /> SSL暗号化・いつでも解約可
                            </div>
                        </div>

                        {/* Real-time Logs */}
                        <div className="bg-white rounded-2xl p-7 border border-gray-100 shadow-sm hover:shadow-xl transition-shadow duration-300 text-center">
                            <div className="h-16 w-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-5">
                                <FileText size={30} className="text-emerald-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-3">リアルタイム実行ログ</h3>
                            <p className="text-sm text-gray-500 leading-relaxed mb-4">
                                各Botの実行ログを色分け表示で確認。投稿成功・エラー・警告を一目で把握できるモーダルビューアを搭載しています。
                            </p>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
                                <Activity size={12} /> 30日間のログを保存
                            </div>
                        </div>

                        {/* Auto Backup */}
                        <div className="bg-white rounded-2xl p-7 border border-gray-100 shadow-sm hover:shadow-xl transition-shadow duration-300 text-center">
                            <div className="h-16 w-16 rounded-2xl bg-purple-50 flex items-center justify-center mx-auto mb-5">
                                <Database size={30} className="text-purple-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-3">自動データバックアップ</h3>
                            <p className="text-sm text-gray-500 leading-relaxed mb-4">
                                3時間ごとにデータを自動バックアップ。Bot設定や投稿履歴など、大切なデータを安全に保護します。
                            </p>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-50 text-purple-700 text-xs font-bold">
                                <Clock size={12} /> 3時間ごとに自動実行
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ============================================================ */}
            {/* Pricing                                                      */}
            {/* ============================================================ */}
            <section id="pricing" className="py-20 sm:py-28">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <div className="text-center mb-16">
                        <p className="text-sm font-bold text-purple-600 uppercase tracking-wider mb-3">Pricing</p>
                        <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">シンプルな料金プラン</h2>
                        <p className="text-gray-500 max-w-xl mx-auto">
                            まずは無料で試して、収益に合わせてスケールアップ。
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {PLANS.map((plan, i) => (
                            <div
                                key={i}
                                className={`relative flex flex-col p-6 rounded-2xl border transition-all duration-300 ${
                                    plan.popular
                                        ? 'border-purple-300 bg-purple-50/30 shadow-xl shadow-purple-100/50 scale-[1.02] z-10'
                                        : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-lg'
                                }`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg flex items-center gap-1">
                                        <Crown size={11} className="fill-current" /> おすすめ
                                    </div>
                                )}

                                <div className="mb-6">
                                    <h4 className={`text-lg font-bold mb-3 ${plan.popular ? 'text-purple-700' : 'text-gray-700'}`}>{plan.name}</h4>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-black text-gray-900">
                                            {plan.price === 0 ? '無料' : `¥${plan.price.toLocaleString()}`}
                                        </span>
                                        {plan.price > 0 && <span className="text-gray-400 text-sm">/月</span>}
                                    </div>
                                </div>

                                <ul className="space-y-3 mb-6 flex-1">
                                    <li className="flex items-center gap-3 text-sm text-gray-600">
                                        <Check size={16} className={`shrink-0 ${plan.popular ? 'text-purple-500' : 'text-gray-400'}`} />
                                        Bot作成 <strong className="ml-auto text-gray-900">{plan.bots}個</strong>
                                    </li>
                                    <li className="flex items-center gap-3 text-sm text-gray-600">
                                        <Check size={16} className={`shrink-0 ${plan.popular ? 'text-purple-500' : 'text-gray-400'}`} />
                                        投稿上限 <strong className="ml-auto text-gray-900">{plan.tweets}回/日</strong>
                                    </li>
                                    <li className="flex items-center gap-3 text-sm text-gray-600">
                                        <Check size={16} className={`shrink-0 ${plan.popular ? 'text-purple-500' : 'text-gray-400'}`} />
                                        全機能利用可能
                                    </li>
                                </ul>

                                <Link to="/signup" className="mt-auto">
                                    <Button
                                        className={`w-full py-5 rounded-xl font-bold text-sm transition-all ${
                                            plan.popular
                                                ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-200'
                                                : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                                        }`}
                                    >
                                        {plan.price === 0 ? '無料で始める' : '選択する'}
                                    </Button>
                                </Link>
                            </div>
                        ))}
                    </div>

                    <p className="text-center text-xs text-gray-400 mt-6">
                        アップグレード時は日割り計算で差額のみ請求。いつでもキャンセル可能です。
                    </p>
                </div>
            </section>

            {/* ============================================================ */}
            {/* FAQ                                                          */}
            {/* ============================================================ */}
            <section id="faq" className="py-20 bg-gray-50">
                <div className="max-w-3xl mx-auto px-4 sm:px-6">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-black text-gray-900 mb-2">よくある質問</h2>
                        <p className="text-gray-500 text-sm">気になる点をクリックして確認してください</p>
                    </div>

                    <div className="space-y-3">
                        {[
                            { q: "無料プランはずっと無料ですか？", a: "はい、期間制限なく無料でご利用いただけます。Bot数1、投稿数5回/日の制限がありますが、全機能を試せます。" },
                            { q: "APIキーはどこで取得しますか？", a: "X Developer Portal (developer.x.com) でプロジェクトを作成し、API Key/Secret、Access Token/Secretの4つを取得します。詳しい手順はログイン後のセットアップガイドに記載しています。" },
                            { q: "凍結リスクはありますか？", a: "ランダムテキスト機能、投稿間隔のランダム化、シャドウバン自動検出など、最大限のリスクヘッジ機能を搭載しています。" },
                            { q: "DMM/FANZAのアフィリエイトリンクは使えますか？", a: "はい。DMM/FANZAとMGSのアフィリエイトURLを自動変換する機能が組み込まれています。カスタムURLにも対応しています。" },
                            { q: "プランの変更は日割り計算ですか？", a: "はい。アップグレード時は残り期間に応じた日割り計算で差額のみが請求されます。ダウングレード時は請求期間の終了時に反映されます。" },
                            { q: "Botの実行状況は確認できますか？", a: "はい。各Botの実行ログをリアルタイムで確認できるログビューア機能を搭載しています。成功・エラー・警告を色分けで一目で把握できます。" },
                            { q: "スマホだけで使えますか？", a: "はい、ブラウザベースのため全端末（PC・スマホ・タブレット）からアクセスし、すべての機能をご利用いただけます。" },
                            { q: "解約はいつでもできますか？", a: "はい、ダッシュボードからいつでも解約可能です。解約後も請求期間の終了まではサービスを利用できます。" },
                            { q: "紹介プログラムとは何ですか？", a: "友達をPosuttoに紹介し、紹介された方が有料プランに加入すると毎月¥500の報酬が発生します。紹介した方が有料プランを継続する限り、毎月報酬が継続的に入ります。紹介者は自分の特典コンテンツ（テキスト・ファイル添付）を設定して紹介リンクから配布できます。" },
                            { q: "データのバックアップはされますか？", a: "はい、3時間ごとに自動でデータバックアップが実行されます。Bot設定・投稿履歴・アカウント情報など、大切なデータを安全に保護しています。" },
                        ].map((item, i) => (
                            <div key={i} className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                                <button
                                    onClick={() => toggleFaq(i)}
                                    className="w-full text-left px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                                >
                                    <span className="font-bold text-gray-900 text-sm pr-4">{item.q}</span>
                                    <ChevronDown
                                        size={18}
                                        className={`transform transition-transform text-gray-400 shrink-0 ${activeFaq === i ? 'rotate-180 text-purple-500' : ''}`}
                                    />
                                </button>
                                {activeFaq === i && (
                                    <div className="px-5 py-4 border-t border-gray-100 text-sm text-gray-600 leading-relaxed bg-gray-50/50">
                                        {item.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ============================================================ */}
            {/* Final CTA                                                    */}
            {/* ============================================================ */}
            <section className="py-24 bg-gray-900 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/30 via-transparent to-transparent" />
                <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
                    <h2 className="text-3xl sm:text-4xl font-black mb-4">
                        アフィリエイト収益を<br />自動化しませんか？
                    </h2>
                    <p className="text-gray-400 mb-10 max-w-lg mx-auto">
                        登録は無料。クレジットカード不要。<br />
                        今すぐPosuttoで自動運用を始めましょう。
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link to="/signup">
                            <Button size="lg" className="rounded-full px-10 h-14 text-base font-bold bg-white text-gray-900 hover:bg-gray-100 shadow-xl transition-all hover:scale-[1.02]">
                                無料で始める <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                        <Button
                            variant="outline"
                            size="lg"
                            onClick={handleDemoLogin}
                            className="rounded-full px-10 h-14 text-base border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white transition-all"
                        >
                            デモを試す
                        </Button>
                    </div>
                </div>
            </section>

            {/* ============================================================ */}
            {/* Footer                                                       */}
            {/* ============================================================ */}
            <footer className="bg-gray-950 border-t border-gray-800 py-10">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <img src="/posutto/assets/logo.png" alt="Posutto" className="h-6 w-6 grayscale opacity-30" />
                        <span className="font-bold text-gray-500 text-sm">Posutto</span>
                    </div>
                    <div className="flex gap-6 text-xs text-gray-500">
                        <Link to="/terms" className="hover:text-gray-300 transition-colors">利用規約</Link>
                        <Link to="/privacy" className="hover:text-gray-300 transition-colors">プライバシーポリシー</Link>
                        <Link to="/legal" className="hover:text-gray-300 transition-colors">特定商取引法</Link>
                    </div>
                    <p className="text-xs text-gray-600">
                        &copy; Posutto. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}
