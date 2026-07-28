"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

import Image from "next/image";

interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageHeroProps {
  badge?: React.ReactNode;
  title: string;
  titleHighlight?: string; // the part to color amber
  subtitle?: string;
  breadcrumbs?: Breadcrumb[];
  children?: React.ReactNode; // extra CTA buttons etc.
  backgroundImage?: string; // optional background image
}

export default function PageHero({
  badge,
  title,
  titleHighlight,
  subtitle,
  breadcrumbs,
  children,
  backgroundImage,
}: PageHeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-zinc-800/60 min-h-[45vh] sm:min-h-[50vh] flex flex-col justify-center">
      {/* Background */}
      {backgroundImage ? (
        <div className="absolute inset-0 z-0">
          <Image 
            src={backgroundImage} 
            alt={title} 
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-75 dark:opacity-55 transition-opacity duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/50 to-zinc-950/20 z-1" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-zinc-950/80 z-2" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-[#0B0F17]" />
      )}

      {/* Ambient glow */}
      {!backgroundImage && (
        <div
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 25% 60%, #b4530920 0%, transparent 55%), radial-gradient(circle at 80% 20%, #92400e18 0%, transparent 50%)",
          }}
        />
      )}

      {/* Honeycomb pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100' viewBox='0 0 56 100'%3E%3Cpath d='M28 66L0 50V16L28 0l28 16v34L28 66zm0-18L8 36V20L28 4l20 16v16L28 48z' fill='%23f59e0b'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">

        {/* Breadcrumb */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 mb-6">
            <Link href="/" className="flex items-center gap-1 hover:text-amber-500 transition-colors">
              <Home className="w-3 h-3" />
              Ana Sayfa
            </Link>
            {breadcrumbs.map((crumb, i) => (
              <React.Fragment key={i}>
                <ChevronRight className="w-3 h-3 text-zinc-700" />
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-amber-500 transition-colors">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-amber-500">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}

        {/* Badge */}
        {badge && (
          <div className="mb-5">
            <span className="inline-flex items-center gap-2 bg-zinc-950/65 backdrop-blur-md border border-amber-500/30 text-amber-300 rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] shadow-lg shadow-black/40">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
              </span>
              <span className="leading-none">{badge}</span>
            </span>
          </div>
        )}

        {/* Title */}
        <h1 className="text-3xl md:text-5xl xl:text-6xl font-black text-white leading-tight tracking-tight mb-5">
          {titleHighlight ? (
            <>
              {title}{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">
                {titleHighlight}
              </span>
            </>
          ) : (
            title
          )}
        </h1>

        {/* Subtitle */}
        {subtitle && (
          <p className="text-zinc-400 text-base md:text-lg font-medium leading-relaxed max-w-2xl">
            {subtitle}
          </p>
        )}

        {/* Extra children (CTA buttons etc.) */}
        {children && <div className="mt-8 flex flex-wrap gap-4">{children}</div>}
      </div>
    </section>
  );
}
