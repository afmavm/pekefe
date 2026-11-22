import { Metadata } from "next";
import TastingRoomClient from "@/modules/tasting/components/TastingRoomClient";

export const metadata: Metadata = {
  title: "Özel Tadım Odası Rezervasyonu | İstanbul, Londra & Paris | PEKEFE",
  description: "PEKEFE İstanbul Bebek, Londra Mayfair ve Paris Le Marais özel tadım salonlarında bal uzmanlarımız eşliğinde hasat ve lezzet tadım seansı rezervasyonu.",
};

export default function TadimOdasiPage() {
  return <TastingRoomClient />;
}
