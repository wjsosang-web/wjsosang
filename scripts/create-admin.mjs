/**
 * 관리자 계정을 만든다.
 *
 *   npm run admin:create -- 이메일 비밀번호 "이름"
 *   예) npm run admin:create -- admin@wjsosang.kr 비밀번호1234 "박승환"
 *
 * 하는 일
 *   1. Supabase Auth 에 계정을 만든다 (이미 있으면 그 계정을 쓴다)
 *   2. members 테이블에 같은 이름의 회원이 있으면 그 행에 계정을 연결하고,
 *      없으면 새로 만든다
 *   3. role 을 admin 으로 올린다
 *
 * SUPABASE_SERVICE_ROLE_KEY 가 있어야 한다.
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });

const [email, password, name] = process.argv.slice(2);

if (!email || !password) {
  console.error('사용법: npm run admin:create -- 이메일 비밀번호 "이름"');
  process.exit(1);
}
if (password.length < 8) {
  console.error("비밀번호는 8자 이상으로 정해주세요.");
  process.exit(1);
}

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !KEY) {
  console.error("NEXT_PUBLIC_SUPABASE_URL 과 SUPABASE_SERVICE_ROLE_KEY 가 .env.local 에 있어야 합니다.");
  process.exit(1);
}

const db = createClient(URL, KEY, { auth: { persistSession: false } });

// 1. 계정 만들기
let accountId;
const { data: created, error: createError } = await db.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});

if (createError) {
  if (!/already|exists|registered/i.test(createError.message)) {
    console.error("계정 생성 실패:", createError.message);
    process.exit(1);
  }
  // 이미 있는 계정 찾기
  const { data: list } = await db.auth.admin.listUsers({ perPage: 1000 });
  const found = list?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!found) {
    console.error("이미 있는 계정이라는데 찾지 못했습니다. Supabase 대시보드에서 확인해 주세요.");
    process.exit(1);
  }
  accountId = found.id;
  console.log("이미 있는 계정을 사용합니다:", email);
} else {
  accountId = created.user.id;
  console.log("계정을 만들었습니다:", email);
}

// 2. members 행 연결
const displayName = name || email.split("@")[0];

const { data: existing } = await db
  .from("members")
  .select("id, name")
  .eq("name", displayName)
  .maybeSingle();

if (existing) {
  const { error } = await db
    .from("members")
    .update({ account_id: accountId, email, role: "admin", status: "active" })
    .eq("id", existing.id);
  if (error) {
    console.error("회원 정보 연결 실패:", error.message);
    process.exit(1);
  }
  console.log(`기존 회원 "${displayName}" 에 관리자 권한을 부여했습니다.`);
} else {
  const { error } = await db.from("members").insert({
    account_id: accountId,
    name: displayName,
    email,
    role: "admin",
    status: "active",
  });
  if (error) {
    console.error("회원 생성 실패:", error.message);
    process.exit(1);
  }
  console.log(`새 관리자 회원 "${displayName}" 을 만들었습니다.`);
}

console.log("\n이제 http://localhost:3000/admin/login 에서 로그인할 수 있습니다.");
