"use client";
import { useAuth } from "@/lib/firebase/AuthContext";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = {
  customer: [
    { label: "Plants", icon: "🌱", href: "/plants" },
    { label: "Scan", icon: "🔍", href: "/scan" },
    { label: "Ask", icon: "💬", href: "/ask" },
  ],
  staff: [
    { label: "Plants", icon: "🌱", href: "/plants" },
    { label: "Scan", icon: "🔍", href: "/scan" },
    { label: "Ask", icon: "💬", href: "/ask" },
    { label: "Inbox", icon: "📥", href: "/admin/inbox" },
  ],
  admin: [
    { label: "Plants", icon: "🌱", href: "/plants" },
    { label: "Scan", icon: "🔍", href: "/scan" },
    { label: "Ask", icon: "💬", href: "/ask" },
    { label: "Inbox", icon: "📥", href: "/admin/inbox" },
  ],
};

function getNavItems(role: string | null) {
  if (role === "admin") return NAV_ITEMS.admin;
  if (role === "staff") return NAV_ITEMS.staff;
  return NAV_ITEMS.customer;
}

export default function BottomNav() {
  const { user, role } = useAuth();
  const pathname = usePathname();

  // Hide on /signin and /unauthorized
  if (pathname === "/signin" || pathname === "/unauthorized") return null;

  const items = getNavItems(role);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-sm flex justify-around py-1 ">
      {items.map((item) => {
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center flex-1 py-2"
            aria-current={isActive ? "page" : undefined}
          >
            <span
              className={`text-2xl mb-0.5 ${
                isActive ? "text-green-600" : "text-gray-400"
              }`}
            >
              {item.icon}
            </span>
            <span
              className={`text-xs font-medium tracking-wide ${
                isActive ? "text-green-600" : "text-gray-500"
              }`}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
