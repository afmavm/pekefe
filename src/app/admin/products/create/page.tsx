import { redirect } from "next/navigation";

export default function AdminProductsCreateRedirectPage() {
  redirect("/admin/stock/form");
}
