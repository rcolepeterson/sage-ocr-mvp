/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { useState, useEffect, useRef, useContext } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/auth";
import { useAuth, AuthContext } from "@/lib/firebase/AuthContext";
import { updateUserDisplayName } from "@/lib/firebase/users";
import EditIcon from "@/components/ui/EditIcon";

const HIDDEN_ROUTES = ["/signin", "/unauthorized", "/terms", "/onboarding"];

const NAV_ITEMS = {
  customer: [
    { label: "Home", href: "/" },
    { label: "Spaces", href: "/spaces" },
    { label: "Add a Plant", href: "/scan" },
    { label: "Ask an Expert", href: "/ask" },
  ],
  staff: [
    { label: "Home", href: "/" },
    { label: "Spaces", href: "/spaces" },
    { label: "Scan a Plant", href: "/scan" },
    { label: "Inbox", href: "/admin/inbox" },
  ],
  admin: [
    { label: "Home", href: "/" },
    { label: "Spaces", href: "/spaces" },
    { label: "Scan a Plant", href: "/scan" },
    { label: "Inbox", href: "/admin/inbox" },
    { label: "Dashboard", href: "/admin/dashboard" },
    { label: "Debug", href: "/debug" },
  ],
};

function getNavItems(role: string | null) {
  if (role === "admin") return NAV_ITEMS.admin;
  if (role === "staff") return NAV_ITEMS.staff;
  return NAV_ITEMS.customer;
}

export default function HamburgerMenu() {
  const { user, role } = useAuth();
  const authCtx = useContext(AuthContext);
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  /* name editing */
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user?.displayName || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const isGoogleUser = user?.providerData?.some(
    (p: { providerId: string }) => p.providerId === "google.com",
  );

  /* close on outside click */
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  /* close on Escape */
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  const handleSaveName = async () => {
    if (!user || !nameInput.trim()) return;
    setSaving(true);
    setMessage(null);
    try {
      await updateUserDisplayName(user.uid, nameInput.trim());
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

  if (!user || HIDDEN_ROUTES.includes(pathname)) return null;

  const navItems = getNavItems(role);

  return (
    <>
      {/* Hamburger button */}
      <button
        className="fixed top-5 right-4 z-50 flex flex-col gap-1.5 p-2 bg-white/70 backdrop-blur-sm rounded-lg"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((v) => !v)}
      >
        <span
          className={`block w-6 h-1 bg-swansons-navy rounded transition-all duration-300 origin-center ${open ? "rotate-45 translate-y-2" : ""}`}
        />
        <span
          className={`block w-6 h-1 bg-swansons-navy rounded transition-all duration-300 ${open ? "opacity-0 scale-x-0" : ""}`}
        />
        <span
          className={`block h-1 bg-swansons-navy rounded transition-all duration-300 origin-center ${open ? "w-6 -rotate-45 -translate-y-2" : "w-4"}`}
        />
      </button>

      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        aria-hidden="true"
        onClick={() => setOpen(false)}
      />

      {/* Slide-out panel */}
      <div
        ref={menuRef}
        className={`fixed top-0 right-0 z-50 h-full w-72 bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-8 pb-6 border-b border-gray-100">
          <Logo width={100} height={50} />
          <button
            onClick={() => setOpen(false)}
            className="p-1 text-swansons-muted hover:text-swansons-navy transition-colors -mt-15"
            aria-label="Close menu"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M4 4l12 12M16 4L4 16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Account section */}
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3 mb-1">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt="avatar"
                className="w-10 h-10 rounded-full shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-swansons-green-muted flex items-center justify-center shrink-0">
                <span className="text-swansons-navy text-lg">👤</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              {editingName ? (
                <div className="flex items-center gap-1">
                  <input
                    className="text-sm font-body border border-gray-200 rounded px-2 py-1 w-full focus:outline-none focus:ring-2 focus:ring-swansons-green"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    disabled={saving}
                    maxLength={40}
                    autoFocus
                  />
                  <button
                    className="text-swansons-green text-xs font-body font-semibold px-2 py-1 rounded hover:bg-swansons-green-muted disabled:opacity-50"
                    onClick={handleSaveName}
                    disabled={saving || !nameInput.trim()}
                  >
                    {saving ? "..." : "Save"}
                  </button>
                  <button
                    className="text-swansons-muted text-xs font-body px-1 py-1 rounded hover:bg-gray-100"
                    onClick={() => {
                      setEditingName(false);
                      setNameInput(user?.displayName || "");
                      setMessage(null);
                    }}
                    disabled={saving}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <p className="font-body font-medium text-swansons-navy text-sm truncate">
                    {user?.displayName}
                  </p>
                  {!isGoogleUser && (
                    <button
                      className="text-swansons-muted hover:text-swansons-green text-xs"
                      onClick={() => {
                        setEditingName(true);
                        setNameInput(user?.displayName || "");
                        setMessage(null);
                      }}
                    >
                      <EditIcon width={16} height={16} />
                    </button>
                  )}
                </div>
              )}
              <p className="font-body text-xs text-swansons-muted truncate">
                {user?.email}
              </p>
            </div>
          </div>
          {message && (
            <p
              className={`text-xs font-body mt-1 ${message.type === "success" ? "text-swansons-green" : "text-red-500"}`}
            >
              {message.text}
            </p>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex flex-col px-6 py-4 gap-1 flex-1 overflow-y-auto">
          {navItems.map(({ label, href }) => {
            const isActive =
              pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={label}
                href={href}
                onClick={() => setOpen(false)}
                className={`font-body text-base py-3 border-b border-gray-100 transition-colors ${
                  isActive
                    ? "text-swansons-green font-semibold"
                    : "text-swansons-navy hover:text-swansons-green"
                }`}
              >
                {label}
              </Link>
            );
          })}
          <Link
            href="/?onboarding=preview"
            onClick={() => setOpen(false)}
            className="font-body text-base py-3 border-b border-gray-100 transition-colors text-swansons-navy hover:text-swansons-green"
          >
            App Tour
          </Link>
        </nav>

        {/* Sign out */}
        <div className="px-6 pb-10 pt-4">
          <button
            onClick={() => signOut(auth)}
            className="w-full text-sm font-body text-swansons-muted underline underline-offset-2 hover:text-swansons-navy transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
}
