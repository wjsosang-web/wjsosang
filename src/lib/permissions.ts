import type { Role } from "@/lib/types";

/**
 * 권한 — 운영자 / 임원진 / 협회원 세 가지.
 *
 * 한 곳에 모아 둔 이유: 화면마다 "이 사람 뭐 할 수 있지?"를 따로 판단하면
 * 나중에 임기가 바뀌어 권한을 손볼 때 빠뜨리는 곳이 생긴다.
 *
 *   운영자(admin)   협회 홈페이지 전체. 회원 승인과 권한 변경까지
 *   임원진(officer) 협회 운영에 필요한 글·행사·업장·문의. 회원 승인도 한다
 *                   (인사국이 여기 들어간다). 권한 변경과 협회 정보는 못 건드린다
 *   협회원(member)  회원 전용 자료를 보고, 자기 업장 정보를 고친다
 *
 * superadmin 은 운영자와 같되 계정을 지우거나 만드는 마지막 권한을 갖는다.
 */

export const ROLE_LABEL: Record<Role, string> = {
  superadmin: "최고운영자",
  admin: "운영자",
  officer: "임원진",
  member: "협회원",
};

/** 관리자 화면에서 할 수 있는 일들 */
export type Permission =
  | "admin.access" //        관리자 화면에 들어갈 수 있다
  | "posts.manage" //        공지·활동·행사 쓰기
  | "businesses.manage" //   회원업장 등록·수정
  | "org.manage" //          조직도
  | "popups.manage" //       팝업
  | "hero.manage" //         메인 배너
  | "inquiries.manage" //    문의 확인
  | "members.approve" //     가입 승인·거절
  | "members.role" //        권한 바꾸기
  | "site.manage"; //        협회 정보·회원 전용 자료

const OFFICER: Permission[] = [
  "admin.access",
  "posts.manage",
  "businesses.manage",
  "org.manage",
  "popups.manage",
  "hero.manage",
  "inquiries.manage",
  "members.approve",
];

const ADMIN: Permission[] = [...OFFICER, "members.role", "site.manage"];

const BY_ROLE: Record<Role, Permission[]> = {
  superadmin: ADMIN,
  admin: ADMIN,
  officer: OFFICER,
  member: [],
};

export function can(role: Role | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return BY_ROLE[role]?.includes(permission) ?? false;
}

/** 관리자 화면 자체에 들어올 수 있는 역할인지 */
export function canEnterAdmin(role: Role | null | undefined): boolean {
  return can(role, "admin.access");
}
