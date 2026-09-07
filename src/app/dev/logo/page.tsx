import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LogoUploader from "@/components/dev/LogoUploader";

export const metadata: Metadata = { title: "로고 등록 (개발용)" };
export const dynamic = "force-dynamic";

/**
 * 로고 파일을 끌어다 놓아 public/logo 에 저장하는 개발용 화면.
 * 배포된 사이트에서는 열리지 않는다.
 */
export default function LogoDevPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <div className="px-5 py-12">
      <div className="mx-auto max-w-[1000px]">
        <p className="inline-block rounded-md bg-amber-tint px-2.5 py-1 text-[11.5px] font-bold text-amber">
          개발용 화면
        </p>
        <h1 className="mt-3 text-[26px] font-bold tracking-[-0.02em]">로고 등록</h1>
        <p className="mt-3 text-[14px] leading-[1.8] text-ink-soft">
          로고 파일을 각 칸에 끌어다 놓으면 <code className="text-brand">public/logo</code> 에
          저장되고 홈페이지에 바로 반영됩니다. 저장된 파일은 저장소에 커밋해서 올려야
          배포된 사이트에도 적용됩니다.
        </p>
        <ul className="mt-4 space-y-1 text-[13px] text-muted">
          <li>· SVG를 권장합니다. 화면 크기와 관계없이 선명하고 용량이 작습니다.</li>
          <li>· PNG는 배경이 투명한 파일로 준비해 주세요.</li>
          <li>· 이 화면은 개발 서버에서만 열립니다. 배포된 사이트에서는 나오지 않습니다.</li>
        </ul>

        <div className="mt-10">
          <LogoUploader />
        </div>
      </div>
    </div>
  );
}
