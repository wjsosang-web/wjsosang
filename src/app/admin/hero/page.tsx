import Link from "next/link";
import { redirect } from "next/navigation";
import HeroSlideCard from "@/components/admin/HeroSlideCard";
import { getCurrentAdmin } from "@/lib/supabase/auth";
import { addHeroSlide } from "@/lib/admin/actions";
import { getHeroSlides } from "@/lib/repo";

export const dynamic = "force-dynamic";

export default async function AdminHeroPage() {
  if (!(await getCurrentAdmin())) redirect("/admin/login");

  const slides = await getHeroSlides();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold tracking-[-0.02em]">메인 배너</h1>
          <p className="mt-1 text-[13px] text-muted">
            메인홈 맨 위에서 넘어가는 배너입니다. 총{" "}
            <b className="tnum text-ink">{slides.length}</b>장
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/"
            target="_blank"
            className="rounded-lg border border-line px-4 py-2.5 text-[14px] font-semibold text-muted transition-colors hover:border-brand hover:text-brand"
          >
            메인홈에서 보기 ↗
          </Link>
          <form action={addHeroSlide}>
            <button
              type="submit"
              className="rounded-lg bg-brand px-5 py-2.5 text-[14px] font-bold text-white transition-colors hover:bg-brand-deep"
            >
              + 슬라이드 추가
            </button>
          </form>
        </div>
      </div>

      <p className="rounded-xl border border-line bg-white px-4 py-3 text-[12.5px] leading-[1.7] text-muted">
        사진만 올리면 <b className="text-ink">글씨가 있는 왼쪽이 자동으로 어두워집니다.</b>{" "}
        사진마다 밝기를 맞출 필요가 없습니다. 배너 높이는 사진 크기와 상관없이 늘 같습니다.
        <br />
        가로로 넓은 사진을 쓰시고, 왼쪽 절반은 글씨에 덮이니 <b className="text-ink">사람이나
        중요한 것이 오른쪽에 있는 사진</b>이 잘 어울립니다.
      </p>

      <div className="space-y-4">
        {slides.map((slide, i) => (
          <HeroSlideCard key={slide.id} slide={slide} index={i} total={slides.length} />
        ))}
      </div>
    </div>
  );
}
