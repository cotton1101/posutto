import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export default function Privacy() {
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
                <h1 className="text-3xl font-bold text-white mb-8">プライバシーポリシー</h1>

                <div className="space-y-8 text-gray-300 leading-relaxed">
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">1. 個人情報の定義</h2>
                        <p>本プライバシーポリシーにおいて、個人情報とは、個人情報の保護に関する法律に規定される生存する個人に関する情報（氏名、生年月日、その他の特定の個人を識別することができる情報）、ならびに特定の個人と結びついて使用されるメールアドレス、ユーザーID、パスワード、クレジットカードなどの情報、および個人情報と一体となった趣味、家族構成、年齢その他の個人に関する属性情報を指します。</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">2. クッキー・IPアドレス情報</h2>
                        <p>クッキー及びIPアドレス情報については、それら単独では特定の個人を識別することができないため、個人情報とは考えておりません。ただしこれら情報と個人情報が一体となって使用される場合にはこれら情報も個人情報とみなします。</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">3. 個人情報の利用目的</h2>
                        <p>当社は、取得した個人情報を以下の目的でのみ利用します。</p>
                        <ul className="list-disc pl-5 mt-2 space-y-2">
                            <li>本サービスの提供・運営のため</li>
                            <li>ユーザーからのお問い合わせに回答するため（本人確認を行うことを含む）</li>
                            <li>ユーザーが利用中のサービスの新機能、更新情報、キャンペーン等及び当社が提供する他のサービスの案内のメールを送付するため</li>
                            <li>メンテナンス、重要なお知らせなど必要に応じたご連絡のため</li>
                            <li>利用規約に違反したユーザーや、不正・不当な目的でサービスを利用しようとするユーザーの特定をし、ご利用をお断りするため</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">4. 個人情報の第三者提供</h2>
                        <p>当社は、あらかじめユーザーの同意を得ることなく、第三者に個人情報を提供することはありません。ただし、個人情報保護法その他の法令で認められる場合を除きます。</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">5. APIデータの取り扱い</h2>
                        <p>本サービスは、Twitter（X）APIその他の外部サービスAPIを利用して機能を提供します。APIを通じて取得したデータ（アクセストークン等）は、本サービスの機能提供に必要な範囲内でのみ使用・保存され、厳重に管理されます。これらのデータを第三者に販売・提供することはありません。</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">6. お問い合わせ窓口</h2>
                        <p>本ポリシーに関するお問い合わせは、下記の窓口までお願いいたします。</p>
                        <p className="mt-2 text-yellow-500">Posutto運営事務局 サポートセンター</p>
                    </section>
                </div>

                <div className="mt-16 pt-8 border-t border-gray-800 text-center">
                    <p className="text-gray-500 mb-4">2026年2月17日 制定</p>
                    <Link to="/">
                        <Button variant="ghost" className="text-yellow-500 hover:text-yellow-400">トップページに戻る</Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
