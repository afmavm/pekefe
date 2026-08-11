import { Metadata } from "next";
import HarvestClubClient from "@/modules/harvest/components/HarvestClubClient";

export const metadata: Metadata = {
  title: "Sınırlı Hasat Rekolte Kulübü | PEKEFE Geleneksel Gastronomi",
  description: "PEKEFE 2026 İspir Yaylası ve Kaçkar Etekleri sınırlı rekolte ham dut pekmezi ve ham çiçek balı ön sipariş ve rezervasyon kulübü.",
};

export default function RekolteKulubuPage() {
  return <HarvestClubClient />;
}
