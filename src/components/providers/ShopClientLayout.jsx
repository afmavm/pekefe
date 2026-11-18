"use client";

import { CMSProvider } from "@/context/CMSContext";
import MaintenanceGuard from "@/components/MaintenanceGuard";
import TopAnnouncementBar from "@/components/TopAnnouncementBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SupportWidget from "@/components/SupportWidget";
import HomePopup from "@/components/HomePopup";
import CookieConsentBanner from "@/components/CookieConsentBanner";

export default function ShopClientLayout({ children }) {
  return (
    <CMSProvider>
      <MaintenanceGuard>
        <div className="min-h-screen flex flex-col bg-surface text-on-surface overflow-x-hidden">
          <TopAnnouncementBar />
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <SupportWidget />
          <HomePopup />
          <CookieConsentBanner />
        </div>
      </MaintenanceGuard>
    </CMSProvider>
  );
}
