# 🚀 Vercel 自動デプロイ完全ガイド

## 📋 デプロイの全体フロー

```
1. GitHubにプッシュ（自動）
2. Vercelでプロジェクト作成（手動・初回のみ）
3. 環境変数を設定（手動・初回のみ）
4. 自動ビルド＆デプロイ（自動）
```

---

## ✅ 事前準備チェックリスト

### 必要なアカウント
- [ ] GitHubアカウント
- [ ] Vercelアカウント（GitHubで連携可能）
- [ ] Supabaseプロジェクト（データベース＋ストレージ）

### 必要な情報を準備
以下の情報を手元に用意してください：

#### 1. データベース接続情報
```
Supabaseダッシュボード → Settings → Database → Connection String
形式: postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
```

#### 2. Supabase認証情報
```
Supabaseダッシュボード → Settings → API
- Project URL
- anon public key
- service_role key（秘密！）
```

#### 3. NextAuth秘密鍵（自動生成）
ターミナルで実行：
```bash
openssl rand -base64 32
```
出力された文字列をコピーして保存

---

## 🎯 ステップ1: GitHubにプッシュ（自動）

このプロジェクトをGitHubにプッシュします。

### 1-1. 既存のリモートリポジトリを確認
```bash
git remote -v
```

### 1-2. すべての変更をコミット
```bash
git add .
git commit -m "feat: Vercelデプロイ設定完了"
```

### 1-3. GitHubにプッシュ
```bash
git push origin main
```

> **✅ 完了確認**: GitHubのリポジトリページで最新のコミットが表示されればOK

---

## 🎯 ステップ2: Vercelでプロジェクト作成（手動・初回のみ）

### 2-1. Vercelにログイン
1. https://vercel.com にアクセス
2. 「Continue with GitHub」でログイン

### 2-2. プロジェクトをインポート
1. ダッシュボードで「Add New...」→「Project」をクリック
2. GitHubリポジトリの一覧から「keihiseisan」を検索
3. 「Import」をクリック

### 2-3. プロジェクト設定（そのままでOK）
以下の設定を確認：
- **Framework Preset**: Next.js（自動検出）
- **Root Directory**: `./`
- **Build Command**: `npm run build`
- **Output Directory**: `.next`

> **⚠️ まだ「Deploy」を押さないでください！先に環境変数を設定します**

---

## 🎯 ステップ3: 環境変数を設定（手動・初回のみ）

### 3-1. 環境変数セクションを開く
プロジェクト設定画面で「Environment Variables」セクションまでスクロール

### 3-2. 必須の環境変数を追加

#### ① DATABASE_URL
```
Key: DATABASE_URL
Value: postgresql://postgres:[YOUR_PASSWORD]@[YOUR_HOST]:5432/postgres
Environment: Production, Preview, Development（3つすべてチェック）
```

#### ② NEXT_PUBLIC_SUPABASE_URL
```
Key: NEXT_PUBLIC_SUPABASE_URL
Value: https://[YOUR_PROJECT_ID].supabase.co
Environment: Production, Preview, Development
```

#### ③ NEXT_PUBLIC_SUPABASE_ANON_KEY
```
Key: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGc... （Supabaseの anon public key）
Environment: Production, Preview, Development
```

#### ④ SUPABASE_SERVICE_ROLE_KEY
```
Key: SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGc... （Supabaseの service_role key）
Environment: Production, Preview, Development
```
> **⚠️ 重要**: このキーは秘密情報です。絶対に公開しないでください

#### ⑤ NEXTAUTH_SECRET
```
Key: NEXTAUTH_SECRET
Value: （openssl rand -base64 32 で生成した文字列）
Environment: Production, Preview, Development
```

#### ⑥ NEXTAUTH_URL
```
Key: NEXTAUTH_URL
Value: https://your-project-name.vercel.app
Environment: Production

（Previewは空欄でOK - 自動設定されます）
```
> **📝 メモ**: プロジェクト名は次の画面で表示されます。一旦ダミーのURLを入れても後で変更可能です

### 3-3. オプション: メール通知を有効にする場合

Gmailを使う場合の設定：

#### アプリパスワードの取得方法
1. Googleアカウント（https://myaccount.google.com/）にアクセス
2. 「セキュリティ」→「2段階認証」を有効化
3. 「2段階認証」→「アプリパスワード」をクリック
4. アプリ: 「メール」、デバイス: 「その他（カスタム名）」で「keihiseisan」を入力
5. 生成された16桁のパスワードをコピー

