"use client";
import { usePathname } from "next/navigation";

const NO_TOP_PADDING = [
  "/",
  "/ask",
  "/plants",
  "/signin",
  "/unauthorized",
  "/terms",
  "/onboarding",
];
const NO_MAX_WIDTH = ["/admin"];

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const needsPadding = !NO_TOP_PADDING.includes(pathname);
  const needsMaxWidth = !NO_MAX_WIDTH.some((route) =>
    pathname.startsWith(route),
  );

  return (
    <div
      className={
        needsMaxWidth
          ? "max-w-lg mx-auto min-h-screen bg-swansons-cream relative"
          : "min-h-screen bg-swansons-cream relative"
      }
    >
      <div className={needsPadding ? "pt-14" : ""}>{children}</div>
    </div>
  );
}
