import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// クライアントサイド用
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// サーバーサイド用（簡易版）
export const createServerClient = () => createClient(supabaseUrl, supabaseAnonKey)