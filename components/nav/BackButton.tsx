"use client";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/firebase/AuthContext";

const HIDE_ON = [
  "/",
  "/dashboard",
  "/signin",
  "/unauthorized",
  "/terms",
  "/onboarding",
  "/admin",
  "/settings",
];

export default function BackButton() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const isDarkBg = pathname.startsWith("/ask/");

  // Also hide on exact /ask (thread list) but NOT on /ask/[threadId]
  if (
    !user ||
    HIDE_ON.some(
      (path) => pathname === path || pathname.startsWith(path + "/"),
    ) ||
    pathname === "/ask"
  )
    return null;

  return (
    <button
      aria-label="Back"
      onClick={() => router.back()}
      className={`fixed top-4 left-2 z-40 p-2 cursor-pointer ${
        isDarkBg ? "text-white" : "text-swansons-navy"
      }`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 33 24.9"
        width="28"
        height="28"
        fill="currentColor"
      >
        <polygon points="12.7 24.5 14 23.1 4.3 13.4 32.7 13.4 32.7 11.5 4.3 11.5 14 1.8 12.7 .5 .7 12.5 12.7 24.5" />
      </svg>
    </button>
  );
}
