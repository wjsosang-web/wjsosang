import { NextResponse, type NextRequest } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { siteDisplayUrl } from "@/lib/siteUrl";

/**
 * 카카오·이메일 로그인이 끝나고 돌아오는 자리.
 *
 * 주소에 붙어 온 임시 코드를 진짜 세션으로 바꾼다.
 * next 는 우리 사이트 안의 경로만 허용한다. 바깥 주소를 넣어 보내면
 * 로그인 직후 낯선 곳으로 튕기는 통로가 되기 때문이다.
 *
 * 돌려보낼 주소는 한글 도메인으로 만든다.
 *   요청에 실려 오는 호스트는 늘 xn-- 로 시작하는 퓨니코드다. 그대로 쓰면
 *   로그인한 뒤 주소창에 xn--ob0bs5f49... 가 박히고, 그 뒤로 홈페이지를
 *   돌아다니는 내내 그 주소가 남는다. 회원이 보기에 남의 사이트 같다.
 */

/** 돌아갈 주소의 앞부분. 설정된 도메인이 있으면 그것을, 없으면 요청 그대로. */
function homeOrigin(request: NextRequest): string {
  const configured = siteDisplayUrl();
  // 내 컴퓨터에서 돌릴 때는 설정값이 localhost 라 요청 쪽을 쓰는 편이 맞다
  if (configured.startsWith("http") && !configured.includes("localhost")) return configured;
  return new URL(request.url).origin;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const origin = homeOrigin(request);

  const raw = searchParams.get("next") ?? "/my";
  const next = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/my";

  if (!code) return NextResponse.redirect(`${origin}/login?error=1`);

  const supabase = await getServerSupabase();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) return NextResponse.redirect(`${origin}/login?error=1`);

  return NextResponse.redirect(`${origin}${next}`);
}
