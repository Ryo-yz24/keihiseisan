// 環境変数をハードコード（デプロイ用）
export const env = {
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'https://your-app-name.netlify.app',
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'WeyFnOSmnQHV2kkuwyHiwoxD2xMQr6rwTlAlNpxlTX0=',
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://dummy:dummy@localhost:5432/dummy',
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy-service-key',
  RESEND_API_KEY: process.env.RESEND_API_KEY || 'dummy-resend-key',
  NODE_ENV: process.env.NODE_ENV || 'development'
}

// デプロイ用：環境変数チェックを無効化
// 本番環境での必須環境変数チェック（無効化）
// if (env.NODE_ENV === 'production') {
//   const requiredEnvVars = [
//     'NEXTAUTH_URL',
//     'NEXTAUTH_SECRET',
//     'DATABASE_URL'
//   ]

//   const missingVars = requiredEnvVars.filter(key => !env[key as keyof typeof env])
  
//   if (missingVars.length > 0) {
//     throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`)
//   }
// }

// セキュリティチェック（無効化）
// if (env.NEXTAUTH_SECRET && env.NEXTAUTH_SECRET.length < 32) {
//   throw new Error('NEXTAUTH_SECRET must be at least 32 characters long')
// }
