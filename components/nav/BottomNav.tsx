"use client";
import { useAuth, AuthContext } from "@/lib/firebase/AuthContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/auth";
import { useState, useContext } from "react";
import { updateUserDisplayName } from "@/lib/firebase/users";

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
    { label: "Debug", icon: "🐞", href: "/debug" },
  ],
};

function getNavItems(role: string | null) {
  if (role === "admin") return NAV_ITEMS.admin;
  if (role === "staff") return NAV_ITEMS.staff;
  return NAV_ITEMS.customer;
}

export default function BottomNav() {
  const { user, role } = useAuth();
  const authCtx = useContext(AuthContext);
  const pathname = usePathname();
  const [showAccount, setShowAccount] = useState(false);
  // --- Display Name Edit State ---
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user?.displayName || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Detect Google user
  const isGoogleUser = user?.providerData?.some(
    (p: { providerId: string }) => p.providerId === "google.com",
  );

  // Hide on /signin, /unauthorized, /terms, /onboarding
  if (
    pathname === "/signin" ||
    pathname === "/unauthorized" ||
    pathname === "/terms" ||
    pathname === "/onboarding"
  )
    return null;

  const items = getNavItems(role);

  // Handle save
  const handleSaveName = async () => {
    if (!user || !nameInput.trim()) return;
    setSaving(true);
    setMessage(null);
    try {
      await updateUserDisplayName(user.uid, nameInput.trim());
      // Patch AuthContext user state immediately
      if (authCtx && typeof authCtx.setUser === "function") {
        authCtx.setUser({ ...user, displayName: nameInput.trim() });
      }
      setEditingName(false);
      setMessage({ type: "success", text: "Name updated!" });
    } catch {
      setMessage({ type: "error", text: "Failed to update name." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Account Popup */}
      {showAccount && (
        <div className="fixed bottom-16 right-4 z-50 bg-white rounded-xl shadow-lg border border-gray-200 p-4 min-w-50">
          {/* Name row */}
          <div className="flex items-center mb-1">
            {editingName ? (
              <>
                <input
                  className="text-sm font-medium text-gray-800 border border-gray-200 rounded px-2 py-1 w-full focus:outline-none focus:ring-2 focus:ring-green-600"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  disabled={saving}
                  maxLength={40}
                  autoFocus
                />
                <button
                  className="ml-2 text-green-600 text-xs font-semibold px-2 py-1 rounded hover:bg-green-50 disabled:opacity-50"
                  onClick={handleSaveName}
                  disabled={saving || !nameInput.trim()}
                >
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  className="ml-1 text-gray-400 text-xs font-semibold px-2 py-1 rounded hover:bg-gray-100"
                  onClick={() => {
                    setEditingName(false);
                    setNameInput(user?.displayName || "");
                    setMessage(null);
                  }}
                  disabled={saving}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-gray-800">
                  {user?.displayName}
                </p>
                {/* Edit icon for non-Google users */}
                {!isGoogleUser && (
                  <button
                    className="ml-2 text-gray-400 hover:text-green-600 text-base"
                    title="Edit name"
                    onClick={() => {
                      setEditingName(true);
                      setNameInput(user?.displayName || "");
                      setMessage(null);
                    }}
                  >
                    <span role="img" aria-label="Edit">
                      ✏️
                    </span>
                  </button>
                )}
              </>
            )}
          </div>
          {/* Success/Error message */}
          {message && (
            <div
              className={`text-xs mb-2 ${message.type === "success" ? "text-green-600" : "text-red-500"}`}
            >
              {message.text}
            </div>
          )}
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
