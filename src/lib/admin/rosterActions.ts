"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/supabase/auth";
import { getAdminSupabase } from "@/lib/supabase/server";
import { buildRosterExcel, normalizePhone, parseRoster, type RosterRow } from "@/lib/admin/roster";

/**
 * 회원 명단 엑셀 올리기 · 내려받기.
 *
 * 해마다 1월에 갱신하면서 들어오는 분과 나가는 분이 한꺼번에 바뀐다.
 * 그때 엑셀을 통째로 올리면 명단을 맞춰준다.
 *
 * 중요한 규칙: 바로 반영하지 않고 먼저 보여준다.
 * 명단을 통째로 갈아엎는 일이라, 잘못 올린 엑셀 하나로 회원 전체가
 * 탈퇴 처리될 수 있기 때문이다. 무엇이 어떻게 바뀌는지 확인한 뒤
 * 두 번째 버튼을 눌러야 실제로 저장된다.
 */

export interface RosterPreview {
  ok: boolean;
  message: string;
  /** 어떤 칸을 무엇으로 읽었는지 */
  mapping?: Record<string, string>;
  warnings?: string[];
  /** 엑셀에는 있는데 명부에 없는 사람 — 새로 들어온 분 */
  added?: { name: string; phone: string | null; shop: string | null }[];
  /** 양쪽에 다 있는 사람 수 */
  kept?: number;
  /** 명부에는 있는데 엑셀에 없는 사람 — 나간 분일 수 있다 */
  missing?: { id: string; name: string; phone: string | null; isOfficer: boolean }[];
  /** 확인 화면에서 그대로 다시 넘기기 위한 값 */
  payload?: string;
}

/** 사람을 맞추는 기준 — 이름+연락처가 같으면 같은 사람으로 본다 */
function keyOf(name: string, phone: string | null): string {
  return `${name.replace(/\s/g, "")}|${(phone ?? "").replace(/[^0-9]/g, "")}`;
}

export async function previewRoster(
  _prev: RosterPreview | null,
  form: FormData,
): Promise<RosterPreview> {
  try {
    await requirePermission("members.approve");

    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { ok: false, message: "엑셀 파일을 골라 주세요." };
    }
    if (file.size > 10 * 1024 * 1024) {
      return { ok: false, message: "파일이 너무 큽니다. 10MB 아래로 줄여 주세요." };
    }

    const { rows, mapping, warnings } = parseRoster(await file.arrayBuffer());
    if (rows.length === 0) {
      return { ok: false, message: warnings[0] ?? "읽을 수 있는 회원이 없습니다.", warnings };
    }

    const db = getAdminSupabase();
    const { data: existing } = await db
      .from("members")
      .select("id, name, phone, status")
      .neq("status", "withdrawn");

    const { data: org } = await db.from("org_members").select("member_id");
    const officerIds = new Set((org ?? []).map((o) => o.member_id as string));

    // 이름+연락처로 맞추되, 연락처가 없는 엑셀이면 이름만으로 맞춘다
    const byKey = new Map<string, { id: string; name: string; phone: string | null }>();
    const byName = new Map<string, { id: string; name: string; phone: string | null }>();

    for (const m of existing ?? []) {
      const entry = {
        id: m.id as string,
        name: m.name as string,
        phone: (m.phone as string | null) ?? null,
      };
      byKey.set(keyOf(entry.name, entry.phone), entry);
      byName.set(entry.name.replace(/\s/g, ""), entry);
    }

    const matched = new Set<string>();
    const added: NonNullable<RosterPreview["added"]> = [];

    for (const row of rows) {
      const hit =
        byKey.get(keyOf(row.name, row.phone)) ?? byName.get(row.name.replace(/\s/g, ""));

      if (hit) matched.add(hit.id);
      else added.push({ name: row.name, phone: row.phone, shop: row.shop });
    }

    const missing = (existing ?? [])
      .filter((m) => !matched.has(m.id as string))
      .map((m) => ({
        id: m.id as string,
        name: m.name as string,
        phone: (m.phone as string | null) ?? null,
        // 임원은 실수로 빼면 조직도가 무너지므로 눈에 띄게 표시한다
        isOfficer: officerIds.has(m.id as string),
      }));

    return {
      ok: true,
      message: `엑셀에서 ${rows.length}명을 읽었습니다.`,
      mapping,
      warnings,
      added,
      kept: matched.size,
      missing,
      payload: JSON.stringify(rows),
    };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}

export interface ApplyResult {
  ok: boolean;
  message: string;
}

