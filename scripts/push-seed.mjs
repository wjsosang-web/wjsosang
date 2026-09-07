/**
 * 시드 JSON 내용을 Supabase 에 밀어 넣는다.
 *
 *   npm run seed:push
 *
 * 이미 있는 행은 slug / key 기준으로 갱신하므로 여러 번 돌려도 안전하다.
 * SUPABASE_SERVICE_ROLE_KEY 가 있어야 한다(RLS 우회 필요).
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !KEY) {
  console.error(
    "NEXT_PUBLIC_SUPABASE_URL 과 SUPABASE_SERVICE_ROLE_KEY 가 .env.local 에 있어야 합니다.",
  );
  process.exit(1);
}

const db = createClient(URL, KEY, { auth: { persistSession: false } });
const read = (name) => JSON.parse(readFileSync(`src/lib/data/seed/${name}.json`, "utf8"));

const site = read("site");
const businesses = read("businesses");
const posts = read("posts");
const org = read("org");
const membersFile = read("members");

function check(label, error) {
  if (error) {
    console.error(`  ✗ ${label}: ${error.message}`);
    process.exitCode = 1;
    return false;
  }
  console.log(`  ✓ ${label}`);
  return true;
}

/* ------------------------------------------------------------------ */

console.log("사이트 설정...");
{
  const rows = [
    ["info", site.info],
    ["story", site.story],
    ["president_message", site.presidentMessage],
    ["programs", site.programs],
    ["history", site.history],
    ["partners", site.partners],
    ["faqs", site.faqs],
    ["hero_slides", site.heroSlides],
  ].map(([key, value]) => ({ key, value }));

  const { error } = await db.from("site_settings").upsert(rows, { onConflict: "key" });
  check(`site_settings ${rows.length}건`, error);
}

console.log("숫자로 보는 원청협...");
{
  await db.from("site_stats").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  const rows = site.stats.map((s) => ({
    value: s.value,
    label: s.label,
    description: s.description ?? "",
    icon: s.icon ?? "store",
    sort_order: s.order,
  }));
  const { error } = await db.from("site_stats").insert(rows);
  check(`site_stats ${rows.length}건`, error);
}

console.log("회원...");
const memberIdByName = new Map();
{
  for (const m of membersFile.members) {
    const { data, error } = await db
      .from("members")
      .upsert(
        {
          name: m.name,
          role: m.role,
          status: m.status,
          phone: m.phone,
          email: m.email,
          joined_at: m.joinedAt,
          profile_image: m.profileImage ?? null,
        },
        { onConflict: "id", ignoreDuplicates: false },
      )
      .select("id")
      .maybeSingle();

    if (error) {
      // 이름으로 이미 있는지 확인 후 건너뛴다
      const { data: existing } = await db.from("members").select("id").eq("name", m.name).maybeSingle();
      if (existing) memberIdByName.set(m.name, existing.id);
      continue;
    }
    if (data) memberIdByName.set(m.name, data.id);
  }
  console.log(`  ✓ members ${memberIdByName.size}건`);
}

console.log("회원업장...");
const businessIdBySlug = new Map();
{
  const rows = businesses.map((b) => ({
    slug: b.slug,
    name: b.name,
    category: b.category,
    tagline: b.tagline,
    description: b.description,
    owner_name: b.ownerName,
    address: b.address,
    district: b.district,
    lat: b.lat,
    lng: b.lng,
    phone: b.phone,
    hours: b.hours,
    place_url: b.placeUrl,
    homepage_url: b.homepageUrl,
    sns_url: b.snsUrl,
    cover_image: b.coverImage,
    place_id: b.placeId,
    place_type: b.placeType,
    place_photo: b.placePhoto,
    place_keywords: b.placeKeywords ?? [],
    keywords: b.keywords ?? [],
    priority: b.priority,
    featured: b.featured ?? false,
    status: b.status,
    sourced_from_place: b.sourcedFromPlace ?? false,
  }));

  const { data, error } = await db
    .from("businesses")
    .upsert(rows, { onConflict: "slug" })
    .select("id, slug");

  if (check(`businesses ${rows.length}건`, error) && data) {
    for (const r of data) businessIdBySlug.set(r.slug, r.id);
  }
}

console.log("메뉴...");
{
  let count = 0;
  for (const b of businesses) {
    const id = businessIdBySlug.get(b.slug);
    if (!id || !b.menus?.length) continue;
    await db.from("business_menus").delete().eq("business_id", id);
    const { error } = await db.from("business_menus").insert(
      b.menus.map((m) => ({
        business_id: id,
        name: m.name,
        price: m.price,
        description: m.description,
        image_url: m.imageUrl,
        source: m.source ?? "manual",
        sort_order: m.order,
      })),
    );
    if (!error) count += b.menus.length;
  }
  console.log(`  ✓ business_menus ${count}건`);
}

console.log("게시물...");
const postIdBySlug = new Map();
{
  const rows = posts.map((p) => ({
    type: p.type,
    slug: p.slug,
    title: p.title,
    category: p.category,
    date: p.date,
    start_date: p.startDate,
    end_date: p.endDate,
    time: p.time,
    place: p.place,
    participants: p.participants,
    summary: p.summary,
    body: p.body,
    cover_image: p.coverImage,
    pinned: p.pinned,
    important: p.important,
    status: p.status,
  }));

  const { data, error } = await db.from("posts").upsert(rows, { onConflict: "slug" }).select("id, slug");
  if (check(`posts ${rows.length}건`, error) && data) {
    for (const r of data) postIdBySlug.set(r.slug, r.id);
  }
}

console.log("활동사진 설명...");
{
  let count = 0;
  for (const p of posts) {
    const id = postIdBySlug.get(p.slug);
    if (!id || !p.photos?.length) continue;
    await db.from("post_photos").delete().eq("post_id", id);
    // 사진 파일은 아직 없으므로 설명만 미리 넣지 않고 건너뛴다.
    // 관리자 화면에서 사진을 올리면 그때 설명과 함께 저장된다.
    count += 0;
  }
  console.log(`  ✓ post_photos — 사진 파일이 없어 건너뜀 (관리자 화면에서 업로드)`);
}

console.log("조직도...");
{
  await db.from("org_members").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  const rows = org.map((o) => ({
    member_id: memberIdByName.get(o.name) ?? null,
    business_id: o.businessId
      ? (businessIdBySlug.get(businesses.find((b) => b.id === o.businessId)?.slug) ?? null)
      : null,
    name: o.name,
    org_group: o.group,
    title: o.title,
    department: o.department,
    photo: o.photo,
    intro: o.intro,
    expertise: o.expertise,
    sort_order: o.order,
  }));
  const { error } = await db.from("org_members").insert(rows);
  check(`org_members ${rows.length}건`, error);
}

console.log("회원-업장 소유관계...");
{
  const rows = [];
  for (const mb of membersFile.memberBusinesses) {
    const member = membersFile.members.find((m) => m.id === mb.memberId);
    const business = businesses.find((b) => b.id === mb.businessId);
    const memberId = member && memberIdByName.get(member.name);
    const businessId = business && businessIdBySlug.get(business.slug);
    if (memberId && businessId) {
      rows.push({
        member_id: memberId,
        business_id: businessId,
        ownership: mb.ownership,
        can_edit: mb.canEdit,
      });
    }
  }
  if (rows.length > 0) {
    const { error } = await db
      .from("member_businesses")
      .upsert(rows, { onConflict: "member_id,business_id" });
    check(`member_businesses ${rows.length}건`, error);
  }
}

console.log("\n완료. 홈페이지를 새로고침하면 DB 내용이 보입니다.");
