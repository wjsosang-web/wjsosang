/**
 * 원주청년소상공인협회 도메인 타입
 *
 * 설계 원칙 (기획안 23~26조)
 *  - 회원(Member)과 업장(Business)은 별개의 엔티티다. 절대 한 테이블에 합치지 않는다.
 *  - 소유관계는 MemberBusiness 라는 별도 관계로 관리한다.
 *    → 회원 1명이 여러 업장을 가질 수 있고, 한 업장에 공동대표가 여럿일 수도 있다.
 *  - 지금은 관리자만 로그인하지만, 권한(Role)과 승인(Approval) 구조는 처음부터 넣어둔다.
 */

/* ------------------------------------------------------------------ */
/* 권한                                                                */
/* ------------------------------------------------------------------ */

/** 계정 권한. 지금은 admin 이상만 로그인하지만 member 는 미리 정의해 둔다. */
export type Role = "superadmin" | "admin" | "officer" | "member";

/** 관리자 페이지의 기능 단위 권한. Role 별로 매핑해서 사용한다. */
export type Permission =
  | "members.manage"
  | "businesses.manage"
  | "businesses.manage.own"
  | "org.manage"
  | "posts.manage"
  | "inquiries.manage"
  | "site.manage"
  | "admins.manage";

/* ------------------------------------------------------------------ */
/* 회원                                                                */
/* ------------------------------------------------------------------ */

export type MemberStatus = "pending" | "active" | "paused" | "withdrawn";

/** 소셜 간편가입 제공자 */
export type AuthProvider = "kakao" | "naver" | "email";

/** 개인정보 동의 이력 — 가입 시점 기준으로 스냅샷을 남긴다. */
export interface Consent {
  /** 동의 항목 코드 (terms / privacy / marketing / thirdParty ...) */
  code: string;
  label: string;
  required: boolean;
  agreed: boolean;
  /** 동의한 약관 버전 — 약관이 바뀌면 재동의를 받기 위해 필요 */
  version: string;
  agreedAt: string | null;
}

export interface Member {
  id: string;
  name: string;
  /** 로그인 계정이 연결되기 전에도 회원 데이터는 존재할 수 있다(관리자 대리등록). */
  accountId: string | null;
  authProvider: AuthProvider | null;
  role: Role;
  status: MemberStatus;
  phone: string | null;
  email: string | null;
  joinedAt: string | null;
  /** 회원 본인이 올리는 프로필 사진. 임원 카드에서 사진이 없으면 이 값을 쓴다. */
  profileImage: string | null;
  consents: Consent[];
}

/* ------------------------------------------------------------------ */
/* 회원 ↔ 업장 관계                                                     */
/* ------------------------------------------------------------------ */

export type OwnershipType = "owner" | "co-owner" | "manager";

export interface MemberBusiness {
  id: string;
  memberId: string;
  businessId: string;
  ownership: OwnershipType;
  /** 이 회원이 해당 업장 정보를 직접 수정할 수 있는지 (2단계 회원 로그인용) */
  canEdit: boolean;
}

/* ------------------------------------------------------------------ */
/* 업장                                                                */
/* ------------------------------------------------------------------ */

export type BusinessCategory =
  | "외식"
  | "카페·디저트"
  | "미용·뷰티"
  | "자동차"
  | "휴대폰·통신"
  | "건설·인테리어"
  | "금융·보험"
  | "세무·법무"
  | "제조"
  | "교육"
  | "유통"
  | "생활서비스"
  | "전문서비스"
  | "기타";

export const BUSINESS_CATEGORIES: BusinessCategory[] = [
  "외식",
  "카페·디저트",
  "미용·뷰티",
  "자동차",
  "휴대폰·통신",
  "건설·인테리어",
  "금융·보험",
  "세무·법무",
  "제조",
  "교육",
  "유통",
  "생활서비스",
  "전문서비스",
  "기타",
];

export type PublishStatus = "public" | "private" | "draft";

export interface BusinessPhoto {
  id: string;
  url: string | null;
  /** 사진별 설명 (기획안 29조) */
  caption: string;
  order: number;
}

