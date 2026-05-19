import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export default function Legal() {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
            <header className="fixed top-0 inset-x-0 z-50 bg-gray-900/90 backdrop-blur-md border-b border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2">
                        <img src="/posutto/assets/logo.png" alt="Posutto" className="h-8 w-8 rounded-md" />
                        <span className="text-xl font-bold text-white tracking-widest">Posutto</span>
                    </Link>
                    <Link to="/login">
                        <Button size="sm" variant="outline" className="border-gray-700 hover:bg-gray-800">ログイン</Button>
                    </Link>
                </div>
            </header>

            <div className="pt-24 pb-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold text-white mb-8">特定商取引法に基づく表記</h1>

                <div className="overflow-hidden rounded-xl border border-gray-700">
                    <table className="w-full text-left border-collapse">
                        <tbody className="divide-y divide-gray-700">
                            <tr className="bg-gray-800/50">
                                <th className="py-4 px-6 font-medium text-gray-300 w-1/3">販売業者</th>
                                <td className="py-4 px-6 text-white">Posutto運営事務局</td>
                            </tr>
                            <tr>
                                <th className="py-4 px-6 font-medium text-gray-300">運営統括責任者</th>
                                <td className="py-4 px-6 text-white">山田 秀樹</td>
                            </tr>
                            <tr className="bg-gray-800/50">
                                <th className="py-4 px-6 font-medium text-gray-300">所在地</th>
                                <td className="py-4 px-6 text-white">
                                    請求があったら遅滞なく開示します
                                </td>
                            </tr>
                            <tr>
                                <th className="py-4 px-6 font-medium text-gray-300">電話番号</th>
                                <td className="py-4 px-6 text-white">
                                    請求があったら遅滞なく開示します
                                </td>
                            </tr>
                            <tr className="bg-gray-800/50">
                                <th className="py-4 px-6 font-medium text-gray-300">商品代金以外の必要料金</th>
                                <td className="py-4 px-6 text-white">インターネット接続料金、通信料金等はお客様の負担となります。</td>
                            </tr>
                            <tr>
                                <th className="py-4 px-6 font-medium text-gray-300">お支払い方法</th>
                                <td className="py-4 px-6 text-white">クレジットカード決済</td>
                            </tr>
                            <tr className="bg-gray-800/50">
                                <th className="py-4 px-6 font-medium text-gray-300">代金の支払時期</th>
                                <td className="py-4 px-6 text-white">初回お申し込み時、および翌月以降の毎月同日に請求されます。</td>
                            </tr>
                            <tr>
                                <th className="py-4 px-6 font-medium text-gray-300">商品の引渡時期</th>
                                <td className="py-4 px-6 text-white">お支払い手続き完了後、直ちにご利用いただけます。</td>
                            </tr>
                            <tr className="bg-gray-800/50">
                                <th className="py-4 px-6 font-medium text-gray-300">返品・キャンセルについて</th>
                                <td className="py-4 px-6 text-white">
                                    サービスの性質上、返品・返金はお受けしておりません。<br />
                                    解約はいつでもマイページより行うことができます。<br />
                                    次回更新日の24時間前までに解約手続きを行ってください。
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="mt-16 pt-8 border-t border-gray-800 text-center">
                    <Link to="/">
                        <Button variant="ghost" className="text-yellow-500 hover:text-yellow-400">トップページに戻る</Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
