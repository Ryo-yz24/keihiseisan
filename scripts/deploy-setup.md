# Vercelデプロイ後の設定手順

## 1. 環境変数の設定

Vercelダッシュボードで以下の環境変数を設定：

```
NEXTAUTH_URL = https://keihiseisan.vercel.app
NEXTAUTH_SECRET = Vb3IPr/YZzqDzUpLf7M/Wo69z3O6tCKARbNBwGEMLYQ=
DATABASE_URL = [Supabaseの実際のデータベースURL]
NEXT_PUBLIC_SUPABASE_URL = [SupabaseのプロジェクトURL]
NEXT_PUBLIC_SUPABASE_ANON_KEY = [SupabaseのAnon Key]
SUPABASE_SERVICE_ROLE_KEY = [SupabaseのService Role Key]
NODE_ENV = production
```

## 2. Supabaseでのデータベース設定

1. Supabaseダッシュボードにアクセス
2. プロジェクトを選択
3. Settings → Database でデータベースURLを取得
4. Settings → API でAPIキーを取得

## 3. データベースのマイグレーション

環境変数設定後、以下のコマンドをローカルで実行：

```bash
# Prismaクライアントを生成
npx prisma generate

# データベースにマイグレーションを適用
npx prisma db push

# シードデータを投入（オプション）
npm run db:seed
```

## 4. 再デプロイ

環境変数設定後、Vercelで再デプロイを実行

## 5. 動作確認

- https://keihiseisan.vercel.app にアクセス
- ログイン機能をテスト
- ダッシュボードの表示を確認

