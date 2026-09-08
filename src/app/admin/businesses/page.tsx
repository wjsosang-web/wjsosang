import Link from "next/link";
import { redirect } from "next/navigation";
import BusinessSearch, { type AdminBusinessRow } from "@/components/admin/BusinessSearch";
import { getCurrentAdmin } from "@/lib/supabase/auth";
import { listBusinesses } from "@/lib/admin/queries";
import { resolveBusinessCover } from "@/lib/images";

export const dynamic = "force-dynamic";

export default async function AdminBusinessesPage() {
  if (!(await getCurrentAdmin())) redirect("/admin/login");

  const businesses = await listBusinesses();

  // 검색용 글자 뭉치. 화면에 안 보이는 키워드·메뉴까지 넣어서 찾기 쉽게 한다.
  const rows: AdminBusinessRow[] = businesses.map((b) => ({
    id: b.id,
    name: b.name,
    ownerName: b.ownerName,
    district: b.district,
    category: b.category,
    status: b.status,
    priority: b.priority,
    featured: b.featured,
    phoneHidden: !b.phonePublic && !!b.phone,
    cover: resolveBusinessCover(b).url,
    searchText: [
      b.name,
      b.ownerName,
      b.category,
      b.district,
      b.address,
      b.phone,
      b.tagline,
      b.description,
      ...b.keywords,
      ...b.placeKeywords,
      ...b.menus.map((m) => m.name),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase(),
  }));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold tracking-[-0.02em]">회원업장 관리</h1>
          <p className="mt-1 text-[13px] text-muted">
            업장명·대표자명·업종·동네로 찾을 수 있습니다.
          </p>
        </div>
        <Link
          href="/admin/businesses/new"
          className="rounded-lg bg-brand px-5 py-2.5 text-[14px] font-bold text-white transition-colors hover:bg-brand-deep"
        >
          + 새 업장 등록
        </Link>
      </div>

      <BusinessSearch rows={rows} />
    </div>
  );
}
