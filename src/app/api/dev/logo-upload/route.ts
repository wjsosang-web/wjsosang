import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { ALLOWED_EXTENSIONS, LOGO_SLOTS, MAX_UPLOAD_BYTES } from "@/lib/logoSlots";

/**
 * 로고 파일을 public/logo 에 저장한다.
 *
 * 개발 중에만 동작한다. 배포된 사이트에서는 404 로 막는다.
 * (Vercel 같은 곳은 파일시스템이 읽기 전용이라 어차피 저장도 되지 않는다.)
 *
 * 로고를 바꾸는 일은 자주 있는 일이 아니므로, 관리자 페이지에 넣지 않고
 * 개발용 화면으로만 둔다. 실제 배포에는 저장된 파일을 커밋해서 올린다.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LOGO_DIR = path.join(process.cwd(), "public", "logo");
const VALID_KEYS = new Set(LOGO_SLOTS.map((s) => s.key));

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "개발 환경에서만 사용할 수 있습니다." }, { status: 404 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const slot = form.get("slot");
  const file = form.get("file");

  if (typeof slot !== "string" || !VALID_KEYS.has(slot)) {
    return NextResponse.json({ error: "알 수 없는 로고 자리입니다." }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
  }

  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return NextResponse.json(
      { error: `${ALLOWED_EXTENSIONS.join(", ")} 파일만 올릴 수 있습니다.` },
      { status: 400 },
    );
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: `파일이 너무 큽니다. ${MAX_UPLOAD_BYTES / 1024 / 1024}MB 이하로 올려주세요.` },
      { status: 400 },
    );
  }

  await fs.mkdir(LOGO_DIR, { recursive: true });

  // 같은 자리에 다른 확장자가 남아 있으면 그쪽이 먼저 잡힐 수 있으므로 지운다.
  for (const other of ALLOWED_EXTENSIONS) {
    if (other === ext) continue;
    await fs.rm(path.join(LOGO_DIR, `${slot}${other}`), { force: true });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(LOGO_DIR, `${slot}${ext}`), buffer);

  return NextResponse.json({
    ok: true,
    slot,
    url: `/logo/${slot}${ext}`,
    size: file.size,
  });
}

/** 지금 어떤 파일이 들어와 있는지 알려준다. */
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "개발 환경에서만 사용할 수 있습니다." }, { status: 404 });
  }

  const installed: Record<string, string | null> = {};

  for (const slot of LOGO_SLOTS) {
    installed[slot.key] = null;
    for (const ext of ALLOWED_EXTENSIONS) {
      try {
        await fs.access(path.join(LOGO_DIR, `${slot.key}${ext}`));
        installed[slot.key] = `/logo/${slot.key}${ext}`;
        break;
      } catch {
        // 다음 확장자 확인
      }
    }
  }

  return NextResponse.json({ installed });
}
