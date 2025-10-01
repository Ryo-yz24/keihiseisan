# 経費計上システム

セキュアな経費申請・承認システムです。子アカウントからの経費申請を親アカウント（マスターアカウント）が承認・管理できるWebアプリケーションです。

## 特徴

### 🔐 セキュリティ重視
- NextAuth.js v5による強固な認証システム
- パスワードポリシー（8文字以上、英数字記号含む）
- セッション管理（24時間自動ログアウト）
- 監査ログによる全操作の記録
- CSRF、XSS対策
- ファイルアップロード時の検証

### 📊 洗練された管理画面
- レスポンシブデザイン（PC・タブレット・スマホ対応）
- 直感的なダッシュボード
- リアルタイム統計表示
- グラフによる視覚的なデータ表示

### 💰 経費管理機能
- 経費申請の作成・編集・削除
- 画像アップロード（JPG、PNG、PDF、最大10MB）
- 税額自動計算（10%、8%軽減税率、非課税対応）
- カテゴリ別分類
- 下書き保存機能

### ✅ 承認フロー
- マスターアカウントによる承認・却下・修正依頼
- 申請ステータス管理
- 却下理由の記録
- 直接編集機能

### 📈 分析・レポート
- 月別・年別の経費推移
- カテゴリ別内訳
- 限度額使用状況
- エクスポート機能（CSV、Excel）

## 技術スタック

### フロントエンド
- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui**
- **React Hook Form**
- **Zod** (バリデーション)
- **Recharts** (グラフ)

### バックエンド
- **PostgreSQL** (Supabase)
- **Prisma** (ORM)
- **NextAuth.js v5** (認証)
- **Supabase Storage** (ファイルストレージ)

### デプロイ
- **Vercel** (ホスティング)
- **Supabase** (データベース・ストレージ)

## プロジェクト構造

```
src/
├── app/                    # Next.js App Router
│   ├── auth/              # 認証ページ
│   ├── dashboard/         # ダッシュボード
│   ├── expenses/          # 経費管理
│   ├── admin/             # 管理画面
│   └── api/               # API ルート
├── components/            # React コンポーネント
│   ├── dashboard/         # ダッシュボード関連
│   ├── admin/             # 管理画面関連
│   ├── expenses/          # 経費管理関連
│   └── ui/                # UI コンポーネント
├── lib/                   # ユーティリティ・設定
│   ├── auth.ts           # NextAuth 設定
│   ├── prisma.ts         # Prisma クライアント
│   ├── security.ts       # セキュリティ機能
│   └── supabase.ts       # Supabase 設定
└── types/                # TypeScript 型定義
```

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local` ファイルを作成し、以下の環境変数を設定してください：

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/keihiseisan"

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# Resend
RESEND_API_KEY=your_resend_api_key
```

### 3. データベースのセットアップ

```bash
# Prisma クライアントの生成
npm run db:generate

# データベースマイグレーション
npm run db:migrate
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

アプリケーションは [http://localhost:3000](http://localhost:3000) で起動します。

## 主要機能

### 認証・アカウント管理
- メールアドレス + パスワードによるログイン
- マスターアカウントによる子アカウント管理
- 権限設定（他ユーザー閲覧権限など）

### 経費申請
- 請求書画像のアップロード（複数対応）
- 税額自動計算
- カテゴリ分類
- 下書き保存機能

### 承認フロー
- マスターアカウントによる承認・却下
- 修正依頼機能
- 直接編集機能

### ダッシュボード
- 経費統計の表示
- グラフによる視覚化
- 承認待ち一覧
- 限度額使用状況

### 管理機能
- ユーザー管理
- 限度額設定
- カテゴリ管理
- 監査ログ
- システム設定

## セキュリティ機能

- **認証**: NextAuth.js v5による強固な認証
- **認可**: ロールベースのアクセス制御
- **監査ログ**: 全操作の記録・追跡
- **ファイルセキュリティ**: アップロード時の検証・サニタイズ
- **データ保護**: 暗号化によるデータ保護
- **レート制限**: 不正アクセス防止

## ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。

## サポート

ご質問やサポートが必要な場合は、プロジェクトの Issue ページでお知らせください。


# Deploy trigger
