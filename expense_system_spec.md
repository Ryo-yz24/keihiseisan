# 経費計上システム 仕様書

## プロジェクト概要

子アカウントからの経費申請を親アカウント（マスターアカウント）が承認・管理できる経費計上システム。請求書画像のアップロード、経費限度額の管理、承認フロー、通知機能を備えたセキュアなWebアプリケーション。

## 技術スタック

### フロントエンド
- **フレームワーク**: Next.js 14 (App Router)
- **UI**: Tailwind CSS + shadcn/ui
- **レスポンシブ対応**: 必須（追加工数minimal）

### バックエンド
- **データベース**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **認証**: NextAuth.js v5
- **ファイルストレージ**: Supabase Storage
- **メール通知**: Resend

### デプロイ・インフラ
- **ホスティング**: Vercel
- **データベース**: Supabase (PostgreSQL + Storage)

### セキュリティ
- **認証**: NextAuth.js (セッション管理、パスワードポリシー)
- **データ暗号化**: 転送時（HTTPS）、保存時（Supabase暗号化）
- **画像アクセス制御**: 認証済みユーザーのみ
- **監査ログ**: アクセスログの記録

## アカウント構造

### アカウント階層
```
マスターアカウント（親アカウント）
  └ 子アカウント（最大5名程度）
```

### 権限設定
- **マスターアカウント（親）**:
  - 全ての経費申請の閲覧・承認・却下・修正
  - 子アカウントの管理（追加・削除・権限設定）
  - 経費限度額の設定（全体・個別）
  - 自身の経費申請も可能
  - ダッシュボードで全体の経費状況を把握

- **子アカウント**:
  - 経費申請の作成・編集（自分の申請のみ）
  - 自分の申請履歴の閲覧
  - マスターから権限付与された場合、他の子アカウントの申請閲覧可能
  - ダッシュボードで自分の経費状況を把握

## 機能要件

### 1. 認証・アカウント管理
- **ログイン機能**: メールアドレス + パスワード
- **パスワードポリシー**: 8文字以上、英数字記号含む
- **セッション管理**: 自動ログアウト機能
- **アカウント管理**:
  - マスターアカウントが子アカウントを招待
  - 子アカウント間の閲覧権限設定

### 2. 経費申請機能

#### 申請フォーム項目
- **必須項目**:
  - 請求書画像（複数アップロード可能）
  - 利用日付（カレンダー選択）
  - 支払金額（税込）
  - 支払先（テキスト入力）
  - 利用目的（テキストエリア）
  - カテゴリ（選択式）

- **カテゴリ一覧** (マスターが追加・編集可能):
  - 交通費
  - 飲食費（接待）
  - 消耗品費
  - 通信費
  - 水道光熱費
  - 広告宣伝費
  - その他（未分類）※親の判断を仰ぐ

- **税率管理**:
  - 消費税率選択（10%、8%軽減税率、非課税）
  - 税込/税抜の切り替え
  - 消費税額の自動計算・表示

#### 画像アップロード
- **形式**: JPG、PNG、PDF
- **サイズ制限**: 1ファイル10MBまで
- **複数アップロード**: 1申請につき最大5枚
- **ダウンロード**: 認証済みユーザーのみ可能
- **プレビュー機能**: アップロード前確認

#### 申請ステータス
- **下書き**: 保存のみ（未申請）
- **申請中**: マスターの承認待ち
- **承認済み**: マスターが承認
- **却下**: マスターが却下（却下理由必須）
- **修正依頼**: マスターからの修正依頼

### 3. 承認フロー

#### 承認プロセス
```
子アカウント
  ↓ 申請
マスターアカウント（親）
  ↓ 承認 or 却下 or 修正依頼
承認済み / 却下 / 修正依頼中
```

#### マスターの操作
- **承認**: 申請を承認
- **却下**: 却下理由を入力して却下
- **修正依頼**: 修正箇所を指摘して差し戻し
- **直接編集**: マスターが申請内容を修正可能

### 4. 経費限度額管理