export async function applyRoster(
  _prev: ApplyResult | null,
  form: FormData,
): Promise<ApplyResult> {
  try {
    await requirePermission("members.approve");

    const rows = JSON.parse(String(form.get("payload") ?? "[]")) as RosterRow[];
    if (!Array.isArray(rows) || rows.length === 0) {
      return { ok: false, message: "적용할 명단이 없습니다. 파일을 다시 올려 주세요." };
    }

    // 명부에만 있는 사람을 탈퇴로 돌릴지 — 기본은 그대로 둔다
    const withdrawMissing = form.get("withdrawMissing") === "on";
    const withdrawIds = String(form.get("withdrawIds") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const db = getAdminSupabase();
    const { data: existing } = await db
      .from("members")
      .select("id, name, phone")
      .neq("status", "withdrawn");

    const byKey = new Map<string, string>();
    const byName = new Map<string, string>();
    for (const m of existing ?? []) {
      const name = m.name as string;
      const phone = (m.phone as string | null) ?? null;
      byKey.set(keyOf(name, phone), m.id as string);
      byName.set(name.replace(/\s/g, ""), m.id as string);
    }

    let inserted = 0;
    let updated = 0;

    for (const row of rows) {
      const id =
        byKey.get(keyOf(row.name, normalizePhone(row.phone))) ??
        byName.get(row.name.replace(/\s/g, ""));

      if (id) {
        // 이미 있는 사람은 비어 있던 값만 채운다. 홈페이지에서 고친 값을 덮지 않는다.
        const patch: Record<string, unknown> = { status: "active" };
        if (row.phone) patch.phone = row.phone;
        if (row.email) patch.email = row.email;

        await db.from("members").update(patch).eq("id", id);
        updated += 1;
        continue;
      }

      const { error } = await db.from("members").insert({
        name: row.name,
        phone: row.phone,
        email: row.email,
        role: "member",
        status: "active",
        joined_at: new Date().toISOString().slice(0, 10),
      });

      if (!error) inserted += 1;
    }

    let withdrawn = 0;
    if (withdrawMissing && withdrawIds.length > 0) {
      const { error } = await db
        .from("members")
        .update({ status: "withdrawn" })
        .in("id", withdrawIds);

      if (!error) withdrawn = withdrawIds.length;
    }

    revalidatePath("/admin/members");

    const parts = [
      `새로 ${inserted}명 등록`,
      `${updated}명 확인`,
      withdrawn > 0 ? `${withdrawn}명 탈퇴 처리` : null,
    ].filter(Boolean);

    return { ok: true, message: parts.join(" · ") + " 했습니다." };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}

/** 회원 한 명을 직접 추가한다 */
export async function addMember(
  _prev: ApplyResult | null,
  form: FormData,
): Promise<ApplyResult> {
  try {
    await requirePermission("members.approve");

    const name = String(form.get("name") ?? "").trim();
    if (!name) return { ok: false, message: "이름을 입력해 주세요." };

    const db = getAdminSupabase();
    const { error } = await db.from("members").insert({
      name,
      phone: normalizePhone(form.get("phone")),
      email: String(form.get("email") ?? "").trim() || null,
      role: "member",
      status: "active",
      joined_at: new Date().toISOString().slice(0, 10),
    });

    if (error) throw new Error(error.message);

    revalidatePath("/admin/members");
    return { ok: true, message: `${name} 님을 명부에 넣었습니다.` };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}

/** 회원 명단을 엑셀로 만들어 돌려준다 (base64) */
export async function exportRoster(): Promise<{
  ok: boolean;
  message: string;
  file?: string;
}> {
  try {
    await requirePermission("members.approve");

    const db = getAdminSupabase();
    const [{ data: members }, { data: org }, { data: links }, { data: businesses }] =
      await Promise.all([
        db
          .from("members")
          .select("id, name, phone, email, role, status, joined_at, telegram_chat_id")
          .order("name"),
        db.from("org_members").select("member_id, title, department"),
        db.from("member_businesses").select("member_id, business_id"),
        db.from("businesses").select("id, name, category, district"),
      ]);

    const orgBy = new Map((org ?? []).map((o) => [o.member_id as string, o]));
    const bizById = new Map((businesses ?? []).map((b) => [b.id as string, b]));

    const bizBy = new Map<string, { name: string; category: string; district: string }>();
    for (const l of links ?? []) {
      const biz = bizById.get(l.business_id as string);
      if (biz) {
        bizBy.set(l.member_id as string, {
          name: biz.name as string,
          category: biz.category as string,
          district: biz.district as string,
        });
      }
    }

    const STATUS: Record<string, string> = {
      active: "정상",
      pending: "대기",
      paused: "중지",
      withdrawn: "탈퇴",
    };
    const ROLE: Record<string, string> = {
      superadmin: "최고운영자",
      admin: "운영자",
      officer: "임원진",
      member: "협회원",
    };

    const rows = (members ?? []).map((m) => {
      const o = orgBy.get(m.id as string);
      const b = bizBy.get(m.id as string);
      return {
        이름: m.name as string,
        연락처: (m.phone as string | null) ?? "",
        이메일: (m.email as string | null) ?? "",
        업장명: b?.name ?? "",
        업종: b?.category ?? "",
        법정동: b?.district ?? "",
        직책: (o?.title as string | undefined) ?? "",
        소속국: (o?.department as string | undefined) ?? "",
        권한: ROLE[m.role as string] ?? (m.role as string),
        상태: STATUS[m.status as string] ?? (m.status as string),
        가입일: (m.joined_at as string | null) ?? "",
        텔레그램: m.telegram_chat_id ? "연결됨" : "",
      };
    });

    const bytes = buildRosterExcel(rows);

    return {
      ok: true,
      message: `${rows.length}명을 내려받습니다.`,
      file: Buffer.from(bytes).toString("base64"),
    };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}