#### 環境変数に追加
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=（アプリパスワード 16桁）
```

> **✅ 確認**: すべての環境変数が追加されたか確認

---

## 🎯 ステップ4: デプロイ実行（自動）

### 4-1. デプロイ開始
「Deploy」ボタンをクリック

### 4-2. ビルドログを確認
- ビルドが開始されます（3〜5分程度）
- ログが表示されるので、エラーがないか確認

### 4-3. ビルドエラーについて
以下のエラーは**無視してOK**です（Vercelでは正常に動作します）：
```
/_error: /404
/_error: /500
/auth/error/page: /auth/error
```

### 4-4. デプロイ完了
「Congratulations!」の画面が表示されたら成功！
- デプロイされたURLが表示されます
- 「Visit」ボタンでサイトにアクセス

---

## 🎯 ステップ5: データベースセットアップ（手動・初回のみ）

### 5-1. Supabase SQL Editorでマイグレーション実行

1. Supabaseダッシュボードを開く
2. 「SQL Editor」をクリック
3. 「New Query」をクリック
4. 以下のSQLを実行（プロジェクトの`prisma/migrations`フォルダから最新のマイグレーションファイルをコピー）

または、ローカルから実行：
```bash
# .envファイルのDATABASE_URLを本番環境に設定
npx prisma migrate deploy
```

### 5-2. 初期データ投入（オプション）
必要に応じて、カテゴリやマスターユーザーを作成します。

---

## 🎯 ステップ6: 動作確認

### 6-1. 基本機能チェック
- [ ] デプロイされたURLにアクセス
- [ ] ログインページが表示される
- [ ] 認証なしで保護されたページにアクセスできない

### 6-2. データベース接続チェック
- [ ] テストユーザーでログインできる
- [ ] ダッシュボードが表示される

### 6-3. 画像アップロードチェック
- [ ] 経費申請で画像をアップロードできる

### 6-4. メール通知チェック（SMTP設定した場合）
- [ ] 経費申請時にメールが届く

---

## 🎯 ステップ7: NEXTAUTH_URLを正しいURLに更新

### 7-1. デプロイされたURLを確認
Vercelダッシュボードで「Domains」セクションを確認
```
例: https://keihiseisan-abc123.vercel.app
```

### 7-2. 環境変数を更新
1. Vercelダッシュボード → 「Settings」→「Environment Variables」
2. `NEXTAUTH_URL`を探す
3. 「Edit」をクリック
4. 正しいURLに変更
   ```
   https://keihiseisan-abc123.vercel.app
   ```
5. 「Save」をクリック

### 7-3. 再デプロイ
1. 「Deployments」タブに戻る
2. 最新のデプロイの「...」メニュー →「Redeploy」
3. 「Redeploy」を確認

> **✅ 完了**: これでログイン機能が正常に動作します

---

## 🎉 完了！今後の自動デプロイ

### 今後の更新は完全自動
GitHubにプッシュするだけで自動的にデプロイされます：

```bash
git add .
git commit -m "feat: 新機能追加"
git push origin main
```

- **mainブランチ**: 本番環境に自動デプロイ
- **その他のブランチ**: プレビュー環境に自動デプロイ

---

## 🔧 トラブルシューティング

### ❌ ビルドが失敗する

#### 原因1: 環境変数が未設定
```
解決策: ステップ3を再確認して、すべての必須環境変数を設定
```

#### 原因2: DATABASE_URLが間違っている
```
解決策: Supabaseの接続文字列を再確認
- パスワードに特殊文字がある場合はURLエンコード
- ホスト名が正しいか確認
```

### ❌ ログインできない

#### 原因: NEXTAUTH_URLが間違っている
```
解決策: 
1. ステップ7を再実行
2. 正しいVercel URLに更新
3. 再デプロイ
```

### ❌ 画像アップロードが動作しない

#### 原因1: Supabaseストレージが未作成
```
解決策:
1. Supabaseダッシュボード → Storage
2. 新しいバケット「expense-receipts」を作成
3. Publicアクセスを有効化
```

#### 原因2: SUPABASE_SERVICE_ROLE_KEYが間違っている
```
解決策: Supabaseの service_role key を再確認して更新
```

### ❌ メール送信が動作しない

#### 原因: Gmailアプリパスワードが未設定
```
解決策: ステップ3-3を再実行してアプリパスワードを取得
```

---

## 📞 サポート

### Vercelのサポート
- ビルドログを確認: Vercelダッシュボード → Deployments
- Vercel公式ドキュメント: https://vercel.com/docs

### Supabaseのサポート
- Supabase公式ドキュメント: https://supabase.com/docs

---

## 🎨 カスタムドメインの設定（オプション）

独自ドメインを設定する場合：

1. Vercelダッシュボード → 「Settings」→「Domains」
2. 「Add」をクリックしてドメインを入力
3. DNSレコードを設定：
   ```
   Type: CNAME
   Name: www (またはサブドメイン)
   Value: cname.vercel-dns.com
   ```
4. SSL証明書は自動発行されます

---

最終更新: 2025-11-11

**🎉 お疲れ様でした！これでVercelへの自動デプロイが完了です！**
