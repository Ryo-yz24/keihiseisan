# Netlifyデプロイ設定

## ビルド設定

### 必須設定
- **Build command**: `npm run build`
- **Publish directory**: `.next`
- **Node version**: `18.20.8`

### 環境変数（netlify.tomlに設定済み）
```
NEXTAUTH_URL=https://your-app-name.netlify.app
NEXTAUTH_SECRET=WeyFnOSmnQHV2kkuwyHiwoxD2xMQr6rwTlAlNpxlTX0=
DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy
NEXT_PUBLIC_SUPABASE_URL=https://dummy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy-anon-key
SUPABASE_SERVICE_ROLE_KEY=dummy-service-key
RESEND_API_KEY=dummy-resend-key
NODE_ENV=production
```

## トラブルシューティング

### 1. Node.jsバージョン
- `.nvmrc`ファイルでNode.js 18.20.8を指定
- `package.json`の`engines`でNode.js 18.xを指定

### 2. ビルドコマンド
- `npm run build`が正常に実行されることを確認
- ローカルで`npm run build`を実行してエラーがないか確認

### 3. 依存関係
- すべての依存関係が`package.json`に記載されていることを確認
- `package-lock.json`がコミットされていることを確認

### 4. ファイル構造
- `src/`ディレクトリが正しく存在することを確認
- `@`エイリアスが`jsconfig.json`と`next.config.js`で設定されていることを確認

## デプロイ手順

1. GitHubリポジトリをNetlifyに接続
2. ビルド設定を上記の値に設定
3. 環境変数を設定（netlify.tomlに記載済み）
4. デプロイを実行

## 確認事項

- [ ] package.jsonにbuildスクリプトが存在
- [ ] tsconfig.jsonとjsconfig.jsonで@エイリアスが設定
- [ ] next.config.jsでwebpackエイリアスが設定
- [ ] すべての依存関係がpackage.jsonに記載
- [ ] ローカルでnpm run buildが成功

