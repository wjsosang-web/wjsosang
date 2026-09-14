import { NextResponse } from "next/server";
import { getServerSupabase, getAdminSupabase } from "@/lib/supabase/server";
import { toDateKey } from "@/lib/date";

/**
 * 회원 방문 기록.
 *
 * 화면이 뜨면 브라우저가 한 번 부른다. 로그인한 회원만 센다.
 * 그냥 지나가는 분은 누구인지 알 수 없어 셀 수가 없다.
 *
 * 하루에 한 번만 센다. 새로고침마다 세면 한 사람이 하루에 백 번도 올릴 수
 * 있어서 순위가 아무 뜻이 없어진다.
 *
 * 실패해도 아무 일도 일어나지 않는다. 방문 세는 일 때문에 화면이
 * 멈추거나 오류가 보이면 안 된다.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const supabase = await getServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 로그인 여부를 같이 알려준다. 브라우저는 이 값을 보고
    // "이번 창에서는 더 묻지 않을지"를 정한다.
    if (!user) return NextResponse.json({ counted: false, loggedIn: false });

    const db = getAdminSupabase();
    const today = toDateKey(new Date());

    const { data: me } = await db
      .from("members")
      .select("id, visit_count, last_visit_on, status")
      .eq("account_id", user.id)
      .maybeSingle();

    // 승인 전인 분은 세지 않는다. 순위는 협회원들의 것이다.
    if (!me || me.status !== "active") {
      return NextResponse.json({ counted: false, loggedIn: true });
    }
    if (me.last_visit_on === today) {
      return NextResponse.json({ counted: false, loggedIn: true });
    }

    await db
      .from("members")
      .update({
        visit_count: ((me.visit_count as number) ?? 0) + 1,
        last_visit_on: today,
      })
      .eq("id", me.id as string);

    return NextResponse.json({ counted: true, loggedIn: true });
  } catch {
    return NextResponse.json({ counted: false, loggedIn: false });
  }
}
