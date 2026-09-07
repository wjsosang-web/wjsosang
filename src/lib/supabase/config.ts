/**
 * Supabase 연결 설정.
 *
 * 값이 아직 없으면 사이트는 로컬 시드 JSON으로 동작한다.
 * 그래서 자격증명이 없어도 화면은 그대로 뜨고, 값을 넣는 순간 DB로 갈아탄다.
 */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** 서버에서만 쓰는 키. 절대 클라이언트로 넘기지 않는다. */
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

/** 브라우저에서도 확인할 수 있는 값만으로 판단한다. */
export function isSupabaseConfigured(): boolean {
  return SUPABASE_URL !== "" && SUPABASE_ANON_KEY !== "";
}

/** 관리자 쓰기 작업이 가능한 상태인지 (service role 키 필요) */
export function canWriteToSupabase(): boolean {
  return isSupabaseConfigured() && SUPABASE_SERVICE_ROLE_KEY !== "";
}

/**
 * 데이터를 어디서 읽을지.
 * DATA_SOURCE 를 명시하면 그걸 따르고, 없으면 자격증명 유무로 자동 판단한다.
 */
export function dataSource(): "seed" | "supabase" {
  const explicit = process.env.DATA_SOURCE;
  if (explicit === "seed" || explicit === "supabase") return explicit;
  return isSupabaseConfigured() ? "supabase" : "seed";
}

/** 업로드한 사진이 들어가는 스토리지 버킷 이름 */
export const STORAGE_BUCKET = "public-assets";
