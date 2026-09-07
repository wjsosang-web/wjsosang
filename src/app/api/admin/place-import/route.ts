import { NextResponse } from "next/server";
import { importFromPlaceUrl, MANUAL_ONLY_FIELDS } from "@/lib/place/import";

/**
 * 관리자 업장등록 화면의 [업장정보 불러오기] 버튼이 호출하는 곳.
 *
 *   POST /api/admin/place-import
 *   { "url": "https://naver.me/xxxxxxx" }
 *
 * 응답은 '초안'이다. 그대로 저장하지 않고 관리자 확인 화면에 채워 넣는다.
 *
 * 주의: 지금은 관리자 로그인이 없어서 이 경로가 열려 있다.
 * 관리자 인증을 붙일 때 반드시 이 라우트에 세션 검사를 추가해야 한다.
 * 바깥 사이트를 대신 호출하는 창구라 아무나 쓰게 두면 안 된다.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // TODO(2단계): 관리자 세션 확인 후에만 통과시킬 것
  let body: { url?: string };

  try {
    body = (await request.json()) as { url?: string };
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  if (!body.url || typeof body.url !== "string") {
    return NextResponse.json({ error: "플레이스 주소(url)를 보내주세요." }, { status: 400 });
  }

  try {
    const result = await importFromPlaceUrl(body.url);

    return NextResponse.json(
      {
        ...result,
        // 플레이스에서 절대 못 가져오는 항목을 화면에 안내한다
        manualOnly: MANUAL_ONLY_FIELDS,
      },
      { status: result.result === "failed" ? 422 : 200 },
    );
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: `불러오기에 실패했습니다: ${error}` }, { status: 500 });
  }
}
