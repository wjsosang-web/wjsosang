import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { collectFeeds } from "@/lib/feeds/collect";

/**
 * 하루 한 번 소식을 모아 새 것만 알린다.
 *
 * Vercel 이 vercel.json 에 적힌 시각에 이 주소를 부른다.
 * 아무나 부르면 알림이 마구 나갈 수 있으므로 열쇠를 확인한다.
 *
 *   CRON_SECRET=아무 긴 글자
 *
 * Vercel 이 부를 때는 Authorization: Bearer <CRON_SECRET> 을 붙여 준다.
 * 손으로 확인할 때는 ?key=<CRON_SECRET> 를 붙여도 된다.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return NextResponse.json(
      { ok: false, message: "CRON_SECRET 이 설정되지 않았습니다." },
      { status: 500 },
    );
  }

  const url = new URL(request.url);
  const given =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? url.searchParams.get("key");

  if (given !== secret) {
    return NextResponse.json({ ok: false, message: "열쇠가 맞지 않습니다." }, { status: 401 });
  }

  const report = await collectFeeds();

  // 새 소식이 들어왔으면 홈페이지 목록도 새로 그린다
  if (report.added > 0) revalidatePath("/support");

  return NextResponse.json({ ok: true, ...report });
}
