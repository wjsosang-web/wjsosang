import Link from "next/link";
import { getAdminSupabase } from "@/lib/supabase/server";

/**
 * 많이 찾아주신 회원 순위.
 *
 * 셀 수 있는 사람은 로그인한 회원뿐이다. 그냥 지나가는 분은 누구인지 알 수
 * 없어 순위에 올릴 수 없다. 그래서 회원 로그인이 늘어야 순위도 채워진다.
 *
 * 숫자는 "며칠 들르셨는가" 다. 새로고침 횟수가 아니다.
 * 하루에 여러 번 오셔도 하루로 센다. 그래야 순위가 뜻을 갖는다.
 *
 * 이름만 보여준다. 업장명·연락처는 넣지 않는다.
 */

interface Row {
  name: string;
  count: number;
}

async function topVisitors(limit = 10): Promise<Row[]> {
  try {
    const { data } = await getAdminSupabase()
      .from("members")
      .select("name, visit_count")
      .eq("status", "active")
      .gt("visit_count", 0)
      .order("visit_count", { ascending: false })
      .limit(limit);

    return (data ?? []).map((r) => ({
      name: r.name as string,
      count: (r.visit_count as number) ?? 0,
    }));
  } catch {
    // 칸이 아직 없을 수 있다. 그때는 빈 목록으로 둔다.
    return [];
  }
}

/** 1·2·3등만 색을 달리한다. 그 아래는 다 같다. */
function medal(rank: number): string {
  if (rank === 1) return "bg-amber text-white";
  if (rank === 2) return "bg-line-strong text-white";
  if (rank === 3) return "bg-coral text-white";
  return "bg-mist text-muted";
}

export default async function VisitRanking() {
  const rows = await topVisitors();

  return (
    <section className="px-5 py-10 md:py-12">
      <div className="mx-auto grid max-w-[1180px] gap-6 lg:grid-cols-[380px_1fr] lg:gap-10">
        {/* 순위 — 좌측 */}
        <div className="rounded-2xl border border-line bg-white p-5 md:p-6">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-[18px] font-bold tracking-[-0.02em]">많이 찾아주신 회원</h2>
            <span className="text-[11.5px] text-muted">방문일 기준</span>
          </div>

          {rows.length === 0 ? (
            <div className="mt-4 rounded-xl bg-mist px-4 py-8 text-center">
              <p className="text-[13.5px] font-bold">아직 순위가 없습니다.</p>
              <p className="mt-2 text-[12.5px] leading-[1.75] text-muted">
                회원 로그인을 하신 분부터 집계됩니다.
              </p>
              <Link
                href="/my"
                className="mt-4 inline-block rounded-lg bg-brand px-5 py-2.5 text-[13px] font-bold text-white"
              >
                회원 로그인 →
              </Link>
            </div>
          ) : (
            <ol className="mt-4 divide-y divide-line">
              {rows.map((row, i) => (
                <li key={row.name} className="flex items-center gap-3 py-2.5">
                  <span
                    aria-hidden
                    className={`tnum grid h-7 w-7 shrink-0 place-items-center rounded-full text-[12.5px] font-bold ${medal(
                      i + 1,
                    )}`}
                  >
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[14.5px] font-bold">
                    {row.name}
                  </span>
                  <span className="tnum shrink-0 text-[13.5px] font-bold text-brand">
                    {row.count}회
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* 설명 — 우측 */}
        <div className="flex flex-col justify-center">
          <p className="text-[12px] font-bold tracking-[0.18em] text-brand">MEMBERS</p>
          <h3 className="mt-2.5 text-[22px] font-bold leading-snug tracking-[-0.02em] md:text-[26px]">
            자주 오시는 만큼
            <br />
            더 많이 연결됩니다.
          </h3>
          <p className="mt-3 max-w-[560px] text-[14px] leading-[1.85] text-ink-soft">
            회원 로그인을 하시면 방문이 집계됩니다. 하루에 여러 번 오셔도 하루로 셉니다.
            로그인하신 분은 회원 전용 자료를 받아보실 수 있고, 지원금 공고를 텔레그램으로
            받아보실 수 있습니다.
          </p>

          <div className="mt-5 flex flex-wrap gap-2.5">
            <Link
              href="/my"
              className="rounded-lg bg-brand px-6 py-3 text-[14.5px] font-bold text-white transition-colors hover:bg-brand-deep"
            >
              회원 로그인 →
            </Link>
            <Link
              href="/join"
              className="rounded-lg border border-line-strong px-6 py-3 text-[14.5px] font-bold transition-colors hover:border-brand hover:text-brand"
            >
              가입 안내 보기
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
