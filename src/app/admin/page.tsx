import { redirect } from "next/navigation";

// Root /admin → redirect directly to /admin/dashboard
export default function AdminRootPage() {
  redirect("/admin/dashboard");
}
