"use client";

import { SessionProvider } from "next-auth/react";
import { SessionTimeoutTracker } from "./SessionTimeoutTracker";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <SessionTimeoutTracker />
    </SessionProvider>
  );
}
