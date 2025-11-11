# 経費精算システム - 現在の状態

## 最終更新日
2025-11-08

## 実装済み機能
- ✅ 認証・ログイン
- ✅ ダッシュボード（統計・経費一覧タブ付き）
- ✅ 限度額管理（MASTER）
- ✅ 経費申請・承認・編集・削除
- ✅ 上限解放申請機能（申請作成・一覧・承認/却下・実効限度額計算）
- ✅ ナビゲーション

## データベーステーブル
- User, ExpenseLimit, Expense, ExpenseImage, Category, LimitIncreaseRequest

## 開発サーバー
npm run dev → http://localhost:3000
