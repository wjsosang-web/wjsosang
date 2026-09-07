import { NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase/server";
import { canWriteToSupabase } from "@/lib/supabase/config";

/**
 * 홈페이지 문의 접수.
 *
 * 누구나 호출할 수 있으므로 값 검증을 서버에서 다시 한다.
 * 저장은 service role 로 한다 (inquiries 는 insert 만 열려 있고 읽기는 막혀 있다).
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_MESSAGE = 1000;

export async function POST(request: Request) {
  if (!canWriteToSupabase()) {
    return NextResponse.json(
      { error: "문의 접수가 아직 준비되지 않았습니다. 이메일로 보내주세요." },
      { status: 503 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const text = (key: string) => String(body[key] ?? "").trim();

  const name = text("name");
  const phone = text("phone");
  const kind = text("kind");
  const message = text("message");
  const agreed = body.privacyAgreed === true;

  if (!name || !phone || !kind || !message) {
    return NextResponse.json({ error: "필수 항목을 모두 입력해 주세요." }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE) {
    return NextResponse.json({ error: "문의 내용이 너무 깁니다." }, { status: 400 });
  }
  if (!agreed) {
    return NextResponse.json(
      { error: "개인정보 수집 및 이용에 동의해 주세요." },
      { status: 400 },
    );
  }

  const { error } = await getAdminSupabase().from("inquiries").insert({
    kind,
    name,
    phone,
    company: text("company") || null,
    email: text("email") || null,
    message,
    privacy_agreed: true,
  });

  if (error) {
    return NextResponse.json({ error: "접수 중 문제가 발생했습니다." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
