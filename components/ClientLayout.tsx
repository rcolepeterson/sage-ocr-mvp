/* eslint-disable @next/next/no-img-element */
"use client";
import { usePathname } from "next/navigation";

const NO_TOP_PADDING = [
  "/",
  "/ask",
  "/signin",
  "/unauthorized",
  "/terms",
  "/onboarding",
  "/admin",
];
const NO_MAX_WIDTH = ["/admin"];

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const needsPadding = !NO_TOP_PADDING.some(
    (path) => pathname === path || pathname.startsWith(path + "/"),
  );
  const needsMaxWidth = !NO_MAX_WIDTH.some((route) =>
    pathname.startsWith(route),
  );
  const isAdmin = pathname.startsWith("/admin");

  return (
    <div
      className={
        needsMaxWidth
          ? "max-w-lg mx-auto min-h-screen bg-swansons-cream relative"
          : "min-h-screen bg-swansons-cream relative"
      }
    >
      {!isAdmin && (
        <div
          className="fixed top-0 w-full max-w-lg pointer-events-none select-none overflow-hidden"
          style={{ left: "max(0px, calc(50vw - 256px))" }}
        >
          <img
            src="/images/FullWidthTest.png"
            alt=""
            className="w-full h-auto"
          />
        </div>
      )}
      <div
        style={{ position: "relative", zIndex: 1 }}
        className={needsPadding ? "pt-14" : ""}
      >
        {children}
      </div>
    </div>
  );
}
