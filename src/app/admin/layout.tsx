import React from "react";
import AdminProviders from "./AdminProviders";
import { prisma, withTimeout } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function RootAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
