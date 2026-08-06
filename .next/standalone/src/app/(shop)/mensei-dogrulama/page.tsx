import { Metadata } from "next";
import ProvenanceVerificationClient from "@/modules/blockchain/components/ProvenanceVerificationClient";

export const metadata: Metadata = {
  title: "Blokzincir Menşei & NFT Doğrulama | PEKEFE Geleneksel Gastronomi",
  description: "Kavanozunuzdaki benzersiz doğrulama kodunu sorgulayarak laboratuvar analizlerini, GPS rakım verisini ve blokzincir menşei kaydını doğrulayın.",
};

export default function MenseiDogrulamaPage() {
  return <ProvenanceVerificationClient />;
}
