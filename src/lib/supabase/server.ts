import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import {
  SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_URL,
} from "@/lib/supabase/config";

/**
 * 서버에서 쓰는 Supabase 클라이언트 두 가지.
 *
 *  - getServerSupabase()  로그인한 사람의 권한으로 동작. RLS 가 그대로 적용된다.
 *  - getAdminSupabase()   service role 키로 RLS 를 우회한다. 관리자 저장 작업에만 쓴다.
 *
 * 관리자 작업이라도 "이 사람이 관리자가 맞는지"는 반드시 먼저 확인한 뒤에
 * getAdminSupabase() 를 써야 한다. 이 함수 자체는 아무 검사도 하지 않는다.
 */

export async function getServerSupabase() {
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // 서버 컴포넌트에서는 쿠키를 쓸 수 없다.
          // 미들웨어가 세션을 갱신하므로 여기서는 무시해도 된다.
        }
      },
    },
  });
}

/** RLS 를 우회하는 클라이언트. 권한 확인을 마친 뒤에만 호출한다. */
export function getAdminSupabase() {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY 가 설정되지 않았습니다. 관리자 작업을 할 수 없습니다.",
    );
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
