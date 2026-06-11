/* eslint-disable @next/next/no-img-element */
"use client";
import { usePathname } from "next/navigation";

const NO_TOP_PADDING = [
  "/",
  "/dashboard",
  "/ask",
  "/signin",
  "/unauthorized",
  "/terms",
  "/onboarding",
  "/admin",
  "/settings",
];
const NO_MAX_WIDTH = ["/admin"];

const PAGE_IMAGES: Record<string, string> = {
  "/dashboard": "/images/BG_HomeDashboard.png",
  "/spaces": "/images/BG_YourSpaces.png",
  "/ask": "/images/BG_Rubeckia_LowerRight.png",
  "/scan": "/images/BG_Rubeckia_LowerRight.png",
  "/onboarding": "/images/BG_LowerFlowerStem.png",
  "/signin": "/images/BG_SignIn.png",
  "/settings": "/images/FullWidthTest.png",
};

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
  const isLanding = pathname === "/";
  const bgImage =
    PAGE_IMAGES[pathname] ||
    (pathname.startsWith("/plant/")
      ? "/images/BG_PlantProfile.png"
      : "/images/FullWidthTest.png");

  return (
    <div
      className={
        needsMaxWidth
          ? "max-w-lg mx-auto min-h-screen bg-swansons-cream relative"
          : "min-h-screen bg-swansons-cream relative"
      }
    >
      {!isAdmin && !isLanding && (
        <div
          className="fixed top-0 w-full max-w-lg pointer-events-none select-none overflow-hidden"
          style={{ left: "max(0px, calc(50vw - 256px))" }}
        >
          <img src={bgImage} alt="" className="w-full h-auto" />
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
