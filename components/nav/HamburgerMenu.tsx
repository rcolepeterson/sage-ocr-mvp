"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/auth";
import { useAuth } from "@/lib/firebase/AuthContext";

// Routes where the hamburger should not appear
const HIDDEN_ROUTES = ["/signin", "/unauthorized", "/terms", "/onboarding"];

export default function HamburgerMenu() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
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

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  // Hide on public routes or when not logged in
  if (!user || HIDDEN_ROUTES.includes(pathname)) return null;

  return (
    <>
      {/* Hamburger button — fixed top-right */}
      <button
        className="fixed top-5 right-4 z-50 flex flex-col gap-1.5 p-2"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((v) => !v)}
      >
        <span
          className={`block w-6 h-0.5 bg-swansons-navy rounded transition-all duration-300 origin-center ${open ? "rotate-45 translate-y-2" : ""}`}
        />
        <span
          className={`block w-6 h-0.5 bg-swansons-navy rounded transition-all duration-300 ${open ? "opacity-0 scale-x-0" : ""}`}
        />
        <span
          className={`block h-0.5 bg-swansons-navy rounded transition-all duration-300 origin-center ${open ? "w-6 -rotate-45 -translate-y-2" : "w-4"}`}
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
        <div className="flex items-center justify-between px-6 pt-8 pb-6 border-b border-gray-100">
          <span className="font-heading text-2xl text-swansons-navy">sage</span>
          <button
            onClick={() => setOpen(false)}
            className="p-1 text-swansons-muted hover:text-swansons-navy transition-colors"
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

        <nav className="flex flex-col px-6 py-6 gap-1 flex-1">
          {[
            { label: "My Plants", href: "/plants" },
            { label: "Scan a Plant", href: "/scan" },
            { label: "Ask an Expert", href: "/ask" },
            { label: "Account", href: "#" },
          ].map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              onClick={() => setOpen(false)}
              className="font-body text-base text-swansons-navy py-3 border-b border-gray-100 hover:text-swansons-green transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="px-6 pb-10">
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
