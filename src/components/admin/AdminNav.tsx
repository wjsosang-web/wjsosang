"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/admin", label: "관리자 홈", exact: true },
  { href: "/admin/hero", label: "메인 배너" },
  { href: "/admin/posts?type=notice", label: "공지사항", match: "/admin/posts" },
  { href: "/admin/businesses", label: "회원업장" },
  { href: "/admin/org", label: "조직도" },
  { href: "/admin/popups", label: "팝업관리" },
  { href: "/admin/feeds", label: "지원사업 소식" },
  { href: "/admin/members", label: "회원관리" },
  { href: "/admin/inquiries", label: "문의관리" },
  { href: "/admin/site", label: "협회 정보" },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="관리자 메뉴" className="hidden w-[180px] shrink-0 lg:block">
      <ul className="sticky top-6 space-y-1">
        {ITEMS.map((item) => {
          const base = item.match ?? item.href.split("?")[0];
          const active = item.exact ? pathname === base : pathname.startsWith(base);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`block rounded-lg px-4 py-2.5 text-[14px] font-semibold transition-colors ${
                  active ? "bg-brand text-white" : "text-ink-soft hover:bg-white"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
