import { Metadata } from "next";
import Link from "next/link";
import {
  Store,
  Warehouse,
  MapPin,
  Phone,
  Users,
  Package,
  Lock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Plus,
  Building2,
  Layers,
  Hash,
  BoxesIcon,
  AlertTriangle,
  Pencil,
} from "lucide-react";
import { getWarehousesHierarchy } from "@/modules/inventory/server/inventoryActions";

export const metadata: Metadata = {
  title: "Depolar & Şube Hiyerarşisi | Envanter Yönetimi",
  description: "Şube ve depo hiyerarşisini görüntüleyin ve yönetin.",
};

// ─── Type helpers ────────────────────────────────────────────────────────────

type WarehouseItem = {
  id: string;
  name: string;
  code: string;
  type: string;
  address: string | null;
  isActive: boolean;
  isLocked: boolean;
  totalStock: number;
  totalReserved: number;
  _count: { locations: number };
};

type BranchItem = {
  id: string;
  name: string;
  code: string;
  address: string | null;
  phone: string | null;
  isActive: boolean;
  warehouses: WarehouseItem[];
  _count: { warehouses: number; users: number };
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatPill({
  icon: Icon,
  label,
  value,
  accent = false,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  accent?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium ${
        accent
          ? "bg-orange-50 text-orange-700 ring-1 ring-orange-200"
          : "bg-slate-50 text-slate-600 ring-1 ring-slate-200"
      }`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="text-slate-500">{label}:</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function ActiveBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
      <CheckCircle2 className="h-3 w-3" />
      Aktif
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500 ring-1 ring-slate-200">
      <XCircle className="h-3 w-3" />
      Pasif
    </span>
  );
}

function LockedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200">
      <Lock className="h-3 w-3" />
      Sayımda Kilitli
    </span>
  );
}

function WarehouseTypeLabel({ type }: { type: string }) {
  const typeMap: Record<string, { label: string; color: string }> = {
    MAIN: {
      label: "Ana Depo",
      color: "bg-blue-50 text-blue-700 ring-blue-200",
    },
    BRANCH: {
      label: "Şube Deposu",
      color: "bg-purple-50 text-purple-700 ring-purple-200",
    },
    TRANSIT: {
      label: "Transit",
      color: "bg-cyan-50 text-cyan-700 ring-cyan-200",
    },
    VIRTUAL: {
      label: "Sanal",
      color: "bg-slate-100 text-slate-600 ring-slate-200",
    },
    CONSIGNMENT: {
      label: "Konsinye",
      color: "bg-rose-50 text-rose-700 ring-rose-200",
    },
  };

  const config = typeMap[type] ?? {
    label: type,
    color: "bg-slate-100 text-slate-600 ring-slate-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1 ${config.color}`}
    >
      {config.label}
    </span>
  );
}

function WarehouseCard({ warehouse }: { warehouse: WarehouseItem }) {
  return (
    <div className="group relative flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-orange-200 hover:shadow-md">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 group-hover:bg-orange-50 group-hover:text-orange-600 transition-colors">
            <Warehouse className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-slate-800">
                {warehouse.name}
              </span>
              <WarehouseTypeLabel type={warehouse.type} />
              <Link
                href={`/admin/inventory/warehouses/edit?type=warehouse&id=${warehouse.id}`}
                className="opacity-0 group-hover:opacity-100 inline-flex items-center justify-center p-1 rounded-md text-slate-400 hover:text-orange-600 hover:bg-orange-50 transition-all duration-200"
                title="Depoyu Düzenle"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
              <Hash className="h-3 w-3" />
              <span className="font-mono">{warehouse.code}</span>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <ActiveBadge isActive={warehouse.isActive} />
          {warehouse.isLocked && <LockedBadge />}
        </div>
      </div>

      {/* Address */}
      {warehouse.address && (
        <div className="flex items-start gap-1.5 text-xs text-slate-500">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
          <span>{warehouse.address}</span>
        </div>
      )}

      {/* Stats row */}
      <div className="flex flex-wrap gap-2 pt-1">
        <StatPill
          icon={BoxesIcon}
          label="Toplam Stok"
          value={warehouse.totalStock.toLocaleString("tr-TR")}
          accent={warehouse.totalStock > 0}
        />
        <StatPill
          icon={Package}
          label="Rezerve"
          value={warehouse.totalReserved.toLocaleString("tr-TR")}
        />
        <StatPill
          icon={Layers}
          label="Lokasyon"
          value={warehouse._count.locations.toLocaleString("tr-TR")}
        />
      </div>
    </div>
  );
}

