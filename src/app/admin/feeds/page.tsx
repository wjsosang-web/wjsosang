import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/supabase/auth";
import { getSourceSwitches } from "@/lib/admin/feedActions";
import { getFeedItems } from "@/lib/feeds/repo";
import { hasBizinfoKey } from "@/lib/feeds/bizinfo";
import { hasTourKey } from "@/lib/feeds/festival";
import { hasTelegram } from "@/lib/telegram";
import FeedPanel from "@/components/admin/FeedPanel";

export const dynamic = "force-dynamic";

export default async function AdminFeedsPage() {
  if (!(await getCurrentAdmin())) redirect("/admin/login");

  const [items, switches] = await Promise.all([
    // 관리자 화면에서는 마감이 지난 것과 감춘 것도 보인다.
    getFeedItems({ includeClosed: true, includeHidden: true, limit: 120 }),
    getSourceSwitches(),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[22px] font-bold tracking-[-0.02em]">지원사업 소식</h1>
        <p className="mt-1 text-[13px] leading-[1.7] text-muted">
          지원사업·정책자금 공고, 소상공인 교육, 원주 행사를 매일 아침 모아 둡니다.
          처음 올라온 공고만 골라 회원들에게 텔레그램으로 보냅니다.
        </p>
      </div>

      <div className="rounded-xl border border-line bg-white px-4 py-3.5 text-[12.5px] leading-[1.8] text-muted">
        <p className="font-bold text-ink">어디서 가져오나요</p>
        <p className="mt-1">
          <b>지원사업·정책자금</b> — 기업마당. 중앙부처·강원도·원주시가 올리는 공고가 모두 모이는
          곳이고, 소상공인 정책자금(융자) 공고도 여기 함께 올라옵니다.
          <br />
          <b>소상공인 교육</b> — 지식배움터 공지사항. 이곳은 공개 API 가 없어서 화면을 읽어 옵니다.
          현장교육 목록은 로그인 뒤에 있어 가져올 수 없습니다.
          <br />
          <b>원주 행사·축제</b> — 한국관광공사. 강원 전체를 받아 주소에 원주가 들어간 것만 남깁니다.
        </p>
      </div>

      <FeedPanel
        items={items}
        switches={switches}
        keys={{ bizinfo: hasBizinfoKey(), tour: hasTourKey(), telegram: hasTelegram() }}
      />
    </div>
  );
}
