/**
 * Supabase 준비 상태를 점검한다.
 *
 *   npm run setup:check
 *
 * 무엇이 되어 있고 무엇이 남았는지 알려준다.
 * 설정을 바꾸지 않고 확인만 한다.
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const TABLES = [
  "members",
  "businesses",
  "business_photos",
  "business_menus",
  "posts",
  "post_photos",
  "org_members",
  "inquiries",
  "site_settings",
  "site_stats",
  "popups",
  "member_businesses",
  "pending_edits",
];

const ok = (m) => console.log(`  [32m✓[0m ${m}`);
const no = (m) => console.log(`  [31m✗[0m ${m}`);
const info = (m) => console.log(`    ${m}`);

const todo = [];

console.log("\n원주청년소상공인협회 — Supabase 준비 상태\n");

/* 1. 환경변수 --------------------------------------------------------- */
console.log("1. 환경변수 (.env.local)");
if (URL) ok(`NEXT_PUBLIC_SUPABASE_URL — ${URL}`);
else {
  no("NEXT_PUBLIC_SUPABASE_URL 없음");
  todo.push(".env.local 에 NEXT_PUBLIC_SUPABASE_URL 넣기");
}
if (ANON) ok("NEXT_PUBLIC_SUPABASE_ANON_KEY");
else {
  no("NEXT_PUBLIC_SUPABASE_ANON_KEY 없음");
  todo.push(".env.local 에 NEXT_PUBLIC_SUPABASE_ANON_KEY 넣기");
}
if (SECRET) ok("SUPABASE_SERVICE_ROLE_KEY");
else {
  no("SUPABASE_SERVICE_ROLE_KEY 없음 — 관리자 저장 기능이 동작하지 않습니다");
  todo.push(
    "Supabase 대시보드 > Project Settings > API Keys 에서 secret key 를 복사해 .env.local 에 넣기",
  );
}

if (!URL || !ANON) {
  console.log("\n환경변수가 없어 더 확인할 수 없습니다.\n");
  process.exit(1);
}

/* 2. 테이블 ----------------------------------------------------------- */
console.log("\n2. 테이블");
const db = createClient(URL, SECRET || ANON, { auth: { persistSession: false } });

const missing = [];
for (const t of TABLES) {
  // head 조회는 없는 테이블에도 오류를 내지 않는다. 실제로 한 행을 읽어봐야 한다.
  const { error } = await db.from(t).select("*").limit(1);
  if (error && /schema cache|does not exist/i.test(error.message)) missing.push(t);
}

if (missing.length === 0) {
  ok(`${TABLES.length}개 테이블 모두 있음`);
} else if (missing.length === TABLES.length) {
  no("테이블이 하나도 없습니다");
  todo.push("Supabase 대시보드 > SQL Editor 에 supabase/schema.sql 내용을 붙여넣고 실행");
} else {
  no(`없는 테이블: ${missing.join(", ")}`);
  todo.push("supabase/schema.sql 을 다시 확인해서 빠진 부분을 실행");
}

/* 3. 콘텐츠 ----------------------------------------------------------- */
if (missing.length === 0) {
  console.log("\n3. 콘텐츠");
  const counts = {};
  for (const t of ["businesses", "posts", "org_members", "site_settings", "site_stats"]) {
    const { count } = await db.from(t).select("*", { count: "exact", head: true });
    counts[t] = count ?? 0;
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  if (total === 0) {
    no("아직 비어 있습니다");
    todo.push("npm run seed:push — 지금 콘텐츠를 DB로 옮기기");
  } else {
    ok(
      `업장 ${counts.businesses} · 게시물 ${counts.posts} · 임원 ${counts.org_members} · ` +
        `설정 ${counts.site_settings} · 숫자 ${counts.site_stats}`,
    );
  }
}

/* 4. 저장소 ----------------------------------------------------------- */
if (SECRET) {
  console.log("\n4. 사진 저장소");
  const { data: buckets, error } = await db.storage.listBuckets();
  if (error) {
    no(`확인 실패: ${error.message}`);
  } else if (buckets?.some((b) => b.name === "public-assets")) {
    ok("public-assets 버킷 있음");
  } else {
    no("public-assets 버킷 없음 — 사진 업로드가 되지 않습니다");
    todo.push("supabase/schema.sql 의 storage 부분이 실행됐는지 확인");
  }

  /* 5. 관리자 계정 ---------------------------------------------------- */
  console.log("\n5. 관리자 계정");
  if (missing.includes("members")) {
    no("members 테이블이 없어 확인할 수 없습니다");
  } else {
    const { data: admins } = await db
      .from("members")
      .select("name, email, role, account_id")
      .in("role", ["admin", "superadmin"]);

    const linked = (admins ?? []).filter((a) => a.account_id);
    if (linked.length > 0) {
      for (const a of linked) ok(`${a.name} (${a.email}) — ${a.role}`);
    } else {
      no("로그인 가능한 관리자가 없습니다");
      todo.push('npm run admin:create -- 이메일 비밀번호 "이름"');
    }
  }
}

/* 정리 ---------------------------------------------------------------- */
console.log("\n" + "─".repeat(60));
if (todo.length === 0) {
  console.log("\n준비가 모두 끝났습니다. /admin/login 에서 로그인하세요.\n");
} else {
  console.log("\n남은 일:\n");
  todo.forEach((t, i) => console.log(`  ${i + 1}. ${t}`));
  console.log("");
}
