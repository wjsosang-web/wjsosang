import { NextResponse, type NextRequest } from "next/server";
import { refreshPublicPages } from "@/lib/admin/revalidate";

/**
 * 반영이 바로 되는지 확인하는 개발용 통로.
 * 배포 환경에서는 열리지 않는다.
 */
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEV_REVALIDATE !== "1") {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  refreshPublicPages();
  return NextResponse.json({ ok: true, at: new Date().toISOString() });
}
