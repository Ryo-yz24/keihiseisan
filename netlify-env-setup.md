# Netlify環境変数設定ガイド

## 必要な環境変数

Netlifyのダッシュボードで以下の環境変数を設定してください：

### 1. NextAuth設定
```
NEXTAUTH_URL=https://your-site-name.netlify.app
NEXTAUTH_SECRET=WeyFnOSmnQHV2kkuwyHiwoxD2xMQr6rwTlAlNpxlTX0=
```

### 2. Supabase設定（実際の値に置き換え）
```
DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy
NEXT_PUBLIC_SUPABASE_URL=https://dummy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy-anon-key
SUPABASE_SERVICE_ROLE_KEY=dummy-service-key
```

### 3. メール送信（オプション）
```
RESEND_API_KEY=[RESEND-KEY]
```

### 4. 環境設定
```
NODE_ENV=production
```

## 設定手順

1. **Netlifyダッシュボード**にアクセス
2. **プロジェクト**を選択
3. **「Site settings」**をクリック
4. **「Environment variables」**をクリック
5. **「Add variable」**をクリック
6. 上記の環境変数を**1つずつ追加**

## 注意事項

- `NEXTAUTH_URL`は、実際のNetlifyのURLに置き換えてください
- Supabaseの設定は、実際のプロジェクトの値に置き換えてください
- 環境変数は**大文字**で入力してください

