"use client";

import React from "react";
import { 
  Shield, 
  Award, 
  Users, 
  TrendingUp, 
  UserCheck, 
  DollarSign, 
  Building2, 
  GitCommit, 
  ChevronRight,
  Crown
} from "lucide-react";
import { CurrentAccount, SubAccount } from "../types";

interface DealerTierCenterProps {
  dealer: CurrentAccount;
  allDealers: CurrentAccount[];
}

export default function DealerTierCenter({ dealer, allDealers }: DealerTierCenterProps) {
  // Find parent dealer if applicable
  const parentDealer = allDealers.find((d) => d.id === dealer.parentDealerId);
  
  // Find child dealers if applicable
  const childDealers = allDealers.filter((d) => d.parentDealerId === dealer.id);

  // Credit risk limit calculation
  const riskLimit = dealer.riskLimit || 0;
  const balance = dealer.balance || 0;
  const creditLimit = dealer.creditLimit || 0;

  const riskPercent = riskLimit > 0 ? Math.min((balance / riskLimit) * 100, 100) : 0;
  const activeSubsCount = dealer.subAccounts?.length || 0;

  // Determine tier styles and benefits
  const getTierDetails = (group: string) => {
    switch (group) {
      case "Platin":
        return {
          icon: Shield,
          color: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900/50",
          benefit: "%20 Sabit İskonto, Öncelikli Lojistik, 90 Gün Vade",
          pointsMult: "1.5x Puan Çarpanı"
        };
      case "Gold":
        return {
          icon: Award,
          color: "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900/50",
          benefit: "%15 Sabit İskonto, 60 Gün Vade, Özel Müşteri Temsilcisi",
          pointsMult: "1.2x Puan Çarpanı"
        };
      case "Silver":
        return {
          icon: TrendingUp,
          color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50",
          benefit: "%10 Sabit İskonto, 30 Gün Vade",
          pointsMult: "1.0x Puan Çarpanı"
        };
      case "Standart":
      default:
        return {
          icon: UserCheck,
          color: "text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/20 border-slate-200 dark:border-slate-800",
          benefit: "Standart Liste Fiyatı, Peşin veya Kredi Kartı Ödeme",
          pointsMult: "1.0x Puan Çarpanı"
        };
    }
  };

  const tier = getTierDetails(dealer.dealerGroup);
  const TierIcon = tier.icon;

  return (
    <div className="space-y-6">
      {/* Tier and Loyalty Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Tier Info Card */}
        <div className="glass border border-slate-200/60 dark:border-slate-850 p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Mevcut Bayi Seviyesi</h4>
              <h3 className="text-xl font-black text-slate-800 dark:text-white mt-1 uppercase flex items-center gap-1.5">
                <span className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-black ${tier.color}`}>
                  <TierIcon className="w-4 h-4" />
                  {dealer.dealerGroup} TIER
                </span>
              </h3>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-850/50">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Tanımlı Ayrıcalıklar</p>
            <p className="text-xs text-slate-700 dark:text-slate-300 font-bold mt-1">{tier.benefit}</p>
            <div className="flex items-center gap-1.5 px-3 py-1 mt-2 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-full border border-amber-200 dark:border-amber-900/50 w-fit">
              <Crown className="w-3.5 h-3.5" />
              <span className="text-xs font-bold">{tier.pointsMult}</span>
            </div>
          </div>
        </div>

        {/* Loyalty Points Card */}
        <div className="glass border border-slate-200/60 dark:border-slate-850 p-5 rounded-2xl flex flex-col justify-between bg-gradient-to-br from-amber-50/20 to-amber-100/10 dark:from-amber-950/5 dark:to-amber-950/10">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="text-[10px] text-amber-600 font-black uppercase tracking-widest">Sadakat Kulübü Hakedişi</h4>
              <p className="text-3xl font-black text-[#f97316] mt-1.5">
                {dealer.loyaltyPoints.toLocaleString("tr-TR")} <span className="text-xs font-bold uppercase tracking-wide">Puan</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-[#f97316] flex items-center justify-center border border-amber-500/20">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-amber-200/20">
            <p className="text-[10px] text-slate-400 font-semibold">Tüm alışverişlerden kazanılan puanlar sonraki siparişlerde indirim çekine veya hediyelere dönüştürülebilir.</p>
          </div>
        </div>

      </div>

      {/* Credit Limits and Risk Usage */}
      <div className="glass border border-slate-200/60 dark:border-slate-850 p-5 rounded-2xl space-y-4">
        <div>
          <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">Kredi Limiti ve Risk Durumu</h4>
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">ERP cari risk kullanımı</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50/50 dark:bg-slate-950/20 p-4 rounded-xl border border-slate-150/80 dark:border-slate-850/80">
          <div className="space-y-0.5">
            <span className="text-[9px] text-slate-400 font-black uppercase">Toplam Borç Bakiye</span>
            <p className="text-sm font-black text-slate-800 dark:text-slate-200">
              {balance.toLocaleString("tr-TR")} ₺
            </p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[9px] text-slate-400 font-black uppercase">Açık Risk Limiti</span>
            <p className="text-sm font-black text-blue-600 dark:text-blue-400">
              {riskLimit.toLocaleString("tr-TR")} ₺
            </p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[9px] text-slate-400 font-black uppercase">Kredi Teminat Limiti</span>
            <p className="text-sm font-black text-emerald-600 dark:text-emerald-450">
              {creditLimit.toLocaleString("tr-TR")} ₺
            </p>
          </div>
        </div>

        {/* Risk progress bar */}
        {riskLimit > 0 && (
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between items-center text-[10px] font-black uppercase">
              <span className="text-slate-500">Risk Kullanım Oranı</span>
              <span className={riskPercent > 80 ? "text-red-500 font-black" : "text-slate-700 dark:text-slate-300"}>
                %{Math.round(riskPercent)}
              </span>
            </div>
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${
                  riskPercent > 80 
                    ? "bg-red-500" 
                    : riskPercent > 50 
                    ? "bg-orange-500" 
                    : "bg-orange-500"
                }`}
                style={{ width: `${riskPercent}%` }}
              />
            </div>
            {riskPercent > 80 && (
              <p className="text-[9px] text-red-500 font-bold uppercase tracking-wider animate-pulse">
                ⚠️ UYARI: Cari hesap risk limiti dolmak üzere, sipariş geçişleri kısıtlanabilir!
              </p>
            )}
          </div>
        )}
      </div>

      {/* Corporate Hierarchies (Parent & Subsidiary & Child accounts) */}
      <div className="glass border border-slate-200/60 dark:border-slate-850 p-5 rounded-2xl space-y-4">
        <div>
          <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center gap-1">
            <Building2 className="w-4 h-4 text-orange-600 dark:text-amber-500" /> Kurumsal Hiyerarşi &amp; Grup Bağlantıları
          </h4>
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Merkez / Şube ve Alt bayi ilişkileri</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Parent Dealer Node */}
          <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20 space-y-2">
            <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Ana Bayi / Üst Cari</span>
            {parentDealer ? (
              <div className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 border border-slate-150/60 dark:border-slate-800 rounded-lg">
                <div>
                  <p className="text-xs font-black text-slate-800 dark:text-white uppercase">{parentDealer.name}</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">{parentDealer.id} | Bakiye: {parentDealer.balance.toLocaleString()} ₺</p>
                </div>
                <GitCommit className="w-4 h-4 text-[#f97316]" />
              </div>
            ) : (
              <p className="text-xs text-slate-400 font-medium italic p-2">Bu cari hesap bağımsız bir ana bayidir.</p>
            )}
          </div>

          {/* Child Dealers Nodes */}
          <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20 space-y-2">
            <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Bağlı Alt Bayiler ({childDealers.length})</span>
            {childDealers.length > 0 ? (
              <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                {childDealers.map((child) => (
                  <div key={child.id} className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 border border-slate-150/60 dark:border-slate-800 rounded-lg text-xs">
                    <div>
                      <p className="font-black text-slate-700 dark:text-slate-300 uppercase">{child.name}</p>
                      <p className="text-[8px] text-slate-400 font-bold uppercase">{child.id} | Bakiye: {child.balance.toLocaleString()} ₺</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 font-medium italic p-2">Bu bayiye bağlı alt bayi bulunmuyor.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
