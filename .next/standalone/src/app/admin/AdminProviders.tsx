"use client";

import React from "react";
import { SessionProvider } from "next-auth/react";
import { NextIntlClientProvider } from "next-intl";
import { CMSProvider } from "@/context/CMSContext";
import { ProductProvider } from "@/context/ProductContext";
import { OrderProvider } from "@/context/OrderContext";
import { FinanceProvider } from "@/context/FinanceContext";
import { IntegrationProvider } from "@/context/IntegrationContext";
import { Toaster } from "sonner";
import AdminLayoutContent from "./AdminLayoutContent";

interface AdminProvidersProps {
  children: React.ReactNode;
  initialCMSData: any;
  initialPages: any[];
}

export default function AdminProviders({
  children,
  initialCMSData,
  initialPages,
}: AdminProvidersProps) {
  return (
    <SessionProvider>
      <NextIntlClientProvider locale="tr" messages={{}}>
        <CMSProvider initialCMSData={initialCMSData} initialPages={initialPages}>
          <ProductProvider>
            <OrderProvider>
              <FinanceProvider>
                <IntegrationProvider>
                  <AdminLayoutContent>{children}</AdminLayoutContent>
                  <Toaster richColors position="top-right" closeButton />
                </IntegrationProvider>
              </FinanceProvider>
            </OrderProvider>
          </ProductProvider>
        </CMSProvider>
      </NextIntlClientProvider>
    </SessionProvider>
  );
}
