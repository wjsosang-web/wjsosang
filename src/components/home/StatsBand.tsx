import { Icon } from "@/components/common/Icons";
import { accentAt } from "@/lib/accents";
import type { StatItem } from "@/lib/types";

/**
 * 숫자로 보는 원청협 (시안 기준).
 * 연한 민트 박스 안에 왼쪽 제목 + 오른쪽 항목 4개.
 * 값·라벨·설명·아이콘 전부 데이터에서 읽는다. 코드에 숫자를 적지 않는다.
 */
export default function StatsBand({ items }: { items: StatItem[] }) {
  if (items.length === 0) return null;

  return (
    <section className="px-5 py-10 md:py-14">
      <div className="mx-auto max-w-[1180px] rounded-2xl bg-brand-tint px-6 py-8 md:px-10 md:py-10">
        <div className="grid gap-8 lg:grid-cols-[220px_1fr] lg:items-center lg:gap-10">
          <div>
            <h2 className="text-[22px] font-bold leading-[1.35] tracking-[-0.02em] md:text-[25px]">
              숫자로 보는
              <br />
              원청협
            </h2>
            <p className="mt-3 text-[13.5px] leading-relaxed text-ink-soft">
              함께 만든 오늘,
              <br />더 큰 내일을 위해.
            </p>
          </div>

          <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {items.map((item, i) => (
              <div key={item.id} className="flex gap-3.5">
                <span
                  aria-hidden
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white ${accentAt(i).text}`}
                >
                  <Icon name={item.icon} className="h-[22px] w-[22px]" />
                </span>
                <div className="min-w-0">
                  <dd className="tnum text-[24px] font-bold leading-none tracking-[-0.02em] md:text-[27px]">
                    {item.value}
                  </dd>
                  <dt className="mt-1.5 text-[14px] font-bold">{item.label}</dt>
                  <p className="mt-1.5 text-[12.5px] leading-[1.6] text-ink-soft">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
