import React from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { isAdminRole } from "@/lib/auth-helpers";
import AdminProviders from "./AdminProviders";
import { prisma, withTimeout } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default async function RootAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Çift katmanlı sunucu güvenliği (Defense-in-Depth):
  // Middleware'e ek olarak Server Component düzeyinde oturum ve rol doğrulaması
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/giris");
  }
  const userRole = String((session.user as any).role || "");
  if (!isAdminRole(userRole)) {
    redirect("/403");
  }

  let initialCMSData = null;
  let initialPages: any[] = [];
  try {
    const data = await withTimeout(
      prisma.cMSData.findUnique({ where: { id: "singleton" } }),
      800,
      null
    );
    if (data) {
      initialCMSData = JSON.parse(JSON.stringify(data));
    }
    const pagesRaw = await withTimeout(
      prisma.cMSPage.findMany(),
      800,
      []
    );
    initialPages = pagesRaw.map(page => {
      let sections = [];
      try {
        sections = typeof page.sections === "string" ? JSON.parse(page.sections) : (page.sections as any);
      } catch (e) {
        console.error("Failed to parse page sections in admin layout", e);
      }
      return {
        id: page.id,
        name: page.name,
        slug: page.slug,
        status: page.status,
        sections
      };
    });
  } catch (error) {
    console.error("Error fetching initial CMS data in admin layout:", error);
  }

  return (
    <AdminProviders initialCMSData={initialCMSData} initialPages={initialPages}>
      {children}
    </AdminProviders>
  );
}
