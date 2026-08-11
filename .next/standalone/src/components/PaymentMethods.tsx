"use client";

import { useTranslations } from "next-intl";

export default function PaymentMethods() {
  const th = useTranslations("Home");

  // Premium inline SVGs representing clean, responsive and high-fidelity vector card logos
  const cardLogos = [
    {
      id: "visa",
      name: "Visa",
      svg: (
        <svg viewBox="0 0 48 16" className="h-5 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19.467 15.656h2.956L24.27 1.547h-2.955L19.467 15.656zm17.904-13.75c-.689-.265-1.772-.375-3.084-.375-3.4 0-5.795 1.766-5.813 4.297-.018 1.867 1.71 2.906 3.018 3.531 1.341.64 1.795 1.055 1.79 1.633-.008.883-1.085 1.289-2.086 1.289-1.393 0-2.138-.21-3.266-.703l-.459-.211-.49 2.969c.819.367 2.33.687 3.9.703 3.61 0 5.955-1.742 5.986-4.437.025-1.477-.9-2.594-2.877-3.516-1.196-.586-1.93-1.008-1.922-1.617.008-.547.627-.11 1.2-.11 1.157 0 2.015.226 2.656.492l.317.149.387-2.61zm6.915 5.562c.316-.844.646-1.758.948-2.656.035.156.47 1.258.675 1.828l.383 1.055h-2.006zm3.176 8.188h2.719L47.8 1.547h-2.531c-.785 0-1.442.445-1.746 1.156L38.74 15.656h3.113l.621-1.672h3.805l.356 1.672zM9.544 1.547L6.697 11.23 6.386 9.69C5.83 7.82 4.195 5.82 2.32 4.844L0 3.656l.047.219c1.945.742 3.633 2.195 4.695 4.094l2.852 10.422H10.74L14.887 1.547H9.544z" fill="#1A1F71"/>
          <path d="M7.594 9.69l-.311-1.54C6.727 6.29 5.092 4.29 3.217 3.314l-.897-.47v.82c1.945.743 3.633 2.196 4.695 4.095L7.594 9.69z" fill="#F7B600"/>
        </svg>
      )
    },
    {
      id: "mastercard",
      name: "Mastercard",
      svg: (
        <svg viewBox="0 0 32 20" className="h-5 w-auto" xmlns="http://www.w3.org/2000/svg">
          <circle cx="10" cy="10" r="10" fill="#EB001B" />
          <circle cx="22" cy="10" r="10" fill="#F79E1B" fillOpacity="0.85" />
          <path d="M16 3.125a9.96 9.96 0 0 1 3.516 6.875A9.96 9.96 0 0 1 16 16.875 9.96 9.96 0 0 1 12.484 10c0-2.71 1.085-5.176 2.844-6.875h.672z" fill="#FF5F00" />
        </svg>
      )
    },
    {
      id: "troy",
      name: "Troy",
      svg: (
        <svg viewBox="0 0 54 16" className="h-5 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3.2 1.5h7.2v2.8H6.8V15H3.2V1.5z" fill="#006BB5"/>
          <path d="M12.4 1.5H19c2.3 0 4.1.6 5.1 1.7 1 1.1 1.5 2.6 1.5 4.4 0 1.9-.5 3.4-1.5 4.5-1 1.1-2.8 1.7-5.1 1.7h-6.6V1.5zm6.6 9c1.1 0 1.9-.3 2.4-.8.5-.5.8-1.3.8-2.3 0-1.1-.3-1.8-.8-2.3-.5-.5-1.3-.8-2.4-.8h-3.4v6.2h3.4z" fill="#006BB5"/>
          <path d="M38.8 1.5h3.6l-5.6 13.5h-3.6L38.8 1.5z" fill="#006BB5"/>
          <path d="M34.8 1.5h3.6L32.8 15h-3.6L34.8 1.5z" fill="#FF8200"/>
          <path d="M26.4 5.5a4 4 0 0 1 4-4 4 4 0 0 1 4 4 4 4 0 0 1-4 4 4 4 0 0 1-4-4z" fill="#FF8200"/>
          <path d="M49.4 1.5a4 4 0 0 1 4 4 4 4 0 0 1-4 4 4 4 0 0 1-4-4 4 4 0 0 1 4-4z" fill="#006BB5"/>
        </svg>
      )
    },
    {
      id: "maximum",
      name: "Maximum",
      svg: (
        <svg viewBox="0 0 64 16" className="h-4.5 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 14V2h3l2.5 5.5L9 2h3v12H9.5V6L7 11.5H5L2.5 6v8H1z" fill="#E2001A" />
          <path d="M16 14l-1-2.5h-3.5L10.5 14H8l4-12h2.5l4 12h-2.5zm-1.8-4.5L13 5.5l-1.2 4h2.4z" fill="#E2001A" />
          <path d="M18.5 2h3l2.5 4.5L26.5 2h3l-4 6.5 4 5.5h-3l-2.5-4.5-2.5 4.5h-3l4-5.5-4-6.5z" fill="#E2001A" />
          <path d="M31.5 2h2.5v12h-2.5V2z" fill="#E2001A" />
          <path d="M36 2h2.5l2.5 6 2.5-6h2.5v12h-2.2V5.5L41.5 11h-1L38.2 5.5V14H36V2z" fill="#E2001A" />
          <path d="M50 2v7.5c0 1.5.3 2.5 1 3s1.7.8 2.8.8c1.1 0 2-.3 2.7-.8.7-.5 1-1.5 1-3V2h-2.2v7.3c0 1.2-.4 1.8-1.5 1.8s-1.5-.6-1.5-1.8V2H50z" fill="#E2001A" />
          <path d="M60 2h2.5l2.5 6 2.5-6h2.5v12h-2.2V5.5L65.5 11h-1L62.2 5.5V14H60V2z" fill="#E2001A" />
        </svg>
      )
    },
    {
      id: "bonus",
      name: "Bonus",
      svg: (
        <svg viewBox="0 0 54 16" className="h-5 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1.5 14V2h4.5c1.2 0 2.2.3 2.8.8.6.5.9 1.3.9 2.2 0 .8-.3 1.4-.8 1.8.8.3 1.2.9 1.2 1.8 0 1-.3 1.8-1 2.4-.7.6-1.7.9-3.2.9H1.5zm2.8-8h2c.6 0 1-.3 1-.8s-.4-.7-1-.7h-2V6zm0 5.2h2.2c.7 0 1.1-.3 1.1-.9 0-.5-.4-.8-1.1-.8h-2.2v1.7z" fill="#4CAF50"/>
          <path d="M12.5 8c0-3.5 1.8-6.2 4.8-6.2S22 4.5 22 8s-1.7 6.2-4.7 6.2-4.8-2.7-4.8-6.2zm6.6 0c0-2.2-.8-3.7-1.8-3.7s-1.8 1.5-1.8 3.7.8 3.7 1.8 3.7 1.8-1.5 1.8-3.7z" fill="#4CAF50"/>
          <path d="M23.5 14V2.2H26l3.5 6.5V2.2h2.5V14H29.6L26.1 7.5V14h-2.6z" fill="#4CAF50"/>
          <path d="M35 11c0 1 .3 1.7.8 2.2.5.5 1.3.7 2.3.7s1.8-.2 2.3-.7c.5-.5.8-1.2.8-2.2V2h2.5v9c0 1.8-.6 3.2-1.7 4-1.1.8-2.5 1.2-4.1 1.2s-3-.4-4.1-1.2C33.1 14.2 32.5 12.8 32.5 11V2H35v9z" fill="#FFC107"/>
          <path d="M47.5 11.2c.8.6 1.8.9 3 .9 1.1 0 1.7-.3 1.7-.8 0-.4-.4-.7-1.3-.9-1.8-.4-3-.8-3.7-1.5s-1-1.5-1-2.5c0-1.4.5-2.5 1.6-3.3 1.1-.8 2.5-1.2 4.2-1.2 1.5 0 2.8.3 3.8.9l-.8 2c-.9-.5-1.9-.7-2.9-.7-.9 0-1.4.2-1.4.6 0 .3.4.6 1.2.8 1.8.4 3 .8 3.8 1.5s1.1 1.6 1.1 2.6c0 1.5-.6 2.7-1.8 3.5-1.2.8-2.8 1.2-4.6 1.2-1.7 0-3.2-.3-4.4-1l.7-2.1z" fill="#FFC107"/>
        </svg>
      )
    },
    {
      id: "world",
      name: "World",
      svg: (
        <svg viewBox="0 0 54 16" className="h-5 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 2.2h3.2l2.3 8 2.3-8H12l2.3 8 2.3-8H20l-3.5 11.8h-3L11 4.5l-2.5 9.5H5.5L1 2.2z" fill="#00A4E4"/>
          <path d="M21 8c0-3.5 1.8-6.2 4.8-6.2s4.7 2.7 4.7 6.2-1.7 6.2-4.7 6.2-4.8-2.7-4.8-6.2zm6.6 0c0-2.2-.8-3.7-1.8-3.7s-1.8 1.5-1.8 3.7.8 3.7 1.8 3.7 1.8-1.5 1.8-3.7z" fill="#00A4E4"/>
          <path d="M31.5 2.2H34v3.5c.8-1 1.8-1.5 2.8-1.5.5 0 .9.1 1.3.3l-.7 2.3c-.4-.2-.8-.3-1.1-.3-1.1 0-1.8.8-2.1 2.3V14H31.5V2.2z" fill="#00A4E4"/>
          <path d="M40 14V0.5h2.5V14H40z" fill="#E2001A"/>
          <path d="M44.5 8c0-3.5 1.8-6.2 4.5-6.2.9 0 1.7.3 2.3.9V0.5h2.5V14H51.5v-1c-.6.6-1.4.9-2.3.9-2.7 0-4.7-2.7-4.7-5.9zm6.6 0c0-2.2-.7-3.7-1.7-3.7-.9 0-1.6 1.4-1.8 3.7 0 2.2.8 3.7 1.8 3.7.9 0 1.6-1.5 1.7-3.7z" fill="#E2001A"/>
        </svg>
      )
    },
    {
      id: "axess",
      name: "Axess",
      svg: (
        <svg viewBox="0 0 54 16" className="h-5 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 14l5-12.2h3L14 14h-2.7l-1.3-3.5H5.8L4.5 14H1zm4.8-5.8h4.4L8 3.8 5.8 8.2z" fill="#000000" className="dark:fill-white"/>
          <path d="M14.5 2.2h3L20 6.5l2.5-4.3h3l-4 6.5 4 5.5h-3l-2.5-4.5-2.5 4.5h-3l4-5.5-4-6.5z" fill="#FFC107"/>
          <path d="M26.5 2.2h3L32 6.5l2.5-4.3h3l-4 6.5 4 5.5h-3l-2.5-4.5-2.5 4.5h-3l4-5.5-4-6.5z" fill="#000000" className="dark:fill-white"/>
          <path d="M38.5 8.2c.1 2.2 1.3 3.6 3.3 3.6 1.2 0 2-.4 2.6-1.2l1.6 1.5C45 13.3 43.6 14 41.8 14c-3.6 0-5.8-2.6-5.8-5.8s2.2-5.8 5.8-5.8c3.5 0 5.6 2.3 5.6 5.3v.5H38.5zm5.7-2c0-1.5-.9-2.2-2.3-2.2-1.4 0-2.3.7-2.4 2.2h4.7z" fill="#FFC107"/>
          <path d="M49 11.2c.8.6 1.7.9 2.8.9 1 0 1.6-.3 1.6-.8 0-.4-.4-.7-1.2-.9-1.7-.4-2.8-.8-3.5-1.5s-1-1.5-1-2.5c0-1.4.5-2.5 1.5-3.3C50.2 2.5 51.5 2 53 2c1.4 0 2.6.3 3.5.9l-.8 2c-.8-.5-1.8-.7-2.7-.7-.8 0-1.3.2-1.3.6 0 .3.4.6 1.1.8 1.7.4 2.8.8 3.5 1.5s1 1.6 1 2.6c0 1.5-.6 2.7-1.7 3.5-1.1.8-2.6 1.2-4.3 1.2-1.6 0-3-.3-4.1-1l.7-2.1z" fill="#000000" className="dark:fill-white"/>
        </svg>
      )
    }
  ];

  return (
    <div className="w-full py-8 border-t border-slate-200/50 dark:border-zinc-850/60 bg-slate-50/50 dark:bg-zinc-950/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
        {/* Subtle, elegant title */}
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 dark:text-zinc-500 mb-5 text-center">
          {th("footer_secure_payment") || "Güvenli Alışveriş ve Ödeme Seçenekleri"}
        </p>

        {/* Logo container: Flex on desktop (centered), Responsive Grid on mobile */}
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-5 w-full max-w-4xl px-4">
          {cardLogos.map((logo) => (
            <div
              key={logo.id}
              className="grayscale opacity-70 hover:grayscale-0 hover:opacity-100 hover:scale-105 hover:brightness-125 dark:hover:brightness-150 transition-all duration-300 ease-out flex items-center justify-center select-none cursor-pointer"
              title={logo.name}
            >
              {logo.svg}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
