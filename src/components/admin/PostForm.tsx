"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import ImageInput from "@/components/admin/ImageInput";
import { deletePostPhoto, savePost, type ActionResult } from "@/lib/admin/actions";
import type { Post, PostType } from "@/lib/types";

const TYPE_LABEL: Record<PostType, string> = {
  notice: "공지사항",
  activity: "활동소식",
  event: "행사",
};

const NOTICE_CATEGORIES = ["공지", "모임", "행사안내", "지원사업", "회원안내", "기타"];
const ACTIVITY_CATEGORIES = ["교류", "네트워킹", "지역사회", "교육"];

/** 사진 한 장 = 파일 + 설명 (기획안 29조) */
interface PhotoSlot {
  key: number;
  caption: string;
}

export default function PostForm({ type, post }: { type: PostType; post?: Post }) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(savePost, null);
  const [slots, setSlots] = useState<PhotoSlot[]>([]);

  const field =
    "w-full rounded-lg border border-line bg-white px-4 py-2.5 text-[14px] outline-none transition-colors focus:border-brand";
  const label = "mb-1.5 block text-[13px] font-bold";

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="type" value={type} />
      {post && <input type="hidden" name="id" value={post.id} />}
      {post && <input type="hidden" name="slug" value={post.slug} />}
      {post?.coverImage && <input type="hidden" name="coverImage" value={post.coverImage} />}

      <div className="flex items-center justify-between gap-4">
        <h1 className="text-[22px] font-bold tracking-[-0.02em]">
          {TYPE_LABEL[type]} {post ? "수정" : "쓰기"}
        </h1>
        <Link
          href={`/admin/posts?type=${type}`}
          className="text-[13.5px] font-semibold text-muted hover:text-brand"
        >
          목록으로
        </Link>
      </div>

      <section className="space-y-4 rounded-xl border border-line bg-white p-5">
        <div>
          <label htmlFor="title" className={label}>
            제목 <span className="text-brand">*</span>
          </label>
          <input id="title" name="title" required defaultValue={post?.title} className={field} />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="date" className={label}>
              {type === "event" ? "행사일" : "날짜"} <span className="text-brand">*</span>
            </label>
            <input
              id="date"
              name="date"
              type="date"
              required
              defaultValue={post?.date ?? new Date().toISOString().slice(0, 10)}
              className={field}
            />
          </div>

          {type === "event" && (
            <>
              <label className="flex items-start gap-2 self-end pb-3 text-[13px] sm:col-span-3">
                <input
                  type="checkbox"
                  name="dateTbd"
                  defaultChecked={post?.dateTbd}
                  className="mt-0.5 h-4 w-4 accent-[color:var(--color-brand)]"
                />
                <span>
                  <b>날짜 미정</b>
                  <span className="mt-0.5 block text-[12px] text-muted">
                    켜면 달력에 날짜가 찍히지 않고 &quot;○월 중&quot;으로만 안내됩니다.
                    임원진 회의로 확정되면 끄고 날짜·시간·장소를 채우세요.
                    (미정일 때도 위 날짜는 해당 월로 맞춰 주세요)
                  </span>
                </span>
              </label>

              <div>
                <label htmlFor="endDate" className={label}>
                  종료일 (여러 날이면)
                </label>
                <input
                  id="endDate"
                  name="endDate"
                  type="date"
                  defaultValue={post?.endDate ?? ""}
                  className={field}
                />
              </div>
              <div>
                <label htmlFor="time" className={label}>
                  시각
                </label>
                <input
                  id="time"
                  name="time"
                  placeholder="18:00"
                  defaultValue={post?.time ?? ""}
                  className={field}
                />
              </div>
            </>
          )}

          {type === "notice" && (
            <div>
              <label htmlFor="category" className={label}>
                분류
              </label>
              <select
                id="category"
                name="category"
                defaultValue={post?.category ?? "공지"}
                className={field}
              >
                {NOTICE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}

          {type === "activity" && (
            <>
              <div>
                <label htmlFor="activityCategory" className={label}>
                  분류
                </label>
                <select
                  id="activityCategory"
                  name="activityCategory"
                  defaultValue={post?.category ?? "교류"}
                  className={field}
                >
                  {ACTIVITY_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="participants" className={label}>
                  참여자 수
                </label>
                <input
                  id="participants"
                  name="participants"
                  type="number"
                  min={0}
                  defaultValue={post?.participants ?? ""}
                  className={field}
                />
              </div>
            </>
          )}
        </div>

        {type !== "notice" && (
          <div>
            <label htmlFor="place" className={label}>
              장소
            </label>
            <input
              id="place"
              name="place"
              defaultValue={post?.place ?? ""}
              placeholder="원주시 ○○"
              className={field}
            />
          </div>
        )}

        <div>
          <label htmlFor="summary" className={label}>
            한 줄 요약
          </label>
          <textarea
            id="summary"
            name="summary"
            rows={2}
            defaultValue={post?.summary}
            placeholder="목록과 카드에 보이는 짧은 소개입니다."
            className={`${field} resize-y`}
          />
        </div>

        <div>
          <label htmlFor="body" className={label}>
            본문
          </label>
          <textarea
            id="body"
            name="body"
            rows={8}
            defaultValue={post?.body}
            className={`${field} resize-y`}
          />
        </div>
      </section>

      {/* 대표사진 */}
      <section className="rounded-xl border border-line bg-white p-5">
        <h2 className="text-[15px] font-bold">대표사진</h2>
        <p className="mt-1 text-[12.5px] text-muted">목록 카드와 상세 상단에 크게 보입니다.</p>

        <div className="mt-3">
          <ImageInput
            name="coverFile"
            hint="목록 카드와 글 위쪽에 크게 나옵니다."
            currentUrl={post?.coverImage}
            aspect={16 / 10}
            folder="posts"
          />
        </div>
      </section>

      {/* 활동사진 — 사진마다 설명 */}
      {type !== "notice" && (
        <section className="rounded-xl border border-line bg-white p-5">
          <h2 className="text-[15px] font-bold">활동사진</h2>
          <p className="mt-1 text-[12.5px] text-muted">
            사진마다 설명을 붙일 수 있습니다. 몇 년 뒤 활동기록의 가치가 달라집니다.
          </p>

          {post && post.photos.length > 0 && (
            <ul className="mt-4 grid gap-3 sm:grid-cols-3">
              {post.photos.map((photo) => (
                <li key={photo.id} className="rounded-lg border border-line p-2">
                  {photo.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photo.url} alt="" className="aspect-[4/3] w-full rounded object-cover" />
                  ) : (
                    <div aria-hidden className="ph aspect-[4/3] w-full rounded" />
                  )}
                  <p className="mt-1.5 line-clamp-2 text-[12px] text-muted">{photo.caption}</p>
                  <button
                    type="button"
                    onClick={async () => {
                      const fd = new FormData();
                      fd.set("photoId", photo.id);
                      await deletePostPhoto(fd);
                      location.reload();
                    }}
                    className="mt-2 w-full rounded border border-line py-1.5 text-[12px] font-semibold text-coral hover:border-coral"
                  >
                    삭제
                  </button>
                </li>
              ))}
            </ul>
          )}

          <ul className="mt-4 space-y-3">
            {slots.map((slot, i) => (
              <li key={slot.key} className="grid gap-2 sm:grid-cols-[1fr_1.4fr_auto] sm:items-center">
                <ImageInput name="photoFiles" folder="posts" aspect={4 / 3} />
                <input
                  name="photoCaptions"
                  placeholder={`사진 ${i + 1} 설명 (예: 개회식 모습)`}
                  className={field}
                />
                <button
                  type="button"
                  onClick={() => setSlots((s) => s.filter((x) => x.key !== slot.key))}
                  className="rounded-lg border border-line px-3 py-2.5 text-[13px] font-semibold text-muted hover:border-coral hover:text-coral"
                >
                  빼기
                </button>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => setSlots((s) => [...s, { key: Date.now(), caption: "" }])}
            className="mt-3 rounded-lg border border-line px-4 py-2.5 text-[13px] font-bold text-ink transition-colors hover:border-brand hover:text-brand"
          >
            + 사진 추가
          </button>
        </section>
      )}

      {/* 공개 설정 */}
      <section className="rounded-xl border border-line bg-white p-5">
        <h2 className="text-[15px] font-bold">공개 설정</h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="status" className={label}>
              공개 상태
            </label>
            <select id="status" name="status" defaultValue={post?.status ?? "public"} className={field}>
              <option value="public">공개</option>
              <option value="private">비공개</option>
              <option value="draft">임시저장</option>
            </select>
          </div>

          {/* 상단 고정은 글 종류와 상관없이 쓸 수 있다.
              공지든 활동이든 행사든, 지금 가장 알리고 싶은 것을 올려두는 자리다. */}
          <label className="flex items-start gap-2 self-end pb-3 text-[13.5px] sm:col-span-2">
            <input
              type="checkbox"
              name="pinned"
              defaultChecked={post?.pinned}
              className="mt-0.5 h-4 w-4 accent-[color:var(--color-brand)]"
            />
            <span>
              협회활동 화면 «주요활동» 자리에 띄우기
              <span className="mt-0.5 block text-[11.5px] font-normal text-muted">
                공지사항 옆 큰 카드에 이 글이 나옵니다. 여러 개를 고르면 가장 최근 글이
                나오고, 아무것도 고르지 않으면 최근 활동소식이 나옵니다.
              </span>
            </span>
          </label>

          {type === "notice" && (
            <>
              <label className="flex items-center gap-2 self-end pb-3 text-[13.5px]">
                <input
                  type="checkbox"
                  name="important"
                  defaultChecked={post?.important}
                  className="h-4 w-4 accent-[color:var(--color-brand)]"
                />
                중요 공지
              </label>
            </>
          )}
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
          href={`/admin/posts?type=${type}`}
          className="rounded-lg border border-line px-6 py-3.5 text-[15px] font-bold text-muted transition-colors hover:border-ink hover:text-ink"
        >
          취소
        </Link>
      </div>
    </form>
  );
}
