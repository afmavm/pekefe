import { redirect } from "next/navigation";

export default function AdminStockNewRedirectPage() {
  redirect("/admin/stock/form");
}
