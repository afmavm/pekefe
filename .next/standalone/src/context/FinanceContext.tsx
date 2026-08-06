"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface SubAccount {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "Yönetici" | "Satın Alma" | "Muhasebe";
  balance: number; // Balance loaded specifically for this sub-account
}

export interface CurrentAccount {
  id: string;
  name: string;
  type: "Müşteri" | "Tedarikçi" | "Personel";
  taxId?: string;
  taxOffice?: string;
  phone?: string;
  email?: string;
  address?: string;
  balance: number; // Toplam Cari Bakiye
  discountRate?: number;
  creditLimit?: number;
  riskLimit?: number;
  vadeGun?: number;
  dealerGroup: "Platin" | "Gold" | "Silver" | "Standart";
  priceGroup: "Liste" | "Maliyet+" | "Özel İskonto";
  priceFormula?: string; // e.g., "maliyet * 1.10"
  loyaltyPoints?: number;
  subAccounts?: SubAccount[];
  parentDealerId?: string; // For hierarchical structure
}

export interface Transaction {
  id: string;
  accountId: string;
  subAccountId?: string;
  date: string;
  type: "Satış Faturası" | "Alış Faturası" | "Tahsilat" | "Ödeme" | "Açılış Bakiyesi" | "İade" | "Virman";
  amount: number;
  description: string;
  paymentMethod?: "Kredi Kartı" | "Havale" | "Açık Hesap" | "Nakit";
}

export interface InvoiceItem {
  name: string;
  quantity: number;
  price: number;
  taxRate: number;
}

export interface Invoice {
  id: string;
  orderId?: string;
  accountId: string;
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  totalAmount: number;
  taxAmount: number;
  status: "Taslak" | "Gönderildi" | "İptal Edildi" | "Onay Bekliyor";
  type: "e-Fatura" | "e-Arşiv" | "e-İrsaliye";
  externalLink?: string; // GİB Linki
}

export interface Bank {
  id: string;
  name: string;
  accountNumber: string;
  iban: string;
  balance: number;
  currency: "TRY" | "USD" | "EUR";
  logo: string;
}

interface FinanceContextType {
  accounts: CurrentAccount[];
  transactions: Transaction[];
  invoices: Invoice[];
  banks: Bank[];
  addAccount: (account: CurrentAccount) => void;
  updateAccount: (account: CurrentAccount) => void;
  deleteAccount: (id: string) => void;
  addTransaction: (transaction: Transaction) => void;
  addInvoice: (invoice: Invoice) => void;
  updateBankBalance: (bankId: string, amount: number) => void;
  addSubAccount: (dealerId: string, sub: SubAccount) => void;
  fetchAccounts: () => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const initialAccounts: CurrentAccount[] = [
  { 
    id: "CARI-001", name: "Zeta Madencilik A.Ş.", type: "Müşteri", taxId: "1234567890", taxOffice: "Boğaziçi", 
    phone: "0212 555 11 22", email: "muhasebe@zetamadencilik.com", balance: 125000,
    dealerGroup: "Platin", priceGroup: "Özel İskonto", riskLimit: 500000,
    subAccounts: [
      { id: "SUB-01", name: "Ahmet Yılmaz", email: "ahmet@zeta.com", role: "Satın Alma", balance: 5000 }
    ]
  },
  { 
    id: "CARI-002", name: "Omega Gıda Ltd. Şti.", type: "Müşteri", taxId: "9876543210", taxOffice: "Marmara", 
    phone: "0216 444 33 22", email: "info@omegagida.com", balance: -45000,
    dealerGroup: "Gold", priceGroup: "Liste"
  },
];

const initialTransactions: Transaction[] = [
  { id: "TRX-1001", accountId: "CARI-001", date: "2026-05-12 14:30", type: "Satış Faturası", amount: 45000, description: "B2B Sipariş #ORD-5521", paymentMethod: "Kredi Kartı" },
  { id: "TRX-1003", accountId: "CARI-002", date: "2026-05-10 16:45", type: "Tahsilat", amount: 15000, description: "Kredi Kartı Tahsilatı", paymentMethod: "Kredi Kartı" },
];

const initialBanks: Bank[] = [
  { id: "BNK-01", name: "Garanti BBVA", accountNumber: "1234-5678", iban: "TR00 1111 2222 3333 4444 5555 66", balance: 450000, currency: "TRY", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Garanti_BBVA_logo.svg/1024px-Garanti_BBVA_logo.svg.png" },
  { id: "BNK-03", name: "Iyzico Sanal POS", accountNumber: "IYZ-POS-01", iban: "---", balance: 85200, currency: "TRY", logo: "https://web-static.iyzipay.com/iyzico-logo-white.png" },
];

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [accounts, setAccounts] = useState<CurrentAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);

  const fetchFinanceData = async () => {
    try {
      const res = await fetch('/api/finance');
      const data = await res.json();
      if (data.transactions) setTransactions(data.transactions);
      if (data.banks) setBanks(data.banks);
      if (data.invoices) setInvoices(data.invoices);
    } catch (err) { console.error(err); }
  };

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/dealers');
      const data = await res.json();
      if (Array.isArray(data)) setAccounts(data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchFinanceData();
    fetchAccounts();
  }, []);

  const addAccount = async (account: CurrentAccount) => {
    try {
      const res = await fetch('/api/dealers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(account)
      });
      if (res.ok) fetchAccounts();
    } catch (err) { console.error(err); }
  };

  const updateAccount = async (updatedAccount: CurrentAccount) => {
    try {
      const res = await fetch('/api/dealers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedAccount)
      });
      if (res.ok) {
        setAccounts(accounts.map(a => a.id === updatedAccount.id ? updatedAccount : a));
      }
    } catch (err) { console.error(err); }
  };

  const deleteAccount = (id: string) => {
    setAccounts(accounts.filter(a => a.id !== id));
  };

  const addTransaction = async (transaction: Transaction) => {
    try {
      const res = await fetch('/api/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transaction)
      });
      if (res.ok) {
        fetchFinanceData();
        fetchAccounts();
      }
    } catch (err) { console.error(err); }
  };

  const addInvoice = (invoice: Invoice) => {
    setInvoices([...invoices, invoice]);
  };

  const updateBankBalance = (bankId: string, amount: number) => {
    setBanks(banks.map(b => b.id === bankId ? { ...b, balance: b.balance + amount } : b));
  };

  const addSubAccount = (dealerId: string, sub: SubAccount) => {
    setAccounts(accounts.map(acc => {
      if (acc.id === dealerId) {
        return { ...acc, subAccounts: [...(acc.subAccounts || []), sub] };
      }
      return acc;
    }));
  };

  return (
    <FinanceContext.Provider value={{ 
      accounts, transactions, invoices, banks, 
      addAccount, updateAccount, deleteAccount, 
      addTransaction, addInvoice, updateBankBalance, 
      addSubAccount, fetchAccounts 
    }}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error("useFinance must be used within a FinanceProvider");
  }
  return context;
}
