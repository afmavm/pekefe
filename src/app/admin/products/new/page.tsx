import { redirect } from "next/navigation";

export default function AdminProductsNewRedirectPage() {
  redirect("/admin/stock/form");
}
