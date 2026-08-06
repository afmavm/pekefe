export interface SubAccount {
  id: string;
  currentAccountId: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  balance: number;
}

export interface Transaction {
  id: string;
  currentAccountId: string;
  subAccountId?: string | null;
  date: Date;
  type: string;
  amount: number;
  description?: string | null;
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  currentAccountId: string;
  date: Date;
  dueDate?: Date | null;
  amount: number;
  taxAmount: number;
  status: string; // 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Cancelled'
}

export interface CurrentAccount {
  id: string;
  cariKod?: string | null;
  name: string;
  type: string; // "MUSTERI" | "TEDARIKCI" | "HER_IKISI"
  cariTipi: string; // "INDIVIDUAL" | "CORPORATE"
  ad?: string | null;
  soyad?: string | null;
  tckn?: string | null;
  dogumTarihi?: Date | null;
  taxNo?: string | null;
  taxId?: string | null;
  taxOffice?: string | null;
  mersisNo?: string | null;
  yetkiliKisi?: string | null;
  webSitesi?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  balance: number;
  currency: string;
  openingBalance: number;
  isActive: boolean;
  isDeleted: boolean;
  discountRate?: number | null;
  creditLimit?: number | null;
  riskLimit?: number | null;
  vadeGun?: number | null;
  loyaltyPoints: number;
  dealerGroup: string; // "Platin" | "Gold" | "Silver" | "Standart"
  priceGroup: string;  // "Liste" | "Maliyet+" | "Özel İskonto"
  priceFormula?: string | null;
  parentDealerId?: string | null;
  b2bMinQty?: number | null;
  b2bPaymentTerms?: string | null;
  b2bCode?: string | null;
  createdAt: Date;
  updatedAt: Date;
  subAccounts?: SubAccount[];
  transactions?: Transaction[];
  invoices?: Invoice[];
  isApproved?: boolean; // dynamic field matched with B2B User.isApproved
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  cost: number;
  category: string;
}
