/**
 * 상단 메뉴는 이 5개로 고정한다 (기획안 2조). 영어 메뉴명은 쓰지 않는다.
 *
 * "지원사업"을 한때 여섯 번째로 뒀다가 내렸다. 원주 행사와 소상공인 교육을
 * 자동으로 끌어오는 일이 생각만큼 되지 않아서, 메뉴에 자리를 내줄 만큼
 * 채워지지 않았다. 화면(/support)과 수집 기능은 그대로 두었으니,
 * 공고가 제대로 쌓이면 이 줄만 되살리면 된다.
 */
export const NAV = [
  { href: "/", label: "메인홈" },
  { href: "/about", label: "협회소개" },
  { href: "/business", label: "회원업장" },
  { href: "/activities", label: "협회활동" },
  { href: "/contact", label: "협회문의" },
] as const;
