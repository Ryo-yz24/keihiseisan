#!/usr/bin/env node

/**
 * Netlify環境変数設定スクリプト
 * このスクリプトを実行して、Netlifyに設定する環境変数を表示します
 */

const envVars = {
  // NextAuth設定
  NEXTAUTH_URL: 'https://your-site-name.netlify.app',
  NEXTAUTH_SECRET: 'WeyFnOSmnQHV2kkuwyHiwoxD2xMQr6rwTlAlNpxlTX0=',
  
  // Supabase設定（実際の値に置き換え）
  DATABASE_URL: 'postgresql://dummy:dummy@localhost:5432/dummy',
  NEXT_PUBLIC_SUPABASE_URL: 'https://dummy.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'dummy-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'dummy-service-key',
  
  // メール送信（オプション）
  RESEND_API_KEY: '[RESEND-KEY]',
  
  // 環境設定
  NODE_ENV: 'production'
}

console.log('=== Netlify環境変数設定 ===\n')
console.log('以下の環境変数をNetlifyのダッシュボードで設定してください：\n')

Object.entries(envVars).forEach(([key, value]) => {
  console.log(`${key}=${value}`)
})

console.log('\n=== 設定手順 ===')
console.log('1. Netlifyダッシュボードにアクセス')
console.log('2. プロジェクトを選択')
console.log('3. 「Site settings」→「Environment variables」をクリック')
console.log('4. 上記の環境変数を1つずつ追加')
console.log('\n注意: NEXTAUTH_URLは実際のNetlifyのURLに置き換えてください')
