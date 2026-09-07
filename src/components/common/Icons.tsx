/**
 * 시안에 쓰인 아이콘 모음.
 * 데이터에 아이콘 이름(문자열)만 저장하고 여기서 그림을 고른다.
 * 모르는 이름이 들어와도 기본 아이콘이 나와서 화면이 비지 않는다.
 */

type IconProps = { className?: string };

const S = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export function CalendarIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden {...S}>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}

export function UsersIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden {...S}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" />
      <path d="M16 5.5a3 3 0 0 1 0 5.6M17.5 19.8c0-2.6-1-4.4-2.6-5.4" />
    </svg>
  );
}

export function StoreIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden {...S}>
      <path d="M4 9.5V20h16V9.5" />
      <path d="M3 5h18l1 4.2a3 3 0 0 1-5.9.8 3 3 0 0 1-5.9 0 3 3 0 0 1-5.9-.8L3 5Z" />
      <path d="M10 20v-5h4v5" />
    </svg>
  );
}

export function MegaphoneIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden {...S}>
      <path d="M4 10v4a2 2 0 0 0 2 2h1l9 4V4L7 8H6a2 2 0 0 0-2 2Z" />
      <path d="M19 9.5a3 3 0 0 1 0 5" />
    </svg>
  );
}

export function ChartIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden {...S}>
      <path d="M5 20V12M12 20V6M19 20v-5" />
    </svg>
  );
}

export function ChatIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden {...S}>
      <path d="M20 12c0 3.9-3.6 7-8 7-.9 0-1.8-.1-2.6-.4L4 20l1.5-3.4A6.6 6.6 0 0 1 4 12c0-3.9 3.6-7 8-7s8 3.1 8 7Z" />
    </svg>
  );
}

export function HeartIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden {...S}>
      <path d="M12 20s-7-4.4-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.6-7 9-7 9Z" />
    </svg>
  );
}

export function PhoneIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden {...S}>
      <path d="M6 3h3l1.5 4-2 1.5a12 12 0 0 0 6 6L16 12l4 1.5v3a2 2 0 0 1-2.2 2A16 16 0 0 1 4 5.2 2 2 0 0 1 6 3Z" />
    </svg>
  );
}

export function MailIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden {...S}>
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="M4 7.5 12 13l8-5.5" />
    </svg>
  );
}

export function PinIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden {...S}>
      <path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.6" />
    </svg>
  );
}

export function ClockIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden {...S}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 1.8" />
    </svg>
  );
}

export function BusIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden {...S}>
      <rect x="4" y="4" width="16" height="13" rx="3" />
      <path d="M4 11h16M7 20v-2M17 20v-2" />
      <circle cx="8" cy="14.5" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="16" cy="14.5" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function CarIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden {...S}>
      <path d="M4 16v-3l2-5h12l2 5v3" />
      <path d="M3 16h18v3h-3v-1H6v1H3v-3Z" />
      <path d="M7 12.5h2M15 12.5h2" />
    </svg>
  );
}

export function CameraIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden {...S}>
      <rect x="3" y="7" width="18" height="13" rx="3" />
      <path d="M9 7l1.2-2.2h3.6L15 7" />
      <circle cx="12" cy="13.5" r="3.2" />
    </svg>
  );
}

export function LinkIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden {...S}>
      <path d="M10 13.8a4 4 0 0 0 5.7 0l2.6-2.6a4 4 0 1 0-5.7-5.7l-1.3 1.3" />
      <path d="M14 10.2a4 4 0 0 0-5.7 0l-2.6 2.6a4 4 0 1 0 5.7 5.7l1.3-1.3" />
    </svg>
  );
}

export function CheckUserIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden {...S}>
      <circle cx="10" cy="8" r="3.2" />
      <path d="M4 20c0-3.3 2.7-5.5 6-5.5 1 0 2 .2 2.8.6" />
      <path d="m15 17 2 2 4-4" />
    </svg>
  );
}

export function FormIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden {...S}>
      <rect x="4" y="3" width="16" height="18" rx="3" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </svg>
  );
}

const REGISTRY: Record<string, (p: IconProps) => React.ReactElement> = {
  calendar: CalendarIcon,
  users: UsersIcon,
  store: StoreIcon,
  megaphone: MegaphoneIcon,
  chart: ChartIcon,
  chat: ChatIcon,
  heart: HeartIcon,
  phone: PhoneIcon,
  mail: MailIcon,
  pin: PinIcon,
  clock: ClockIcon,
  bus: BusIcon,
  car: CarIcon,
  camera: CameraIcon,
  link: LinkIcon,
  "check-user": CheckUserIcon,
  form: FormIcon,
};

/** 데이터에 담긴 아이콘 이름으로 그림을 고른다. */
export function Icon({ name, className = "" }: { name: string; className?: string }) {
  const Component = REGISTRY[name] ?? StoreIcon;
  return <Component className={className} />;
}
