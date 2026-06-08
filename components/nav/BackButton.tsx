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

const BACK_DESTINATIONS: { prefix: string; destination: string }[] = [
  { prefix: "/ask/", destination: "/ask" },
  { prefix: "/plant/", destination: "/spaces" },
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

  const handleClick = () => {
    const destination = BACK_DESTINATIONS.find((d) =>
      pathname.startsWith(d.prefix),
    );
    if (destination) {
      router.replace(destination.destination);
    } else {
      router.back();
    }
  };

  return (
    <button
      aria-label="Back"
      onClick={handleClick}
      className="fixed top-5 left-4 z-40 p-2 cursor-pointer bg-white/70 backdrop-blur-sm rounded-lg"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 33 24.9"
        width="24"
        height="24"
        fill="currentColor"
      >
        <polygon points="12.7 24.5 14 23.1 4.3 13.4 32.7 13.4 32.7 11.5 4.3 11.5 14 1.8 12.7 .5 .7 12.5 12.7 24.5" />
      </svg>
    </button>
  );
}
