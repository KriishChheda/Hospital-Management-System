"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import logoDark from "@/assets/logo-header-dark.png";

interface BizlumeLogoProps {
  subtitle?: string;
  className?: string;
  href?: string;
}

export default function BizlumeLogo({
  subtitle,
  className = "",
  href = "/",
}: BizlumeLogoProps) {
  return (
    <div className={`pb-3 border-b border-white/10 ${className}`}>
      <Link href={href} className="block">
        <Image
          src={logoDark}
          alt="BizLume"
          priority
          className="h-8 w-auto object-contain"
        />
      </Link>
      {subtitle && (
        <span className="text-[10px] font-bold tracking-widest text-cyan uppercase block mt-2 pl-0.5">
          {subtitle}
        </span>
      )}
    </div>
  );
}
