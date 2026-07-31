import { Metadata } from "next";
import AcademyClient from "@/modules/academy/components/AcademyClient";

export const metadata: Metadata = {
  title: "PEKEFE Gurme Akademisi | Geleneksel geleneksel lezzetler & Yavaş Gıda Eğitimi",
  description: "İspir yaylasında usta arıcılar ve geleneksel pekmez ustaları tarafından verilen sertifikalı gıda ve zanaat akademi programları.",
};

export default function AkademiPage() {
  return <AcademyClient />;
}
