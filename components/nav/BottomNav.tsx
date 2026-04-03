"use client";
import { useAuth } from "@/lib/firebase/AuthContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/auth";
import { useState } from "react";

const NAV_ITEMS = {
  customer: [
    { label: "Plants", icon: "🌱", href: "/plants" },
    { label: "Scan", icon: "🔍", href: "/scan" },
    { label: "Ask", icon: "💬", href: "/ask" },
  ],
  staff: [
    { label: "Plants", icon: "🌱", href: "/plants" },
    { label: "Scan", icon: "🔍", href: "/scan" },
    { label: "Inbox", icon: "📥", href: "/admin/inbox" },
  ],
  admin: [
    { label: "Plants", icon: "🌱", href: "/plants" },
    { label: "Scan", icon: "🔍", href: "/scan" },
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
  const [showAccount, setShowAccount] = useState(false);

  // Hide on /signin, /unauthorized, /terms, /onboarding
  if (
    pathname === "/signin" ||
    pathname === "/unauthorized" ||
    pathname === "/terms" ||
    pathname === "/onboarding"
  )
    return null;

  const items = getNavItems(role);

  return (
    <>
      {/* Account Popup */}
      {showAccount && (
        <div className="fixed bottom-16 right-4 z-50 bg-white rounded-xl shadow-lg border border-gray-200 p-4 min-w-[200px]">
          <p className="text-sm font-medium text-gray-800 mb-1">
            {user?.displayName}
          </p>
          <p className="text-xs text-gray-400 mb-4">{user?.email}</p>
          <button
            onClick={() => signOut(auth)}
            className="w-full text-sm text-red-500 hover:text-red-700 text-left transition"
          >
            Sign Out
          </button>
        </div>
      )}

      {/* Overlay to close popup */}
      {showAccount && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowAccount(false)}
        />
      )}

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-sm flex justify-around py-1">
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

        {/* Account Button */}
        <button
          onClick={() => setShowAccount(!showAccount)}
          className="flex flex-col items-center flex-1 py-2"
        >
          <span className="text-2xl mb-0.5">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt="avatar"
                className="w-7 h-7 rounded-full"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              "👤"
            )}
          </span>
          <span className="text-xs font-medium tracking-wide text-gray-500">
            {user?.displayName?.split(" ")[0] || "Account"}
          </span>
        </button>
      </nav>
    </>
  );
}
