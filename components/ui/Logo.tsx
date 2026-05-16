import Image from "next/image";

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
}

import Link from "next/link";

export function Logo({ className = "", width = 160, height = 80 }: LogoProps) {
  return (
    <Link href="/">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/SageBySwansons_Logo.png"
        alt="Sage by Swansons Nursery"
        width={width}
        height={height}
        className={className}
      />
    </Link>
  );
}