/** 회원이 직접 작성하는 홍보 영역. 2단계에서 회원이 수정하는 핵심 블록. */
export interface PromoBlock {
  id: string;
  type: "text" | "image";
  text?: string;
  imageUrl?: string | null;
  caption?: string;
  order: number;
}

/** 값의 출처. 자동채움과 사람이 고친 값을 구분한다. */
export type FieldSource = "place" | "manual";

export interface MenuItem {
  id: string;
  name: string;
  /** "12,000원", "시가" 처럼 표기가 제각각이라 문자열로 둔다. */
  price: string | null;
  description: string | null;
  imageUrl: string | null;
  source: FieldSource;
  order: number;
}

export interface Business {
  id: string;
  /** URL 슬러그 — /business/pickphone */
  slug: string;
  name: string;
  category: BusinessCategory;
  /** 한 줄 소개 (카드에 노출) */
  tagline: string;
  /** 상세 소개 */
  description: string;

  /** 표기용 대표자명. 실제 소유관계는 MemberBusiness 로 관리한다. */
  ownerName: string;

  address: string;
  /** 원주시 읍·면·동 — 지역 필터 기준 */
  district: string;
  lat: number | null;
  lng: number | null;

  phone: string | null;
  hours: string | null;
  placeUrl: string | null;
  homepageUrl: string | null;
  /** 인스타그램 / 블로그 / 그 밖의 SNS. 값이 없으면 화면에 나오지 않는다. */
  instagramUrl: string | null;
  blogUrl: string | null;
  snsUrl: string | null;
  /** 업장 로고 (대표사진과 별개) */
  logoImage: string | null;
  /** 원청협 회원에게 주는 혜택. 비어 있으면 표시하지 않는다. */
  benefit: string | null;
  /** 연락처를 홈페이지에 보여줄지. 개인 휴대폰이라 기본은 숨김. */
  phonePublic: boolean;
  /** 협회 가입일. 6개월 이내면 신입회원으로 표시한다. */
  memberSince: string | null;
  /** 신입회원 배지를 숨길지. 켜면 가입 6개월 이내라도 배지가 안 나온다. */
  hideNewBadge: boolean;

  /**
   * 회원 또는 관리자가 직접 올린 대표사진.
   * 이 값이 비어 있으면 photos[0] → placePhoto 순으로 대체된다.
   * 플레이스에서 가져온 사진과 절대 같은 칼럼에 넣지 않는다.
   * 그래야 나중에 회원이 자기 사진을 올렸을 때 자동으로 그쪽이 우선된다.
   */
  coverImage: string | null;
  photos: BusinessPhoto[];
  promo: PromoBlock[];

  /* --- 네이버 플레이스에서 자동으로 채워지는 값들 --- */

  placeId: string | null;
  /** 플레이스 업종 경로 (restaurant / hairshop / place ...) */
  placeType: string | null;
  /** 플레이스 대표사진. coverImage 가 없을 때만 화면에 쓴다. */
  placePhoto: string | null;
  /** 플레이스 대표키워드. 검색에는 쓰지만 화면에 나열하지 않는다. */
  placeKeywords: string[];
  /** 메뉴 — 플레이스에서 가져오거나 관리자가 직접 입력 */
  menus: MenuItem[];
  placeSyncedAt: string | null;
  /** 어떤 항목이 자동으로 들어왔고 어떤 항목을 사람이 고쳤는지 */
  fieldSources: Partial<Record<string, FieldSource>>;

  /**
   * 겉으로 드러내지 않는 추가 검색어.
   * 취급 품목, 옛 상호, 관리자가 붙이는 키워드 등이 들어간다.
   */
  keywords: string[];

  /** 메인 노출 우선순위. 숫자가 작을수록 먼저. null 이면 랜덤 그룹. */
  priority: number | null;
  /** 이달의 추천 회원업장으로 올릴지 */
  featured: boolean;
  status: PublishStatus;

  /** 자동채움 출처 추적 — 플레이스에서 가져온 값인지 관리자가 고쳤는지 */
  sourcedFromPlace: boolean;
  createdAt: string;
  updatedAt: string;
}

