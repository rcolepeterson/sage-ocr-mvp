"use client";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/firebase/AuthContext";

const HIDE_ON = ["/", "/signin", "/unauthorized", "/terms", "/onboarding"];

export default function BackButton() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user || HIDE_ON.includes(pathname)) return null;

  return (
    <button
      aria-label="Back"
      onClick={() => router.back()}
      className="fixed top-5 left-4 z-40 bg-white/80 hover:bg-white text-swansons-navy rounded-full p-2 shadow transition-all border border-gray-100"
      style={{ boxShadow: "0 2px 8px 0 rgba(20,31,98,0.06)" }}
    >
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path
          d="M19 7l-7 7 7 7"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
