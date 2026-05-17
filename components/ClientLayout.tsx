"use client";
import { usePathname } from "next/navigation";

const NO_TOP_PADDING = [
  "/",
  "/ask",
  "/signin",
  "/unauthorized",
  "/terms",
  "/onboarding",
];

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const needsPadding = !NO_TOP_PADDING.includes(pathname);
  return <div className={needsPadding ? "pt-14" : ""}>{children}</div>;
}
