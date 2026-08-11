import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import EditFormClient from "./EditFormClient";

interface PageProps {
  searchParams: Promise<{
    type?: string;
    id?: string;
  }>;
}

export default async function EditWarehousePage({ searchParams }: PageProps) {
  // Admin yetki kontrolü yapıyoruz.
  const auth = await requireAdmin();
  if (!auth.authorized) {
    redirect("/admin/inventory/warehouses");
  }

  const sp = await searchParams;
  const type = sp.type === "branch" ? "branch" : "warehouse";
  const id = sp.id;

  if (!id) {
    redirect("/admin/inventory/warehouses");
  }

  // Düzenlenecek kaydı çekiyoruz.
  let record: any = null;
  if (type === "branch") {
    record = await prisma.branch.findUnique({
      where: { id },
    });
  } else {
    record = await prisma.warehouse.findUnique({
      where: { id },
    });
  }

  if (!record) {
    redirect("/admin/inventory/warehouses");
  }

  // Depo ekranındaki şube listesi için aktif şubeleri getiriyoruz.
  const branches = await prisma.branch.findMany({
    where: { isActive: true },
    select: { id: true, name: true, code: true },
    orderBy: { name: "asc" },
  });

  return <EditFormClient type={type} record={record} branches={branches} />;
}
