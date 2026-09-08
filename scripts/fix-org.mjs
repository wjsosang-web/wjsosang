/**
 * 조직도 정리.
 *
 *   node scripts/fix-org.mjs
 *
 *  - 감사를 별도 항목으로 두지 않고 이사에 겸직 표시로 합친다
 *  - 빠진 임원을 채우고 직책 오타를 고친다
 *  - 표시 순서를 다시 매긴다: 국장 → 부국장 → 부장 → 부원
 *    (같은 직급 안에서는 사무·재무·관리·인사·홍보·기획 순)
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const DEPT_ORDER = ["사무국", "재무국", "관리국", "인사국", "홍보국", "기획국"];

/** 직급이 높을수록 앞에 온다 */
function rankOf(title) {
  if (/(국장|총장)$/.test(title) && !/부국장$/.test(title)) return 1;
  if (/부국장$/.test(title)) return 2;
  if (/부장$/.test(title)) return 3;
  if (/부원$/.test(title)) return 4;
  return 5;
}

const { data: org } = await db.from("org_members").select("*");

/* 1. 감사 겸직 정리 ---------------------------------------------------- */
{
  const auditors = org.filter((o) => o.title === "감사");
  for (const a of auditors) {
    const twin = org.find(
      (o) => o.name === a.name && o.title === "이사" && o.id !== a.id,
    );
    if (twin) {
      await db.from("org_members").update({ sub_title: "감사" }).eq("id", twin.id);
      await db.from("org_members").delete().eq("id", a.id);
      console.log(`감사 겸직 정리: ${a.name} → 이사(감사 겸직)`);
    } else {
      // 이사 항목이 없으면 감사 자체를 이사로 올리고 겸직 표시
      await db
        .from("org_members")
        .update({ title: "이사", sub_title: "감사", org_group: "이사회·감사" })
        .eq("id", a.id);
      console.log(`감사 → 이사(감사 겸직): ${a.name}`);
    }
  }
}

/* 2. 직책 오타 -------------------------------------------------------- */
{
  const { error } = await db
    .from("org_members")
    .update({ title: "재무부장" })
    .eq("title", "제무부장");
  console.log(error ? `오타 수정 실패: ${error.message}` : "직책 오타 수정: 제무부장 → 재무부장");
}

/* 3. 관리국 직책 정리 (조직도 기준) ------------------------------------ */
{
  await db.from("org_members").update({ title: "관리부장" }).eq("name", "김명준");
  await db.from("org_members").update({ title: "관리부원" }).eq("name", "이경운");
  console.log("관리국 직책 정리: 김명준 관리부장 / 이경운 관리부원");
}

/* 4. 인사부국장 임동연 ------------------------------------------------- */
{
  const { data: exists } = await db
    .from("org_members")
    .select("id")
    .eq("name", "임동연")
    .maybeSingle();

  if (exists) {
    await db
      .from("org_members")
      .update({ title: "인사부국장", department: "인사국", org_group: "운영진" })
      .eq("id", exists.id);
    console.log("임동연 → 인사부국장 (수정)");
  } else {
    // 명부에 있는 회원이면 업장을 연결한다
    const { data: member } = await db
      .from("members")
      .select("id")
      .eq("name", "임동연")
      .maybeSingle();
    const { data: link } = member
      ? await db
          .from("member_businesses")
          .select("business_id")
          .eq("member_id", member.id)
          .maybeSingle()
      : { data: null };

    await db.from("org_members").insert({
      name: "임동연",
      org_group: "운영진",
      title: "인사부국장",
      department: "인사국",
      member_id: member?.id ?? null,
      business_id: link?.business_id ?? null,
      intro: "",
      sort_order: 99,
    });
    console.log("임동연 인사부국장 추가");
  }
}

/* 5. 표시 순서 다시 매기기 --------------------------------------------- */
{
  const { data: all } = await db.from("org_members").select("*");

  const 회장단 = all.filter((o) => o.org_group === "회장단");
  const 이사회 = all.filter((o) => o.org_group === "이사회·감사");
  const 운영진 = all.filter((o) => o.org_group === "운영진");
  const 역대 = all.filter((o) => o.org_group === "역대 회장");

  const updates = [];

  // 회장 → 부회장
  회장단
    .sort((a, b) => (a.title === "회장" ? -1 : b.title === "회장" ? 1 : 0))
    .forEach((o, i) => updates.push({ id: o.id, sort_order: i + 1 }));

  // 감사 겸직을 맨 앞에 두고 나머지 이사
  이사회
    .sort((a, b) => (b.sub_title ? 1 : 0) - (a.sub_title ? 1 : 0))
    .forEach((o, i) => updates.push({ id: o.id, sort_order: i + 1 }));

  // 국장 → 부국장 → 부장 → 부원, 같은 직급 안에서는 국 순서
  운영진
    .sort((a, b) => {
      const r = rankOf(a.title) - rankOf(b.title);
      if (r !== 0) return r;
      return DEPT_ORDER.indexOf(a.department) - DEPT_ORDER.indexOf(b.department);
    })
    .forEach((o, i) => updates.push({ id: o.id, sort_order: i + 1 }));

  역대
    .sort((a, b) => a.title.localeCompare(b.title, "ko"))
    .forEach((o, i) => updates.push({ id: o.id, sort_order: i + 1 }));

  for (const u of updates) {
    await db.from("org_members").update({ sort_order: u.sort_order }).eq("id", u.id);
  }
  console.log(`표시 순서 재정렬: ${updates.length}명`);
}

/* 확인 ---------------------------------------------------------------- */
{
  const { data } = await db
    .from("org_members")
    .select("name, org_group, title, sub_title, department, sort_order")
    .order("sort_order");

  const byGroup = {};
  for (const o of data) (byGroup[o.org_group] ??= []).push(o);

  for (const [g, list] of Object.entries(byGroup)) {
    console.log(`\n[${g}] ${list.length}명`);
    for (const o of list) {
      const sub = o.sub_title ? ` (${o.sub_title} 겸직)` : "";
      const dept = o.department ? ` · ${o.department}` : "";
      console.log(`  ${String(o.sort_order).padStart(2)} ${o.title.padEnd(7)} ${o.name}${sub}${dept}`);
    }
  }
}
