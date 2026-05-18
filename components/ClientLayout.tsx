/* eslint-disable @next/next/no-img-element */
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

const PLANTS = [
  { src: "/images/TestPlants1.png", side: "left" },
  { src: "/images/TestPlants2.png", side: "right" },
  { src: "/images/TestPlants3.png", side: "left" },
  { src: "/images/TestPlants4.png", side: "left" },
  { src: "/images/TestPlants5.png", side: "left" },
  { src: "/images/TestPlants6.png", side: "left" },
  { src: "/images/TestPlants7.png", side: "left" },
];

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
  const isAdmin = pathname.startsWith("/admin");
  const plantIndex =
    Math.abs(pathname.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)) %
    PLANTS.length;
  const plant = PLANTS[plantIndex];

  return (
    <div
      className={
        needsMaxWidth
          ? "max-w-lg mx-auto min-h-screen bg-swansons-cream relative"
          : "min-h-screen bg-swansons-cream relative"
      }
      style={
        !isAdmin
          ? {
              backgroundImage: `url(${plant.src})`,
              backgroundRepeat: "no-repeat",
              backgroundAttachment: "fixed",
              backgroundPosition:
                plant.side === "right" ? "bottom right" : "bottom left",
              backgroundSize: "160px",
            }
          : undefined
      }
    >
      <div className={needsPadding ? "pt-14" : ""}>{children}</div>
    </div>
  );
}
