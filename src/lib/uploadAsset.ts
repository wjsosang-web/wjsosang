"use client";

/**
 * 사진을 브라우저에서 저장소로 바로 올린다.
 *
 * 왜 서버를 거치지 않는가:
 * 배포 환경(Vercel)은 서버로 보내는 요청 본문을 4.5MB 로 제한한다.
 * 사진을 폼에 담아 보내면 몇 장만 붙여도 그 앞에서 막혀 흰 오류 화면이 뜬다.
 * 그래서 파일은 저장소로 직접 올리고, 폼에는 주소(글자)만 담아 보낸다.
 *
 * 쓰기 권한은 로그인한 관리자에게만 열려 있다 (migration 0011).
 */

import { getBrowserSupabase } from "@/lib/supabase/client";
import { STORAGE_BUCKET } from "@/lib/supabase/config";

export async function uploadAsset(file: File, folder: string): Promise<string> {
  const db = getBrowserSupabase();

  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext || "jpg"}`;

  const { error } = await db.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, { contentType: file.type || undefined, upsert: false });

  if (error) {
    throw new Error(
      // 권한 문제는 원인이 정해져 있어서 따로 안내한다.
      /row-level security|not authorized|Unauthorized/i.test(error.message)
        ? "사진을 올릴 권한이 없습니다. 로그아웃 후 다시 로그인해 주세요."
        : `사진 업로드 실패: ${error.message}`,
    );
  }

  return db.storage.from(STORAGE_BUCKET).getPublicUrl(path).data.publicUrl;
}