function BranchCard({ branch }: { branch: BranchItem }) {
  return (
    <div className="relative">
      {/* Branch header card */}
      <div className="relative z-10 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm">
        {/* Branch top row */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600 shadow-inner">
              <Store className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-slate-800">
                  {branch.name}
                </h3>
                <ActiveBadge isActive={branch.isActive} />
                <Link
                  href={`/admin/inventory/warehouses/edit?type=branch&id=${branch.id}`}
                  className="inline-flex items-center justify-center p-1 rounded-md text-slate-400 hover:text-orange-600 hover:bg-orange-50 transition"
                  title="Şubeyi Düzenle"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                <Hash className="h-3 w-3" />
                <span className="font-mono font-medium text-slate-500">
                  {branch.code}
                </span>
              </div>
            </div>
          </div>

          {/* Branch stats pills */}
          <div className="hidden sm:flex shrink-0 flex-col items-end gap-2">
            <StatPill
              icon={Warehouse}
              label="Depo"
              value={branch._count.warehouses}
              accent
            />
            <StatPill icon={Users} label="Kullanıcı" value={branch._count.users} />
          </div>
        </div>

        {/* Address / phone row */}
        <div className="flex flex-wrap gap-4">
          {branch.address && (
            <div className="flex items-start gap-1.5 text-xs text-slate-500">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span>{branch.address}</span>
            </div>
          )}
          {branch.phone && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span>{branch.phone}</span>
            </div>
          )}
        </div>

        {/* sm branch stats (mobile) */}
        <div className="flex sm:hidden flex-wrap gap-2">
          <StatPill
            icon={Warehouse}
            label="Depo"
            value={branch._count.warehouses}
            accent
          />
          <StatPill icon={Users} label="Kullanıcı" value={branch._count.users} />
        </div>
      </div>

      {/* Indented warehouses */}
      {branch.warehouses.length > 0 && (
        <div className="relative mt-0 pl-8">
          {/* Vertical line connector */}
          <div className="absolute left-6 top-0 bottom-4 w-px bg-gradient-to-b from-orange-300 to-slate-200" />

          <div className="flex flex-col gap-3 pt-3">
            {branch.warehouses.map((warehouse, idx) => (
              <div key={warehouse.id} className="relative">
                {/* Horizontal connector */}
                <div className="absolute -left-2 top-[22px] h-px w-5 bg-orange-200" />
                {/* Dot */}
                <div className="absolute -left-[13px] top-[17px] h-2.5 w-2.5 rounded-full border-2 border-orange-300 bg-white" />
                <WarehouseCard warehouse={warehouse} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty warehouses state */}
      {branch.warehouses.length === 0 && (
        <div className="mt-3 pl-8">
          <div className="absolute left-6 top-[88px] bottom-10 w-px bg-slate-200" />
          <div className="flex items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-400">
            <Warehouse className="h-4 w-4 shrink-0" />
            Bu şubeye henüz depo eklenmemiş.
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function WarehousesPage() {
  const result = await getWarehousesHierarchy();

  const branches: BranchItem[] = result.success && result.data ? result.data : [];
  const hasError = !result.success;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Page shell ── */}
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">

        {/* ── Breadcrumb ── */}
        <nav className="mb-6 flex items-center gap-1.5 text-xs text-slate-500">
          <span className="font-medium text-slate-700">Envanter &amp; Depo</span>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-orange-600 font-semibold">Depolar</span>
        </nav>

        {/* ── Header ── */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500 shadow-lg shadow-orange-200">
              <Building2 className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Depolar &amp; Şube Hiyerarşisi
              </h1>
              <p className="mt-0.5 text-sm text-slate-500">
                {branches.length > 0
                  ? `${branches.length} şube · ${branches.reduce(
                      (acc, b) => acc + b._count.warehouses,
                      0
                    )} depo`
                  : "Henüz şube tanımlanmamış"}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex shrink-0 flex-wrap gap-2">
            <Link
              href="/admin/inventory/warehouses/new?type=branch"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 hover:shadow-md active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              Yeni Şube
            </Link>
            <Link
              href="/admin/inventory/warehouses/new?type=warehouse"
              className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-orange-200 transition-all hover:bg-orange-600 hover:shadow-md active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              Yeni Depo
            </Link>
          </div>
        </div>

        {/* ── Error state ── */}
        {hasError && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700 shadow-sm">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Veri yüklenemedi</p>
              <p className="mt-0.5 text-sm text-red-600">
                Depo hiyerarşisi alınırken bir hata oluştu. Lütfen sayfayı
                yenileyiniz veya yöneticinizle iletişime geçiniz.
              </p>
            </div>
          </div>
        )}

        {/* ── Empty state ── */}
        {!hasError && branches.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-dashed border-slate-300 bg-white py-20 text-center shadow-sm">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-100">
              <Building2 className="h-10 w-10 text-slate-300" />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-700">
                Hiç şube bulunamadı
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Başlamak için ilk şubenizi oluşturun.
              </p>
            </div>
            <Link
              href="/admin/inventory/warehouses/new?type=branch"
              className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-orange-200 transition-all hover:bg-orange-600 hover:shadow-md"
            >
              <Plus className="h-4 w-4" />
              İlk Şubeyi Ekle
            </Link>
          </div>
        )}

        {/* ── Hierarchy list ── */}
        {!hasError && branches.length > 0 && (
          <div className="flex flex-col gap-8">
            {branches.map((branch) => (
              <BranchCard key={branch.id} branch={branch} />
            ))}
          </div>
        )}

        {/* ── Legend ── */}
        {!hasError && branches.length > 0 && (
          <div className="mt-10 flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-xs text-slate-500 shadow-sm">
            <span className="font-semibold text-slate-600">Gösterge:</span>
            <span className="inline-flex items-center gap-1.5">
              <Store className="h-3.5 w-3.5 text-orange-500" />
              Şube
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Warehouse className="h-3.5 w-3.5 text-slate-500" />
              Depo
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 font-semibold text-amber-700 ring-1 ring-amber-200">
              <Lock className="h-3 w-3" />
              Sayımda Kilitli
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700 ring-1 ring-emerald-200">
              <CheckCircle2 className="h-3 w-3" />
              Aktif
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-500 ring-1 ring-slate-200">
              <XCircle className="h-3 w-3" />
              Pasif
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

