"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import ImageInput from "@/components/admin/ImageInput";
import { fetchPlaceDraft, saveBusiness, type ActionResult } from "@/lib/admin/actions";
import { BUSINESS_CATEGORIES, type Business, type PlaceDraft } from "@/lib/types";

/**
 * 업장 등록·수정 (기획안 22조, 37조).
 *
 * 맨 위가 네이버 플레이스 주소 입력칸이다.
 * [업장정보 불러오기] 를 누르면 아래 칸들이 자동으로 채워지고,
 * 관리자가 확인·수정한 뒤 저장한다. 자동 등록이 아니라 자동 채우기다.
 */
export default function BusinessForm({ business }: { business?: Business }) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(
    saveBusiness,
    null,
  );

  const [placeUrl, setPlaceUrl] = useState(business?.placeUrl ?? "");
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<PlaceDraft | null>(null);
  const [importNote, setImportNote] = useState<{
    tone: "ok" | "warn" | "error";
    filled: string[];
    missing: string[];
    warnings: string[];
    error: string | null;
  } | null>(null);
  const [photoSlots, setPhotoSlots] = useState<number[]>([]);

  /** 자동채움 값이 있으면 그걸 쓰고, 없으면 기존 값 */
  const v = <K extends keyof PlaceDraft>(key: K, current: string | null | undefined) => {
    const fromDraft = draft?.[key];
    if (fromDraft !== null && fromDraft !== undefined && fromDraft !== "") return String(fromDraft);
    return current ?? "";
  };

  const runImport = async () => {
    if (!placeUrl.trim()) return;
    setLoading(true);
    setImportNote(null);
    try {
      const result = await fetchPlaceDraft(placeUrl);
      setDraft(result.draft);
      setImportNote({
        tone: result.result === "ok" ? "ok" : result.result === "partial" ? "warn" : "error",
        filled: result.filled,
        missing: result.missing,
        warnings: result.warnings,
        error: result.error,
      });
    } catch (e) {
      setImportNote({
        tone: "error",
        filled: [],
        missing: [],
        warnings: [],
        error: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setLoading(false);
    }
  };

  const field =
    "w-full rounded-lg border border-line bg-white px-4 py-2.5 text-[14px] outline-none transition-colors focus:border-brand";
  const label = "mb-1.5 block text-[13px] font-bold";
  // 자동채움으로 값이 들어온 칸은 표시해 준다
  const marked = (key: keyof PlaceDraft) =>
    draft && draft[key] ? "border-brand bg-brand-tint-2" : "";

  return (
    <form action={action} className="space-y-6">
      {business && <input type="hidden" name="id" value={business.id} />}
      {business && <input type="hidden" name="slug" value={business.slug} />}
      {business?.coverImage && (
        <input type="hidden" name="coverImage" value={business.coverImage} />
      )}
      {business?.logoImage && <input type="hidden" name="logoImage" value={business.logoImage} />}
      <input type="hidden" name="placeId" value={v("placeId", business?.placeId)} />
      <input type="hidden" name="placeType" value={v("placeType", business?.placeType)} />
      <input type="hidden" name="placePhoto" value={v("photo", business?.placePhoto)} />
      <input type="hidden" name="lat" value={v("lat", business?.lat?.toString())} />
      <input type="hidden" name="lng" value={v("lng", business?.lng?.toString())} />
      {draft?.menus && draft.menus.length > 0 && (
        <input type="hidden" name="menusJson" value={JSON.stringify(draft.menus)} />
      )}

      <div className="flex items-center justify-between gap-4">
        <h1 className="text-[22px] font-bold tracking-[-0.02em]">
          회원업장 {business ? "수정" : "등록"}
        </h1>
        <Link
          href="/admin/businesses"
          className="text-[13.5px] font-semibold text-muted hover:text-brand"
        >
          목록으로
        </Link>
      </div>

      {/* 1단계 — 플레이스 주소 */}
      <section className="rounded-xl border-2 border-brand/30 bg-brand-tint-2 p-5">
        <h2 className="text-[15px] font-bold">
          <span className="tnum mr-2 text-brand">01</span>
          네이버 플레이스 주소를 입력해주세요
        </h2>
        <p className="mt-1.5 text-[12.5px] text-muted">
          주소를 넣고 불러오면 상호·업종·주소·전화·영업시간·대표사진·메뉴가 자동으로 채워집니다.
          대표자명처럼 플레이스에 없는 정보는 직접 입력하셔야 합니다.
        </p>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            name="placeUrl"
            value={placeUrl}
            onChange={(e) => setPlaceUrl(e.target.value)}
            placeholder="https://naver.me/xxxxxxx"
            className={`${field} flex-1`}
          />
          <button
            type="button"
            onClick={runImport}
            disabled={loading || placeUrl.trim() === ""}
            className="shrink-0 rounded-lg bg-brand px-6 py-2.5 text-[14px] font-bold text-white transition-colors hover:bg-brand-deep disabled:bg-line-strong"
          >
            {loading ? "불러오는 중…" : "업장정보 불러오기"}
          </button>
        </div>

        {importNote && (
          <div
            className={`mt-3 rounded-lg px-4 py-3 text-[13px] leading-[1.75] ${
              importNote.tone === "ok"
                ? "bg-brand-tint text-brand-deep"
                : importNote.tone === "warn"
                  ? "bg-amber-tint text-amber"
                  : "bg-coral-tint text-coral"
            }`}
          >
            {importNote.error ? (
              <p>{importNote.error}</p>
            ) : (
              <>
                <p>
                  <b>가져왔습니다:</b> {importNote.filled.join(", ") || "없음"}
                </p>
                {importNote.missing.length > 0 && (
                  <p className="mt-1">
                    <b>직접 채워주세요:</b> {importNote.missing.join(", ")}
                  </p>
                )}
                <p className="mt-1">
                  <b>항상 직접 입력:</b> 대표자명, 한 줄 소개, 협회 등록 키워드
                </p>
                {importNote.warnings.map((w, i) => (
                  <p key={i} className="mt-1 opacity-80">
                    · {w}
                  </p>
                ))}
              </>
            )}
          </div>
        )}

        {draft?.photo && (
          <div className="mt-3">
            <p className="text-[12.5px] font-bold">플레이스 대표사진</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={draft.photo}
              alt=""
              className="mt-1.5 aspect-[4/3] w-[200px] rounded-lg object-cover"
            />
            <p className="mt-1.5 text-[11.5px] text-muted">
              회원이 사진을 올리기 전까지 이 사진이 쓰입니다.
            </p>
          </div>
        )}
      </section>

      {/* 2단계 — 기본 정보 */}
      <section className="space-y-4 rounded-xl border border-line bg-white p-5">
        <h2 className="text-[15px] font-bold">
          <span className="tnum mr-2 text-brand">02</span>
          업장 정보 확인
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className={label}>
              업장명 <span className="text-brand">*</span>
            </label>
            <input
              id="name"
              name="name"
              required
              key={`name-${draft?.name ?? ""}`}
              defaultValue={v("name", business?.name)}
              className={`${field} ${marked("name")}`}
            />
          </div>

          <div>
            <label htmlFor="ownerName" className={label}>
              대표자명 <span className="text-brand">*</span>
              <span className="ml-1.5 font-normal text-muted">(직접 입력)</span>
            </label>
            <input
              id="ownerName"
              name="ownerName"
              required
              defaultValue={business?.ownerName ?? ""}
              className={field}
            />
          </div>

          <div>
            <label htmlFor="category" className={label}>
              업종
            </label>
            <select
              id="category"
              name="category"
              key={`cat-${draft?.category ?? ""}`}
              defaultValue={business?.category ?? "기타"}
              className={field}
            >
              {BUSINESS_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {draft?.category && (
              <p className="mt-1 text-[11.5px] text-brand">
                플레이스 분류: {draft.category} — 위에서 협회 업종으로 골라주세요.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="district" className={label}>
              지역 (읍·면·동)
            </label>
            <input
              id="district"
              name="district"
              key={`dist-${draft?.district ?? ""}`}
              defaultValue={v("district", business?.district)}
              className={`${field} ${marked("district")}`}
            />
          </div>
        </div>

        <div>
          <label htmlFor="address" className={label}>
            주소
          </label>
          <input
            id="address"
            name="address"
            key={`addr-${draft?.address ?? ""}`}
            defaultValue={v("address", business?.address)}
            className={`${field} ${marked("address")}`}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="phone" className={label}>
              전화번호
            </label>
            <input
              id="phone"
              name="phone"
              key={`tel-${draft?.phone ?? ""}`}
              defaultValue={v("phone", business?.phone)}
              className={`${field} ${marked("phone")}`}
            />
            <label className="mt-2 flex items-start gap-2 rounded-lg bg-mist p-3 text-[12.5px]">
              <input
                type="checkbox"
                name="phonePublic"
                defaultChecked={business?.phonePublic ?? false}
                className="mt-0.5 h-4 w-4 accent-[color:var(--color-brand)]"
              />
              <span>
                <b>홈페이지에 전화번호 공개</b>
                <span className="mt-0.5 block text-[11.5px] text-muted">
                  개인 휴대폰이면 꺼두세요. 꺼도 협회는 이 번호로 연락할 수 있습니다.
                  회원이 공개에 동의한 경우에만 켜주세요.
                </span>
              </span>
            </label>
          </div>
          <div>
            <label htmlFor="hours" className={label}>
              영업시간
            </label>
            <input
              id="hours"
              name="hours"
              key={`hrs-${draft?.hours ?? ""}`}
              defaultValue={v("hours", business?.hours)}
              className={`${field} ${marked("hours")}`}
            />
          </div>
        </div>

        <div>
          <label htmlFor="tagline" className={label}>
            한 줄 소개 <span className="ml-1 font-normal text-muted">(직접 입력)</span>
          </label>
          <input
            id="tagline"
            name="tagline"
            defaultValue={business?.tagline ?? ""}
            placeholder="좋은 커피가 좋은 하루를 만듭니다."
            className={field}
          />
        </div>

        <div>
          <label htmlFor="description" className={label}>
            업장 소개
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            key={`desc-${draft?.description ?? ""}`}
            defaultValue={v("description", business?.description)}
            className={`${field} resize-y`}
          />
        </div>

        <div>
          <p className={label}>바로가기 링크</p>
          <p className="-mt-1 mb-2 text-[11.5px] text-muted">
            입력한 것만 업장 페이지에 버튼으로 나옵니다. 비워두면 나오지 않습니다.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              name="homepageUrl"
              defaultValue={v("homepageUrl", business?.homepageUrl)}
              placeholder="홈페이지 주소"
              className={field}
            />
            <input
              name="instagramUrl"
              defaultValue={business?.instagramUrl ?? ""}
              placeholder="인스타그램 주소"
              className={field}
            />
            <input
              name="blogUrl"
              defaultValue={business?.blogUrl ?? ""}
              placeholder="블로그 주소"
              className={field}
            />
            <input
              name="snsUrl"
              defaultValue={business?.snsUrl ?? ""}
              placeholder="그 밖의 SNS 주소"
              className={field}
            />
          </div>
        </div>

        <div>
          <label htmlFor="benefit" className={label}>
            원청협 회원 혜택 <span className="ml-1 font-normal text-muted">(선택)</span>
          </label>
          <input
            id="benefit"
            name="benefit"
            defaultValue={business?.benefit ?? ""}
            placeholder="예: 원청협 회원 카드 제시 시 10% 할인"
            className={field}
          />
          <p className="mt-1 text-[11.5px] text-muted">
            적어두면 업장 페이지에 눈에 띄게 표시됩니다. 비워두면 나오지 않습니다.
          </p>
        </div>

        <div>
          <label htmlFor="keywords" className={label}>
            협회 등록 키워드 <span className="ml-1 font-normal text-muted">(쉼표로 구분)</span>
          </label>
          <input
            id="keywords"
            name="keywords"
            defaultValue={business?.keywords.join(", ") ?? ""}
            placeholder="휴대폰, 개통, 요금제"
            className={field}
          />
          <p className="mt-1 text-[11.5px] text-muted">
            화면에는 안 보이지만 검색에는 걸립니다. 손님이 쓸 법한 말을 넣어주세요.
          </p>
        </div>

        <input
          type="hidden"
          name="placeKeywords"
          value={(draft?.keywords ?? business?.placeKeywords ?? []).join(", ")}
        />
        {draft?.keywords && draft.keywords.length > 0 && (
          <p className="text-[12px] text-muted">
            플레이스 대표키워드(검색에 함께 쓰임): {draft.keywords.join(", ")}
          </p>
        )}

        {draft?.menus && draft.menus.length > 0 && (
          <div className="rounded-lg bg-mist p-4">
            <p className="text-[13px] font-bold">불러온 메뉴 {draft.menus.length}개</p>
            <ul className="mt-2 space-y-1 text-[12.5px] text-ink-soft">
              {draft.menus.slice(0, 8).map((m, i) => (
                <li key={i} className="flex justify-between gap-4">
                  <span>{m.name}</span>
                  <span className="tnum">{m.price}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* 사진 */}
      <section className="rounded-xl border border-line bg-white p-5">
        <h2 className="text-[15px] font-bold">
          <span className="tnum mr-2 text-brand">03</span>
          사진
        </h2>
        <p className="mt-1 text-[12.5px] text-muted">
          여기에 올린 사진이 플레이스 사진보다 먼저 쓰입니다.
        </p>

        <ul className="mt-3 rounded-lg bg-mist p-4 text-[12px] leading-[1.7] text-ink-soft">
          <li>· 대표사진 권장 크기 <b>1200 × 900px</b> (가로형 4:3), 2MB 이하</li>
          <li>· 추가 사진 권장 크기 <b>1200 × 900px</b>, 장당 2MB 이하, 2~3장이면 충분합니다</li>
          <li>· 로고는 <b>배경이 투명한 PNG</b> 또는 정사각형 이미지가 좋습니다 (512 × 512px)</li>
          <li>· JPG · PNG · WEBP 를 지원하며, 한 장에 10MB 를 넘을 수 없습니다</li>
        </ul>

        {(draft?.photo || business?.placePhoto) && (
          <label className="mt-4 flex items-start gap-2.5 rounded-lg border border-line p-4 text-[13px]">
            <input
              type="checkbox"
              name="dropPlacePhoto"
              defaultChecked={false}
              className="mt-0.5 h-4 w-4 accent-[color:var(--color-brand)]"
            />
            <span>
              <b>플레이스 대표사진을 쓰지 않습니다.</b>
              <span className="mt-0.5 block text-[12px] text-muted">
                직접 올린 사진만 쓰고 싶을 때 켜세요. 켜고 저장하면 플레이스 사진이 지워집니다.
              </span>
            </span>
          </label>
        )}

        <div className="mt-4">
          <ImageInput
            name="coverFile"
            label="대표사진"
            hint="카드에 4:3 으로 나옵니다. 고르면 자르기 창이 뜹니다."
            currentUrl={business?.coverImage}
            folder="businesses"
          />
        </div>

        <div className="mt-4">
          <ImageInput
            name="logoFile"
            label="업장 로고 (선택)"
            hint="투명 배경 PNG 는 그대로 올립니다."
            currentUrl={business?.logoImage}
            keepTransparency
            compact
            folder="businesses"
          />
        </div>

        <ul className="mt-4 space-y-3">
          {photoSlots.map((key, i) => (
            <li key={key} className="grid gap-2 sm:grid-cols-[1fr_1.4fr_auto] sm:items-center">
              <ImageInput name="photoFiles" folder="businesses" />
              <input name="photoCaptions" placeholder={`사진 ${i + 1} 설명`} className={field} />
              <button
                type="button"
                onClick={() => setPhotoSlots((s) => s.filter((k) => k !== key))}
                className="rounded-lg border border-line px-3 py-2.5 text-[13px] font-semibold text-muted hover:border-coral hover:text-coral"
              >
                빼기
              </button>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => setPhotoSlots((s) => [...s, Date.now()])}
          className="mt-3 rounded-lg border border-line px-4 py-2.5 text-[13px] font-bold transition-colors hover:border-brand hover:text-brand"
        >
          + 사진 추가
        </button>
      </section>

      {/* 공개 설정 */}
      <section className="rounded-xl border border-line bg-white p-5">
        <h2 className="text-[15px] font-bold">
          <span className="tnum mr-2 text-brand">04</span>
          공개 설정
        </h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="status" className={label}>
              공개 상태
            </label>
            <select
              id="status"
              name="status"
              defaultValue={business?.status ?? "public"}
              className={field}
            >
              <option value="public">공개</option>
              <option value="private">비공개</option>
              <option value="draft">임시저장</option>
            </select>
          </div>

          <div>
            <label htmlFor="memberSince" className={label}>
              협회 가입일
            </label>
            <input
              id="memberSince"
              name="memberSince"
              type="date"
              defaultValue={business?.memberSince ?? ""}
              className={field}
            />
            <p className="mt-1 text-[11.5px] text-muted">
              비워두고 새로 등록하면 오늘 날짜로 잡히고, 6개월간 &quot;신입회원&quot; 배지가 붙습니다.
            </p>

            <label className="mt-2 flex items-start gap-2 rounded-lg bg-mist p-3 text-[12.5px]">
              <input
                type="checkbox"
                name="hideNewBadge"
                defaultChecked={business?.hideNewBadge ?? false}
                className="mt-0.5 h-4 w-4 accent-[color:var(--color-brand)]"
              />
              <span>
                <b>신입회원 배지 숨기기</b>
                <span className="mt-0.5 block text-[11.5px] text-muted">
                  배지를 원하지 않는 회원이면 켜세요. 가입일은 그대로 남습니다.
                </span>
              </span>
            </label>
          </div>

          <div>
            <label htmlFor="priority" className={label}>
              노출 우선순위
            </label>
            <input
              id="priority"
              name="priority"
              type="number"
              min={1}
              defaultValue={business?.priority ?? ""}
              placeholder="비우면 랜덤"
              className={field}
            />
            <p className="mt-1 text-[11.5px] text-muted">숫자가 작을수록 먼저 나옵니다.</p>
          </div>


        </div>
      </section>

      {state && (
        <p
          role="status"
          className={`rounded-lg px-4 py-3 text-[13.5px] ${
            state.ok ? "bg-brand-tint text-brand-deep" : "bg-coral-tint text-coral"
          }`}
        >
          {state.message}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand px-8 py-3.5 text-[15px] font-bold text-white transition-colors hover:bg-brand-deep disabled:bg-line-strong"
        >
          {pending ? "저장 중…" : "저장"}
        </button>
        <Link
          href="/admin/businesses"
          className="rounded-lg border border-line px-6 py-3.5 text-[15px] font-bold text-muted transition-colors hover:border-ink hover:text-ink"
        >
          취소
        </Link>
      </div>
    </form>
  );
}
