// デプロイ用：Supabase接続を無効化
// import { createClient } from '@supabase/supabase-js'

// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
// const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// クライアントサイド用
// export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// サーバーサイド用（簡易版）
// export const createServerClient = () => createClient(supabaseUrl, supabaseAnonKey)

// ダミーのSupabaseクライアント
export const supabase = {
  storage: {
    from: () => ({
      upload: () => Promise.resolve({ data: null, error: null }),
      getPublicUrl: () => ({ data: { publicUrl: 'https://dummy.com/image.jpg' } }),
    }),
  },
} as any

export const createServerClient = () => supabase