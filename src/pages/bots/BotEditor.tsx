import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, X, Settings, Heart, Type, Link2, MessageSquare, Trophy, UserPlus } from 'lucide-react';
import type { Bot, Account, BotType } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs';
import { useAuth } from '../../lib/auth';
import { PLAN_DETAILS } from '../../types/plans';
import { API_BASE } from '../../config';
import { authFetch, authJsonFetch } from '../../lib/authFetch';

export default function BotEditor() {
    const { user } = useAuth();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;
    const [activeTab, setActiveTab] = useState('basic');
    const [isLoading, setIsLoading] = useState(isEditMode);

    const maxTweets = user?.plan ? PLAN_DETAILS[user.plan].maxTweetsPerDayPerBot : 25;

    const [formData, setFormData] = useState<Partial<Bot>>({
        name: '',
        accountId: '',
        status: 'active',
        botType: 'video_quote',
        schedule: {
            id: '',
            type: 'cron',
            value: '0 * * * *',
            active: true
        },
        tweetsCount: 0,
        referenceAccounts: [],
        randomTexts: [],
        affiliateLink: '',
        dmmAffiliateId: '',
        mgsAffiliateId: '',
        linkPlacement: 'post',
        championshipAccounts: [],
        replyTexts: [],
        automationType: 'none',
        likeKeywords: [],
        followTargetAccount: '',
        dailyLikeLimit: 50,
        followIntervals: ['morning', 'noon', 'evening']
    });

    const [scheduleSlots, setScheduleSlots] = useState<Set<string>>(new Set(['0:00']));
    const [newRefAccount, setNewRefAccount] = useState('');
    const [newChampAccount, setNewChampAccount] = useState('');

    const MINUTES = ['00', '10', '20', '30', '40', '50'];
    const HOURS = Array.from({ length: 24 }, (_, i) => i);

    // Fetch user's accounts from API
    useEffect(() => {
        const fetchAccounts = async () => {
            if (!user?.email) return;
            try {
                const response = await authFetch(`${API_BASE}/api/accounts/${user.email}`);
                if (response.ok) {
                    const data = await response.json();
                    setAccounts(data.map((acc: Record<string, string>) => ({
                        id: acc.id,
                        name: acc.name,
                        screenName: acc.screen_name
                    })));
                }
            } catch (error) {
                console.error('Failed to fetch accounts:', error);
            }
        };
        fetchAccounts();
    }, [user?.email]);

    useEffect(() => {
        if (isEditMode) {
            const fetchBot = async () => {
                try {
                    const response = await authFetch(`${API_BASE}/api/bot/${id}`);
                    if (response.ok) {
                        const data = await response.json();
                        // Flatten settings into top-level for form binding
                        const settings = data.settings || {};
                        setFormData({
                            ...data,
                            botType: settings.botType || data.botType || 'video_quote',
                            referenceAccounts: settings.referenceAccounts || data.referenceAccounts || [],
                            randomTexts: settings.randomTexts || data.randomTexts || [],
                            championshipAccounts: settings.championshipAccounts || data.championshipAccounts || [],
                            replyTexts: settings.replyTexts || data.replyTexts || [],
                            automationType: settings.automationType || data.automationType || 'none',
                            likeKeywords: settings.likeKeywords || data.likeKeywords || [],
                            followTargetAccount: settings.followTargetAccount || data.followTargetAccount || '',
                            dailyLikeLimit: settings.dailyLikeLimit || data.dailyLikeLimit || 50,
                            followIntervals: settings.followIntervals || data.followIntervals || ['morning', 'noon', 'evening'],
                            dmmAffiliateId: settings.dmmAffiliateId || data.dmmAffiliateId || '',
                            mgsAffiliateId: settings.mgsAffiliateId || data.mgsAffiliateId || '',
                            affiliateLink: settings.affiliateLink || data.affiliateLink || '',
                            linkPlacement: settings.linkPlacement || data.linkPlacement || 'post',
                        });
                        if (data.schedule && Array.isArray(data.schedule)) {
                            setScheduleSlots(new Set(data.schedule));
                        }
                    }
                } catch (error) {
                    console.error('Failed to fetch bot:', error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchBot();
        }
    }, [id, isEditMode]);

    useEffect(() => {
        const minuteSet = new Set<string>();
        const hourSet = new Set<string>();
        scheduleSlots.forEach(slot => {
            const [h, m] = slot.split(':');
            minuteSet.add(String(parseInt(m)));
            hourSet.add(h);
        });
        const sortedMins = Array.from(minuteSet).sort((a, b) => parseInt(a) - parseInt(b));
        const sortedHours = Array.from(hourSet).sort((a, b) => parseInt(a) - parseInt(b));
        const minStr = sortedMins.length > 0 ? sortedMins.join(',') : '*';
        const hourStr = sortedHours.length > 0 ? sortedHours.join(',') : '*';

        setFormData(prev => ({
            ...prev,
            schedule: {
                ...prev.schedule!,
                value: `${minStr} ${hourStr} * * *`
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any // Use 'any' or update Schedule type to include the raw slots if needed
        }));
    }, [scheduleSlots]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };


    const addReferenceAccount = () => {
        if (!newRefAccount.trim()) return;
        setFormData(prev => ({
            ...prev,
            referenceAccounts: [...(prev.referenceAccounts || []), newRefAccount.trim()]
        }));
        setNewRefAccount('');
    };

    const removeReferenceAccount = (index: number) => {
        setFormData(prev => ({
            ...prev,
            referenceAccounts: prev.referenceAccounts?.filter((_, i) => i !== index)
        }));
    };

    const toggleSlot = (hour: number, min: string) => {
        const key = `${hour}:${min}`;
        setScheduleSlots(prev => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                if (next.size >= maxTweets) {
                    alert(`1日あたりの投稿上限（${maxTweets}回）に達しています。これ以上追加できません。`);
                    return prev;
                }
                next.add(key);
            }
            return next;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Pro-active limit check for new bots
        if (!isEditMode && user?.email) {
            try {
                const checkRes = await authFetch(`${API_BASE}/api/bots/${user.email}`);
                if (checkRes.ok) {
                    const currentBots = await checkRes.json();
                    const maxBots = user.plan ? PLAN_DETAILS[user.plan].maxBots : 10;
                    if (currentBots.length >= maxBots) {
                        alert(`プラン作成上限（${maxBots}個）に達しています。アップグレードを検討してください。`);
                        return;
                    }
                }
            } catch (err) {
                console.error('Limit check failed:', err);
            }
        }

        const botToSave = {
            ...formData,
            id: isEditMode ? formData.id : undefined, // New bots: let server generate ID
            schedule: Array.from(scheduleSlots), // Store slots as array in DB
            settings: {
                ...((formData as { settings?: Record<string, unknown> }).settings || {}),
                botType: formData.botType || 'video_quote',
                automationType: formData.automationType,
                likeKeywords: formData.likeKeywords,
                followTargetAccount: formData.followTargetAccount,
                dailyLikeLimit: formData.dailyLikeLimit,
                followIntervals: formData.followIntervals,
                referenceAccounts: formData.referenceAccounts,
                randomTexts: (formData.randomTexts || []).filter(t => t.trim() !== ''),
                dmmAffiliateId: formData.dmmAffiliateId || '',
                mgsAffiliateId: formData.mgsAffiliateId || '',
                affiliateLink: formData.affiliateLink || '',
                linkPlacement: formData.linkPlacement || 'post',
                championshipAccounts: formData.championshipAccounts || [],
                replyTexts: (formData.replyTexts || []).filter(t => t.trim() !== ''),
            },
        };

        try {
            const response = await authJsonFetch(`${API_BASE}/api/bots/save`, 'POST', {
                    email: user?.email,
                    bot: botToSave
            });

            if (response.ok) {
                navigate('/dashboard/bots');
            } else {
                const err = await response.json();
                alert('保存に失敗しました: ' + err.error);
            }
        } catch (error) {
            console.error('Save failed:', error);
            alert('ネットワークエラーが発生しました。');
        }
    };

    if (isLoading) return <div className="py-20 text-center text-gray-500">読み込み中...</div>;

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate('/dashboard/bots')}
                        className="rounded-full"
                    >
                        <ArrowLeft size={20} />
                    </Button>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {isEditMode ? 'Bot編集' : 'Bot新規作成'}
                    </h1>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => navigate('/dashboard/bots')}>
                        キャンセル
                    </Button>
                    <Button onClick={handleSubmit}>
                        <Save className="mr-2 h-4 w-4" />
                        保存する
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid w-full grid-cols-4 max-w-lg">
                    <TabsTrigger value="basic">基本設定</TabsTrigger>
                    <TabsTrigger value="content">{formData.botType === 'reply_to_championship' ? 'リプライ設定' : '投稿・引用元'}</TabsTrigger>
                    <TabsTrigger value="automation">自動化設定</TabsTrigger>
                    <TabsTrigger value="schedule">スケジュール</TabsTrigger>
                </TabsList>

                <form id="bot-form" onSubmit={handleSubmit} className="space-y-6">
                    {/* TabsContent sections (Omitted for brevity in this tool call, keep existing logic) */}
                    <TabsContent value="basic" className="space-y-4 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <h2 className="text-lg font-medium mb-4">基本情報</h2>
                        <div className="grid gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Botタイプ
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, botType: 'video_quote' as BotType }))}
                                        className={`p-4 rounded-xl border-2 transition-all text-left ${
                                            formData.botType !== 'reply_to_championship'
                                                ? 'border-[#7c3aed] bg-[#7c3aed]/5 ring-1 ring-[#7c3aed]/20'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <Type className="h-4 w-4 text-[#7c3aed]" />
                                            <span className="text-sm font-bold text-gray-900">動画引用Bot</span>
                                        </div>
                                        <p className="text-xs text-gray-500">動画付きツイートを引用して投稿</p>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, botType: 'reply_to_championship' as BotType }))}
                                        className={`p-4 rounded-xl border-2 transition-all text-left ${
                                            formData.botType === 'reply_to_championship'
                                                ? 'border-[#7c3aed] bg-[#7c3aed]/5 ring-1 ring-[#7c3aed]/20'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <Trophy className="h-4 w-4 text-orange-500" />
                                            <span className="text-sm font-bold text-gray-900">選手権リプライBot</span>
                                        </div>
                                        <p className="text-xs text-gray-500">選手権アカウントに自分のポストを返信</p>
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                    Bot名
                                </label>
                                <Input
                                    id="name"
                                    name="name"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder={formData.botType === 'reply_to_championship' ? '例: 選手権リプライBot' : '例: 動画引用Bot'}
                                />
                            </div>

                            <div>
                                <label htmlFor="accountId" className="block text-sm font-medium text-gray-700 mb-1">
                                    投稿アカウント (自分のアカウント)
                                </label>
                                <select
                                    id="accountId"
                                    name="accountId"
                                    required
                                    value={formData.accountId}
                                    onChange={handleChange}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                >
                                    <option value="">アカウントを選択してください</option>
                                    {accounts.map(account => (
                                        <option key={account.id} value={account.id}>
                                            @{account.screenName} ({account.name})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    ステータス
                                </label>
                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="status"
                                            value="active"
                                            checked={formData.status === 'active'}
                                            onChange={handleChange}
                                            className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                                        />
                                        <span className="text-sm text-gray-900">稼働</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="status"
                                            value="paused"
                                            checked={formData.status === 'paused'}
                                            onChange={handleChange}
                                            className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                                        />
                                        <span className="text-sm text-gray-900">停止</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="content" className="space-y-4 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        {/* Championship Reply Bot UI */}
                        {formData.botType === 'reply_to_championship' ? (
                        <>
                        <div className="flex bg-orange-50 p-4 rounded-md border border-orange-100 mb-4">
                            <p className="text-sm text-orange-800">
                                <strong><Trophy className="inline h-4 w-4 mr-1" />選手権リプライBot:</strong> 指定した選手権アカウントの新しいポストに、自分の過去ポストのURLを自動で返信します。
                            </p>
                        </div>
                        <div className="grid gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    監視する選手権アカウント (IDを入力)
                                </label>
                                <div className="flex gap-2 mb-2">
                                    <Input
                                        value={newChampAccount}
                                        onChange={(e) => setNewChampAccount(e.target.value)}
                                        placeholder="例: sensyuken_bot"
                                        className="flex-1"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                if (newChampAccount.trim()) {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        championshipAccounts: [...(prev.championshipAccounts || []), newChampAccount.trim()]
                                                    }));
                                                    setNewChampAccount('');
                                                }
                                            }
                                        }}
                                    />
                                    <Button
                                        type="button"
                                        onClick={() => {
                                            if (newChampAccount.trim()) {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    championshipAccounts: [...(prev.championshipAccounts || []), newChampAccount.trim()]
                                                }));
                                                setNewChampAccount('');
                                            }
                                        }}
                                        variant="outline"
                                    >
                                        追加
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-2 min-h-[40px] p-2 bg-gray-50 rounded-md border border-gray-100">
                                    {(formData.championshipAccounts || []).length === 0 && (
                                        <span className="text-sm text-gray-400 p-1">選手権アカウントが追加されていません</span>
                                    )}
                                    {(formData.championshipAccounts || []).map((acc, index) => (
                                        <div key={index} className="flex items-center gap-1 bg-white px-3 py-1 rounded-full border border-orange-200 shadow-sm text-sm">
                                            <Trophy className="h-3 w-3 text-orange-500" />
                                            <span className="text-gray-700">@{acc}</span>
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({
                                                    ...prev,
                                                    championshipAccounts: prev.championshipAccounts?.filter((_, i) => i !== index)
                                                }))}
                                                className="text-gray-400 hover:text-red-500 transition-colors ml-1"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Reply Text Section */}
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <MessageSquare className="h-4 w-4 text-orange-500" />
                                    <label className="block text-sm font-medium text-gray-700">
                                        リプライテキスト（任意）
                                    </label>
                                </div>
                                <p className="text-xs text-gray-500 mb-2">
                                    返信時にランダムで1行が選ばれて、自分のポストURLの前に挿入されます。空欄の場合はURLのみが投稿されます。
                                </p>
                                <textarea
                                    value={(formData.replyTexts || []).join('\n')}
                                    onChange={(e) => {
                                        const lines = e.target.value.split('\n');
                                        setFormData(prev => ({ ...prev, replyTexts: lines }));
                                    }}
                                    placeholder={"例:\nこれ見て！\nおすすめです！\n私の一押し"}
                                    rows={5}
                                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                />
                                <div className="flex justify-end mt-1">
                                    <span className="text-xs text-gray-400">
                                        {(formData.replyTexts || []).filter(t => t.trim() !== '').length} 件のテキストパターン
                                    </span>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <h4 className="text-sm font-medium text-gray-700 mb-2">返信の仕組み</h4>
                                <ul className="text-xs text-gray-500 space-y-1">
                                    <li>1. スケジュール時間になると、選手権アカウントの最新ポストを取得</li>
                                    <li>2. まだ返信していないポストに対して、自分の過去ポストのURLを返信</li>
                                    <li>3. リプライテキストが設定されていれば、ランダムに1つ選ばれてURLの前に付きます</li>
                                    <li>4. 1回の実行で1件のみ返信します（レート制限対策）</li>
                                </ul>
                            </div>
                        </div>
                        </>
                        ) : (
                        <>
                        {/* Video Quote Bot UI (existing) */}
                        <div className="flex bg-blue-50 p-4 rounded-md border border-blue-100 mb-4">
                            <p className="text-sm text-blue-800">
                                <strong>動画引用投稿:</strong> 指定したアカウントの動画付きツイートを引用して投稿します。アフィリエイトリンクを設定すると、自動的にリンクが付与されます。
                            </p>
                        </div>
                        <div className="grid gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    参照するXアカウント (IDを入力)
                                </label>
                                <div className="flex gap-2 mb-2">
                                    <Input
                                        value={newRefAccount}
                                        onChange={(e) => setNewRefAccount(e.target.value)}
                                        placeholder="例: elonmusk"
                                        className="flex-1"
                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addReferenceAccount())}
                                    />
                                    <Button type="button" onClick={addReferenceAccount} variant="outline">
                                        追加
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-2 min-h-[40px] p-2 bg-gray-50 rounded-md border border-gray-100">
                                    {formData.referenceAccounts?.length === 0 && (
                                        <span className="text-sm text-gray-400 p-1">アカウントが追加されていません</span>
                                    )}
                                    {formData.referenceAccounts?.map((acc, index) => (
                                        <div key={index} className="flex items-center gap-1 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm text-sm">
                                            <span className="text-gray-700">@{acc}</span>
                                            <button
                                                type="button"
                                                onClick={() => removeReferenceAccount(index)}
                                                className="text-gray-400 hover:text-red-500 transition-colors ml-1"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Random Text Section */}
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Type className="h-4 w-4 text-purple-500" />
                                    <label className="block text-sm font-medium text-gray-700">
                                        ランダムテキスト
                                    </label>
                                </div>
                                <p className="text-xs text-gray-500 mb-2">
                                    投稿時にランダムで1行が選ばれて本文に挿入されます。1行につき1パターンを入力してください。
                                </p>
                                <textarea
                                    value={(formData.randomTexts || []).join('\n')}
                                    onChange={(e) => {
                                        const lines = e.target.value.split('\n');
                                        setFormData(prev => ({ ...prev, randomTexts: lines }));
                                    }}
                                    placeholder={"例:\nこの動画おすすめです！\nめっちゃ面白い！見て！\n必見です\nこれはヤバい"}
                                    rows={6}
                                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                />
                                <div className="flex justify-end mt-1">
                                    <span className="text-xs text-gray-400">
                                        {(formData.randomTexts || []).filter(t => t.trim() !== '').length} 件のテキストパターン
                                    </span>
                                </div>
                            </div>

                            {/* Affiliate Settings Section */}
                            <div className="border-t border-gray-200 pt-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Link2 className="h-5 w-5 text-green-600" />
                                    <h3 className="font-medium text-gray-900">アフィリエイト設定</h3>
                                </div>
                                <div className="flex bg-green-50 p-3 rounded-md border border-green-100 mb-4">
                                    <p className="text-xs text-green-800">
                                        参照アカウントの動画ツイートに含まれるURLを、自分のアフィリエイトIDに自動変換します。DMM/FANZAとMGSに対応しています。
                                    </p>
                                </div>
                                <div className="grid gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            DMM/FANZA アフィリエイトID
                                        </label>
                                        <Input
                                            value={formData.dmmAffiliateId || ''}
                                            onChange={(e) => setFormData(prev => ({ ...prev, dmmAffiliateId: e.target.value }))}
                                            placeholder="例: myid-001"
                                        />
                                        <p className="text-xs text-gray-400 mt-1">URLの id= パラメータが自動的に置き換わります</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            MGS アフィリエイトID
                                        </label>
                                        <Input
                                            value={formData.mgsAffiliateId || ''}
                                            onChange={(e) => setFormData(prev => ({ ...prev, mgsAffiliateId: e.target.value }))}
                                            placeholder="例: mycode123"
                                        />
                                        <p className="text-xs text-gray-400 mt-1">URLの c= パラメータが自動的に置き換わります</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            カスタムアフィリエイトURL（上記以外）
                                        </label>
                                        <Input
                                            value={formData.affiliateLink || ''}
                                            onChange={(e) => setFormData(prev => ({ ...prev, affiliateLink: e.target.value }))}
                                            placeholder="例: https://example.com/aff?id=xxx"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            リンクの配置
                                        </label>
                                        <div className="flex items-center gap-4">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="linkPlacement"
                                                    value="post"
                                                    checked={formData.linkPlacement !== 'reply'}
                                                    onChange={() => setFormData(prev => ({ ...prev, linkPlacement: 'post' }))}
                                                    className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                                                />
                                                <span className="text-sm text-gray-900">本文に含める</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="linkPlacement"
                                                    value="reply"
                                                    checked={formData.linkPlacement === 'reply'}
                                                    onChange={() => setFormData(prev => ({ ...prev, linkPlacement: 'reply' }))}
                                                    className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                                                />
                                                <span className="text-sm text-gray-900">リプライで投稿</span>
                                            </label>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">「リプライで投稿」を選ぶと、アフィリエイトリンクが自動的にリプライとして追加されます</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        </>
                        )}
                    </TabsContent>

                    <TabsContent value="automation" className="space-y-4 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        {/* Automation ON/OFF Toggle */}
                        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50/30">
                            <div className="flex items-center gap-3">
                                <Settings className="h-5 w-5 text-purple-600" />
                                <div>
                                    <h3 className="font-medium text-gray-900">自動いいね・フォロー</h3>
                                    <p className="text-xs text-gray-500">投稿とは別に、自動いいね・自動フォローを実行します</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({
                                    ...prev,
                                    automationType: prev.automationType === 'likes_follows' ? 'none' : 'likes_follows'
                                }))}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                    formData.automationType === 'likes_follows' ? 'bg-[#7c3aed]' : 'bg-gray-300'
                                }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        formData.automationType === 'likes_follows' ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                        </div>

                        {formData.automationType === 'likes_follows' && (
                        <>
                        {/* Auto Like Settings */}
                        <div className="p-4 border border-gray-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-4">
                                <Heart className="h-5 w-5 text-rose-500" />
                                <h3 className="font-medium text-gray-900">自動いいね設定</h3>
                            </div>
                            <p className="text-xs text-gray-500 mb-3">
                                指定したキーワードで検索されたツイートに自動でいいねします。1時間ごとに実行されます。
                            </p>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        いいね対象の検索キーワード
                                    </label>
                                    <Input
                                        placeholder="例: #副業, ポイ活 (カンマ区切り)"
                                        value={formData.likeKeywords?.join(', ')}
                                        onChange={(e) => {
                                            const keywords = e.target.value.split(',').map(k => k.trim()).filter(k => k !== '');
                                            setFormData(prev => ({ ...prev, likeKeywords: keywords }));
                                        }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        1日の上限回数
                                    </label>
                                    <Input
                                        type="number"
                                        value={formData.dailyLikeLimit}
                                        onChange={(e) => setFormData(prev => ({ ...prev, dailyLikeLimit: parseInt(e.target.value) || 0 }))}
                                        min={1}
                                        max={100}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Auto Follow Settings */}
                        <div className="p-4 border border-gray-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-4">
                                <UserPlus className="h-5 w-5 text-blue-500" />
                                <h3 className="font-medium text-gray-900">自動フォロー設定</h3>
                            </div>
                            <p className="text-xs text-gray-500 mb-3">
                                指定したアカウントのフォロワーを自動的にフォローします。選択した時間帯に実行されます。
                            </p>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        ターゲットアカウント（このアカウントのフォロワーをフォロー）
                                    </label>
                                    <Input
                                        placeholder="例: target_user（@は不要）"
                                        value={formData.followTargetAccount || ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, followTargetAccount: e.target.value.replace('@', '') }))}
                                    />
                                    <p className="text-xs text-gray-400 mt-1">同ジャンルの人気アカウントを指定すると効果的です</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        フォロー実行時間帯
                                    </label>
                                    <div className="flex flex-wrap gap-3">
                                        {([
                                            { key: 'morning' as const, label: '朝（8:00）', icon: '🌅' },
                                            { key: 'noon' as const, label: '昼（12:00）', icon: '☀️' },
                                            { key: 'evening' as const, label: '夜（20:00）', icon: '🌙' },
                                        ]).map(({ key, label, icon }) => {
                                            const isSelected = (formData.followIntervals || []).includes(key);
                                            return (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    onClick={() => {
                                                        setFormData(prev => {
                                                            const current = prev.followIntervals || [];
                                                            const updated: ('morning' | 'noon' | 'evening')[] = isSelected
                                                                ? current.filter(i => i !== key)
                                                                : [...current, key];
                                                            return { ...prev, followIntervals: updated };
                                                        });
                                                    }}
                                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all text-sm font-medium ${
                                                        isSelected
                                                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                            : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                                                    }`}
                                                >
                                                    <span>{icon}</span>
                                                    <span>{label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2">1回の実行で最大10人をフォローします（3〜8秒間隔）</p>
                                </div>
                            </div>
                        </div>
                        </>
                        )}
                    </TabsContent>

                    <TabsContent value="schedule" className="space-y-4 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        {/* Full schedule grid as before */}
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-medium">スケジュール設定</h2>
                            <span className={`text-sm font-medium ${scheduleSlots.size > maxTweets ? 'text-rose-600' : 'text-primary'}`}>
                                {scheduleSlots.size} / {maxTweets} スロット
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 mb-3">
                            クリックで投稿時間を選択してください。選択したスロットは<span className="inline-block mx-1 w-4 h-4 bg-[#7c3aed] rounded align-middle"></span>紫色で表示されます。
                        </p>
                        <div className="overflow-x-auto border border-gray-200 rounded-lg">
                            <table className="w-full border-collapse table-fixed">
                                <thead>
                                    <tr className="bg-gray-100 font-mono">
                                        <th className="p-2 text-xs font-bold border-b border-r border-gray-300 w-14 text-gray-700">時＼分</th>
                                        {MINUTES.map(m => <th key={m} className="p-2 text-xs font-bold border-b border-gray-300 text-gray-700">:{m}</th>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    {HOURS.map(h => (
                                        <tr key={h} className={h % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                                            <td className="p-2 text-xs border-r border-gray-300 text-center font-bold text-gray-700 bg-gray-100">{h}時</td>
                                            {MINUTES.map(m => {
                                                const key = `${h}:${m}`;
                                                const active = scheduleSlots.has(key);
                                                return (
                                                    <td
                                                        key={m}
                                                        onClick={() => toggleSlot(h, m)}
                                                        className={`border border-gray-200 h-10 cursor-pointer transition-all duration-150 text-center align-middle select-none ${active
                                                            ? 'bg-[#7c3aed] shadow-inner'
                                                            : 'hover:bg-[#7c3aed]/15'
                                                        }`}
                                                    >
                                                        {active && (
                                                            <span className="text-white text-base font-bold leading-none">✓</span>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </TabsContent>

                    {/* Bottom save button - always visible after scrolling */}
                    <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-200">
                        <Button variant="outline" onClick={() => navigate('/dashboard/bots')}>
                            キャンセル
                        </Button>
                        <Button onClick={handleSubmit}>
                            <Save className="mr-2 h-4 w-4" />
                            保存する
                        </Button>
                    </div>
                </form>
            </Tabs>
        </div >
    );
}