/* ------------------------------------------------------------------ */
/* 조직                                                                */
/* ------------------------------------------------------------------ */

/**
 * 사진 칸이 "이미 있는 사진을 지워 달라"고 알릴 때 쓰는 값.
 *
 * 빈 값은 "새로 고른 것이 없다(그대로 두라)"는 뜻이라서,
 * 지우기를 빈 값으로 표현할 수 없어 따로 둔다.
 */
export const REMOVE_IMAGE = "__remove__";

export type OrgGroup = "회장단" | "이사회·감사" | "임원진" | "역대 회장";

/** 분류가 나오는 기본 순서. 관리자에서 바꾸면 그 순서를 따른다. */
export const ORG_GROUPS: OrgGroup[] = ["회장단", "이사회·감사", "임원진", "역대 회장"];

export interface OrgMember {
  id: string;
  /** 회원 테이블과 연결. 조직도는 회원 데이터를 참조할 뿐 복제하지 않는다. */
  memberId: string | null;
  name: string;
  group: OrgGroup;
  /** 협회 직책 — 회장 / 부회장 / 사무국장 / 이사 ... */
  title: string;
  /** 겸직 표시. 예: 이사이면서 감사이면 title=이사, subTitle=감사 */
  subTitle: string | null;
  /** 소속국 — 사무국 / 재무국 / 관리국 / 인사국 / 홍보국 / 기획국 */
  department: string | null;
  photo: string | null;
  intro: string;
  /** 자문위원용 — 전문분야 / 자격 */
  expertise: string | null;
  /** 연결된 업장 (있으면 업장 페이지로 링크) */
  businessId: string | null;
  order: number;
}

/* ------------------------------------------------------------------ */
/* 게시물 (공지사항 / 활동소식 / 행사) — 하나의 구조로 통합             */
/* ------------------------------------------------------------------ */

export type PostType = "notice" | "activity" | "event";

export type NoticeCategory =
  | "공지"
  | "모임"
  | "행사안내"
  | "지원사업"
  | "회원안내"
  | "기타";

export interface PostPhoto {
  id: string;
  url: string | null;
  /** 사진 한 장마다 붙는 설명 (기획안 29조) */
  caption: string;
  order: number;
}

export interface Post {
  id: string;
  type: PostType;
  slug: string;
  title: string;
  /** 공지사항 분류. activity/event 는 null. */
  category: NoticeCategory | null;
  /** 게시일 */
  date: string;
  /** 행사 시작/종료 — event 타입에서 사용 */
  startDate: string | null;
  endDate: string | null;
  /** 날짜 미정. 켜져 있으면 "○월 중"으로 표시한다. */
  dateTbd: boolean;
  /** 행사 시작 시각 ("18:00") */
  time: string | null;
  place: string | null;
  /** 활동 참여 인원 — 활동소식 상세에 표시 */
  participants: number | null;
  summary: string;
  body: string;
  coverImage: string | null;
  /** 활동소식과 갤러리를 분리하지 않는다. 사진은 게시글에 딸린다. */
  photos: PostPhoto[];
  pinned: boolean;
  important: boolean;
  status: PublishStatus;
}

/* ------------------------------------------------------------------ */
/* 사이트 설정                                                          */
/* ------------------------------------------------------------------ */

/** 숫자로 보는 원청협 — 코드에 고정하지 않고 관리자가 수정 (기획안 6조) */
export interface StatItem {
  id: string;
  value: string;
  label: string;
  description: string;
  /** 아이콘 키 — calendar / users / store / megaphone */
  icon: string;
  order: number;
}

/** 메인 히어로 슬라이드. 장수와 문구를 관리자가 정한다. */
export interface HeroSlide {
  id: string;
  eyebrow: string;
  /** 줄바꿈(
)을 그대로 살려서 보여준다. */
  title: string;
  /** 제목에서 초록으로 강조할 단어들 */
  highlight: string[];
  description: string;
  /** 우측 손글씨 포인트 문구 */
  note: string;
  thumbTitle: string;
  thumbDescription: string;
  image: string | null;
  /** 슬라이드마다 다른 버튼. 비우면 기본 버튼이 나온다. */
  links: HeroLink[];
  order: number;
}

