import { createClient } from '@supabase/supabase-js'

// 환경 변수가 없으면 하드코딩된 값 사용 (Vercel 환경 변수 문제 해결용)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qjcjrnogkhaiewoqjrns.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqY2pybm9na2hhaWV3b3Fqcm5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNTYxOTQsImV4cCI6MjA4NjkzMjE5NH0.A9ZdwitLc1UgdAcdHbM-Rpg53XEWD2BWPwP1VjEhYwY'


// Only create client if URL and key are provided
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as any
