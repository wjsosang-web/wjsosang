/**
 * 상단 메뉴. 영어 메뉴명은 쓰지 않는다 (기획안 2조).
 *
 * 기획안은 다섯 개였는데 "지원사업 소식"을 하나 더했다.
 * 회원이 지원금 공고를 찾으러 들어오는 화면인데, 메뉴에 없으면
 * 있는 줄도 모른다. 가입 이유가 되는 화면이라 맨 앞줄에 둔다.
 */
export const NAV = [
  { href: "/", label: "메인홈" },
  { href: "/about", label: "협회소개" },
  { href: "/business", label: "회원업장" },
  { href: "/activities", label: "협회활동" },
  { href: "/support", label: "지원사업" },
  { href: "/contact", label: "협회문의" },
] as const;
