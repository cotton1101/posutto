import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export default function Terms() {
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
                <h1 className="text-3xl font-bold text-white mb-8">利用規約</h1>

                <div className="space-y-8 text-gray-300 leading-relaxed">
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">第1条（適用）</h2>
                        <p>本規約は、Posutto運営事務局（以下「当社」といいます。）が提供するサービス「Posutto」（以下「本サービス」といいます。）の利用条件を定めるものです。登録ユーザー（以下「ユーザー」といいます。）の皆さまには、本規約に従って本サービスをご利用いただきます。</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">第2条（利用登録）</h2>
                        <p>登録希望者が当社の定める方法によって利用登録を申請し、当社がこれを承認することによって、利用登録が完了するものとします。</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">第3条（禁止事項）</h2>
                        <p>ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。</p>
                        <ul className="list-disc pl-5 mt-2 space-y-2">
                            <li>法令または公序良俗に違反する行為</li>
                            <li>犯罪行為に関連する行為</li>
                            <li>本サービスの内容等、本サービスに含まれる著作権、商標権ほか知的財産権を侵害する行為</li>
                            <li>当社、ほかのユーザー、またはその他第三者のサーバーまたはネットワークの機能を破壊したり、妨害したりする行為</li>
                            <li>本サービスによって得られた情報を商業的に利用する行為</li>
                            <li>当社のサービスの運営を妨害するおそれのある行為</li>
                            <li>不正アクセスをし、またはこれを試みる行為</li>
                            <li>他のユーザーまたは第三者に成りすます行為</li>
                            <li>当社のサービスに関連して、反社会的勢力に対して直接または間接に利益を供与する行為</li>
                            <li>その他、当社が不適切と判断する行為</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">第4条（本サービスの提供の停止等）</h2>
                        <p>当社は、以下のいずれかの事由があると判断した場合、ユーザーに事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします。</p>
                        <ul className="list-disc pl-5 mt-2 space-y-2">
                            <li>本サービスにかかるコンピュータシステムの保守点検または更新を行う場合</li>
                            <li>地震、落雷、火災、停電または天災などの不可抗力により、本サービスの提供が困難となった場合</li>
                            <li>コンピュータまたは通信回線等が事故により停止した場合</li>
                            <li>その他、当社が本サービスの提供が困難と判断した場合</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">第5条（免責事項）</h2>
                        <p>当社の債務不履行責任は、当社の故意または重過失によらない場合には免責されるものとします。当社は、本サービスに関して、ユーザーと他のユーザーまたは第三者との間において生じた取引、連絡または紛争等について一切責任を負いません。</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">第6条（サービス内容の変更等）</h2>
                        <p>当社は、ユーザーに通知することなく、本サービスの内容を変更し、または本サービスの提供を中止することができるものとし、これによってユーザーに生じた損害について一切の責任を負いません。</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">第7条（利用規約の変更）</h2>
                        <p>当社は、必要と判断した場合には、ユーザーに通知することなくいつでも本規約を変更することができるものとします。</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">第8条（準拠法・裁判管轄）</h2>
                        <p>本規約の解釈にあたっては、日本法を準拠法とします。本サービスに関して紛争が生じた場合には、当社の本店所在地を管轄する裁判所を専属的合意管轄裁判所とします。</p>
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
