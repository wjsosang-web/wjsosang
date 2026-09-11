"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/supabase/auth";
import { getAdminSupabase } from "@/lib/supabase/server";
import { collectFeeds, notifyPending, type SourceSwitches } from "@/lib/feeds/collect";
import { SOURCE_LABEL, type FeedSource } from "@/lib/feeds/types";
import { broadcastTelegram, hasTelegram } from "@/lib/telegram";
import type { ActionResult } from "@/lib/admin/actions";

/**
 * 지원사업·교육·행사 소식 관리.
 *
 * 자동으로도 돌지만(하루 한 번), 관리자가 직접 눌러 지금 모을 수도 있다.
 * 새 공고가 떴다는 얘기를 들었을 때 기다리지 않아도 되도록.
 */

const SETTINGS_KEY = "feed_sources";

export async function getSourceSwitches(): Promise<SourceSwitches> {
  try {
    const { data } = await getAdminSupabase()
      .from("site_settings")
      .select("value")
      .eq("key", SETTINGS_KEY)
      .maybeSingle();

    if (data?.value && typeof data.value === "object") return data.value as SourceSwitches;
  } catch {
    /* 아직 저장한 적이 없으면 전부 켜진 것으로 본다 */
  }
  return {};
}

export async function saveSourceSwitches(
  _prev: ActionResult | null,
  form: FormData,
): Promise<ActionResult> {
  try {
    await requirePermission("site.manage");

    const next: SourceSwitches = {};
    for (const source of Object.keys(SOURCE_LABEL) as FeedSource[]) {
      next[source] = form.get(`on-${source}`) === "on";
    }

    const { error } = await getAdminSupabase()
      .from("site_settings")
      .upsert({ key: SETTINGS_KEY, value: next, updated_at: new Date().toISOString() });

    if (error) throw new Error(error.message);

    revalidatePath("/admin/feeds");
    return { ok: true, message: "가져올 곳을 저장했습니다." };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}

/** 지금 모아 온다. 알림은 따로 눌러서 보낸다. */
export async function runCollect(): Promise<ActionResult> {
  try {
    await requirePermission("posts.manage");

    const report = await collectFeeds(await getSourceSwitches(), { notify: false });

    revalidatePath("/admin/feeds");
    revalidatePath("/support");

    const failed = report.perSource.filter((s) => s.error);
    const detail = failed
      .map((s) => `${SOURCE_LABEL[s.source]}: ${s.error}`)
      .join(" / ");

    return {
      ok: failed.length < report.perSource.length,
      message: `새 소식 ${report.added}건을 담았습니다.` + (detail ? ` — ${detail}` : ""),
    };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}

/** 아직 안 보낸 소식을 회원들에게 보낸다 */
export async function sendPending(): Promise<ActionResult> {
  try {
    await requirePermission("posts.manage");

    if (!hasTelegram()) {
      return { ok: false, message: "텔레그램 봇 토큰이 등록되지 않았습니다." };
    }

    const { notified, receivers } = await notifyPending(10);

    revalidatePath("/admin/feeds");

    if (notified === 0) return { ok: true, message: "보낼 새 소식이 없습니다." };
    if (receivers === 0) {
      return {
        ok: true,
        message: `${notified}건을 보낸 것으로 표시했습니다. 텔레그램을 등록한 회원이 아직 없습니다.`,
      };
    }
    return { ok: true, message: `${notified}건을 회원 ${receivers}명에게 보냈습니다.` };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}

/** 한 건만 골라서 지금 보낸다 */
export async function sendOne(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  try {
    await requirePermission("posts.manage");

    const id = String(form.get("id") ?? "");
    if (!id) return { ok: false, message: "어떤 소식인지 알 수 없습니다." };
    if (!hasTelegram()) {
      return { ok: false, message: "텔레그램 봇 토큰이 등록되지 않았습니다." };
    }

    const db = getAdminSupabase();
    const { data: row } = await db.from("feed_items").select("*").eq("id", id).maybeSingle();
    if (!row) return { ok: false, message: "그 소식을 찾지 못했습니다." };

    const { data: members } = await db
      .from("members")
      .select("telegram_chat_id")
      .not("telegram_chat_id", "is", null);

    const chatIds = [...new Set((members ?? []).map((m) => m.telegram_chat_id as string))];
    if (chatIds.length === 0) {
      return { ok: false, message: "텔레그램을 등록한 회원이 아직 없습니다." };
    }

    const text = [
      `<b>${row.title as string}</b>`,
      row.organizer ? `주관 ${row.organizer as string}` : "",
      row.ends_on ? `마감 ${row.ends_on as string}` : "",
      "",
      ((row.summary as string) ?? "").slice(0, 200),
      "",
      (row.link as string) ?? "",
    ]
      .filter((line) => line !== undefined)
      .join("\n");

    const { sent, failed } = await broadcastTelegram(chatIds, text);

    await db
      .from("feed_items")
      .update({ notified_at: new Date().toISOString() })
      .eq("id", id);

    revalidatePath("/admin/feeds");

    return {
      ok: sent > 0,
      message:
        failed > 0 ? `${sent}명에게 보냈습니다. ${failed}명은 실패했습니다.` : `${sent}명에게 보냈습니다.`,
    };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}

/** 홈페이지에서 감추거나 다시 보이게 한다 */
export async function toggleHidden(
  _prev: ActionResult | null,
  form: FormData,
): Promise<ActionResult> {
  try {
    await requirePermission("posts.manage");

    const id = String(form.get("id") ?? "");
    const hide = form.get("hide") === "1";
    if (!id) return { ok: false, message: "어떤 소식인지 알 수 없습니다." };

    const { error } = await getAdminSupabase()
      .from("feed_items")
      .update({ hidden: hide })
      .eq("id", id);

    if (error) throw new Error(error.message);

    revalidatePath("/admin/feeds");
    revalidatePath("/support");

    return { ok: true, message: hide ? "홈페이지에서 감췄습니다." : "다시 보이게 했습니다." };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}
