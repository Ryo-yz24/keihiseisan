# Vercel デプロイ手順書

## 必要な環境変数

Vercelの環境変数設定で以下を設定してください：

### データベース (必須)

```
DATABASE_URL=your_postgresql_connection_string
```

### Supabase (必須)

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### NextAuth (必須)

```
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your_generated_secret
```

NEXTAUTH_SECRETの生成方法：
```bash
openssl rand -base64 32
```

### SMTP (オプション - メール通知を有効にする場合)

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

## デプロイ手順

### 1. Vercelアカウントの準備

1. [Vercel](https://vercel.com) にサインアップ/ログイン
2. GitHubアカウントと連携

### 2. プロジェクトのインポート

1. Vercel ダッシュボードで「Add New Project」をクリック
2. GitHubリポジトリを選択してインポート
3. プロジェクト設定：
   - **Framework Preset**: Next.js
   - **Root Directory**: ./
   - **Build Command**: npm run build
   - **Output Directory**: .next

### 3. 環境変数の設定

1. 「Environment Variables」セクションで上記の環境変数を追加
2. すべての環境変数をProduction、Preview、Developmentに適用

### 4. データベースのセットアップ

デプロイ前にデータベースマイグレーションを実行：

```bash
npx prisma migrate deploy
```

### 5. デプロイ

1. 「Deploy」ボタンをクリック
2. ビルドログを確認
3. デプロイ完了後、URLにアクセスして動作確認

## デプロイ後の確認事項

- [ ] ログインページが表示される
- [ ] ログインができる
- [ ] ダッシュボードが表示される
- [ ] 経費申請ができる
- [ ] 画像アップロードが動作する

---

最終更新: 2025-11-11
