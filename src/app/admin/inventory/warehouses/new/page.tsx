import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import FormClient from "./FormClient";

interface PageProps {
  searchParams: Promise<{
    type?: string;
  }>;
}

export default async function NewWarehousePage({ searchParams }: PageProps) {
  // Admin yetki kontrolü yapıyoruz.
  const auth = await requireAdmin();
  if (!auth.authorized) {
    redirect("/admin/inventory/warehouses");
  }

  const sp = await searchParams;
  const type = sp.type === "branch" ? "branch" : "warehouse";

  // Depo ekleme ekranındaki şube listesi için aktif şubeleri getiriyoruz.
  const branches = await prisma.branch.findMany({
    where: { isActive: true },
    select: { id: true, name: true, code: true },
    orderBy: { name: "asc" },
  });

  return <FormClient type={type} branches={branches} />;
}
