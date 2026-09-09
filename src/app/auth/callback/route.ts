import { NextResponse, type NextRequest } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

/**
 * 카카오·이메일 로그인이 끝나고 돌아오는 자리.
 *
 * 주소에 붙어 온 임시 코드를 진짜 세션으로 바꾼다.
 * next 는 우리 사이트 안의 경로만 허용한다. 바깥 주소를 넣어 보내면
 * 로그인 직후 낯선 곳으로 튕기는 통로가 되기 때문이다.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  const raw = searchParams.get("next") ?? "/my";
  const next = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/my";

  if (!code) return NextResponse.redirect(`${origin}/login?error=1`);

  const supabase = await getServerSupabase();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) return NextResponse.redirect(`${origin}/login?error=1`);

  return NextResponse.redirect(`${origin}${next}`);
}
