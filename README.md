# posutto - マルチSNS自動投稿ツール

> X（Twitter）・Threads・Instagram への自動投稿を一元管理する Cotton-Web の自社開発ツール。
> 投稿スケジューラ、ハッシュタグ自動付与、複数アカウント対応で、SNS運用の手間をゼロに。

![posutto LP](./posutto-lp.png)

## ✨ 主な機能

- **マルチSNS同時投稿**（X / Threads / Instagram）
- **マルチアカウント切り替え**（複数の運用アカウントを1画面で管理）
- **投稿スケジューラ**（日時指定・繰り返し投稿）
- **ハッシュタグの自動付与**（テンプレ管理）
- **画像付き投稿**（最大4枚）
- **API キーの管理画面**（各SNSの認証情報を一元管理）
- **投稿履歴・予約一覧**

## 🛠️ 技術スタック

### フロントエンド
- **React 19** + **TypeScript**
- **Vite** + **Tailwind CSS 4**
- **React Router**（ルーティング）
- **Lucide React**（アイコン）
- **tailwind-merge** / **clsx**（スタイリング）

### バックエンド
- **Node.js** + **Express**
- 各SNSのAPI（X API v2 / Threads API / Instagram Graph API）

### 開発・運用
- **ESLint 9** + **TypeScript ESLint**
- Cotton-Web で本番運用中

## 🚀 セットアップ

```bash
# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env
# .env を編集（API URL 等）

# 開発サーバ起動
npm run dev
```

ブラウザで `http://localhost:5173` を開いて確認。

サーバー側を起動する場合は別ターミナルで：

```bash
cd server
npm install
npm run dev
```

## 📦 ビルド & デプロイ

```bash
npm run build       # 本番ビルド（dist/ に出力）
npm run preview     # ローカルでビルド結果を確認
```

## 🌐 運用

このツールは Cotton-Web で本番運用中です：
**https://sns-tool.online/posutto/**

「SNS運用を全自動化したい」という課題感から、自社で開発・運用しています。
各SNSのAPI仕様変更にも追随しながら、安定的に投稿を続けています。

## 📝 ライセンス

MIT License

## 👤 作者

**Cotton-Web（山田 英紀 / Hi）**

業務システム制作 × SNS自動化 × AI連携 を一人で完結するエンジニアです。

- 自社サイト: [https://sns-tool.online](https://sns-tool.online)
- 連絡先: yamada@sns-tool.online

### 関連プロダクト

- [tubetto](https://sns-tool.online/tubetto/) - YouTube動画自動生成・公開ツール
- [tradepostpro](https://sns-tool.online/tradepostpro/) - FX実績連動マルチSNS投稿
- [keiri](https://sns-tool.online/keiri/) - 個人事業主向け経理ソフト（[GitHub](https://github.com/cotton1101/keiri)）

---

SNS自動化・AI連携プロダクト開発のご相談は yamada@sns-tool.online までお気軽にどうぞ。
