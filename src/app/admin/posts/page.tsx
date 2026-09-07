import Link from "next/link";
import { redirect } from "next/navigation";
import Badge from "@/components/common/Badge";
import { getCurrentAdmin } from "@/lib/supabase/auth";
import { listPosts } from "@/lib/admin/queries";
import type { PostType } from "@/lib/types";

export const dynamic = "force-dynamic";

const TABS: { type: PostType; label: string }[] = [
  { type: "notice", label: "공지사항" },
  { type: "activity", label: "활동소식" },
  { type: "event", label: "행사" },
];

const STATUS_LABEL: Record<string, string> = {
  public: "공개",
  private: "비공개",
  draft: "임시저장",
};

export default async function AdminPostsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  if (!(await getCurrentAdmin())) redirect("/admin/login");

  const { type } = await searchParams;
  const current = (TABS.find((t) => t.type === type)?.type ?? "notice") as PostType;
  const posts = await listPosts(current);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[22px] font-bold tracking-[-0.02em]">협회활동 관리</h1>
        <Link
          href={`/admin/posts/new?type=${current}`}
          className="rounded-lg bg-brand px-5 py-2.5 text-[14px] font-bold text-white transition-colors hover:bg-brand-deep"
        >
          + 새 글 쓰기
        </Link>
      </div>

      <div className="flex gap-1 rounded-lg bg-white p-1.5">
        {TABS.map((t) => (
          <Link
            key={t.type}
            href={`/admin/posts?type=${t.type}`}
            className={`flex-1 rounded-md py-2.5 text-center text-[14px] font-bold transition-colors ${
              t.type === current ? "bg-brand text-white" : "text-ink-soft hover:bg-mist"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {posts.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line bg-white py-16 text-center text-[14px] text-muted">
          아직 등록된 글이 없습니다.
        </p>
      ) : (
        <ul className="overflow-hidden rounded-xl border border-line bg-white">
          {posts.map((p, i) => (
            <li key={p.id} className={i > 0 ? "border-t border-line" : ""}>
              <Link
                href={`/admin/posts/${p.id}`}
                className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-mist"
              >
                <span className="tnum w-24 shrink-0 text-[12.5px] text-muted">
                  {p.date.replace(/-/g, ".")}
                </span>
                {p.category && <Badge label={p.category} />}
                <span className="min-w-0 flex-1 truncate text-[14.5px] font-semibold">
                  {p.title}
                </span>
                {p.photos.length > 0 && (
                  <span className="tnum shrink-0 text-[12px] text-muted">
                    사진 {p.photos.length}
                  </span>
                )}
                <span
                  className={`shrink-0 rounded px-2 py-1 text-[11.5px] font-bold ${
                    p.status === "public" ? "bg-brand-tint text-brand-deep" : "bg-mist text-muted"
                  }`}
                >
                  {STATUS_LABEL[p.status] ?? p.status}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
