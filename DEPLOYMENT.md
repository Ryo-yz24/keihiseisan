# デプロイ手順書

## Netlifyでのデプロイ

### 1. 環境変数の設定
Netlifyのダッシュボードで以下の環境変数を設定してください：

```
NEXTAUTH_URL=https://your-app-name.netlify.app
NEXTAUTH_SECRET=WeyFnOSmnQHV2kkuwyHiwoxD2xMQr6rwTlAlNpxlTX0=
DATABASE_URL=postgresql://your-database-url
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
RESEND_API_KEY=your-resend-key
NODE_ENV=production
```

### 2. ビルド設定
- **Build command**: `npm run build`
- **Publish directory**: `.next`
- **Node version**: `18`

## Vercelでのデプロイ（代替案）

### 1. Vercelにプロジェクトをインポート
1. [Vercel](https://vercel.com)にアクセス
2. GitHubリポジトリをインポート
3. 環境変数を設定

### 2. 環境変数の設定
```
NEXTAUTH_URL=https://your-app-name.vercel.app
NEXTAUTH_SECRET=WeyFnOSmnQHV2kkuwyHiwoxD2xMQr6rwTlAlNpxlTX0=
DATABASE_URL=postgresql://your-database-url
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
RESEND_API_KEY=your-resend-key
NODE_ENV=production
```

## トラブルシューティング

### ビルドエラーの場合
1. ローカルで `npm run build` を実行してエラーを確認
2. 環境変数が正しく設定されているか確認
3. データベース接続が正常か確認

### モジュールが見つからないエラーの場合
1. ファイルが正しくコミットされているか確認
2. `git push origin main` でリモートにプッシュ
3. デプロイを再実行
