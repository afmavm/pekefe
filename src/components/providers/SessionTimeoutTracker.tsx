"use client";

import { useSession, signOut, getSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Lock, ShieldAlert, LogOut, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const IDLE_TIMEOUT_SECONDS = 15 * 60; // 15 minutes of inactivity
const WARNING_SECONDS = 60; // Show warning 60 seconds before logout

const locales = {
  tr: {
    title: "Güvenlik Uyarısı: Hareketsiz Kaldınız",
    desc: "Uzun süredir işlem yapmadığınız için oturumunuzun güvenliği adına otomatik çıkış yapılacaktır.",
    countdown: "Oturumunuzun kapatılmasına kalan süre:",
    keepLoggedIn: "Oturumu Açık Tut",
    logoutNow: "Güvenli Çıkış Yap",
    seconds: "saniye",
  },
  en: {
    title: "Security Alert: You are Idle",
    desc: "Due to inactivity, your session will be automatically terminated for security reasons.",
    countdown: "Time remaining before logout:",
    keepLoggedIn: "Keep Me Logged In",
    logoutNow: "Logout Now",
    seconds: "seconds",
  }
};

export function SessionTimeoutTracker() {
  const { data: session, status } = useSession();
  const params = useParams();
  const locale = ((params?.locale as string) || "tr") as "tr" | "en";
  const t = locales[locale] || locales.tr;

  const getLoginUrl = (role?: string) => {
    const adminRoles = ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER", "WAREHOUSE_SUPERVISOR", "SALES_STAFF"];
    const isAdmin = role && adminRoles.includes(role);
    return isAdmin ? `/${locale}/login` : `/${locale}/login-customer`;
  };

  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(WARNING_SECONDS);
  
  const lastActivityTimeRef = useRef<number>(Date.now());
  const wasUnauthenticatedRef = useRef<boolean>(false);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const checkTimeoutIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Browser/Tab Close & Reopen Detection State Machine
  useEffect(() => {
    if (status === "loading") return;

    if (status === "authenticated") {
      const isSessionCookiePresent = document.cookie
        .split(";")
        .some((item) => item.trim().startsWith("browser_session_active="));

      const isRememberMe = document.cookie
        .split(";")
        .some((item) => item.trim().startsWith("remember_me=true"));

      if (!isSessionCookiePresent) {
        // If they just logged in during this page lifecycle, or if they have Remember Me checked, restore the cookie
        if (wasUnauthenticatedRef.current || isRememberMe) {
          if (isRememberMe) {
            document.cookie = "browser_session_active=true; path=/; max-age=2592000; SameSite=Lax";
          } else {
            document.cookie = "browser_session_active=true; path=/; SameSite=Lax";
          }
        } else {
          // Cookie is missing, no Remember Me, and they didn't just log in -> browser was closed and reopened!
          const loginUrl = getLoginUrl(session?.user?.role);
          signOut({ callbackUrl: `${loginUrl}?reason=browser_close` });
        }
      } else {
        // Keep refreshing session cookie
        if (isRememberMe) {
          document.cookie = "browser_session_active=true; path=/; max-age=2592000; SameSite=Lax";
        } else {
          document.cookie = "browser_session_active=true; path=/; SameSite=Lax";
        }
      }
    } else if (status === "unauthenticated") {
      wasUnauthenticatedRef.current = true;
      // Delete session cookie and remember_me cookie on explicit logout
      document.cookie = "browser_session_active=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax";
      document.cookie = "remember_me=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax";
    }
  }, [status, locale, session]);

  // 2. Monitor Inactivity and Idle Timeouts
  useEffect(() => {
    if (status !== "authenticated") {
      // Clear timers if user logs out
      if (checkTimeoutIntervalRef.current) clearInterval(checkTimeoutIntervalRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      setShowWarning(false);
      return;
    }

    // Initialize/Reset activity timestamp
    lastActivityTimeRef.current = Date.now();

    // Event listeners to monitor user interaction
    const handleActivity = () => {
      // Throttle state updates: record timestamp but avoid excessive React renders
      lastActivityTimeRef.current = Date.now();
      
      // If warning is currently showing and they interact with the page,
      // we don't automatically close it (they must click the button to confirm),
      // but their backend session will remain alive.
    };

    const events = ["mousemove", "mousedown", "keypress", "scroll", "touchstart"];
    events.forEach((event) => window.addEventListener(event, handleActivity));

    // Check inactivity every 2 seconds
    checkTimeoutIntervalRef.current = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - lastActivityTimeRef.current) / 1000);
      const threshold = IDLE_TIMEOUT_SECONDS - WARNING_SECONDS;

      if (elapsedSeconds >= threshold && !showWarning) {
        setShowWarning(true);
        setSecondsRemaining(WARNING_SECONDS);
      }
    }, 2000);

    return () => {
      events.forEach((event) => window.removeEventListener(event, handleActivity));
      if (checkTimeoutIntervalRef.current) clearInterval(checkTimeoutIntervalRef.current);
    };
  }, [status, showWarning]);

  // 3. Warning Countdown Timer
  useEffect(() => {
    if (!showWarning) {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      return;
    }

    countdownIntervalRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          // Timer expired -> Auto logout
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
          handleAutoLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [showWarning]);

  const handleAutoLogout = async () => {
    setShowWarning(false);
    // Explicitly delete session active cookie and remember_me cookie
    document.cookie = "browser_session_active=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax";
    document.cookie = "remember_me=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax";
    const loginUrl = getLoginUrl(session?.user?.role);
    await signOut({ callbackUrl: `${loginUrl}?reason=idle` });
  };

  const handleKeepLoggedIn = async () => {
    // Reset inactivity timer
    lastActivityTimeRef.current = Date.now();
    setShowWarning(false);

    // Refresh NextAuth token session cookie by calling getSession()
    try {
      await getSession();
      // Reset the session cookie to ensure it's still alive in the browser
      const isRememberMe = document.cookie
        .split(";")
        .some((item) => item.trim().startsWith("remember_me=true"));

      if (isRememberMe) {
        document.cookie = "browser_session_active=true; path=/; max-age=2592000; SameSite=Lax";
      } else {
        document.cookie = "browser_session_active=true; path=/; SameSite=Lax";
      }
    } catch (err) {
      console.error("Failed to refresh session on keep alive:", err);
    }
  };

  const handleManualLogout = async () => {
    setShowWarning(false);
    document.cookie = "browser_session_active=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax";
    document.cookie = "remember_me=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax";
    const loginUrl = getLoginUrl(session?.user?.role);
    await signOut({ callbackUrl: loginUrl });
  };

  // Render nothing if user is not authenticated or warning is not triggered
  return (
    <AnimatePresence>
      {showWarning && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Blur Glassmorphic Overlay Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#06080F]/80 backdrop-blur-xl"
            onClick={handleKeepLoggedIn}
          />

          {/* Premium Warning Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 15 }}
            transition={{ type: "spring", damping: 25, stiffness: 180 }}
            className="relative w-full max-w-md overflow-hidden bg-gradient-to-b from-[#111522] to-[#0A0D16] border border-white/10 rounded-[2.5rem] p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] text-center"
          >
            {/* Ambient Background Glow */}
            <div className="absolute -top-20 -right-20 w-44 h-44 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-44 h-44 bg-red-500/5 rounded-full blur-[80px] pointer-events-none" />

            {/* Glowing Icon Header */}
            <div className="relative mx-auto w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500/15 to-orange-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mb-6 shadow-[0_0_30px_rgba(245,158,11,0.15)] animate-pulse">
              <ShieldAlert className="w-9 h-9" />
              <div className="absolute inset-0 rounded-3xl border border-amber-500/40 animate-ping opacity-25" />
            </div>

            {/* Modal Headings */}
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight mb-2 uppercase">
              {t.title}
            </h2>
            <p className="text-zinc-400 font-semibold text-sm leading-relaxed mb-6 px-1">
              {t.desc}
            </p>

            {/* Premium Countdown Progress Display */}
            <div className="relative w-36 h-36 mx-auto mb-8 flex items-center justify-center">
              {/* SVG Circular Progress Loader */}
              <svg className="absolute w-full h-full transform -rotate-90">
                {/* Background Ring */}
                <circle
                  cx="72"
                  cy="72"
                  r="64"
                  className="stroke-zinc-800/60 fill-none"
                  strokeWidth="6"
                />
                {/* Active Progress Ring */}
                <motion.circle
                  cx="72"
                  cy="72"
                  r="64"
                  className="stroke-amber-500 fill-none"
                  strokeWidth="6"
                  strokeDasharray="402"
                  strokeDashoffset={402 - (402 * secondsRemaining) / WARNING_SECONDS}
                  strokeLinecap="round"
                  transition={{ duration: 1, ease: "linear" }}
                />
              </svg>
              
              {/* Inner Countdown Values */}
              <div className="flex flex-col items-center justify-center z-10">
                <span className="text-4xl font-black text-white tracking-tighter tabular-nums">
                  {secondsRemaining}
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-1">
                  {t.seconds}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleKeepLoggedIn}
                className="w-full h-13 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-black text-sm uppercase tracking-widest rounded-2xl transition-all duration-300 shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4.5 h-4.5" />
                <span>{t.keepLoggedIn}</span>
              </button>

              <button
                onClick={handleManualLogout}
                className="w-full h-12 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white font-bold text-xs uppercase tracking-widest rounded-2xl transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t.logoutNow}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