#### 設定項目
- **設定権限**: マスターアカウントのみ
- **単位選択**: 月次 or 年次
- **設定方法**:
  - 全体限度額（全子アカウントの合計）
  - 個別限度額（子アカウント毎）

#### アラート機能
- **残り70%**: 情報通知
- **残り30%**: 警告通知（メール送信）
- **100%到達**: 限度額到達通知（メール送信、申請は可能）
- **表示**: ダッシュボードに進捗バー表示

### 5. ダッシュボード

#### マスターアカウント用
- **当月の経費状況**:
  - 月初〜当日までの合計金額
  - 限度額に対する使用率（プログレスバー）
  - カテゴリ別内訳（円グラフ）
  - 承認待ち件数

- **過去の経費履歴**:
  - 月別の経費推移（折れ線グラフ）
  - 年別の合計金額
  - カテゴリ別の年間推移

- **承認待ち一覧**:
  - 申請中のリスト（最新順）
  - クイック承認ボタン

#### 子アカウント用
- **自分の経費状況**:
  - 月初〜当日までの合計金額
  - 個別限度額に対する使用率
  - カテゴリ別内訳

- **申請履歴**:
  - ステータス別フィルタ
  - 月別表示

### 6. 通知機能

#### システム内通知
- **通知API** (`/api/notifications`)
  - **GET**: 通知一覧取得、未読数カウント（最新50件）
  - **PUT**: 個別通知または全通知の既読処理
  - **DELETE**: 個別通知または全通知の削除
  - **認証**: NextAuth.jsセッション認証必須
  - **権限**: ユーザーは自分の通知のみアクセス可能

- **通知ドロップダウンUI**
  - ベルアイコンクリックで表示/非表示切り替え
  - 30秒ごとの自動更新機能（ポーリング）
  - 未読数バッジ表示（9件以上は "9+" と表示）
  - 通知タイプ別アイコン表示:
    - 承認: 緑色チェックマーク
    - 却下: 赤色×印
    - 保留: 黄色警告マーク
    - その他: 青色情報マーク
  - 相対時間表示（たった今、○分前、○時間前、○日前、または日付）
  - クリック外部検知で自動クローズ
  - 未読通知の視覚的ハイライト（青い背景色 + 青い丸印）
  - 個別通知クリックで自動的に既読処理
  - "すべて既読にする"ボタン（未読がある場合のみ表示）
  - 通知がない場合の空状態表示
  - "すべての通知を見る"リンク（/notificationsページへ遷移）

- **対応アカウント**
  - 子アカウント: ダッシュボードヘッダーに通知機能
  - マスターアカウント: 管理画面ヘッダーに通知機能

#### メール通知
- **送信先**: 該当ユーザーのメールアドレス
- **通知タイミング**:
  1. 子が申請提出時 → マスターに通知
  2. 限度額残り30%到達時 → マスター・該当子に通知
  3. 限度額100%到達時 → マスター・該当子に通知
  4. 申請が却下された時 → 申請者に通知
  5. 申請が承認された時 → 申請者に通知
  6. 修正依頼時 → 申請者に通知

### 7. 検索・フィルタ機能
- **検索条件**:
  - 期間指定（開始日〜終了日）
  - ステータス
  - カテゴリ
  - 支払先（部分一致）
  - 金額範囲
  - 申請者（マスターのみ）

- **ソート**:
  - 申請日（新しい順・古い順）
  - 金額（高い順・低い順）
  - ステータス

### 8. エクスポート機能
- **フォーマット**: CSV、Excel
- **出力内容**:
  - フィルタ・検索結果に基づく
  - 全項目を含む
  - 税額計算結果も含む
- **画像**: ZIPファイルで一括ダウンロード

### 9. データ保持・アーカイブ
- **保存期間**: 無期限（将来的に設定可能にする）
- **アーカイブ機能**: 将来の実装予定
- **削除機能**: マスターのみ実行可能（論理削除）

## データベース設計

### テーブル構成