export interface HeroLink {
  label: string;
  href: string;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
}

export interface PresidentMessage {
  quote: string;
  note: string;
  plaque: string;
  body: string;
}

export interface PopupNotice {
  id: string;
  title: string;
  body: string;
  imageUrl: string | null;
  linkUrl: string | null;
  linkLabel: string | null;
  startAt: string;
  endAt: string;
  status: PublishStatus;
}

export interface SiteInfo {
  name: string;
  shortName: string;
  foundedYear: number;
  phone: string;
  /** 전화를 받는 사람. 예: "이종현 사무국장". 비어 있으면 표시하지 않는다. */
  phoneOwner: string;
  email: string;
  address: string;
  /** 주소 아래 한 줄 (예: "원주청년소상공인협회 사무국") */
  addressDetail: string;
  officeHours: string;
  transport: string;
  parking: string;
  mapUrl: string;
  instagramUrl: string;
  youtubeUrl: string;
  /** 푸터 우측 문구 */
  tagline: string;
  slogan: string;
}

/* ------------------------------------------------------------------ */
/* 협회소개 콘텐츠                                                      */
/* ------------------------------------------------------------------ */

export interface AssociationStory {
  heading: string;
  lead: string;
  note: string;
  paragraphs: string[];
}

export interface ProgramItem {
  id: string;
  title: string;
  description: string;
  /** 아이콘 키 — users / chart / chat / heart / megaphone */
  icon: string;
}

export interface HistoryItem {
  id: string;
  year: string;
  title: string;
  text: string;
  /** 아직 오지 않은 계획이면 true — 타임라인에서 다르게 표시한다 */
  upcoming?: boolean;
}

/** 함께하는 기관. 로고 파일은 public 아래 경로를 그대로 적는다. */
export interface PartnerOrg {
  id: string;
  name: string;
  logo: string | null;
  note: string;
  url: string | null;
}

/* ------------------------------------------------------------------ */
/* 네이버 플레이스 자동채움                                             */
/* ------------------------------------------------------------------ */

/** 플레이스에서 가져온 값 하나. 어디서 왔는지 함께 들고 다닌다. */
export interface SourcedValue<T> {
  value: T;
  /** 'local-api' = 네이버 공식 지역검색 API, 'place-page' = 플레이스 페이지 */
  from: "local-api" | "place-page";
}

/** 플레이스에서 긁어온 원자료를 업장 필드 형태로 정리한 것 */
export interface PlaceDraft {
  placeId: string | null;
  placeType: string | null;
  placeUrl: string | null;
  name: string | null;
  category: string | null;
  address: string | null;
  /** 지번주소. 도로명주소에는 '동'이 없는 경우가 많아 지역 추출에 이 값을 쓴다. */
  jibunAddress: string | null;
  district: string | null;
  phone: string | null;
  hours: string | null;
  lat: number | null;
  lng: number | null;
  photo: string | null;
  keywords: string[];
  menus: Array<{ name: string; price: string | null; description: string | null; imageUrl: string | null }>;
  description: string | null;
  homepageUrl: string | null;
  instagramUrl: string | null;
  blogUrl: string | null;
  /** 그 밖의 SNS (유튜브·페이스북·카페 등) 중 첫 번째 */
  snsUrl: string | null;
}

export interface PlaceImportResult {
  /** ok = 다 가져옴, partial = 일부만, failed = 아무것도 못 가져옴 */
  result: "ok" | "partial" | "failed";
  draft: PlaceDraft;
  /** 실제로 값이 채워진 항목 */
  filled: string[];
  /** 비어 있어서 관리자가 직접 넣어야 하는 항목 */
  missing: string[];
  /** 사람이 읽을 수 있는 경고 (예: 메뉴를 못 가져왔습니다) */
  warnings: string[];
  resolvedUrl: string | null;
  error: string | null;
}
