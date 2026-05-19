import { useNavigate } from 'react-router-dom';
import {
    HelpCircle,
    LayoutDashboard,
    Bot,
    Activity,
    ArrowRight,
    CheckCircle2,
    Zap,
    Heart,
    UserPlus,
    Search,
    Key,
    Video,
    Link2,
    Type,
    Clock,
    Settings,
    AlertTriangle,
    Rocket,
    Trophy,
    MessageSquare,
    ToggleRight,
    Gift,
    CreditCard,
    FileText,
    ScrollText,
    Copy,
    Share2,
    DollarSign,
} from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function Guide() {
    const navigate = useNavigate();
    return (
        <div className="max-w-4xl mx-auto space-y-16 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Hero Section */}
            <div className="text-center space-y-4 pt-8">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-bold tracking-wide">
                    <HelpCircle size={16} />
                    <span>SETUP GUIDE</span>
                </div>
                <h1 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight">
                    Posutto セットアップガイド
                </h1>
                <p className="text-base sm:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
                    アカウント登録からBot稼働まで、すべての設定手順をステップバイステップで解説します。
                </p>
            </div>

            {/* Quick Navigation */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
                {[
                    { name: '初期設定', icon: Rocket, href: '#quickstart' },
                    { name: 'API設定', icon: Key, href: '#api-setup' },
                    { name: 'Bot設定', icon: Bot, href: '#bot-setup' },
                    { name: '選手権Bot', icon: Trophy, href: '#championship-bot' },
                    { name: 'アフィリエイト', icon: Gift, href: '#affiliate' },
                    { name: 'プラン', icon: CreditCard, href: '#plans' },
                    { name: '機能一覧', icon: LayoutDashboard, href: '#features' },
                ].map((item) => (
                    <a
                        key={item.href}
                        href={item.href}
                        className="flex flex-col items-center gap-2 sm:gap-3 p-4 sm:p-6 bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                    >
                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                            <item.icon size={22} />
                        </div>
                        <span className="text-xs sm:text-sm font-bold text-gray-600 group-hover:text-gray-900">{item.name}</span>
                    </a>
                ))}
            </div>

            {/* ========================================================= */}
            {/* Quick Start - Overall Flow                                */}
            {/* ========================================================= */}
            <section id="quickstart" className="space-y-8 scroll-mt-24">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
                        <Rocket size={28} />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">初期セットアップの流れ</h2>
                </div>

                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl p-6 sm:p-8 md:p-10">
                    <p className="text-gray-600 mb-8">以下の5ステップで、Botの自動投稿が開始されます。</p>

                    <div className="space-y-0">
                        {[
                            {
                                step: 1,
                                title: 'Xアカウントを登録する',
                                desc: 'サイドバーの「アカウント設定」から、Botで使うXアカウントの情報（@ユーザー名など）を登録します。',
                                link: '/dashboard/settings/account',
                                linkText: 'アカウント設定を開く',
                                color: 'bg-blue-500',
                            },
                            {
                                step: 2,
                                title: 'X API キーを設定する',
                                desc: 'X Developer Portalで取得した4つのキー（API Key, API Secret, Access Token, Access Token Secret）をアカウント情報に入力します。',
                                link: null,
                                linkText: '',
                                color: 'bg-indigo-500',
                            },
                            {
                                step: 3,
                                title: 'Botを作成する',
                                desc: '「Bot管理」→「Bot新規作成」で、Botタイプ（動画引用 or 選手権リプライ）を選んで設定します。',
                                link: '/dashboard/bots/new',
                                linkText: 'Bot作成画面を開く',
                                color: 'bg-purple-500',
                            },
                            {
                                step: 4,
                                title: 'スケジュールを設定する',
                                desc: 'Bot編集画面の「スケジュール」タブで、投稿する時間帯をクリックして選択します。10分刻みで設定できます。',
                                link: null,
                                linkText: '',
                                color: 'bg-amber-500',
                            },
                            {
                                step: 5,
                                title: 'ステータスを「稼働」にする',
                                desc: '基本設定のステータスを「稼働」にして保存すれば、スケジュール通りに自動投稿が始まります。',
                                link: null,
                                linkText: '',
                                color: 'bg-emerald-500',
                            },
                        ].map((item, i) => (
                            <div key={item.step} className="flex gap-4">
                                {/* Timeline line */}
                                <div className="flex flex-col items-center">
                                    <div className={`h-10 w-10 rounded-full ${item.color} text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-lg`}>
                                        {item.step}
                                    </div>
                                    {i < 4 && <div className="w-0.5 h-full bg-gray-200 my-1" />}
                                </div>
                                <div className={`pb-8`}>
                                    <h4 className="font-bold text-gray-900 text-lg">{item.title}</h4>
                                    <p className="text-sm text-gray-600 mt-1">{item.desc}</p>
                                    {item.link && (
                                        <button
                                            onClick={() => navigate(item.link!)}
                                            className="mt-2 text-sm text-primary font-bold flex items-center gap-1 hover:underline"
                                        >
                                            {item.linkText} <ArrowRight size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========================================================= */}
            {/* X API Setup (2026年最新版)                                */}
            {/* ========================================================= */}
            <section id="api-setup" className="space-y-8 scroll-mt-24">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-sky-50 text-sky-500 flex items-center justify-center">
                        <Key size={28} />
                    </div>
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">X API キーの取得と設定</h2>
                        <p className="text-xs text-gray-400 mt-1">2026年最新版 — console.x.com 対応</p>
                    </div>
                </div>

                {/* Important Notice */}
                <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5 sm:p-6 flex gap-4">
                    <AlertTriangle className="h-6 w-6 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-bold text-amber-800 mb-1">重要: APIキーは必須です</h4>
                        <p className="text-sm text-amber-700">
                            自動投稿・自動いいね・自動フォローを使うには、各アカウントにX APIの認証情報が必要です。
                            APIキーが未設定のアカウントではBot機能は動作しません。
                        </p>
                    </div>
                </div>

                {/* Overview: What you need */}
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl p-6 sm:p-8 md:p-10">
                    <div className="flex items-center gap-3 mb-6">
                        <Clock size={20} className="text-gray-400" />
                        <p className="text-sm text-gray-600">所要時間: 約<strong>15分</strong> ・ 全<strong>7ステップ</strong></p>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 mb-4">取得する4つのキー</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                        {[
                            { name: 'API Key', alt: 'Consumer Key', color: 'border-blue-200 bg-blue-50 text-blue-700' },
                            { name: 'API Key Secret', alt: 'Consumer Secret', color: 'border-blue-200 bg-blue-50 text-blue-700' },
                            { name: 'Access Token', alt: 'ユーザー認証用', color: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
                            { name: 'Access Token Secret', alt: 'ユーザー認証用', color: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
                        ].map(k => (
                            <div key={k.name} className={`p-3 rounded-xl border ${k.color} text-center`}>
                                <p className="font-bold text-sm">{k.name}</p>
                                <p className="text-[10px] opacity-70 mt-0.5">{k.alt}</p>
                            </div>
                        ))}
                    </div>

                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <p className="text-sm text-red-700 flex items-start gap-2">
                            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                            <span>
                                <strong>セキュリティ注意:</strong> APIキーはアカウントのパスワードと同等の重要情報です。
                                GitHubなどへの公開は厳禁。万が一流出した場合は即座に再生成してください。
                            </span>
                        </p>
                    </div>
                </div>

                {/* Step-by-step guide */}
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl p-6 sm:p-8 md:p-12 space-y-10">

                    {/* Step 1 */}
                    <div className="space-y-4">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-3">
                            <span className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-white text-sm font-bold shadow-lg shadow-primary/30">1</span>
                            X Developer Console にログイン
                        </h3>
                        <div className="ml-11 space-y-3">
                            <ol className="space-y-3 text-sm text-gray-600">
                                <li className="flex items-start gap-3">
                                    <ArrowRight size={14} className="mt-1 text-primary shrink-0" />
                                    <span>
                                        <a href="https://console.x.com/" target="_blank" rel="noreferrer" className="text-primary hover:underline font-bold">
                                            https://console.x.com/
                                        </a>
                                        {' '}にアクセスします。
                                    </span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <ArrowRight size={14} className="mt-1 text-primary shrink-0" />
                                    <span><strong>Botで使うXアカウント</strong>でログインしてください（普段使いとは別のアカウント推奨）。</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <ArrowRight size={14} className="mt-1 text-primary shrink-0" />
                                    <span>初回は <strong>Developer Agreement（開発者規約）</strong> への同意が求められます。チェックを入れて「Submit」をクリック。</span>
                                </li>
                            </ol>
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                                <p className="text-sm text-blue-800">
                                    <strong>ポイント:</strong> 2026年現在、以前のような審査プロセスはありません。同意後すぐにAPIキーの発行を開始できます。
                                </p>
                            </div>

                            {/* Mock UI: Developer Agreement */}
                            <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                                <div className="bg-black px-4 py-2.5 flex items-center gap-2">
                                    <div className="flex gap-1.5">
                                        <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                                        <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                                        <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
                                    </div>
                                    <div className="flex-1 text-center">
                                        <span className="text-[10px] text-gray-500 font-mono">console.x.com</span>
                                    </div>
                                </div>
                                <div className="bg-gray-950 p-6 space-y-4">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="h-8 w-8 bg-white rounded-md flex items-center justify-center">
                                            <span className="text-black font-black text-sm">X</span>
                                        </div>
                                        <span className="text-white font-bold text-sm">Developer Agreement</span>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-start gap-2">
                                            <div className="h-4 w-4 rounded border-2 border-blue-500 bg-blue-500 flex items-center justify-center mt-0.5 shrink-0">
                                                <CheckCircle2 size={10} className="text-white" />
                                            </div>
                                            <span className="text-gray-400 text-xs">I accept the Terms & Conditions</span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <div className="h-4 w-4 rounded border-2 border-blue-500 bg-blue-500 flex items-center justify-center mt-0.5 shrink-0">
                                                <CheckCircle2 size={10} className="text-white" />
                                            </div>
                                            <span className="text-gray-400 text-xs">I agree to the Developer Agreement</span>
                                        </div>
                                    </div>
                                    <button className="px-5 py-2 bg-blue-500 text-white text-xs font-bold rounded-full hover:bg-blue-600">Submit</button>
                                </div>
                            </div>
                            <p className="text-[10px] text-gray-400 text-center italic">※ 上記はイメージです。実際の画面とは異なる場合があります。</p>
                        </div>
                    </div>

                    <div className="h-px bg-gray-100" />

                    {/* Step 2 */}
                    <div className="space-y-4">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-3">
                            <span className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-white text-sm font-bold shadow-lg shadow-primary/30">2</span>
                            プロジェクトとアプリを作成
                        </h3>
                        <div className="ml-11 space-y-3">
                            <ol className="space-y-3 text-sm text-gray-600">
                                <li className="flex items-start gap-3">
                                    <ArrowRight size={14} className="mt-1 text-primary shrink-0" />
                                    <span>ダッシュボードで <strong>「+ Create Project」</strong> をクリックします。</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <ArrowRight size={14} className="mt-1 text-primary shrink-0" />
                                    <span>プロジェクト名を入力（例: 「Posutto Bot」）。</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <ArrowRight size={14} className="mt-1 text-primary shrink-0" />
                                    <span>Use case は <strong>「Making a bot」</strong> を選択します。</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <ArrowRight size={14} className="mt-1 text-primary shrink-0" />
                                    <span>続けてアプリ名を入力（例: 「posutto-app」）して作成。<strong>Production環境</strong>で作成してください。</span>
                                </li>
                            </ol>

                            {/* Mock UI: Create Project */}
                            <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                                <div className="bg-black px-4 py-2.5 flex items-center gap-2">
                                    <div className="flex gap-1.5">
                                        <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                                        <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                                        <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
                                    </div>
                                    <div className="flex-1 text-center">
                                        <span className="text-[10px] text-gray-500 font-mono">console.x.com / dashboard</span>
                                    </div>
                                </div>
                                <div className="bg-gray-950 p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <span className="text-white font-bold text-sm">Projects & Apps</span>
                                        <button className="px-4 py-1.5 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                                            + Create Project
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-gray-500 text-[10px] font-bold uppercase tracking-wider block mb-1">Project Name</label>
                                            <div className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white">Posutto Bot</div>
                                        </div>
                                        <div>
                                            <label className="text-gray-500 text-[10px] font-bold uppercase tracking-wider block mb-1">Use Case</label>
                                            <div className="bg-gray-900 border border-blue-500 rounded-lg px-3 py-2 text-xs text-blue-400 flex items-center justify-between">
                                                <span>Making a bot</span>
                                                <span className="text-blue-500 text-[10px]">Selected</span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-gray-500 text-[10px] font-bold uppercase tracking-wider block mb-1">App Name</label>
                                            <div className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white">posutto-app</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <p className="text-[10px] text-gray-400 text-center italic">※ 上記はイメージです。実際の画面とは異なる場合があります。</p>
                        </div>
                    </div>

                    <div className="h-px bg-gray-100" />

                    {/* Step 3 */}
                    <div className="space-y-4">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-3">
                            <span className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-white text-sm font-bold shadow-lg shadow-primary/30">3</span>
                            User Authentication を設定
                        </h3>
                        <div className="ml-11 space-y-3">
                            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                <p className="text-sm text-red-700 font-medium flex items-start gap-2">
                                    <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                                    <span>この設定を忘れると投稿・いいね・フォローが動作しません。<strong>必ず先に設定</strong>してからキーを発行してください。</span>
                                </p>
                            </div>
                            <ol className="space-y-3 text-sm text-gray-600">
                                <li className="flex items-start gap-3">
                                    <ArrowRight size={14} className="mt-1 text-primary shrink-0" />
                                    <span>作成したアプリの設定画面で <strong>「User authentication settings」</strong> の <strong>「Set up」</strong> ボタンをクリック。</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <ArrowRight size={14} className="mt-1 text-primary shrink-0" />
                                    <span>
                                        App permissions を <strong>「Read and write and Direct message」</strong> に設定。
                                    </span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <ArrowRight size={14} className="mt-1 text-primary shrink-0" />
                                    <span>Type of App は <strong>「Web App, Automated App or Bot」</strong> を選択。</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <ArrowRight size={14} className="mt-1 text-primary shrink-0" />
                                    <div>
                                        <span>以下の値を入力して <strong>「Save」</strong> をクリック:</span>
                                        <div className="mt-3 space-y-2 bg-gray-900 rounded-xl p-4">
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                                                <span className="text-xs font-bold text-gray-400 shrink-0 w-28 font-mono">Callback URI</span>
                                                <code className="text-emerald-400 text-xs font-mono select-all break-all">https://sns-tool.online/posutto/dashboard</code>
                                            </div>
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                                                <span className="text-xs font-bold text-gray-400 shrink-0 w-28 font-mono">Website URL</span>
                                                <code className="text-emerald-400 text-xs font-mono select-all break-all">https://sns-tool.online/posutto/</code>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            </ol>
                            <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                                <p className="text-sm text-purple-800">
                                    <strong>保存時に表示されるClient IDとClient Secret:</strong> OAuth 2.0用のキーです。Posuttoでは使用しませんが、念のためメモしておくことをおすすめします。
                                </p>
                            </div>

                            {/* Mock UI: User Authentication Settings */}
                            <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                                <div className="bg-black px-4 py-2.5 flex items-center gap-2">
                                    <div className="flex gap-1.5">
                                        <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                                        <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                                        <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
                                    </div>
                                    <div className="flex-1 text-center">
                                        <span className="text-[10px] text-gray-500 font-mono">User authentication settings</span>
                                    </div>
                                </div>
                                <div className="bg-gray-950 p-6 space-y-5">
                                    {/* App Permissions */}
                                    <div>
                                        <label className="text-gray-500 text-[10px] font-bold uppercase tracking-wider block mb-2">App permissions</label>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 px-3 py-2 bg-gray-900 rounded-lg border border-gray-700">
                                                <div className="h-3.5 w-3.5 rounded-full border-2 border-gray-600" />
                                                <span className="text-gray-500 text-xs">Read</span>
                                            </div>
                                            <div className="flex items-center gap-2 px-3 py-2 bg-gray-900 rounded-lg border border-blue-500 ring-1 ring-blue-500/30">
                                                <div className="h-3.5 w-3.5 rounded-full border-2 border-blue-500 bg-blue-500 flex items-center justify-center">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-white" />
                                                </div>
                                                <span className="text-blue-400 text-xs font-bold">Read and write and Direct message</span>
                                                <span className="ml-auto text-[10px] text-blue-400">Recommended</span>
                                            </div>
                                        </div>
                                    </div>
                                    {/* App Type */}
                                    <div>
                                        <label className="text-gray-500 text-[10px] font-bold uppercase tracking-wider block mb-2">Type of App</label>
                                        <div className="flex items-center gap-2 px-3 py-2 bg-gray-900 rounded-lg border border-blue-500">
                                            <div className="h-3.5 w-3.5 rounded-full border-2 border-blue-500 bg-blue-500 flex items-center justify-center">
                                                <div className="h-1.5 w-1.5 rounded-full bg-white" />
                                            </div>
                                            <span className="text-blue-400 text-xs font-bold">Web App, Automated App or Bot</span>
                                        </div>
                                    </div>
                                    {/* Callback & Website */}
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-gray-500 text-[10px] font-bold uppercase tracking-wider block mb-1">Callback URI / Redirect URL</label>
                                            <div className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-emerald-400 font-mono break-all">https://sns-tool.online/posutto/dashboard</div>
                                        </div>
                                        <div>
                                            <label className="text-gray-500 text-[10px] font-bold uppercase tracking-wider block mb-1">Website URL</label>
                                            <div className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-emerald-400 font-mono break-all">https://sns-tool.online/posutto/</div>
                                        </div>
                                    </div>
                                    <button className="px-6 py-2 bg-blue-500 text-white text-xs font-bold rounded-full">Save</button>
                                </div>
                            </div>
                            <p className="text-[10px] text-gray-400 text-center italic">※ 上記はイメージです。実際の画面とは異なる場合があります。</p>
                        </div>
                    </div>

                    <div className="h-px bg-gray-100" />

                    {/* Step 4 */}
                    <div className="space-y-4">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-3">
                            <span className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-white text-sm font-bold shadow-lg shadow-primary/30">4</span>
                            API Key と API Key Secret を取得
                        </h3>
                        <div className="ml-11 space-y-4">
                            <ol className="space-y-3 text-sm text-gray-600">
                                <li className="flex items-start gap-3">
                                    <ArrowRight size={14} className="mt-1 text-primary shrink-0" />
                                    <span>アプリのダッシュボードで <strong>「Keys and tokens」</strong> タブを開きます。</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <ArrowRight size={14} className="mt-1 text-primary shrink-0" />
                                    <span>「Consumer Keys」セクションの <strong>「Regenerate」</strong> ボタンをクリック。</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <ArrowRight size={14} className="mt-1 text-primary shrink-0" />
                                    <span>表示された <strong>API Key</strong> と <strong>API Key Secret</strong> を<strong>必ずコピーして安全な場所に保存</strong>してください。</span>
                                </li>
                            </ol>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="p-4 rounded-xl border border-blue-200 bg-blue-50 flex items-center gap-3">
                                    <Key size={20} className="text-blue-500 shrink-0" />
                                    <div>
                                        <p className="font-bold text-gray-800 text-sm">API Key</p>
                                        <p className="text-xs text-gray-500">Consumer Keyとも呼ばれます</p>
                                    </div>
                                </div>
                                <div className="p-4 rounded-xl border border-blue-200 bg-blue-50 flex items-center gap-3">
                                    <Key size={20} className="text-blue-500 shrink-0" />
                                    <div>
                                        <p className="font-bold text-gray-800 text-sm">API Key Secret</p>
                                        <p className="text-xs text-gray-500">Consumer Secretとも呼ばれます</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                                <p className="text-xs text-amber-700">
                                    <strong>注意:</strong> 一度画面を閉じると再表示されません。必ずその場でコピーしてください。紛失した場合は「Regenerate」で再生成できますが、古いキーは無効化されます。
                                </p>
                            </div>

                            {/* Mock UI: Keys and tokens - Consumer Keys */}
                            <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                                <div className="bg-black px-4 py-2.5 flex items-center gap-2">
                                    <div className="flex gap-1.5">
                                        <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                                        <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                                        <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
                                    </div>
                                    <div className="flex-1 text-center">
                                        <span className="text-[10px] text-gray-500 font-mono">Keys and tokens</span>
                                    </div>
                                </div>
                                <div className="bg-gray-950 p-6 space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="flex gap-1">
                                            <span className="px-3 py-1 bg-gray-800 text-gray-500 text-[10px] rounded-md font-bold">Settings</span>
                                            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-[10px] rounded-md font-bold border border-blue-500/30">Keys and tokens</span>
                                        </div>
                                    </div>
                                    <div className="border border-gray-800 rounded-xl p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-white text-xs font-bold">Consumer Keys</span>
                                            <button className="px-3 py-1 bg-blue-500 text-white text-[10px] font-bold rounded-full">Regenerate</button>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-500 text-[10px] w-24">API Key</span>
                                                <div className="flex-1 bg-gray-900 rounded px-2 py-1 flex items-center justify-between border border-gray-700">
                                                    <span className="text-emerald-400 text-[10px] font-mono">xAi8k2Pq9rStUv...</span>
                                                    <span className="text-gray-600 text-[10px] cursor-pointer hover:text-blue-400">Copy</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-500 text-[10px] w-24">API Key Secret</span>
                                                <div className="flex-1 bg-gray-900 rounded px-2 py-1 flex items-center justify-between border border-gray-700">
                                                    <span className="text-emerald-400 text-[10px] font-mono">Hj3mNx7vBcDfGh...</span>
                                                    <span className="text-gray-600 text-[10px] cursor-pointer hover:text-blue-400">Copy</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <p className="text-[10px] text-gray-400 text-center italic">※ 上記はイメージです。実際の画面とは異なる場合があります。</p>
                        </div>
                    </div>

                    <div className="h-px bg-gray-100" />

                    {/* Step 5 */}
                    <div className="space-y-4">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-3">
                            <span className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-white text-sm font-bold shadow-lg shadow-primary/30">5</span>
                            Access Token と Access Token Secret を取得
                        </h3>
                        <div className="ml-11 space-y-4">
                            <ol className="space-y-3 text-sm text-gray-600">
                                <li className="flex items-start gap-3">
                                    <ArrowRight size={14} className="mt-1 text-primary shrink-0" />
                                    <span>同じ「Keys and tokens」タブの「Authentication Tokens」セクションに移動します。</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <ArrowRight size={14} className="mt-1 text-primary shrink-0" />
                                    <span><strong>「Generate」</strong> ボタンをクリックして、Access Token と Access Token Secret を発行します。</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <ArrowRight size={14} className="mt-1 text-primary shrink-0" />
                                    <span>こちらも<strong>必ずコピーして保存</strong>してください。</span>
                                </li>
                            </ol>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 flex items-center gap-3">
                                    <Key size={20} className="text-emerald-500 shrink-0" />
                                    <div>
                                        <p className="font-bold text-gray-800 text-sm">Access Token</p>
                                        <p className="text-xs text-gray-500">ユーザー認証用トークン</p>
                                    </div>
                                </div>
                                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 flex items-center gap-3">
                                    <Key size={20} className="text-emerald-500 shrink-0" />
                                    <div>
                                        <p className="font-bold text-gray-800 text-sm">Access Token Secret</p>
                                        <p className="text-xs text-gray-500">ユーザー認証用シークレット</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                                <p className="text-xs text-blue-700">
                                    <strong>重要:</strong> ステップ3の「User Authentication設定」が完了していないと、Access Tokenの権限が「Read only」になってしまい投稿ができません。
                                    権限を変更した場合は、Access Tokenを<strong>再生成</strong>してください。
                                </p>
                            </div>

                            {/* Mock UI: Keys and tokens - Authentication Tokens */}
                            <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                                <div className="bg-black px-4 py-2.5 flex items-center gap-2">
                                    <div className="flex gap-1.5">
                                        <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                                        <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                                        <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
                                    </div>
                                    <div className="flex-1 text-center">
                                        <span className="text-[10px] text-gray-500 font-mono">Keys and tokens</span>
                                    </div>
                                </div>
                                <div className="bg-gray-950 p-6 space-y-4">
                                    <div className="border border-gray-800 rounded-xl p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <span className="text-white text-xs font-bold">Authentication Tokens</span>
                                                <span className="ml-2 px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded">Read and Write</span>
                                            </div>
                                            <button className="px-3 py-1 bg-blue-500 text-white text-[10px] font-bold rounded-full">Generate</button>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-500 text-[10px] w-32">Access Token</span>
                                                <div className="flex-1 bg-gray-900 rounded px-2 py-1 flex items-center justify-between border border-gray-700">
                                                    <span className="text-emerald-400 text-[10px] font-mono">1234567890-AbCdEf...</span>
                                                    <span className="text-gray-600 text-[10px] cursor-pointer hover:text-blue-400">Copy</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-500 text-[10px] w-32">Access Token Secret</span>
                                                <div className="flex-1 bg-gray-900 rounded px-2 py-1 flex items-center justify-between border border-gray-700">
                                                    <span className="text-emerald-400 text-[10px] font-mono">Wx9yZ1aB2cDe3fGh...</span>
                                                    <span className="text-gray-600 text-[10px] cursor-pointer hover:text-blue-400">Copy</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-emerald-900/30 border border-emerald-800/50 rounded-lg px-3 py-2">
                                        <p className="text-emerald-400 text-[10px]">Permissions: <strong>Read and Write and Direct Messages</strong></p>
                                    </div>
                                </div>
                            </div>
                            <p className="text-[10px] text-gray-400 text-center italic">※ 上記はイメージです。実際の画面とは異なる場合があります。</p>
                        </div>
                    </div>

                    <div className="h-px bg-gray-100" />

                    {/* Step 6 */}
                    <div className="space-y-4">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-3">
                            <span className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-white text-sm font-bold shadow-lg shadow-primary/30">6</span>
                            クレジットをチャージする
                        </h3>
                        <div className="ml-11 space-y-4">
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                <p className="text-sm text-amber-800">
                                    <strong>2026年の変更点:</strong> X APIは従量課金制（Pay-Per-Use）に移行しました。
                                    Freeプラン（無料枠）は新規登録では利用できなくなっています。最低 <strong>$5</strong>（約800円）のクレジットチャージが必要です。
                                </p>
                            </div>
                            <ol className="space-y-3 text-sm text-gray-600">
                                <li className="flex items-start gap-3">
                                    <ArrowRight size={14} className="mt-1 text-primary shrink-0" />
                                    <span>console.x.com の <strong>「Billing」</strong> または <strong>「Credits」</strong> ページを開きます。</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <ArrowRight size={14} className="mt-1 text-primary shrink-0" />
                                    <span>クレジットカード情報を登録し、<strong>$5以上</strong>をチャージします。</span>
                                </li>
                            </ol>

                            <div className="bg-gray-900 rounded-2xl p-5 sm:p-6">
                                <p className="text-gray-400 text-xs mb-4 font-mono">💰 料金の目安</p>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-400">1投稿あたり</span>
                                        <span className="text-emerald-400 font-bold font-mono">約 $0.01</span>
                                    </div>
                                    <div className="h-px bg-gray-700" />
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-400">月500投稿の場合</span>
                                        <span className="text-emerald-400 font-bold font-mono">約 $5（≒ ¥800）</span>
                                    </div>
                                    <div className="h-px bg-gray-700" />
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-400">月1000投稿の場合</span>
                                        <span className="text-emerald-400 font-bold font-mono">約 $10（≒ ¥1,600）</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                                <p className="text-xs text-red-700">
                                    <strong>注意:</strong> 自動チャージ機能はありません。残高がゼロになると <code className="bg-white px-1 rounded border">402 CreditsDepleted</code> エラーが発生し、投稿ができなくなります。
                                    定期的に残高を確認してください。また、登録したクレジットカードは削除できない仕様です。
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-gray-100" />

                    {/* Step 7 */}
                    <div className="space-y-4">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-3">
                            <span className="flex items-center justify-center h-8 w-8 rounded-full bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-500/30">7</span>
                            Posuttoにキーを登録する
                        </h3>
                        <div className="ml-11 space-y-3">
                            <ol className="space-y-3 text-sm text-gray-600">
                                <li className="flex items-start gap-3">
                                    <ArrowRight size={14} className="mt-1 text-primary shrink-0" />
                                    <span>
                                        Posuttoの <button onClick={() => navigate('/dashboard/settings/account')} className="text-primary hover:underline font-bold">Xアカウント設定</button> を開きます。
                                    </span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <ArrowRight size={14} className="mt-1 text-primary shrink-0" />
                                    <span>対象のアカウントの「編集」ボタンをクリック（または新規追加）。</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <ArrowRight size={14} className="mt-1 text-primary shrink-0" />
                                    <span>「API設定」セクションに、ステップ4・5で取得した<strong>4つのキー</strong>を貼り付けます。</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <ArrowRight size={14} className="mt-1 text-primary shrink-0" />
                                    <span>「保存」をクリックして完了です。</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <ArrowRight size={14} className="mt-1 text-primary shrink-0" />
                                    <span>保存後、<strong>⚡ボタン</strong>をクリックして接続テストを実行し、正常に接続できることを確認してください。</span>
                                </li>
                            </ol>

                            <div className="bg-gray-900 rounded-2xl p-5 sm:p-6 mt-4">
                                <p className="text-gray-400 text-xs mb-3 font-mono">入力例：アカウント設定画面のAPI設定セクション</p>
                                <div className="space-y-2.5 font-mono text-xs">
                                    <div className="flex items-center gap-3">
                                        <span className="text-gray-500 w-40">API Key</span>
                                        <span className="text-emerald-400">xAi8k2Pq9rSt...</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-gray-500 w-40">API Key Secret</span>
                                        <span className="text-emerald-400">Hj3mNx7vBcDf...</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-gray-500 w-40">Access Token</span>
                                        <span className="text-emerald-400">1234567890-AbCdEf...</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-gray-500 w-40">Access Token Secret</span>
                                        <span className="text-emerald-400">Wx9yZ1aB2cDe...</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                                <p className="text-sm text-emerald-800">
                                    <strong>✅ 設定完了！</strong> 接続テストで「接続成功」と表示されれば、Botの自動投稿が可能になります。
                                    次はBot管理ページでBotを作成しましょう。
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Troubleshooting */}
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl p-6 sm:p-8 md:p-10 space-y-6">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-3">
                        <Search size={20} className="text-gray-400" />
                        よくあるトラブルと対処法
                    </h3>
                    <div className="space-y-4">
                        {[
                            {
                                q: '接続テストで「401 Unauthorized」と表示される',
                                a: 'APIキーが間違っている可能性があります。4つのキーを再度確認・コピーし直してください。権限変更後にAccess Tokenを再生成していない場合も発生します。',
                            },
                            {
                                q: '接続テストは成功するが投稿できない',
                                a: 'App permissionsが「Read only」のままの可能性があります。ステップ3の「User Authentication設定」で「Read and write」に変更し、その後Access Tokenを必ず再生成してください。',
                            },
                            {
                                q: '「402 CreditsDepleted」エラーが出る',
                                a: 'X APIの残高がゼロです。console.x.comのBillingページでクレジットをチャージしてください。',
                            },
                            {
                                q: 'キーを紛失してしまった',
                                a: '「Keys and tokens」タブで「Regenerate」をクリックすると新しいキーが発行されます。古いキーは無効化されるため、Posuttoのアカウント設定も更新してください。',
                            },
                        ].map((item, i) => (
                            <div key={i} className="border border-gray-100 rounded-xl overflow-hidden">
                                <div className="bg-gray-50 px-5 py-3 flex items-start gap-3">
                                    <span className="text-sm font-bold text-gray-500 shrink-0">Q.</span>
                                    <p className="text-sm font-bold text-gray-800">{item.q}</p>
                                </div>
                                <div className="px-5 py-3 flex items-start gap-3">
                                    <span className="text-sm font-bold text-primary shrink-0">A.</span>
                                    <p className="text-sm text-gray-600">{item.a}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="text-center pt-2">
                        <p className="text-xs text-gray-400 mb-3">さらに詳しい手順は下記の参考記事もご覧ください：</p>
                        <a
                            href="https://note.com/shinya_blogger/n/nf79c351df655"
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-primary font-bold hover:underline"
                        >
                            <ArrowRight size={14} />
                            【2026年2月版】X APIキーの取得方法とクレカチャージの注意点（外部記事）
                        </a>
                    </div>
                </div>
            </section>

            {/* ========================================================= */}
            {/* Bot Setup - Video Quote Bot                                */}
            {/* ========================================================= */}
            <section id="bot-setup" className="space-y-8 scroll-mt-24">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-purple-50 text-purple-500 flex items-center justify-center">
                        <Bot size={28} />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Bot の作成と設定</h2>
                </div>

                {/* Bot Type Selector */}
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl p-6 sm:p-8 md:p-10">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Botタイプを選ぶ</h3>
                    <p className="text-sm text-gray-600 mb-6">
                        Bot作成画面の「基本設定」タブで、まずBotタイプを選択します。目的に合ったタイプを選んでください。
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-5 rounded-2xl border-2 border-[#7c3aed] bg-[#7c3aed]/5 space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-[#7c3aed]/10 flex items-center justify-center">
                                    <Type className="h-5 w-5 text-[#7c3aed]" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">動画引用Bot</h4>
                                    <span className="text-xs text-gray-500">アフィリエイト向け</span>
                                </div>
                            </div>
                            <p className="text-sm text-gray-600">
                                指定アカウントの動画ツイートを引用して投稿。アフィリエイトURL自動変換に対応。
                            </p>
                            <ul className="text-xs text-gray-500 space-y-1">
                                <li>- 参照アカウントの動画を自動引用</li>
                                <li>- DMM / FANZA / MGS アフィリエイト対応</li>
                                <li>- ランダムテキストで凍結リスク軽減</li>
                            </ul>
                        </div>
                        <div className="p-5 rounded-2xl border-2 border-orange-300 bg-orange-50 space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center">
                                    <Trophy className="h-5 w-5 text-orange-500" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">選手権リプライBot</h4>
                                    <span className="text-xs text-gray-500">インプレッション向上向け</span>
                                </div>
                            </div>
                            <p className="text-sm text-gray-600">
                                選手権アカウントのポストに自分の過去ポストURLを自動返信。
                            </p>
                            <ul className="text-xs text-gray-500 space-y-1">
                                <li>- 複数の選手権アカウントを監視</li>
                                <li>- 自分の過去ポストURLを自動返信</li>
                                <li>- リプライテキストのランダム挿入</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Tab Overview */}
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl p-6 sm:p-8 md:p-10">
                    <p className="text-gray-600 mb-6">Bot編集画面は<strong>4つのタブ</strong>に分かれています。各タブの設定内容を解説します。</p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                            { name: '基本設定', icon: Settings, desc: 'Botタイプ、名前、アカウント', color: 'text-blue-500 bg-blue-50' },
                            { name: '投稿設定', icon: Video, desc: '引用元 or リプライ設定', color: 'text-purple-500 bg-purple-50' },
                            { name: '自動化設定', icon: Heart, desc: '自動いいね・フォロー', color: 'text-rose-500 bg-rose-50' },
                            { name: 'スケジュール', icon: Clock, desc: '投稿時間帯', color: 'text-amber-500 bg-amber-50' },
                        ].map(tab => (
                            <div key={tab.name} className={`p-4 rounded-2xl border border-gray-100 text-center`}>
                                <div className={`h-10 w-10 rounded-xl ${tab.color} flex items-center justify-center mx-auto mb-2`}>
                                    <tab.icon size={20} />
                                </div>
                                <p className="font-bold text-gray-800 text-sm">{tab.name}</p>
                                <p className="text-xs text-gray-400 mt-1">{tab.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* --- Tab 1: Basic --- */}
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl overflow-hidden">
                    <div className="bg-blue-500 px-6 sm:px-8 py-5 flex items-center gap-3">
                        <Settings className="h-6 w-6 text-white" />
                        <h3 className="text-lg sm:text-xl font-bold text-white">タブ1: 基本設定</h3>
                    </div>
                    <div className="p-6 sm:p-8 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <h4 className="font-bold text-gray-800">Botタイプ</h4>
                                <p className="text-sm text-gray-500">
                                    「動画引用Bot」と「選手権リプライBot」から選びます。タイプによってタブ2の内容が変わります。
                                </p>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-bold text-gray-800">Bot名</h4>
                                <p className="text-sm text-gray-500">管理用の名前です。好きな名前を付けてください。</p>
                                <div className="bg-gray-50 rounded-lg p-3 text-sm font-mono text-gray-600">例: 動画アフィBot_01</div>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-bold text-gray-800">投稿アカウント</h4>
                                <p className="text-sm text-gray-500">投稿に使う自分のXアカウントを選択します。APIキーが設定済みのアカウントのみ表示されます。</p>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-bold text-gray-800">ステータス</h4>
                                <p className="text-sm text-gray-500">「<strong>稼働</strong>」にすると自動投稿が開始されます。「停止」で一時停止。</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- Tab 2: Content / Quote Source (Video Quote Bot) --- */}
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl overflow-hidden">
                    <div className="bg-purple-500 px-6 sm:px-8 py-5 flex items-center gap-3">
                        <Video className="h-6 w-6 text-white" />
                        <h3 className="text-lg sm:text-xl font-bold text-white">タブ2: 投稿・引用元（動画引用Bot）</h3>
                    </div>
                    <div className="p-6 sm:p-8 space-y-8">
                        {/* Reference Accounts */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Video className="h-5 w-5 text-purple-500" />
                                <h4 className="font-bold text-gray-800 text-lg">参照するXアカウント</h4>
                            </div>
                            <p className="text-sm text-gray-600">
                                ここで指定したアカウントの<strong>動画付きツイート</strong>を自動で取得し、引用ツイートとして投稿します。
                                複数のアカウントを登録でき、投稿時にはランダムに選ばれた新しい動画が使われます。
                            </p>
                            <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                                <p className="text-sm text-purple-800">
                                    <strong>仕組み:</strong> スケジュール時間に実行 → 参照アカウントのタイムラインを取得 → 動画付きツイートをフィルタ → 未投稿のツイートを1件選択 → 引用ツイートとして投稿
                                </p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-4 text-sm">
                                <p className="text-gray-500 mb-2">入力例:</p>
                                <div className="flex flex-wrap gap-2">
                                    <span className="bg-white px-3 py-1 rounded-full border border-gray-200 text-sm">@videocreator1</span>
                                    <span className="bg-white px-3 py-1 rounded-full border border-gray-200 text-sm">@trendaccount</span>
                                    <span className="bg-white px-3 py-1 rounded-full border border-gray-200 text-sm">@popularuser</span>
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-gray-100" />

                        {/* Random Text */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Type className="h-5 w-5 text-purple-500" />
                                <h4 className="font-bold text-gray-800 text-lg">ランダムテキスト</h4>
                            </div>
                            <p className="text-sm text-gray-600">
                                1行ずつテキストを入力すると、投稿時にランダムで1行が本文として使われます。
                                毎回同じ文章にならないので、凍結リスクの軽減にも効果的です。
                            </p>
                            <div className="bg-gray-900 rounded-2xl p-5">
                                <p className="text-gray-400 text-xs mb-3 font-mono">入力例（1行=1パターン）:</p>
                                <pre className="text-emerald-400 font-mono text-sm leading-relaxed">{`この動画おすすめです！
めっちゃ面白い！見て！
必見です
これはヤバい
マジで神動画`}</pre>
                            </div>
                        </div>

                        <div className="h-px bg-gray-100" />

                        {/* Affiliate Settings */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Link2 className="h-5 w-5 text-green-600" />
                                <h4 className="font-bold text-gray-800 text-lg">アフィリエイト設定</h4>
                            </div>
                            <p className="text-sm text-gray-600">
                                参照アカウントのツイートに含まれるURLを、自分のアフィリエイトIDに自動変換して投稿します。
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl border border-green-100 bg-green-50/50 space-y-2">
                                    <h5 className="font-bold text-gray-800 text-sm">DMM / FANZA 対応</h5>
                                    <p className="text-xs text-gray-500">ツイート内のDMM・FANZAのURLの <code className="bg-white px-1 rounded">id=</code> パラメータを自動置換します。</p>
                                    <div className="bg-white rounded-lg p-2 text-xs font-mono">
                                        <span className="text-gray-400">入力:</span> <span className="text-gray-700">myid-001</span>
                                    </div>
                                </div>
                                <div className="p-4 rounded-xl border border-green-100 bg-green-50/50 space-y-2">
                                    <h5 className="font-bold text-gray-800 text-sm">MGS 対応</h5>
                                    <p className="text-xs text-gray-500">ツイート内のMGS URLの <code className="bg-white px-1 rounded">c=</code> パラメータを自動置換します。</p>
                                    <div className="bg-white rounded-lg p-2 text-xs font-mono">
                                        <span className="text-gray-400">入力:</span> <span className="text-gray-700">mycode123</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 mt-3">
                                <h5 className="font-bold text-gray-800 text-sm">リンクの配置方法</h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="p-3 rounded-lg border border-gray-200 bg-white">
                                        <p className="font-bold text-sm text-gray-800 mb-1">本文に含める（デフォルト）</p>
                                        <p className="text-xs text-gray-500">アフィリエイトリンクが引用ツイートの本文に直接含まれます。</p>
                                    </div>
                                    <div className="p-3 rounded-lg border border-gray-200 bg-white">
                                        <p className="font-bold text-sm text-gray-800 mb-1">リプライで投稿</p>
                                        <p className="text-xs text-gray-500">引用ツイート投稿後、リプライとしてリンクを投稿します。本文をスッキリ見せたい場合に。</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========================================================= */}
            {/* Championship Reply Bot                                     */}
            {/* ========================================================= */}
            <section id="championship-bot" className="space-y-8 scroll-mt-24">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center">
                        <Trophy size={28} />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">選手権リプライBot の設定</h2>
                </div>

                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl overflow-hidden">
                    <div className="bg-orange-500 px-6 sm:px-8 py-5 flex items-center gap-3">
                        <Trophy className="h-6 w-6 text-white" />
                        <h3 className="text-lg sm:text-xl font-bold text-white">タブ2: リプライ設定（選手権リプライBot）</h3>
                    </div>
                    <div className="p-6 sm:p-8 space-y-8">
                        <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
                            <p className="text-sm text-orange-800">
                                <strong>選手権リプライBotとは？</strong><br />
                                選手権アカウント（例: 〇〇選手権）の新しいポストに、自分の過去ポストのURLを自動で返信するBotです。
                                選手権ポストへの返信は多くのユーザーの目に触れるため、インプレッション向上が期待できます。
                            </p>
                        </div>

                        {/* Championship Accounts */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Trophy className="h-5 w-5 text-orange-500" />
                                <h4 className="font-bold text-gray-800 text-lg">監視する選手権アカウント</h4>
                            </div>
                            <p className="text-sm text-gray-600">
                                監視対象の選手権アカウントのIDを入力して「追加」をクリックします。<strong>複数のアカウントを登録可能</strong>です。
                            </p>
                            <div className="bg-gray-50 rounded-xl p-4 text-sm">
                                <p className="text-gray-500 mb-2">入力例:</p>
                                <div className="flex flex-wrap gap-2">
                                    <span className="bg-white px-3 py-1 rounded-full border border-orange-200 text-sm flex items-center gap-1"><Trophy className="h-3 w-3 text-orange-500" />@sensyuken_bot</span>
                                    <span className="bg-white px-3 py-1 rounded-full border border-orange-200 text-sm flex items-center gap-1"><Trophy className="h-3 w-3 text-orange-500" />@kawaii_gp</span>
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-gray-100" />

                        {/* Reply Texts */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <MessageSquare className="h-5 w-5 text-orange-500" />
                                <h4 className="font-bold text-gray-800 text-lg">リプライテキスト（任意）</h4>
                            </div>
                            <p className="text-sm text-gray-600">
                                返信時にランダムで1行が選ばれて、自分のポストURLの前に挿入されます。空欄の場合はURLのみが投稿されます。
                            </p>
                            <div className="bg-gray-900 rounded-2xl p-5">
                                <p className="text-gray-400 text-xs mb-3 font-mono">入力例（1行=1パターン）:</p>
                                <pre className="text-emerald-400 font-mono text-sm leading-relaxed">{`これ見て！
おすすめです！
私の一押し
自信作です`}</pre>
                            </div>
                        </div>

                        <div className="h-px bg-gray-100" />

                        {/* How It Works */}
                        <div className="space-y-3">
                            <h4 className="font-bold text-gray-800 text-lg">返信の仕組み</h4>
                            <div className="bg-gray-50 rounded-xl p-5">
                                <div className="space-y-4">
                                    {[
                                        { step: '1', text: 'スケジュール時間になると、選手権アカウントの最新ポストを取得', color: 'bg-orange-500' },
                                        { step: '2', text: 'まだ返信していないポストを見つける', color: 'bg-orange-500' },
                                        { step: '3', text: '自分の過去ポストからランダムに1件のURLを取得', color: 'bg-orange-500' },
                                        { step: '4', text: 'リプライテキスト（設定されていれば）+ ポストURLを返信として投稿', color: 'bg-orange-500' },
                                    ].map((item) => (
                                        <div key={item.step} className="flex items-start gap-3">
                                            <div className={`h-6 w-6 rounded-full ${item.color} text-white flex items-center justify-center font-bold text-xs shrink-0`}>
                                                {item.step}
                                            </div>
                                            <p className="text-sm text-gray-600">{item.text}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                                <p className="text-sm text-blue-800">
                                    <strong>ポイント:</strong> 1回の実行で1件のみ返信します（レート制限対策）。Bot枠は1つ使用します。
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========================================================= */}
            {/* Automation Settings (Auto Like + Auto Follow)              */}
            {/* ========================================================= */}
            <section className="space-y-8">
                {/* --- Tab 3: Automation --- */}
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl overflow-hidden">
                    <div className="bg-rose-500 px-6 sm:px-8 py-5 flex items-center gap-3">
                        <Heart className="h-6 w-6 text-white" />
                        <h3 className="text-lg sm:text-xl font-bold text-white">タブ3: 自動化設定（自動いいね・自動フォロー）</h3>
                    </div>
                    <div className="p-6 sm:p-8 space-y-6">
                        {/* Toggle Explanation */}
                        <div className="bg-gray-50 rounded-xl p-4 flex items-start gap-3">
                            <ToggleRight className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-bold text-gray-800">まず「自動いいね・フォロー」のトグルをONにしてください</p>
                                <p className="text-xs text-gray-500 mt-1">
                                    OFFの場合は投稿だけが実行されます。ONにすると、自動いいね・自動フォローの設定項目が表示されます。
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Auto Like */}
                            <div className="p-6 rounded-2xl bg-rose-50/50 border border-rose-100 space-y-4">
                                <div className="flex items-center gap-3 text-rose-600">
                                    <Heart size={20} className="fill-current" />
                                    <h4 className="font-bold">自動いいね</h4>
                                </div>
                                <p className="text-sm text-gray-600">指定したキーワードで最新ツイートを検索し、自動で「いいね」します。</p>

                                <div className="space-y-3 bg-white rounded-xl p-4 border border-rose-100">
                                    <div>
                                        <p className="text-xs font-bold text-gray-700 mb-1">設定項目</p>
                                        <ul className="text-xs text-gray-500 space-y-1.5">
                                            <li className="flex items-start gap-2">
                                                <CheckCircle2 className="h-3.5 w-3.5 text-rose-400 shrink-0 mt-0.5" />
                                                <span><strong>検索キーワード</strong> — カンマ区切りで複数登録可（例: #副業, ポイ活）</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <CheckCircle2 className="h-3.5 w-3.5 text-rose-400 shrink-0 mt-0.5" />
                                                <span><strong>1日の上限回数</strong> — いいねの最大回数を設定（デフォルト: 50回）</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>

                                <ul className="text-xs text-gray-500 space-y-1">
                                    <li>- 毎時（1時間ごと）に自動実行されます</li>
                                    <li>- 1回あたり数件ずつ実行します</li>
                                </ul>
                            </div>

                            {/* Auto Follow */}
                            <div className="p-6 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-4">
                                <div className="flex items-center gap-3 text-blue-600">
                                    <UserPlus size={20} />
                                    <h4 className="font-bold">自動フォロー</h4>
                                </div>
                                <p className="text-sm text-gray-600">ターゲットアカウントのフォロワーを自動でフォローします。</p>

                                <div className="space-y-3 bg-white rounded-xl p-4 border border-blue-100">
                                    <div>
                                        <p className="text-xs font-bold text-gray-700 mb-1">設定項目</p>
                                        <ul className="text-xs text-gray-500 space-y-1.5">
                                            <li className="flex items-start gap-2">
                                                <CheckCircle2 className="h-3.5 w-3.5 text-blue-400 shrink-0 mt-0.5" />
                                                <span><strong>ターゲットアカウント</strong> — このアカウントのフォロワーをフォローします（@不要）</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <CheckCircle2 className="h-3.5 w-3.5 text-blue-400 shrink-0 mt-0.5" />
                                                <span><strong>実行時間帯</strong> — 朝8時 / 昼12時 / 夜20時 からボタンで選択（複数可）</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>

                                <ul className="text-xs text-gray-500 space-y-1">
                                    <li>- 選択した時間帯に自動実行されます</li>
                                    <li>- 1回あたり最大10人をフォロー</li>
                                    <li>- 3〜8秒間隔で実行（レート制限対策）</li>
                                </ul>
                            </div>
                        </div>

                        {/* Tip */}
                        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                            <p className="text-sm text-emerald-800">
                                <strong>コツ:</strong> ターゲットアカウントには同ジャンルの人気アカウントを指定すると、フォローバック率が高くなります。
                            </p>
                        </div>
                    </div>
                </div>

                {/* --- Tab 4: Schedule --- */}
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl overflow-hidden">
                    <div className="bg-amber-500 px-6 sm:px-8 py-5 flex items-center gap-3">
                        <Clock className="h-6 w-6 text-white" />
                        <h3 className="text-lg sm:text-xl font-bold text-white">タブ4: スケジュール設定</h3>
                    </div>
                    <div className="p-6 sm:p-8 space-y-4">
                        <p className="text-sm text-gray-600">
                            24時間 x 10分刻みのグリッドが表示されます。投稿したい時間帯のセルをクリックして選択してください。
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <h4 className="font-bold text-gray-800 text-sm">操作方法</h4>
                                <ul className="text-sm text-gray-600 space-y-2">
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                                        <span>セルをクリック → <strong>紫色</strong>に変わって投稿予約</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                                        <span>もう一度クリック → 予約を解除</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                                        <span>右上に選択数 / 上限数が表示されます</span>
                                    </li>
                                </ul>
                            </div>
                            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                                <h4 className="font-bold text-amber-800 text-sm mb-2">投稿タイミングのコツ</h4>
                                <ul className="text-xs text-amber-700 space-y-1">
                                    <li>- <strong>7:00〜9:00</strong> — 通勤時間帯はエンゲージメントが高い</li>
                                    <li>- <strong>12:00〜13:00</strong> — 昼休みの閲覧ピーク</li>
                                    <li>- <strong>19:00〜23:00</strong> — 夜のゴールデンタイム</li>
                                    <li>- 均等に分散させると凍結リスクを軽減できます</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========================================================= */}
            {/* Affiliate System                                          */}
            {/* ========================================================= */}
            <section id="affiliate" className="space-y-8 scroll-mt-24">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-violet-50 text-violet-500 flex items-center justify-center">
                        <Gift size={28} />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">アフィリエイト（紹介）機能</h2>
                </div>

                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl p-6 sm:p-8 md:p-10 space-y-8">
                    <div className="bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] rounded-2xl p-5 sm:p-6 text-white">
                        <h3 className="text-lg font-bold mb-2">友達を紹介して報酬をゲット！</h3>
                        <p className="text-white/80 text-sm">
                            あなたの紹介リンクから登録した人が有料プランに加入すると、<strong className="text-white">1人あたり ¥500</strong> の報酬が発生します。
                        </p>
                    </div>

                    {/* How to use */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-bold text-gray-900">使い方</h3>
                        <div className="space-y-0">
                            {[
                                {
                                    step: 1,
                                    icon: Share2,
                                    title: 'アフィリエイトページを開く',
                                    desc: 'サイドバーの「アフィリエイト」をクリックすると、あなた専用の紹介コードと紹介リンクが表示されます。',
                                    color: 'bg-violet-500',
                                },
                                {
                                    step: 2,
                                    icon: Copy,
                                    title: '紹介リンクをシェアする',
                                    desc: '「コピー」ボタンで紹介リンクをクリップボードにコピーし、SNSやブログなどで共有しましょう。',
                                    color: 'bg-violet-500',
                                },
                                {
                                    step: 3,
                                    icon: Gift,
                                    title: '特典コンテンツを設定する（任意）',
                                    desc: '紹介された方への特典（限定PDFやノウハウなど）をアフィリエイトページで設定できます。タイトル・説明文・ファイル添付（最大5MB）に対応。',
                                    color: 'bg-violet-500',
                                },
                                {
                                    step: 4,
                                    icon: DollarSign,
                                    title: '報酬を確認する',
                                    desc: '紹介した人が有料プランに加入すると報酬が発生します。アフィリエイトページで紹介人数・報酬額・支払い状況を確認できます。',
                                    color: 'bg-emerald-500',
                                },
                            ].map((item, i) => (
                                <div key={item.step} className="flex gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className={`h-10 w-10 rounded-full ${item.color} text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-lg`}>
                                            {item.step}
                                        </div>
                                        {i < 3 && <div className="w-0.5 h-full bg-gray-200 my-1" />}
                                    </div>
                                    <div className="pb-8">
                                        <h4 className="font-bold text-gray-900 text-lg">{item.title}</h4>
                                        <p className="text-sm text-gray-600 mt-1">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="h-px bg-gray-100" />

                    {/* Features detail */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-5 rounded-2xl border border-gray-100 bg-gray-50/50 space-y-2">
                            <div className="flex items-center gap-2 text-violet-600">
                                <Copy size={18} />
                                <h4 className="font-bold text-sm">紹介リンク & コード</h4>
                            </div>
                            <p className="text-xs text-gray-500">自動発行される紹介コード付きURL。ワンクリックでコピー可能。新規登録画面で紹介コードを入力してもらうこともできます。</p>
                        </div>
                        <div className="p-5 rounded-2xl border border-gray-100 bg-gray-50/50 space-y-2">
                            <div className="flex items-center gap-2 text-rose-600">
                                <FileText size={18} />
                                <h4 className="font-bold text-sm">紹介特典コンテンツ</h4>
                            </div>
                            <p className="text-xs text-gray-500">紹介された方が閲覧できる特典ページを作成。タイトル・説明文に加え、PDF・画像・ZIPなどのファイルを添付可能（最大5MB）。</p>
                        </div>
                        <div className="p-5 rounded-2xl border border-gray-100 bg-gray-50/50 space-y-2">
                            <div className="flex items-center gap-2 text-emerald-600">
                                <DollarSign size={18} />
                                <h4 className="font-bold text-sm">報酬ダッシュボード</h4>
                            </div>
                            <p className="text-xs text-gray-500">紹介人数・有料転換数・未払い報酬・支払い済み報酬をリアルタイムで確認。報酬明細テーブルで個別の状況も把握できます。</p>
                        </div>
                    </div>

                    {/* Tip */}
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                        <p className="text-sm text-blue-800">
                            <strong>報酬のお支払いについて:</strong> 報酬は管理者が確認後、お振込みにてお支払いいたします。支払い状況はアフィリエイトページの報酬明細でご確認ください。
                        </p>
                    </div>

                    <div className="text-center pt-2">
                        <Button
                            onClick={() => navigate('/dashboard/affiliate')}
                            className="rounded-2xl"
                        >
                            <Gift className="h-4 w-4 mr-2" />
                            アフィリエイトページを開く
                        </Button>
                    </div>
                </div>
            </section>

            {/* ========================================================= */}
            {/* Plans & Billing                                           */}
            {/* ========================================================= */}
            <section id="plans" className="space-y-8 scroll-mt-24">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center">
                        <CreditCard size={28} />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">プラン・お支払い</h2>
                </div>

                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl p-6 sm:p-8 md:p-10 space-y-8">
                    <p className="text-gray-600">
                        Posuttoでは利用規模に応じた複数のプランをご用意しています。
                        プランごとに登録可能なBot数や投稿枠数が異なります。
                    </p>

                    {/* Plan Comparison */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[
                            { name: 'スターター', price: '無料', bots: '1', posts: '10枠/日', color: 'border-gray-200', badge: '' },
                            { name: 'アドバンス', price: '¥980/月', bots: '5', posts: '50枠/日', color: 'border-[#7c3aed]', badge: '人気' },
                            { name: 'アドバンス 20', price: '¥1,980/月', bots: '20', posts: '200枠/日', color: 'border-gray-200', badge: '' },
                        ].map(plan => (
                            <div key={plan.name} className={`p-5 rounded-2xl border-2 ${plan.color} space-y-3 relative`}>
                                {plan.badge && (
                                    <span className="absolute -top-2.5 right-4 px-3 py-0.5 bg-[#7c3aed] text-white text-xs font-bold rounded-full">
                                        {plan.badge}
                                    </span>
                                )}
                                <h4 className="font-bold text-gray-900">{plan.name}</h4>
                                <p className="text-2xl font-black text-gray-900">{plan.price}</p>
                                <ul className="text-xs text-gray-500 space-y-1">
                                    <li>- Bot数: 最大 {plan.bots}</li>
                                    <li>- 投稿枠: {plan.posts}</li>
                                    <li>- 自動いいね・フォロー</li>
                                    <li>- シャドウバン検知</li>
                                </ul>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-gray-400 text-center">
                        ※ アドバンス70（¥4,980/月・70Bot）、アドバンス170（¥9,800/月・170Bot）プランもあります。
                    </p>

                    <div className="h-px bg-gray-100" />

                    {/* Upgrade flow */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-gray-900">プラン変更の流れ</h3>
                        <div className="bg-gray-50 rounded-xl p-5">
                            <div className="space-y-4">
                                {[
                                    { step: '1', text: 'サイドバーの「ショップ」からプラン一覧を開く', color: 'bg-blue-500' },
                                    { step: '2', text: '希望のプランの「このプランに変更」ボタンをクリック', color: 'bg-blue-500' },
                                    { step: '3', text: 'Stripe決済画面で支払い情報を入力（アップグレードの場合は差額の日割り計算）', color: 'bg-blue-500' },
                                    { step: '4', text: '決済完了後、すぐにBot数・投稿枠が新プランに反映', color: 'bg-emerald-500' },
                                ].map((item) => (
                                    <div key={item.step} className="flex items-start gap-3">
                                        <div className={`h-6 w-6 rounded-full ${item.color} text-white flex items-center justify-center font-bold text-xs shrink-0`}>
                                            {item.step}
                                        </div>
                                        <p className="text-sm text-gray-600">{item.text}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                        <p className="text-sm text-amber-800">
                            <strong>日割り計算について:</strong> 上位プランへのアップグレード時、現在のプランの残日数分の差額のみが請求されます。既に支払い済みの期間は無駄になりません。
                        </p>
                    </div>

                    <div className="text-center pt-2">
                        <Button
                            onClick={() => navigate('/dashboard/shop')}
                            className="rounded-2xl"
                        >
                            <CreditCard className="h-4 w-4 mr-2" />
                            ショップを開く
                        </Button>
                    </div>
                </div>
            </section>

            {/* ========================================================= */}
            {/* Features Overview                                         */}
            {/* ========================================================= */}
            <section id="features" className="space-y-8 scroll-mt-24">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
                        <LayoutDashboard size={28} />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">その他の機能</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                    {/* Dashboard */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden flex flex-col">
                        <div className="p-6 sm:p-8 flex-1 space-y-4">
                            <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
                                <LayoutDashboard size={20} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">ダッシュボード</h3>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                                    <span>アクティブBot数、今日の投稿数を一目で確認</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                                    <span>次回投稿予定時刻の表示</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                                    <span>月間インプレッション推移</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Account Status */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden flex flex-col">
                        <div className="p-6 sm:p-8 flex-1 space-y-4">
                            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
                                <Activity size={20} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">アカウント状況</h3>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                                    <span>シャドウバンの自動検出（毎日4:00AM）</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                                    <span>サーチバン・サジェストバン・ゴーストバン・リプライデブーストの4項目チェック</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                                    <span>手動チェックもワンクリックで可能</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Analytics */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden flex flex-col">
                        <div className="p-6 sm:p-8 flex-1 space-y-4">
                            <div className="h-10 w-10 rounded-xl bg-violet-50 text-violet-500 flex items-center justify-center">
                                <Zap size={20} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">投稿分析</h3>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                                    <span>過去30日間のエンゲージメントデータ</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                                    <span>最もクリックされたリンクのランキング</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Bot Execution Log */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden flex flex-col">
                        <div className="p-6 sm:p-8 flex-1 space-y-4">
                            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
                                <ScrollText size={20} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Bot実行ログ</h3>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                                    <span>各Botの実行履歴をリアルタイムで確認</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                                    <span>投稿成功・失敗・スキップの詳細ステータス</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                                    <span>Bot一覧の「ログ」ボタンから確認可能</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Affiliate */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden flex flex-col">
                        <div className="p-6 sm:p-8 flex-1 space-y-4">
                            <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center">
                                <Gift size={20} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">アフィリエイト</h3>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                                    <span>紹介リンクで友達を招待、有料転換で ¥500 報酬</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                                    <span>紹介特典コンテンツ（テキスト＋ファイル添付）の設定</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                                    <span>報酬の発生状況・支払い状況をダッシュボードで確認</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Duplicate prevention callout */}
                <div className="bg-gray-900 rounded-[2rem] p-6 sm:p-8 md:p-10 text-white relative overflow-hidden">
                    <Zap className="absolute -right-4 -top-4 h-32 w-32 text-white/5 rotate-12" />
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 sm:gap-8">
                        <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                            <Search className="h-8 w-8 sm:h-10 sm:w-10 text-emerald-400" />
                        </div>
                        <div className="space-y-3 sm:space-y-4 text-center md:text-left">
                            <h3 className="text-xl sm:text-2xl font-bold">同じ動画は二度と投稿されません</h3>
                            <p className="text-gray-400 max-w-xl text-sm sm:text-base">
                                Posuttoは投稿した動画ツイートを全て記録しています。同じソースツイートを重複して引用することはありません。常に新しい動画コンテンツだけが投稿されます。
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer Support Callout */}
            <div className="bg-primary/5 rounded-[2rem] sm:rounded-[2.5rem] border border-primary/10 p-8 sm:p-12 text-center space-y-6">
                <HelpCircle className="h-12 w-12 sm:h-16 sm:w-16 text-primary mx-auto opacity-20" />
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">困ったときは？</h3>
                <p className="text-gray-500 max-w-md mx-auto text-sm sm:text-base">
                    セットアップでわからないことがあれば、サポート窓口までお気軽にお問い合わせください。
                </p>
                <div className="flex items-center justify-center gap-4 pt-4">
                    <Button
                        className="rounded-2xl h-12 sm:h-14 px-6 sm:px-8 font-bold shadow-xl shadow-primary/20"
                        onClick={() => navigate('/dashboard/support')}
                    >
                        お問い合わせはこちら
                    </Button>
                </div>
            </div>
        </div>
    );
}
