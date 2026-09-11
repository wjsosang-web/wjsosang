/**
 * 소상공인이 자주 쓰는 공공 서비스 바로가기.
 *
 * 회원들이 "그거 어디서 신청하더라" 하고 매번 검색하는 곳들이다.
 * 협회 홈페이지에서 한 번에 닿게 두면, 회원은 즐겨찾기를 하나만 해두면 된다.
 *
 * 주소는 실제로 열리는지 확인한 것만 넣는다. 죽은 링크가 하나 있으면
 * 나머지도 못 믿게 된다. 확인하지 못한 곳은 넣지 않았다.
 *
 * 로고는 public/logo/<logoKey>.(svg|png|…) 에 파일을 넣으면 자동으로 나온다.
 * 없으면 기관 이름이 글자로 나온다. (dev 서버의 /dev/logo 화면에서 올릴 수 있다)
 */

export interface ServiceLink {
  name: string;
  /** 좁은 자리에 쓰는 짧은 이름 */
  short: string;
  href: string;
  logoKey: string;
  /** 무엇을 하는 곳인지 한 줄 */
  hint: string;
  /** PC 화면 양옆 띠에도 띄울지 */
  rail?: boolean;
}

export const SERVICE_LINKS: ServiceLink[] = [
  {
    name: "소상공인 정책자금",
    short: "정책자금",
    href: "https://ols.semas.or.kr",
    logoKey: "svc-policy-fund",
    hint: "융자 신청·심사",
    rail: true,
  },
  {
    name: "소상공인 365",
    short: "소상공인365",
    href: "https://bigdata.sbiz.or.kr",
    logoKey: "svc-sbiz365",
    hint: "상권분석·매출통계",
    rail: true,
  },
  {
    name: "소상공인 지식배움터",
    short: "지식배움터",
    href: "https://edu.sbiz.or.kr",
    logoKey: "svc-edu",
    hint: "무료 온라인 교육",
    rail: true,
  },
  {
    name: "소상공인 24",
    short: "소상공인24",
    href: "https://www.sbiz24.kr",
    logoKey: "svc-sbiz24",
    hint: "지원사업 통합신청",
    rail: true,
  },
  {
    name: "희망리턴패키지",
    short: "희망리턴",
    href: "https://hope.or.kr",
    logoKey: "svc-hope",
    hint: "재기·재취업 지원",
  },
  {
    name: "소상공인시장진흥공단",
    short: "소진공",
    href: "https://www.semas.or.kr",
    logoKey: "svc-semas",
    hint: "기관 홈페이지",
  },
  {
    name: "중소벤처기업부",
    short: "중기부",
    href: "https://www.mss.go.kr",
    logoKey: "svc-mss",
    hint: "정책·보도자료",
  },
  {
    name: "K-Startup 창업지원",
    short: "K-Startup",
    href: "https://www.k-startup.go.kr",
    logoKey: "svc-kstartup",
    hint: "창업지원사업 공고",
  },
];

export const RAIL_LINKS = SERVICE_LINKS.filter((s) => s.rail);
