"use client";

import React from "react";

export default function HomeTicker() {
  return (
    <div className="w-full bg-neutral-950 text-neutral-100 py-4 overflow-hidden whitespace-nowrap relative border-y border-neutral-900 shadow-md">
      <style>{`
        @keyframes ticker {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-50%, 0, 0);
          }
        }
        .ticker-container {
          display: inline-flex;
          animation: ticker 40s linear infinite;
        }
        .ticker-span {
          display: inline-block;
          padding: 0 3rem;
          font-size: 0.85rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          color: #F3F4F6;
          text-shadow: 0 1px 2px rgba(0,0,0,0.2);
        }
        .ticker-dot {
          color: #b45309; /* Marka Kırmızısı */
          margin: 0 1rem;
        }
      `}</style>
      <div className="ticker-container flex">
        <div className="ticker-span">
          Arı Körüğü <span className="ticker-dot">•</span> Arıcı Elbisesi <span className="ticker-dot">•</span> Kovan Bakım Seti <span className="ticker-dot">•</span> Yerli İmalat <span className="ticker-dot">•</span> Hızlı Kargo <span className="ticker-dot">•</span> Atak Arıcılık
        </div>
        <div className="ticker-span">
          Arı Körüğü <span className="ticker-dot">•</span> Arıcı Elbisesi <span className="ticker-dot">•</span> Kovan Bakım Seti <span className="ticker-dot">•</span> Yerli İmalat <span className="ticker-dot">•</span> Hızlı Kargo <span className="ticker-dot">•</span> Atak Arıcılık
        </div>
        <div className="ticker-span">
          Arı Körüğü <span className="ticker-dot">•</span> Arıcı Elbisesi <span className="ticker-dot">•</span> Kovan Bakım Seti <span className="ticker-dot">•</span> Yerli İmalat <span className="ticker-dot">•</span> Hızlı Kargo <span className="ticker-dot">•</span> Atak Arıcılık
        </div>
        <div className="ticker-span">
          Arı Körüğü <span className="ticker-dot">•</span> Arıcı Elbisesi <span className="ticker-dot">•</span> Kovan Bakım Seti <span className="ticker-dot">•</span> Yerli İmalat <span className="ticker-dot">•</span> Hızlı Kargo <span className="ticker-dot">•</span> Atak Arıcılık
        </div>
      </div>
    </div>
  );
}
