import Image from "next/image";

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export function Logo({ className = "", width = 160, height = 80 }: LogoProps) {
  return (
    <Image
      src="/images/SageBySwansons_Logo.png"
      alt="Sage by Swansons Nursery"
      width={width}
      height={height}
      className={className}
      priority
    />
  );
}
