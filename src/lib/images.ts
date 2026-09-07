import type { Business, Member, OrgMember } from "@/lib/types";

/**
 * 업장 대표사진 우선순위.
 *
 *   1. 회원(또는 관리자)이 올린 대표사진
 *   2. 회원이 올린 사진 중 첫 장
 *   3. 네이버 플레이스에서 가져온 대표사진
 *   4. 없음 → 화면에서 자리표시 무늬가 나온다
 *
 * 회원이 올린 사진과 플레이스 사진을 다른 칼럼에 두었기 때문에,
 * 나중에 회원이 자기 사진을 올리는 순간 자동으로 그쪽이 앞선다.
 */
export function resolveBusinessCover(business: {
  coverImage: Business["coverImage"];
  photos?: Business["photos"];
  placePhoto?: Business["placePhoto"];
}): { url: string | null; source: "member" | "place" | null } {
  if (business.coverImage) return { url: business.coverImage, source: "member" };

  const firstPhoto = business.photos
    ?.slice()
    .sort((a, b) => a.order - b.order)
    .find((p) => p.url);
  if (firstPhoto?.url) return { url: firstPhoto.url, source: "member" };

  if (business.placePhoto) return { url: business.placePhoto, source: "place" };

  return { url: null, source: null };
}

/**
 * 임원 사진 우선순위.
 *   1. 조직도에 등록된 사진
 *   2. 회원 본인이 올린 프로필 사진
 */
export function resolveOrgPhoto(
  org: Pick<OrgMember, "photo" | "memberId">,
  members: Pick<Member, "id" | "profileImage">[],
): string | null {
  if (org.photo) return org.photo;
  if (!org.memberId) return null;
  return members.find((m) => m.id === org.memberId)?.profileImage ?? null;
}
