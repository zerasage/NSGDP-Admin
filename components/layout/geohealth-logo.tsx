import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/constants/brand";

interface GeoHealthLogoProps {
  className?: string;
  compact?: boolean;
}

export function GeoHealthLogo({ className, compact }: GeoHealthLogoProps) {
  return (
    <Link
      href="/"
      className={cn("flex items-center gap-2.5 hover:opacity-90 transition-opacity", className)}
      aria-label={BRAND.portalName}
    >
      {/* MOH logo — left */}
      <Image
        src="/images/moh-logo.png"
        alt="Niger State Ministry of Health"
        width={38}
        height={38}
        className="size-[38px] rounded-full object-cover border border-teal/60 shadow-sm"
        priority
      />

      {/* Subtle divider */}
      <span className="h-7 w-px bg-border/60" aria-hidden />

      {/* NSPHCDA logo — right of MOH */}
      <Image
        src={BRAND.logoPath}
        alt={BRAND.logoAlt}
        width={38}
        height={38}
        className="size-[38px] rounded-full object-cover border-2 border-teal shadow-sm"
        priority
      />

      {!compact && (
        <div className="hidden sm:block leading-tight ml-1">
          <div className="text-sm font-bold text-foreground">{BRAND.portalName}</div>
          <div className="text-[10px] font-semibold tracking-widest text-teal uppercase">
            {BRAND.portalTagline}
          </div>
        </div>
      )}
    </Link>
  );
}
