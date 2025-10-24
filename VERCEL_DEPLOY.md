# Vercelデプロイ手順書

## デプロイ手順

### 1. Vercelアカウントの準備
1. [Vercel](https://vercel.com)にアクセス
2. GitHubアカウントでログイン
3. 新しいプロジェクトを作成

### 2. プロジェクトのインポート
1. GitHubリポジトリを選択: `Ryo-yz24/keihiseisan`
2. フレームワーク: **Next.js** を選択
3. ルートディレクトリ: `/` (デフォルト)
4. ビルドコマンド: `npm run build` (自動設定)
5. 出力ディレクトリ: `.next` (自動設定)

### 3. 環境変数の設定
Vercelのダッシュボードで以下の環境変数を設定：

```
NEXTAUTH_URL=https://your-app-name.vercel.app
NEXTAUTH_SECRET=WeyFnOSmnQHV2kkuwyHiwoxD2xMQr6rwTlAlNpxlTX0=
DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy
NEXT_PUBLIC_SUPABASE_URL=https://dummy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy-anon-key
SUPABASE_SERVICE_ROLE_KEY=dummy-service-key
RESEND_API_KEY=dummy-resend-key
NODE_ENV=production
```

### 4. デプロイの実行
1. 「Deploy」ボタンをクリック
2. ビルドが完了するまで待機
3. デプロイされたURLを確認

## 設定ファイル

### vercel.json
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "functions": {
    "src/app/api/**/*.ts": {
      "runtime": "nodejs18.x"
    }
  },
  "env": {
    "NEXTAUTH_URL": "https://your-app-name.vercel.app",
    "NEXTAUTH_SECRET": "WeyFnOSmnQHV2kkuwyHiwoxD2xMQr6rwTlAlNpxlTX0=",
    "DATABASE_URL": "postgresql://dummy:dummy@localhost:5432/dummy",
    "NEXT_PUBLIC_SUPABASE_URL": "https://dummy.supabase.co",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "dummy-anon-key",
    "SUPABASE_SERVICE_ROLE_KEY": "dummy-service-key",
    "RESEND_API_KEY": "dummy-resend-key",
    "NODE_ENV": "production"
  }
}
```

## トラブルシューティング

### ビルドエラーの場合
1. ローカルで `npm run build` を実行
2. エラーが発生した場合は修正
3. 再度デプロイを実行

### 環境変数エラーの場合
1. Vercelダッシュボードで環境変数を確認
2. すべての環境変数が正しく設定されているか確認
3. デプロイを再実行

### デプロイ後の確認
1. アプリケーションが正常に表示されるか確認
2. ログイン機能が動作するか確認
3. パスワード保護が機能するか確認

## 特徴

- **環境変数ファイル不要**: `.env`ファイルを読み込まない
- **自動設定**: VercelがNext.jsを自動検出
- **簡単デプロイ**: GitHubと連携して自動デプロイ
- **無料プラン**: 個人利用なら無料で使用可能
