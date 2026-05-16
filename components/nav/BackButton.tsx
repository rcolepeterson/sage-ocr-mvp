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
      className="fixed top-4 left-4 z-40 text-swansons-navy p-2"
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
