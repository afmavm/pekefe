"use client";

import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { useParams } from "next/navigation";

interface MiniCountdownProps {
  discountEndDate: string | Date | null | undefined;
  serverTimeUtc: string | Date | null | undefined;
}

export default function MiniCountdown({ discountEndDate, serverTimeUtc }: MiniCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const params = useParams();
  const locale = (params?.locale as string) || "tr";

  useEffect(() => {
    if (!discountEndDate || !serverTimeUtc) {
      setTimeLeft(null);
      return;
    }

    const endTime = new Date(discountEndDate).getTime();
    const serverTime = new Date(serverTimeUtc).getTime();
    const diffMs = endTime - serverTime;

    if (diffMs <= 0) {
      setTimeLeft(0);
      return;
    }

    setTimeLeft(Math.floor(diffMs / 1000));

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [discountEndDate, serverTimeUtc]);

  if (timeLeft === null || timeLeft <= 0) return null;

  const days = Math.floor(timeLeft / (24 * 3600));
  const hours = Math.floor((timeLeft % (24 * 3600)) / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;
  const pad = (num: number) => String(num).padStart(2, "0");
  const formatted = `${days > 0 ? `${days}g ` : ""}${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  return (
    <div className="w-full bg-zinc-950 border-b border-zinc-800/80 px-4 py-2.5 flex items-center justify-between select-none">
      <div className="flex items-center gap-2 text-white select-none">
        <Clock className="w-4 h-4 text-amber-500 animate-pulse shrink-0" />
        <span className="text-xs font-black uppercase tracking-wider">
          {locale === "tr" ? "KAMPANYA SONU" : "CAMPAIGN END"}
        </span>
      </div>
      <span className="font-mono text-amber-400 text-sm font-black tracking-widest bg-amber-950/40 border border-amber-500/35 px-3 py-1 rounded-lg shadow-md">
        {formatted}
      </span>
    </div>
  );
}

