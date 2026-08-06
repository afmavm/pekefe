import { Metadata } from "next";
import TastingRoomClient from "@/modules/tasting/components/TastingRoomClient";

export const metadata: Metadata = {
  title: "Butik Tadım Odası Rezervasyonu | İstanbul, Londra & Paris | PEKEFE",
  description: "PEKEFE İstanbul Bebek, Londra Mayfair ve Paris Le Marais butik tadım salonlarında özel bal sommelier ve rekolte tadım seansı rezervasyonu.",
};

export default function TadimOdasiPage() {
  return <TastingRoomClient />;
}
