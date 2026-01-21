import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // 환경 변수가 없으면 더미 클라이언트를 반환하지 않고 에러 방지
  if (!supabaseUrl || !supabaseAnonKey) {
    // 빌드 시에는 환경 변수가 없을 수 있으므로 더미 값 사용
    // 실제 런타임에서는 .env.local에서 로드됨
    if (typeof window === 'undefined') {
      return createBrowserClient(
        'https://placeholder.supabase.co',
        'placeholder-key'
      )
    }
    throw new Error(
      'Supabase URL과 Anon Key가 필요합니다. .env.local 파일을 설정해주세요.'
    )
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
