"use client";

import { CMSProvider } from "@/context/CMSContext";
import MaintenanceGuard from "@/components/MaintenanceGuard";
import TopAnnouncementBar from "@/components/TopAnnouncementBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SupportWidget from "@/components/SupportWidget";
import HomePopup from "@/components/HomePopup";

export default function ShopClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <CMSProvider>
      <MaintenanceGuard>
        <div className="min-h-screen flex flex-col bg-surface text-on-surface">
          <TopAnnouncementBar />
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <SupportWidget />
          <HomePopup />
        </div>
      </MaintenanceGuard>
    </CMSProvider>
  );
}
