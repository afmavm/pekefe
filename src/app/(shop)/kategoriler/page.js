import React from "react";
import {
  getAllCategoriesServer,
  getPublishedProductsServer,
} from "@/lib/category-server";
import AllProductsClient from "@/components/category/AllProductsClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Tüm Ürünler | İspir Dut Pestili, Pekmez ve Köme | PEKEFE",
  description:
    "Erzurum İspir'in geleneksel dut pestili, dut ve karadut pekmezi, cevizli köme ve doğal yöresel ürünlerini PEKEFE kalitesiyle keşfedin.",
  alternates: {
    canonical: "https://pekefe.com/kategoriler",
  },
};

export default async function KategorilerPage() {
  const [allCategories, products] = await Promise.all([
    getAllCategoriesServer({ activeOnly: true }),
    getPublishedProductsServer(),
  ]);

  const mainCategories = allCategories
    .filter((c) => !c.parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <AllProductsClient
      initialProducts={products}
      allCategories={allCategories}
      mainCategories={mainCategories}
    />
  );
}