#### Users
```sql
id                UUID PRIMARY KEY
email             VARCHAR UNIQUE NOT NULL
name              VARCHAR NOT NULL
password_hash     VARCHAR NOT NULL
role              ENUM('master', 'child') NOT NULL
master_user_id    UUID NULL (子の場合、親のIDを参照)
can_view_others   BOOLEAN DEFAULT false
created_at        TIMESTAMP DEFAULT NOW()
updated_at        TIMESTAMP DEFAULT NOW()
deleted_at        TIMESTAMP NULL
```

#### Expenses
```sql
id                UUID PRIMARY KEY
user_id           UUID NOT NULL (申請者)
expense_date      DATE NOT NULL (利用日付)
amount            DECIMAL(10,2) NOT NULL (税込金額)
tax_rate          DECIMAL(3,2) NOT NULL (消費税率)
tax_amount        DECIMAL(10,2) NOT NULL (消費税額)
amount_without_tax DECIMAL(10,2) NOT NULL (税抜金額)
vendor            VARCHAR NOT NULL (支払先)
purpose           TEXT NOT NULL (利用目的)
category          VARCHAR NOT NULL (カテゴリ)
status            ENUM('draft', 'pending', 'approved', 'rejected', 'revision') NOT NULL
rejection_reason  TEXT NULL
created_at        TIMESTAMP DEFAULT NOW()
updated_at        TIMESTAMP DEFAULT NOW()
approved_at       TIMESTAMP NULL
approved_by       UUID NULL
```

#### ExpenseImages
```sql
id                UUID PRIMARY KEY
expense_id        UUID NOT NULL
file_path         VARCHAR NOT NULL (Supabase Storage path)
file_name         VARCHAR NOT NULL
file_size         INTEGER NOT NULL
mime_type         VARCHAR NOT NULL
uploaded_at       TIMESTAMP DEFAULT NOW()
```

#### ExpenseLimits
```sql
id                UUID PRIMARY KEY
master_user_id    UUID NOT NULL
target_user_id    UUID NULL (NULLなら全体限度額)
limit_type        ENUM('monthly', 'yearly') NOT NULL
limit_amount      DECIMAL(10,2) NOT NULL
year              INTEGER NOT NULL
month             INTEGER NULL (月次の場合のみ)
created_at        TIMESTAMP DEFAULT NOW()
updated_at        TIMESTAMP DEFAULT NOW()
```

#### Categories
```sql
id                UUID PRIMARY KEY
master_user_id    UUID NOT NULL
name              VARCHAR NOT NULL
display_order     INTEGER NOT NULL
is_active         BOOLEAN DEFAULT true
created_at        TIMESTAMP DEFAULT NOW()
```

#### Notifications
```sql
id                UUID PRIMARY KEY
user_id           UUID NOT NULL
type              VARCHAR NOT NULL
title             VARCHAR NOT NULL
message           TEXT NOT NULL
is_read           BOOLEAN DEFAULT false
related_expense_id UUID NULL
created_at        TIMESTAMP DEFAULT NOW()
```

#### AuditLogs
```sql
id                UUID PRIMARY KEY
user_id           UUID NOT NULL
action            VARCHAR NOT NULL
table_name        VARCHAR NOT NULL
record_id         UUID NOT NULL
old_value         JSONB NULL
new_value         JSONB NULL
ip_address        VARCHAR NULL
user_agent        TEXT NULL
created_at        TIMESTAMP DEFAULT NOW()
```

## UI/UX設計

### 画面構成
1. **ログイン画面**
2. **ダッシュボード** (マスター/子で表示内容が異なる)
3. **経費申請画面** (新規作成・編集)
4. **経費一覧画面** (検索・フィルタ付き)
5. **承認画面** (マスターのみ)
6. **限度額設定画面** (マスターのみ)
7. **アカウント管理画面** (マスターのみ)
8. **プロフィール設定画面**
9. **通知センター**

### デザインガイドライン
- **カラースキーム**: プロフェッショナルで視認性の高い配色
- **レスポンシブ**: PC・タブレット・スマホ対応
- **アクセシビリティ**: WCAG 2.1 AA準拠
- **フィードバック**: 操作に対する視覚的フィードバック

