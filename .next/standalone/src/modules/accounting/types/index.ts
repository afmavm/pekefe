export interface AccountingAccount {
  id: string;
  code: string;
  name: string;
  type: string; // e.g. "ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"
  parentCode?: string | null;
  isActive: boolean;
  createdAt: Date;
}

export interface JournalLine {
  id: string;
  journalEntryId: string;
  debitAccountId: string;
  creditAccountId: string;
  amount: number;
  description?: string | null;
  debitAccount?: AccountingAccount;
  creditAccount?: AccountingAccount;
}

export interface JournalEntry {
  id: string;
  date: Date;
  number: string;
  description: string;
  status: string; // "DRAFT" | "POSTED"
  type: string; // "GENERAL" | "PAYMENT" | "INVOICE"
  createdBy?: string | null;
  referenceId?: string | null;
  lines?: JournalLine[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Expense {
  id: string;
  date: Date;
  category: string;
  amount: number;
  taxAmount: number;
  description: string;
  supplier?: string | null;
  receiptNo?: string | null;
  paymentMethod: string;
  bankId?: string | null;
  status: string; // "PENDING" | "ODENDI"
}

export interface TaxDeclaration {
  id: string;
  period: string; // e.g. "2026/05"
  type: string; // "KDV-1" | "KDV-2" | "MUHTASAR" | "GECICI_VERGI" | "KURUMLAR_VERGISI"
  amount: number;
  taxBase?: number | null;
  taxRate?: number | null;
  status: string; // "BEKLIYOR" | "ODENDI"
  dueDate: Date;
  paidDate?: Date | null;
  notes?: string | null;
}

export interface BudgetItem {
  id: string;
  year: number;
  month: number;
  category: string;
  planned: number;
  actual: number;
  notes?: string | null;
}

export interface Bank {
  id: string;
  name: string;
  accountNumber: string;
  iban: string;
  balance: number;
  currency: string;
  logo?: string | null;
  branch?: string | null;
  type: string; // "VADESIZ" | "VADELI" | "KREDI"
}

export interface Invoice {
  id: string;
  orderId?: string | null;
  currentAccountId: string;
  date: Date;
  dueDate: Date;
  totalAmount: number;
  taxAmount: number;
  status: string; // "PENDING" | "PAID" | "OVERDUE" | "CANCELLED"
  type: string; // "SATIS" | "ALIS"
  currentAccount?: {
    name: string;
  };
}
