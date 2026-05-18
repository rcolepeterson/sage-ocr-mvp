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
  { src: "/images/TestPlants1.png" },
  { src: "/images/TestPlants2.png" },
  { src: "/images/TestPlants3.png" },
  { src: "/images/TestPlants4.png" },
  { src: "/images/TestPlants5.png" },
  { src: "/images/TestPlants6.png" },
  { src: "/images/TestPlants7.png" },
];

const PAGE_PLANTS = {
  "/": { src: "/images/TestPlants1.png" },
  "/plants": { src: "/images/TestPlants2.png" },
  "/ask": { src: "/images/TestPlants3.png" },
  "/scan": { src: "/images/TestPlants4.png" },
  "/onboarding": { src: "/images/TestPlants2.png" },
  "/signin": { src: "/images/TestPlants6.png" },
};

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
  //const plant = PLANTS[plantIndex];

  const plant =
    PAGE_PLANTS[pathname as keyof typeof PAGE_PLANTS] ??
    PLANTS[
      Math.abs(
        pathname.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0),
      ) % PLANTS.length
    ];

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
          className="fixed top-0 w-full pointer-events-none select-none"
          style={{ left: "max(0px, calc(50vw - 256px))" }}
        >
          {/* <img src={plant.src} alt="" className="w-full h-auto" /> */}
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