## セキュリティ要件

### 認証・認可
- パスワードのハッシュ化（bcrypt）
- セッション管理（JWT with HTTPOnly Cookie）
- CSRF対策
- XSS対策

### データ保護
- 通信の暗号化（HTTPS）
- データベースの暗号化（Supabase標準機能）
- 個人情報の適切な取り扱い
- GDPR/個人情報保護法対応

### ファイルセキュリティ
- アップロード時のファイル検証
- ファイル名のサニタイズ
- アクセス制御（認証済みユーザーのみ）
- 署名付きURL（有効期限付き）

### 監査ログ
- 全ての重要操作を記録
- ログの改ざん防止
- 定期的なログレビュー

## 開発フェーズ

### Phase 1: 基盤構築 (2-3週間)
1. **環境構築**
   - Next.js プロジェクト作成
   - Supabase セットアップ
   - Prisma セットアップ
   - Tailwind CSS + shadcn/ui 導入

2. **認証システム**
   - NextAuth.js 設定
   - ログイン/ログアウト機能
   - セッション管理

3. **データベース構築**
   - Prismaスキーマ定義
   - マイグレーション実行
   - 初期データ投入

### Phase 2: コア機能開発 (3-4週間)
4. **アカウント管理**
   - マスターアカウント作成
   - 子アカウント招待・管理
   - 権限設定

5. **経費申請機能**
   - 申請フォーム作成
   - 画像アップロード機能
   - 税額計算ロジック
   - 下書き保存機能

6. **承認フロー**
   - ステータス管理
   - 承認・却下・修正依頼機能
   - 直接編集機能

### Phase 3: 管理・分析機能 (2-3週間)
7. **ダッシュボード**
   - 経費サマリー表示
   - グラフ表示（Chart.js or Recharts）
   - 承認待ち一覧

8. **限度額管理**
   - 限度額設定機能
   - 使用率計算
   - アラート表示

9. **検索・フィルタ**
   - 詳細検索機能
   - ソート機能
   - エクスポート機能

### Phase 4: 通知・最適化 (1-2週間)
10. **通知機能**
    - メール通知（Resend）
    - システム内通知
    - 通知センター

11. **セキュリティ強化**
    - 監査ログ実装
    - セキュリティテスト

12. **パフォーマンス最適化**
    - 画像の最適化
    - クエリ最適化
    - キャッシング

### Phase 5: テスト・デプロイ (1週間)
13. **テスト**
    - 単体テスト
    - 統合テスト
    - E2Eテスト
    - セキュリティテスト

14. **デプロイ**
    - Vercelデプロイ
    - 本番環境設定
    - モニタリング設定

## 懸念事項・リスク

### 技術面
- [ ] 画像アップロードのパフォーマンス
- [ ] 大量データ時のクエリパフォーマンス
- [ ] メール送信のレート制限

### セキュリティ面
- [ ] ファイルアップロード時のセキュリティ
- [ ] セッションハイジャック対策
- [ ] SQLインジェクション対策（Prisma使用で基本対応済み）

### 運用面
- [ ] バックアップ戦略
- [ ] ディザスタリカバリ計画
- [ ] 監視・アラート体制

## 将来の拡張機能

### 短期（3-6ヶ月）
- OCR機能（領収書の自動読み取り）
- モバイルアプリ（React Native）
- 会計ソフト連携（freee、マネーフォワード等）

### 中期（6-12ヶ月）
- AI による経費分類提案
- 予算管理機能
- レポート自動生成
- 多言語対応

### 長期（12ヶ月以上）
- API公開
- サードパーティ統合
- 複数組織対応

## 成功指標（KPI）

- ユーザー満足度: 4.0/5.0以上
- 申請から承認までの平均時間: 24時間以内
- システム稼働率: 99.9%以上
- ページロード時間: 2秒以内
- モバイル利用率: 30%以上

---

**作成日**: 2025-10-01  
**バージョン**: 1.0  
**更新履歴**: 初版作成