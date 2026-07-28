"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { 
  Database, 
  Download, 
  RefreshCw, 
  Trash2, 
  Settings, 
  Clock, 
  ShieldAlert, 
  Activity, 
  FileText, 
  Check, 
  Loader2, 
  Copy, 
  Calendar,
  Layers,
  HardDrive,
  Play,
  GitBranch,
  Terminal,
  Cpu,
  GitCommit,
  ArrowRight,
  AlertCircle,
  Sliders,
  Plus,
  Edit,
  Tag,
  Percent,
  Save,
  Building,
  X,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Undo,
  Redo,
  Eraser,
  Table,
  Code,
  Quote,
  Palette,
  Type,
  Link as LinkIcon,
  Image as ImageIcon
} from "lucide-react";
import { toast } from "sonner";
import { turkeyLocations } from "@/data/turkey-locations";

interface BackupFile {
  filename: string;
  size: number;
  createdAt: string;
}

interface BackupStats {
  dbSize: number;
  dbProvider: "mysql" | "sqlite";
  totalBackups: number;
  totalSize: number;
  lastBackupDate: string | null;
}

interface BackupConfig {
  autoBackup: boolean;
  scheduleHour: number;
  retentionDays: number;
  cronToken: string;
}

interface DeployData {
  success: boolean;
  system: {
    nodeVersion: string;
    platform: string;
    uptime: number;
    database: string;
  };
  git: {
    branch: string;
    hash: string;
    author: string;
    message: string;
    date: string;
    status: 'Clean' | 'Modified';
    behind: number;
  };
  pm2: {
    active: boolean;
    uptime: string;
    memory: string;
    restarts: number;
    status: string;
    pid: number;
  };
  deploy: {
    status: 'idle' | 'running' | 'success' | 'failed';
    startedAt: string | null;
    completedAt: string | null;
    error: string | null;
    logs: string;
  };
}

const normalizeCityName = (cityStr: string): string => {
  if (!cityStr) return "";
  const keys = Object.keys(turkeyLocations);
  const match = keys.find(k => k.toLocaleLowerCase('tr') === cityStr.toLocaleLowerCase('tr'));
  return match || cityStr;
};

const normalizeDistrictName = (cityStr: string, distStr: string): string => {
  if (!cityStr || !distStr) return "";
  const normalizedCity = normalizeCityName(cityStr);
  const districts = turkeyLocations[normalizedCity] || [];
  const match = districts.find(d => d.toLocaleLowerCase('tr') === distStr.toLocaleLowerCase('tr'));
  return match || distStr;
};

export default function BackupAdminPage() {
  const [activeTab, setActiveTab] = useState<'backup' | 'deployment' | 'settings' | 'company'>('backup');
  
  // Backup states
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [stats, setStats] = useState<BackupStats | null>(null);
  const [config, setConfig] = useState<BackupConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Progress & Confirmation modals states
  const [progressVisible, setProgressVisible] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressText, setProgressText] = useState("");
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [backupToRestore, setBackupToRestore] = useState<string | null>(null);
  const [confirmInput, setConfirmInput] = useState("");

  // Deployment states
  const [deployData, setDeployData] = useState<DeployData | null>(null);
  const [deployLoading, setDeployLoading] = useState(true);
  const [triggerLoading, setTriggerLoading] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement | null>(null);

  // E-Fatura & E-Arşiv & Bank settings states
  const [settings, setSettings] = useState<any>(null);
  const [efaturaPrefix, setEfaturaPrefix] = useState<string>("GIB");
  const [earsivPrefix, setEarsivPrefix] = useState<string>("EAR");
  const [gibApiKey, setGibApiKey] = useState<string>("");
  const [gibApiUrl, setGibApiUrl] = useState<string>("https://earsiv.gib.gov.tr");
  const [cartDiscountType, setCartDiscountType] = useState<string>("none");
  const [cartDiscountValue, setCartDiscountValue] = useState<number>(0);
  const [cartDiscountMinAmount, setCartDiscountMinAmount] = useState<number>(0);
  const [bankTransferDiscountRate, setBankTransferDiscountRate] = useState<number>(0);
  const [companyName, setCompanyName] = useState<string>("");
  const [bankName, setBankName] = useState<string>("");
  const [bankIban, setBankIban] = useState<string>("");

  // Firma Bilgileri & Parametreleri states
  const [contactEmail, setContactEmail] = useState<string>("");
  const [contactPhone, setContactPhone] = useState<string>("");
  const [contactAddress, setContactAddress] = useState<string>("");
  const [socialWhatsapp, setSocialWhatsapp] = useState<string>("");
  const [companyOwnerName, setCompanyOwnerName] = useState<string>("");
  const [companyOwnerSurname, setCompanyOwnerSurname] = useState<string>("");
  const [companyTaxNo, setCompanyTaxNo] = useState<string>("");
  const [companyTaxOffice, setCompanyTaxOffice] = useState<string>("");
  const [companyFax, setCompanyFax] = useState<string>("");
  const [companyGsm, setCompanyGsm] = useState<string>("");
  const [companyKepAddress, setCompanyKepAddress] = useState<string>("");
  const [companyMersisNo, setCompanyMersisNo] = useState<string>("");
  const [companySicilNo, setCompanySicilNo] = useState<string>("");
  const [companyRegion, setCompanyRegion] = useState<string>("");
  const [companyCountry, setCompanyCountry] = useState<string>("");
  const [companyCity, setCompanyCity] = useState<string>("");
  const [companyDistrict, setCompanyDistrict] = useState<string>("");
  const [companyBuildingName, setCompanyBuildingName] = useState<string>("");
  const [companyBuildingNo, setCompanyBuildingNo] = useState<string>("");
  const [companyStreet, setCompanyStreet] = useState<string>("");
  const [companyPostalCode, setCompanyPostalCode] = useState<string>("");
  const [companyWebsite, setCompanyWebsite] = useState<string>("");
  
  // Firma Varsayılanları
  const [companyDefaultKdv, setCompanyDefaultKdv] = useState<number>(20);
  const [companyDefaultUnit, setCompanyDefaultUnit] = useState<string>("Adet");
  const [companyDefaultReturnDays, setCompanyDefaultReturnDays] = useState<number>(30);
  const [companySalesKdvIncluded, setCompanySalesKdvIncluded] = useState<boolean>(true);
  const [companyPurchaseKdvIncluded, setCompanyPurchaseKdvIncluded] = useState<boolean>(true);
  const [companyDefaultLanguages, setCompanyDefaultLanguages] = useState<string>("TR, EN");
  const [companyExcludedChars, setCompanyExcludedChars] = useState<string>("*?/_");
  const [companyDefaultTevkifatCode, setCompanyDefaultTevkifatCode] = useState<string>("");
  const [companyListStartDay, setCompanyListStartDay] = useState<number>(15);
  
  // Firma Parametreleri
  const [companyAutoSendEarsivMail, setCompanyAutoSendEarsivMail] = useState<boolean>(true);
  const [companyUsePaymentPlan, setCompanyUsePaymentPlan] = useState<boolean>(true);
  const [companyAutoUpdatePriceByMargin, setCompanyAutoUpdatePriceByMargin] = useState<boolean>(true);
  const [companyUseCurrencyInPurchase, setCompanyUseCurrencyInPurchase] = useState<boolean>(true);
  const [companyAutoDeductInstallments, setCompanyAutoDeductInstallments] = useState<boolean>(true);
  const [companyUseRowRateInPurchase, setCompanyUseRowRateInPurchase] = useState<boolean>(false);
  const [companyCheckCurrentVkn, setCompanyCheckCurrentVkn] = useState<boolean>(true);
  
  // E-Fatura Ayarları
  const [companyInvoiceFooter, setCompanyInvoiceFooter] = useState<string>(
    '<table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-family: sans-serif; font-size: 12px; text-align: left;"><tbody><tr style="background-color: #f8fafc;"><td colspan="2" style="border: 1px solid #e2e8f0; padding: 8px; font-weight: bold; text-align: center;">BANKA HESAP NUMARALARIMIZ</td></tr><tr style="font-weight: bold; background-color: #f1f5f9;"><td style="border: 1px solid #e2e8f0; padding: 8px; width: 40%;">BANKA</td><td style="border: 1px solid #e2e8f0; padding: 8px; width: 60%;">IBAN</td></tr><tr><td style="border: 1px solid #e2e8f0; padding: 8px; font-weight: bold;">Ziraat Bankası</td><td style="border: 1px solid #e2e8f0; padding: 8px; font-family: monospace;">TR44 0001 0001 1297 8223 5950 01</td></tr></tbody></table>'
  );
  const [companyLogoFile, setCompanyLogoFile] = useState<File | null>(null);
  const [companyStampFile, setCompanyStampFile] = useState<File | null>(null);
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string>("");
  const [companyStampUrl, setCompanyStampUrl] = useState<string>("");

  // WYSIWYG HTML Editor States
  const [isHtmlEditorOpen, setIsHtmlEditorOpen] = useState(false);
  const [editorContent, setEditorContent] = useState("");
  const [showSource, setShowSource] = useState(false);

  const [rulesSaving, setRulesSaving] = useState(false);
  const [gibLoading, setGibLoading] = useState(false);

  const [banks, setBanks] = useState<any[]>([]);
  const [banksLoading, setBanksLoading] = useState(false);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<any>(null);
  const [bankForm, setBankForm] = useState({
    name: "",
    accountNumber: "",
    iban: "",
    currency: "TRY",
    branch: "",
    type: "VADESIZ"
  });

  const fetchData = async () => {
    try {
      const res = await fetch("/api/backup", { cache: "no-store" });
      if (!res.ok) throw new Error("Yedekleme verileri alınamadı.");
      const data = await res.json();
      setBackups(data.backups || []);
      setStats(data.stats || null);
      setConfig(data.config || null);
    } catch (err: any) {
      toast.error(err.message || "İletişim hatası oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const fetchDeployData = async (silent = false) => {
    if (!silent) setDeployLoading(true);
    try {
      const res = await fetch("/api/admin/deploy", { cache: "no-store" });
      if (!res.ok) throw new Error("Sistem tanı bilgileri alınamadı.");
      const data = await res.json();
      setDeployData(data);
    } catch (err: any) {
      console.warn("Deploy fetch error:", err.message);
    } finally {
      if (!silent) setDeployLoading(false);
    }
  };

  const fetchRules = async () => {
    try {
      // Fetch GİB settings
      try {
        const gibRes = await fetch("/api/integrations/gib-settings");
        if (gibRes.ok) {
          const gibData = await gibRes.json();
          setGibApiKey(gibData.gibApiKey || "");
          setGibApiUrl(gibData.gibApiUrl || "https://earsiv.gib.gov.tr");
        }
      } catch (gibErr) {
        console.error("Error fetching GIB settings:", gibErr);
      }

      const res = await fetch(`/api/settings?t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        if (data) {
          setEfaturaPrefix(data.efaturaPrefix || "GIB");
          setEarsivPrefix(data.earsivPrefix || "EAR");
          setCartDiscountType(data.cartDiscountType || "none");
          setCartDiscountValue(data.cartDiscountValue ?? 0);
          setCartDiscountMinAmount(data.cartDiscountMinAmount ?? 0);
          setBankTransferDiscountRate(data.bankTransferDiscountRate ?? 0);
          setCompanyName(data.companyName || "");
          setBankName(data.bankName || "");
          setBankIban(data.bankIban || "");
          setContactEmail(data.contactEmail || "");
          setContactPhone(data.contactPhone || "");
          setContactAddress(data.contactAddress || "");
          setSocialWhatsapp(data.socialWhatsapp || "");

          // Company details & parameters
          setCompanyOwnerName(data.companyOwnerName || "");
          setCompanyOwnerSurname(data.companyOwnerSurname || "");
          setCompanyTaxNo(data.companyTaxNo || "");
          setCompanyTaxOffice(data.companyTaxOffice || "");
          setCompanyFax(data.companyFax || "");
          setCompanyGsm(data.companyGsm || "");
          setCompanyKepAddress(data.companyKepAddress || "");
          setCompanyMersisNo(data.companyMersisNo || "");
          setCompanySicilNo(data.companySicilNo || "");
          setCompanyRegion(data.companyRegion || "");
          setCompanyCountry(data.companyCountry || "");
          const normalizedCity = normalizeCityName(data.companyCity || "");
          setCompanyCity(normalizedCity);
          setCompanyDistrict(normalizeDistrictName(normalizedCity, data.companyDistrict || ""));
          setCompanyBuildingName(data.companyBuildingName || "");
          setCompanyBuildingNo(data.companyBuildingNo || "");
          setCompanyStreet(data.companyStreet || "");
          setCompanyPostalCode(data.companyPostalCode || "");
          setCompanyWebsite(data.companyWebsite || "");

          // Company defaults
          setCompanyDefaultKdv(data.companyDefaultKdv ?? 20);
          setCompanyDefaultUnit(data.companyDefaultUnit || "Adet");
          setCompanyDefaultReturnDays(data.companyDefaultReturnDays ?? 30);
          setCompanySalesKdvIncluded(data.companySalesKdvIncluded ?? true);
          setCompanyPurchaseKdvIncluded(data.companyPurchaseKdvIncluded ?? true);
          setCompanyDefaultLanguages(data.companyDefaultLanguages || "TR, EN");
          setCompanyExcludedChars(data.companyExcludedChars || "*?/_");
          setCompanyDefaultTevkifatCode(data.companyDefaultTevkifatCode || "");
          setCompanyListStartDay(data.companyListStartDay ?? 15);

          // Company parameters
          setCompanyAutoSendEarsivMail(data.companyAutoSendEarsivMail ?? true);
          setCompanyUsePaymentPlan(data.companyUsePaymentPlan ?? true);
          setCompanyAutoUpdatePriceByMargin(data.companyAutoUpdatePriceByMargin ?? true);
          setCompanyUseCurrencyInPurchase(data.companyUseCurrencyInPurchase ?? true);
          setCompanyAutoDeductInstallments(data.companyAutoDeductInstallments ?? true);
          setCompanyUseRowRateInPurchase(data.companyUseRowRateInPurchase ?? false);
          setCompanyCheckCurrentVkn(data.companyCheckCurrentVkn ?? true);

          // E-Fatura & logo urls
          setCompanyInvoiceFooter(data.companyInvoiceFooter || '<table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-family: sans-serif; font-size: 12px; text-align: left;"><tbody><tr style="background-color: #f8fafc;"><td colspan="2" style="border: 1px solid #e2e8f0; padding: 8px; font-weight: bold; text-align: center;">BANKA HESAP NUMARALARIMIZ</td></tr><tr style="font-weight: bold; background-color: #f1f5f9;"><td style="border: 1px solid #e2e8f0; padding: 8px; width: 40%;">BANKA</td><td style="border: 1px solid #e2e8f0; padding: 8px; width: 60%;">IBAN</td></tr><tr><td style="border: 1px solid #e2e8f0; padding: 8px; font-weight: bold;">Ziraat Bankası</td><td style="border: 1px solid #e2e8f0; padding: 8px; font-family: monospace;">TR44 0001 0001 1297 8223 5950 01</td></tr></tbody></table>');
          setCompanyLogoUrl(data.logoUrl || "");
          setCompanyStampUrl(data.companyStampUrl || "");
        }
      }
    } catch (err) {
      console.error("Error loading rules:", err);
    }
  };

  const handleSaveRules = async () => {
    if (!settings) return;
    setRulesSaving(true);
    try {
      let finalLogoUrl = companyLogoUrl;
      let finalStampUrl = companyStampUrl;

      // Upload logo if selected
      if (companyLogoFile) {
        const logoData = new FormData();
        logoData.append("file", companyLogoFile);
        const res = await fetch("/api/upload", { method: "POST", body: logoData });
        if (res.ok) {
          const resJson = await res.json();
          if (resJson.url) {
            finalLogoUrl = resJson.url;
            setCompanyLogoUrl(resJson.url);
          }
        }
      }

      // Upload stamp if selected
      if (companyStampFile) {
        const stampData = new FormData();
        stampData.append("file", companyStampFile);
        const res = await fetch("/api/upload", { method: "POST", body: stampData });
        if (res.ok) {
          const resJson = await res.json();
          if (resJson.url) {
            finalStampUrl = resJson.url;
            setCompanyStampUrl(resJson.url);
          }
        }
      }

      const updatedSettings = {
        ...settings,
        efaturaPrefix: efaturaPrefix.toUpperCase().replace(/[^A-Z0-9]/g, ""),
        earsivPrefix: earsivPrefix.toUpperCase().replace(/[^A-Z0-9]/g, ""),
        cartDiscountType,
        cartDiscountValue: Number(cartDiscountValue),
        cartDiscountMinAmount: Number(cartDiscountMinAmount),
        bankTransferDiscountRate: Number(bankTransferDiscountRate),
        companyName,
        bankName,
        bankIban,
        contactEmail,
        contactPhone,
        contactAddress,
        socialWhatsapp,
        
        // New company settings fields
        companyOwnerName,
        companyOwnerSurname,
        companyTaxNo,
        companyTaxOffice,
        companyFax,
        companyGsm,
        companyKepAddress,
        companyMersisNo,
        companySicilNo,
        companyRegion,
        companyCountry,
        companyCity,
        companyDistrict,
        companyBuildingName,
        companyBuildingNo,
        companyStreet,
        companyPostalCode,
        companyWebsite,
        logoUrl: finalLogoUrl,
        companyStampUrl: finalStampUrl,

        companyDefaultKdv: Number(companyDefaultKdv),
        companyDefaultUnit,
        companyDefaultReturnDays: Number(companyDefaultReturnDays),
        companySalesKdvIncluded,
        companyPurchaseKdvIncluded,
        companyDefaultLanguages,
        companyExcludedChars,
        companyDefaultTevkifatCode,
        companyListStartDay: Number(companyListStartDay),

        companyAutoSendEarsivMail,
        companyUsePaymentPlan,
        companyAutoUpdatePriceByMargin,
        companyUseCurrencyInPurchase,
        companyAutoDeductInstallments,
        companyUseRowRateInPurchase,
        companyCheckCurrentVkn,

        companyInvoiceFooter
      };

      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings)
      });

      if (res.ok) {
        try {
          const gibRes = await fetch("/api/integrations/gib-settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ gibApiKey, gibApiUrl })
          });
          if (!gibRes.ok) {
            const gibErr = await gibRes.json();
            toast.error(`GİB Ayarları Kayıt Hatası: ${gibErr.error || 'Bilinmeyen Hata'}`);
          }
        } catch (gibSaveErr: any) {
          console.error("GIB save error:", gibSaveErr);
          toast.error(`GİB Ayarları Sunucu Hatası: ${gibSaveErr.message}`);
        }

        toast.success("Ayarlar başarıyla kaydedildi!");
        fetchRules();
        setCompanyLogoFile(null);
        setCompanyStampFile(null);
      } else {
        const errData = await res.json();
        toast.error(`Kayıt hatası: ${errData.error || 'Bilinmeyen Hata'}`);
      }
    } catch (e: any) {
      toast.error(`Sunucu bağlantı hatası: ${e.message}`);
    } finally {
      setRulesSaving(false);
    }
  };

  const handleFetchFromGib = async () => {
    const vkn = (companyTaxNo || "").trim().replace(/\s/g, "");
    if (!vkn || (vkn.length !== 10 && vkn.length !== 11)) {
      toast.error("Lütfen 10 haneli geçerli bir Vergi No veya 11 haneli T.C. Kimlik No giriniz.");
      return;
    }
    setGibLoading(true);
    const toastId = toast.loading("GİB/Maliyeden mükellef bilgileri sorgulanıyor...");
    try {
      const res = await fetch(`/api/integrations/gib-sorgu?vkn=${vkn}`);
      toast.dismiss(toastId);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const fetchedCompanyName = data.firmaAdi || "";
          setCompanyName(fetchedCompanyName);
          setCompanyTaxOffice(data.vergiDairesi || "");
          setCompanyOwnerName(data.ad || "");
          setCompanyOwnerSurname(data.soyad || "");
          setContactEmail(data.email || "");
          setContactPhone(data.tel || "");
          setContactAddress(data.adres || "");
          setSocialWhatsapp(data.tel || "");
          setCompanyGsm(data.tel || "");
          setCompanyFax(data.fax || "");
          setCompanyKepAddress(data.kepAddress || "");
          setCompanyMersisNo(data.mersisNo || "");
          setCompanySicilNo(data.sicilNo || "");
          setCompanyRegion(data.bolge || "");
          setCompanyCountry("TÜRKİYE");
          const gibCity = normalizeCityName(data.sehir || "");
          setCompanyCity(gibCity);
          setCompanyDistrict(normalizeDistrictName(gibCity, data.ilce || ""));
          setCompanyBuildingName(data.binaAdi || "");
          setCompanyBuildingNo(data.binaNo || "");
          setCompanyStreet(data.sokak || "");
          setCompanyPostalCode(data.postaKodu || "");
          setCompanyWebsite(data.website || "");
          toast.success("Maliye / GİB sisteminden mükellef bilgileri başarıyla çekildi!");
        } else {
          toast.error(data.error || "GİB sorgusu başarısız oldu.");
        }
      } else {
        const errJson = await res.json();
        toast.error(errJson?.error || "GİB entegrasyon hatası oluştu.");
      }
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error(`Bağlantı hatası: ${err.message}`);
    } finally {
      setGibLoading(false);
    }
  };

  const executeEditorCommand = (command: string, value: string = "") => {
    document.execCommand(command, false, value);
    // Refresh content state
    const editorEl = document.getElementById("wysiwyg-editor");
    if (editorEl) {
      setEditorContent(editorEl.innerHTML);
    }
  };

  const insertHTMLAtCursor = (html: string) => {
    // Focus the editor first to ensure selection refers to it
    const editorEl = document.getElementById("wysiwyg-editor");
    if (editorEl) {
      editorEl.focus();
    }

    const sel = window.getSelection();
    if (sel && sel.getRangeAt && sel.rangeCount) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      
      const el = document.createElement("div");
      el.innerHTML = html;
      
      const frag = document.createDocumentFragment();
      let node, lastNode;
      while ((node = el.firstChild)) {
        lastNode = frag.appendChild(node);
      }
      range.insertNode(frag);
      
      if (lastNode) {
        const newRange = range.cloneRange();
        newRange.setStartAfter(lastNode);
        newRange.collapse(true);
        sel.removeAllRanges();
        sel.addRange(newRange);
      }
      
      // Update editorContent state
      setEditorContent(editorEl ? editorEl.innerHTML : "");
    } else {
      // Fallback
      if (editorEl) {
        editorEl.innerHTML += html;
        setEditorContent(editorEl.innerHTML);
      }
    }
  };

  const fetchBanks = async () => {
    setBanksLoading(true);
    try {
      const res = await fetch("/api/accounting/banks");
      if (res.ok) {
        const json = await res.json();
        const list = Array.isArray(json) ? json : (json?.data || []);
        setBanks(list);
      }
    } catch (err) {
      console.error("Error fetching banks:", err);
    } finally {
      setBanksLoading(false);
    }
  };

  const openAddBank = () => {
    setBankForm({
      name: "",
      accountNumber: "",
      iban: "",
      currency: "TRY",
      branch: "",
      type: "VADESIZ"
    });
    setEditingBank(null);
    setIsBankModalOpen(true);
  };

  const openEditBank = (bank: any) => {
    setBankForm({
      name: bank.name || "",
      accountNumber: bank.accountNumber || "",
      iban: bank.iban || "",
      currency: bank.currency || "TRY",
      branch: bank.branch || "",
      type: bank.type || "VADESIZ"
    });
    setEditingBank(bank);
    setIsBankModalOpen(true);
  };

  const handleSaveBank = async () => {
    if (!bankForm.name.trim()) {
      toast.error("Banka adı zorunludur.");
      return;
    }
    try {
      const url = editingBank 
        ? `/api/accounting/banks/${editingBank.id}`
        : "/api/accounting/banks";
      const method = editingBank ? "PATCH" : "POST";
      
      const payload = {
        ...bankForm,
        balance: editingBank ? editingBank.balance : 0
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsBankModalOpen(false);
        fetchBanks();
        toast.success("Banka hesabı başarıyla kaydedildi.");
      } else {
        const errJson = await res.json();
        toast.error(errJson?.error || "Banka hesabı kaydedilirken bir hata oluştu.");
      }
    } catch (err) {
      console.error("Error saving bank:", err);
      toast.error("Bir hata oluştu.");
    }
  };

  const handleDeleteBank = async (id: string) => {
    if (!confirm("Bu banka hesabını silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`/api/accounting/banks/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        fetchBanks();
        toast.success("Banka hesabı silindi.");
      } else {
        toast.error("Banka hesabı silinirken bir hata oluştu.");
      }
    } catch (err) {
      console.error("Error deleting bank:", err);
    }
  };

  useEffect(() => {
    fetchData();
    fetchDeployData();
  }, []);

  // Poll deployment status if it's currently running
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (deployData?.deploy?.status === 'running') {
      interval = setInterval(() => {
        fetchDeployData(true);
      }, 1500);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [deployData?.deploy?.status]);

  // Scroll terminal to bottom when new logs arrive
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [deployData?.deploy?.logs]);

  const simulateProgress = (text: string, callback: () => Promise<void>) => {
    setProgressText(text);
    setProgressPercent(0);
    setProgressVisible(true);

    const interval = setInterval(() => {
      setProgressPercent(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + Math.floor(Math.random() * 15) + 5;
      });
    }, 200);

    callback()
      .then(() => {
        setProgressPercent(100);
        setTimeout(() => {
          setProgressVisible(false);
          fetchData();
        }, 600);
      })
      .catch((err) => {
        clearInterval(interval);
        setProgressVisible(false);
        toast.error(err.message || "İşlem başarısız oldu.");
      });
  };

  const triggerBackup = () => {
    simulateProgress("Veritabanı yedeği alınıyor...", async () => {
      const res = await fetch("/api/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "backup" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Yedek alınamadı.");
      toast.success("Veritabanı yedeği başarıyla alındı.");
    });
  };

  const triggerDelete = async (filename: string) => {
    if (!confirm("Bu yedeği kalıcı olarak silmek istediğinize emin misiniz?")) return;
    
    setActionLoading(filename);
    try {
      const res = await fetch("/api/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", filename }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Yedek silinemedi.");
      toast.success("Yedek dosyası silindi.");
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const openRestoreConfirmation = (filename: string) => {
    setBackupToRestore(filename);
    setConfirmInput("");
    setConfirmModalVisible(true);
  };

  const triggerRestore = () => {
    if (confirmInput.toLowerCase() !== "geri yukle" && confirmInput.toLowerCase() !== "geri yükle") {
      toast.error("İşlemi onaylamak için lütfen 'GERİ YÜKLE' yazın.");
      return;
    }
    
    setConfirmModalVisible(false);
    const filename = backupToRestore!;

    simulateProgress("Veritabanı yedeği geri yükleniyor. Lütfen bekleyin...", async () => {
      const res = await fetch("/api/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore", filename }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Geri yükleme başarısız.");
      toast.success("Veritabanı başarıyla yedeğe geri yüklendi.");
    });
  };

  const updateConfig = async (updatedFields: Partial<BackupConfig>) => {
    if (!config) return;
    const newConfig = { ...config, ...updatedFields };
    
    try {
      const res = await fetch("/api/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "updateConfig", config: newConfig }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ayarlar güncellenemedi.");
      setConfig(data.config);
      toast.success("Zamanlanmış yedekleme ayarları güncellendi.");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const copyCronToken = () => {
    if (!config) return;
    const url = `${window.location.origin}/api/backup/cron?token=${config.cronToken}`;
    navigator.clipboard.writeText(url);
    toast.success("Crontab tetikleyici URL kopyalandı.");
  };

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleDeploy = async () => {
    if (!confirm("Sunucuda derleme ve otomatik güncelleme sürecini başlatmak istediğinize emin misiniz? Sunucu kısa bir süre yeniden yüklenirken erişilemez olabilir.")) return;

    setTriggerLoading(true);
    try {
      const res = await fetch("/api/admin/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Güncelleme başlatılamadı.");
      toast.success("Dağıtım işlemi başlatıldı. Konsol çıktısını takip edebilirsiniz.");
      fetchDeployData(true);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setTriggerLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#b45309]" />
        <span className="text-sm text-gray-500 font-medium">Sistem durum raporları yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Tab Header Card */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-orange-500" />
              Sistem Yönetimi ve Operasyonlar
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Veritabanı yedeklerini yönetin, sistem tanılamalarını yapın, sunucu dağıtımlarını otomatikleştirin ve e-fatura/banka hesaplarını düzenleyin.
            </p>
          </div>
          <div className="flex gap-2">
            {activeTab === 'backup' ? (
              <button
                onClick={triggerBackup}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition shadow-sm cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Şimdi Yedek Al
              </button>
            ) : activeTab === 'deployment' ? (
              <button
                onClick={() => fetchDeployData(false)}
                disabled={deployLoading}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${deployLoading ? 'animate-spin' : ''}`} />
                Teşhisleri Yenile
              </button>
            ) : activeTab === 'settings' ? (
              <button
                onClick={openAddBank}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Banka Hesabı Ekle
              </button>
            ) : (
              <button
                onClick={handleSaveRules}
                disabled={rulesSaving}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition shadow-sm cursor-pointer disabled:opacity-50"
              >
                {rulesSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Bilgileri Güncelle
              </button>
            )}
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-t border-slate-100 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('backup')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
              activeTab === 'backup'
                ? 'bg-orange-50 text-orange-600'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
          >
            Veritabanı Yedekleme & Kurtarma
          </button>
          <button
            onClick={() => {
              setActiveTab('deployment');
              fetchDeployData(true);
            }}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'deployment'
                ? 'bg-orange-50 text-orange-600'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Otomatik Güncelleme & Canlı Dağıtım
          </button>
          <button
            onClick={() => {
              setActiveTab('settings');
              fetchRules();
              fetchBanks();
            }}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'settings'
                ? 'bg-orange-50 text-orange-600'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            E-Fatura & Banka Ayarları
          </button>
          <button
            onClick={() => {
              setActiveTab('company');
              fetchRules();
            }}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'company'
                ? 'bg-orange-50 text-orange-600'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            Firma Ayarları
          </button>
        </div>
      </div>

      {activeTab === 'backup' ? (
        <>
          {/* Backup Tab Content */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* DB Provider */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 text-slate-800 shadow-sm">
              <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-amber-500/5 rounded-full blur-xl" />
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Veritabanı Türü</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black tracking-tight text-slate-800 uppercase">
                      {stats?.dbProvider || "SQL"}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                  <Database className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 text-xs text-slate-500 flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-emerald-500" />
                <span>Aktif ve Bağlı Durumda</span>
              </div>
            </div>

            {/* DB Size */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 text-slate-800 shadow-sm">
              <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-orange-500/5 rounded-full blur-xl" />
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Veritabanı Boyutu</span>
                  <h3 className="text-2xl font-black tracking-tight text-slate-800">
                    {formatSize(stats?.dbSize || 0)}
                  </h3>
                </div>
                <div className="p-2.5 rounded-xl bg-orange-50 text-orange-600 border border-orange-100">
                  <HardDrive className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 text-xs text-slate-500 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-orange-500" />
                <span>İlişkisel Bütünlük Aktif</span>
              </div>
            </div>

            {/* Total Backups */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 text-slate-800 shadow-sm">
              <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl" />
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mevcut Yedek Sayısı</span>
                  <h3 className="text-2xl font-black tracking-tight text-slate-800">
                    {stats?.totalBackups || 0} Adet
                  </h3>
                </div>
                <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                  <FileText className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 text-xs text-slate-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                <span>Kümülatif Yedek: {formatSize(stats?.totalSize || 0)}</span>
              </div>
            </div>

            {/* Last Backup Date */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 text-slate-800 shadow-sm">
              <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-purple-500/5 rounded-full blur-xl" />
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Son Yedekleme Zamanı</span>
                  <h3 className="text-xs font-black tracking-tight text-slate-800">
                    {stats?.lastBackupDate ? new Date(stats.lastBackupDate).toLocaleString("tr-TR") : "Yedek Alınmadı"}
                  </h3>
                </div>
                <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 text-xs text-slate-500 flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-purple-500" />
                <span>Durum: Güvenli</span>
              </div>
            </div>
          </div>

          {/* Main Grid - Configuration & List */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Side: Scheduling Config */}
            <div className="space-y-6 lg:col-span-1">
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-6">
                <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
                  <Settings className="w-5 h-5 text-slate-500" />
                  <h2 className="font-bold text-slate-800 text-sm">Zamanlama Ayarları</h2>
                </div>

                {/* Config Switch */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-slate-700">Otomatik Yedekleme</label>
                    <p className="text-[11px] text-slate-400">Veritabanı her gün yedeklensin</p>
                  </div>
                  <button
                    onClick={() => updateConfig({ autoBackup: !config?.autoBackup })}
                    className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      config?.autoBackup ? "bg-orange-500" : "bg-slate-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        config?.autoBackup ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Schedule Hour */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Yedekleme Saati</label>
                  <select
                    disabled={!config?.autoBackup}
                    value={config?.scheduleHour ?? 3}
                    onChange={(e) => updateConfig({ scheduleHour: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/40 transition disabled:opacity-50 text-slate-700 bg-white"
                  >
                    {Array.from({ length: 24 }).map((_, i) => (
                      <option key={i} value={i}>
                        {String(i).padStart(2, "0")}:00
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400">Otomatik yedeklerin alınacağı gece saati.</p>
                </div>

                {/* Retention days */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Saklama Süresi (Gün)</label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={config?.retentionDays ?? 30}
                    onChange={(e) => updateConfig({ retentionDays: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/40 transition text-slate-700 bg-white"
                  />
                  <p className="text-[11px] text-slate-400">Sunucuda saklanacak gün sayısı. Daha eski yedekler otomatik silinir.</p>
                </div>

                {/* External Trigger */}
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block">Harici Cron Tetikleyici</label>
                    <p className="text-[11px] text-slate-400">cPanel veya Linux Crontab için URL</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={config ? `${window.location.origin}/api/backup/cron?token=${config.cronToken.substring(0, 8)}...` : ""}
                      className="flex-1 px-3 py-2 text-[11px] border border-slate-200 rounded-xl bg-slate-50 text-slate-500 select-all focus:outline-none"
                    />
                    <button
                      onClick={copyCronToken}
                      className="p-2 border border-slate-200 hover:border-slate-300 rounded-xl hover:bg-slate-50 transition text-slate-600 cursor-pointer"
                      title="Tetikleyici URL'ini Kopyala"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Her gece 03:00'te sistem yedeği almak üzere harici bir cron servisine bu URL'i GET veya POST isteği atacak şekilde tanımlayabilirsiniz.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Side: Backups List */}
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-slate-500" />
                    <h2 className="font-bold text-slate-800 text-sm">Yedek Geçmişi</h2>
                  </div>
                  <button 
                    onClick={fetchData} 
                    className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-50 transition cursor-pointer"
                    title="Yenile"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                {/* List */}
                {backups.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-2">
                    <Database className="w-10 h-10 opacity-30" />
                    <p className="text-xs font-semibold">Kayıtlı herhangi bir veritabanı yedeği bulunamadı.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                          <th className="pb-3 font-bold">Dosya Adı</th>
                          <th className="pb-3 font-bold">Oluşturulma Tarihi</th>
                          <th className="pb-3 font-bold">Boyut</th>
                          <th className="pb-3 text-right font-bold">Aksiyonlar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {backups.map((backup) => (
                          <tr key={backup.filename} className="hover:bg-slate-50/50 group transition duration-150">
                            {/* Filename & Badge */}
                            <td className="py-4 pr-3">
                              <div className="font-bold text-slate-700 flex items-center gap-2 max-w-xs md:max-w-md truncate">
                                <span 
                                  className={`w-2 h-2 rounded-full ${
                                    backup.filename.includes('auto') ? 'bg-indigo-500' : 'bg-amber-500'
                                  }`} 
                                  title={backup.filename.includes('auto') ? 'Otomatik Yedek' : 'Manuel Yedek'}
                                />
                                <span className="truncate text-xs" title={backup.filename}>{backup.filename}</span>
                              </div>
                            </td>
                            {/* Creation Time */}
                            <td className="py-4 text-slate-500">
                              {new Date(backup.createdAt).toLocaleString("tr-TR")}
                            </td>
                            {/* Size */}
                            <td className="py-4 text-slate-600 font-mono font-medium">
                              {formatSize(backup.size)}
                            </td>
                            {/* Action buttons */}
                            <td className="py-4 text-right">
                              <div className="flex items-center justify-end gap-1.5 opacity-90 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-150">
                                {/* Download */}
                                <a
                                  href={`/api/backup/download?filename=${backup.filename}`}
                                  className="p-2 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-white text-slate-600 hover:text-slate-800 transition flex items-center justify-center"
                                  title="İndir"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </a>
                                {/* Restore */}
                                <button
                                  onClick={() => openRestoreConfirmation(backup.filename)}
                                  disabled={actionLoading !== null}
                                  className="p-2 rounded-lg border border-amber-200 hover:bg-amber-50 text-amber-600 hover:text-amber-700 transition flex items-center justify-center cursor-pointer disabled:opacity-50"
                                  title="Geri Yükle"
                                >
                                  <RefreshCw className={`w-3.5 h-3.5 ${actionLoading === backup.filename ? 'animate-spin' : ''}`} />
                                </button>
                                {/* Delete */}
                                <button
                                  onClick={() => triggerDelete(backup.filename)}
                                  disabled={actionLoading !== null}
                                  className="p-2 rounded-lg border border-red-100 hover:bg-red-50 text-red-500 hover:text-red-700 transition flex items-center justify-center cursor-pointer disabled:opacity-50"
                                  title="Sil"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      ) : activeTab === 'deployment' ? (
        /* Deployment Tab Content - Stepper & System Manager Dashboard */
        deployLoading && !deployData ? (
          <div className="flex flex-col items-center justify-center h-80 gap-3 border border-slate-100 rounded-2xl bg-white">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            <span className="text-xs text-slate-500 font-bold">Sunucu teşhis verileri analiz ediliyor...</span>
          </div>
        ) : (
          <div className="space-y-6 animate-fadeIn">
            {/* System Status Dashboard Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* System Environment */}
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sunucu Çekirdeği</span>
                    <h3 className="text-sm font-bold text-slate-800">Node {deployData?.system?.nodeVersion}</h3>
                  </div>
                  <div className="p-2.5 rounded-xl bg-orange-50 text-orange-600">
                    <Cpu className="w-5 h-5" />
                  </div>
                </div>
                <div className="border-t border-slate-50 pt-3 flex flex-col gap-1.5 text-xs text-slate-500">
                  <div className="flex justify-between">
                    <span>İşletim Sistemi:</span>
                    <span className="font-semibold text-slate-700 capitalize">{deployData?.system?.platform}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Aktif Veritabanı:</span>
                    <span className="font-semibold text-slate-700">{deployData?.system?.database}</span>
                  </div>
                </div>
              </div>

              {/* Git Status */}
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sürüm Kontrolü</span>
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                      <GitBranch className="w-4 h-4 text-indigo-500" />
                      {deployData?.git?.branch}
                    </h3>
                  </div>
                  <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                    <GitCommit className="w-5 h-5" />
                  </div>
                </div>
                <div className="border-t border-slate-50 pt-3 flex flex-col gap-1.5 text-xs text-slate-500">
                  <div className="flex justify-between">
                    <span>Son Commit:</span>
                    <span className="font-mono font-semibold text-indigo-650 bg-indigo-50 px-1.5 py-0.5 rounded">{deployData?.git?.hash}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Durum:</span>
                    <span className={`font-semibold ${deployData?.git?.behind && deployData.git.behind > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {deployData?.git?.behind && deployData.git.behind > 0 
                        ? `${deployData.git.behind} Commit Arkada` 
                        : 'Güncel Sürüm'}
                    </span>
                  </div>
                </div>
              </div>

              {/* PM2 Service Status */}
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">PM2 Süreç Yöneticisi</span>
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                      b2b-ecommerce
                      {deployData?.pm2?.active && (
                        <span className={`w-2 h-2 rounded-full ${deployData.pm2.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                      )}
                    </h3>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                    <Activity className="w-5 h-5" />
                  </div>
                </div>
                <div className="border-t border-slate-50 pt-3 flex flex-col gap-1.5 text-xs text-slate-500">
                  {deployData?.pm2?.active ? (
                    <>
                      <div className="flex justify-between">
                        <span>Bellek Kullanımı:</span>
                        <span className="font-semibold text-slate-700">{deployData.pm2.memory}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Yeniden Başlama:</span>
                        <span className="font-semibold text-slate-700">{deployData.pm2.restarts} kez</span>
                      </div>
                    </>
                  ) : (
                    <span className="text-slate-400 italic">PM2 çalışmıyor veya kurulu değil</span>
                  )}
                </div>
              </div>
            </div>

            {/* Stepper Wizard and Console Logs Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Stepper Guide Panel */}
              <div className="lg:col-span-1 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
                <div>
                  <h2 className="font-bold text-slate-850 text-sm flex items-center gap-2">
                    <Settings className="w-4 h-4 text-orange-500" />
                    Adım Adım Dağıtım Sihirbazı
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">Süreci otomatik yönetin ve aşamaları takip edin.</p>
                </div>

                {/* Vertical Stepper */}
                <div className="relative border-l border-slate-100 ml-3 pl-6 space-y-6 text-xs text-slate-600">
                  {/* Step 1 */}
                  <div className="relative">
                    <span className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full flex items-center justify-center border font-bold text-[10px] ${
                      deployData?.deploy?.status === 'idle'
                        ? 'bg-orange-50 border-orange-300 text-orange-600'
                        : 'bg-emerald-500 border-emerald-500 text-white'
                    }`}>
                      {deployData?.deploy?.status !== 'idle' ? '✓' : '1'}
                    </span>
                    <h3 className="font-bold text-slate-850">Adım 1: Teşhis ve Doğrulama</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Sürüm ve çevre kontrolleri tamamlandı.</p>
                  </div>

                  {/* Step 2 */}
                  <div className="relative">
                    <span className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full flex items-center justify-center border font-bold text-[10px] ${
                      deployData?.deploy?.status === 'running' 
                        ? 'bg-amber-500 border-amber-500 text-white animate-pulse'
                        : deployData?.deploy?.status === 'success' || deployData?.deploy?.status === 'failed'
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'bg-white border-slate-200 text-slate-400'
                    }`}>
                      {deployData?.deploy?.status === 'success' || deployData?.deploy?.status === 'failed' ? '✓' : '2'}
                    </span>
                    <h3 className="font-bold text-slate-850">Adım 2: Güvenlik Yedeği</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Geri yükleme noktası ve veritabanı koruması.</p>
                  </div>

                  {/* Step 3 */}
                  <div className="relative">
                    <span className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full flex items-center justify-center border font-bold text-[10px] ${
                      deployData?.deploy?.status === 'running'
                        ? 'bg-orange-50 border-orange-300 text-orange-600 animate-spin border-t-transparent'
                        : deployData?.deploy?.status === 'success'
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : deployData?.deploy?.status === 'failed'
                        ? 'bg-red-500 border-red-500 text-white'
                        : 'bg-white border-slate-200 text-slate-400'
                    }`}>
                      {deployData?.deploy?.status === 'success' ? '✓' : deployData?.deploy?.status === 'failed' ? '✗' : '3'}
                    </span>
                    <h3 className="font-bold text-slate-850">Adım 3: Derleme ve PM2 Reload</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Uygulama yeniden derlenir ve canlıya alınır.</p>
                  </div>
                </div>

                {/* Big Action Button */}
                <div className="pt-4 border-t border-slate-50">
                  {deployData?.deploy?.status === 'running' ? (
                    <div className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 font-bold text-xs">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Otomatik Güncelleme Devam Ediyor...
                    </div>
                  ) : (
                    <button
                      onClick={handleDeploy}
                      disabled={triggerLoading}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      {triggerLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Başlatılıyor...
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          Otomatik Güncellemeyi Başlat
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Console Logs Panel (Terminal View) */}
              <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h2 className="font-bold text-slate-850 text-sm flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-orange-500" />
                      Dağıtım Konsolu (deploy.log)
                    </h2>
                    <p className="text-[11px] text-slate-400">Sunucu işlemleri ve derleme çıktıları.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      deployData?.deploy?.status === 'success'
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                        : deployData?.deploy?.status === 'failed'
                        ? 'bg-red-50 text-red-600 border border-red-100'
                        : deployData?.deploy?.status === 'running'
                        ? 'bg-amber-50 text-amber-600 border border-amber-100 animate-pulse'
                        : 'bg-slate-50 text-slate-500 border border-slate-100'
                    }`}>
                      {deployData?.deploy?.status === 'idle' ? 'Boşta' : deployData?.deploy?.status === 'running' ? 'Çalışıyor' : deployData?.deploy?.status === 'success' ? 'Başarılı' : 'Hata'}
                    </span>
                  </div>
                </div>

                {/* Log Terminal Screen */}
                <div className="relative font-mono bg-slate-950 text-slate-200 p-4 rounded-xl border border-slate-800 text-xs h-80 overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner">
                  {deployData?.deploy?.logs ? (
                    <>
                      {deployData.deploy.logs}
                      <div ref={terminalEndRef} />
                    </>
                  ) : (
                    <span className="text-slate-500 italic">Konsol çıktısı bulunmamaktadır. Güncellemeyi başlattığınızda loglar burada görünecektir.</span>
                  )}
                </div>

                {/* Hint Alert */}
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50/50 border border-blue-100 text-[11px] text-blue-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="leading-normal">
                    Sunucuda derleme sırasında PM2 reload komutu çalışacaktır. Sunucunun yenilenmesi 2-5 saniye sürebilir, bu süreçte konsol geçici olarak bağlantıyı koparabilir ancak sunucu ayağa kalkınca log akışı kaldığı yerden tamamlanır.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )
      ) : activeTab === 'settings' ? (
        /* Settings Tab Content - E-Fatura Prefix Settings & Bank Accounts list */
        <div className="space-y-6 animate-fadeIn">
          {/* Main Controls Panel Card */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-8 text-left">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Sepet &amp; Ödeme İndirimleri</h2>
              <p className="text-xs text-slate-500 mt-1">Tüm sisteme etki eden sepet altı genel kampanyaları ve banka havalesi ödeme indirimini yapılandırın.</p>
            </div>

            {/* 1. Campaign Discount Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Tag className="w-5 h-5 text-orange-500" />
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">1. Sepette Kampanya İndirimi</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">İndirim Türü</label>
                  <select
                    value={cartDiscountType}
                    onChange={e => setCartDiscountType(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none text-xs font-bold focus:border-orange-500 bg-white text-slate-700"
                  >
                    <option value="none">Kampanya Yok</option>
                    <option value="percentage">Yüzde İndirim (%)</option>
                    <option value="fixed">Sabit İndirim (₺)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    {cartDiscountType === "percentage" ? "İndirim Oranı (%)" : cartDiscountType === "fixed" ? "İndirim Tutarı (₺)" : "Değer"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    disabled={cartDiscountType === "none"}
                    value={cartDiscountValue || ""}
                    onChange={e => setCartDiscountValue(Number(e.target.value))}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none text-xs font-bold focus:border-orange-500 disabled:bg-slate-50 disabled:text-slate-400 bg-white text-slate-700"
                    placeholder="0"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Min. Sepet Tutarı (₺)</label>
                  <input
                    type="number"
                    min="0"
                    disabled={cartDiscountType === "none"}
                    value={cartDiscountMinAmount || ""}
                    onChange={e => setCartDiscountMinAmount(Number(e.target.value))}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none text-xs font-bold focus:border-orange-500 disabled:bg-slate-50 disabled:text-slate-400 bg-white text-slate-700"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* 2. Bank Transfer Discount Section */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 pb-2">
                <Percent className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">2. Banka Havalesi Ayarları &amp; Hesap Bilgileri</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Havale İndirim Oranı (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={bankTransferDiscountRate || ""}
                      onChange={e => setBankTransferDiscountRate(Number(e.target.value))}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none text-xs font-bold focus:border-orange-500 pr-12 bg-white text-slate-700"
                      placeholder="0"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-xs text-slate-400">
                      %
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Firma Ünvanı / Alıcı Adı</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none text-xs font-bold focus:border-orange-500 bg-white text-slate-700"
                    placeholder="Örn: Atak Arıcılık San. ve Tic. Ltd. Şti."
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Banka Adı (Varsayılan)</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={e => setBankName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none text-xs font-bold focus:border-orange-500 bg-white text-slate-700"
                    placeholder="Örn: Ziraat Bankası"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">IBAN Numarası (Varsayılan)</label>
                  <input
                    type="text"
                    value={bankIban}
                    onChange={e => setBankIban(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none text-xs font-bold focus:border-orange-500 font-mono bg-white text-slate-700"
                    placeholder="Örn: TR00 0000 0000 0000 0000 0000 00"
                  />
                </div>
              </div>
            </div>

            {/* 3. E-Fatura & E-Arşiv Prefix Section */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 pb-2">
                <Sliders className="w-5 h-5 text-orange-500" />
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">3. E-Fatura &amp; E-Arşiv Ön Ek Ayarları</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">e-Fatura Seri Başlangıç Formatı (Ön Ek - 3 Hane)</label>
                  <input
                    type="text"
                    maxLength={3}
                    value={efaturaPrefix}
                    onChange={e => setEfaturaPrefix(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none text-xs font-black tracking-wider focus:border-orange-500 font-mono bg-white text-slate-700"
                    placeholder="Örn: GIB"
                  />
                  <p className="text-[10px] text-slate-400 leading-normal mt-1">E-Faturalar için varsayılan 3 haneli başlangıç seri ön eki (Örn: GIB2026000000001).</p>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">e-Arşiv Seri Başlangıç Formatı (Ön Ek - 3 Hane)</label>
                  <input
                    type="text"
                    maxLength={3}
                    value={earsivPrefix}
                    onChange={e => setEarsivPrefix(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none text-xs font-black tracking-wider focus:border-orange-500 font-mono bg-white text-slate-700"
                    placeholder="Örn: EAR"
                  />
                  <p className="text-[10px] text-slate-400 leading-normal mt-1">E-Arşiv faturaları için varsayılan 3 haneli başlangıç seri ön eki (Örn: EAR2026000000001).</p>
                </div>
              </div>
            </div>

            {/* 4. GİB API Sorgu Entegrasyon Ayarları */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 pb-2">
                <Settings className="w-5 h-5 text-orange-500" />
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">4. Maliye / GİB Entegrasyon Ayarları</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">GİB Portal / Entegratör API Anahtarı (GIB_API_KEY)</label>
                  <input
                    type="password"
                    value={gibApiKey}
                    onChange={e => setGibApiKey(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none text-xs focus:border-orange-500 font-mono bg-white text-slate-700"
                    placeholder="Boş bırakılırsa simülasyon modu çalışır"
                  />
                  <p className="text-[10px] text-slate-400 leading-normal mt-1">E-Fatura entegratör veya GİB web servis anahtarı. Tanımlandığında canlı mükellef verileri çekilir.</p>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">GİB Web Servis URL (GIB_API_URL)</label>
                  <input
                    type="text"
                    value={gibApiUrl}
                    onChange={e => setGibApiUrl(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none text-xs focus:border-orange-500 font-mono bg-white text-slate-700"
                    placeholder="Örn: https://earsiv.gib.gov.tr"
                  />
                  <p className="text-[10px] text-slate-400 leading-normal mt-1">GİB veya entegratör web servis adresi (varsayılan: https://earsiv.gib.gov.tr).</p>
                </div>
              </div>
            </div>

            {/* Bank Accounts List Section */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Banka Hesap Listesi</h4>
                  <p className="text-[11px] text-slate-400">Havale/EFT ödemesi için müşterilere gösterilecek banka hesap numaraları.</p>
                </div>
                <button
                  type="button"
                  onClick={openAddBank}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition shadow-sm cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Hesap Ekle
                </button>
              </div>

              {banksLoading ? (
                <div className="flex items-center justify-center py-8 text-slate-400 text-xs">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Banka hesapları yükleniyor...
                </div>
              ) : banks.length === 0 ? (
                <div className="text-center py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-slate-450 text-xs font-bold">
                  Kayıtlı herhangi bir banka hesabı bulunamadı. Eklemek için sağ üstteki butonu kullanın.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {banks.map(bank => (
                    <div key={bank.id} className="p-4 bg-slate-50/50 border border-slate-150 rounded-2xl hover:shadow-sm transition flex justify-between items-start text-left">
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-slate-850 block">{bank.name}</span>
                        {bank.iban && (
                          <span className="text-[11px] font-mono text-slate-500 block tracking-wide select-all bg-white py-1 px-2 border border-slate-100 rounded-lg">{bank.iban}</span>
                        )}
                        <div className="text-[10px] text-slate-400 flex gap-3 font-semibold pt-1">
                          <span>Tür: {bank.type}</span>
                          <span>Para Birimi: {bank.currency}</span>
                          {bank.branch && <span>Şube: {bank.branch}</span>}
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0 ml-2">
                        <button
                          type="button"
                          onClick={() => openEditBank(bank)}
                          className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 transition flex items-center justify-center cursor-pointer"
                          title="Düzenle"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteBank(bank.id)}
                          className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-500 transition flex items-center justify-center cursor-pointer"
                          title="Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleSaveRules}
                disabled={rulesSaving}
                className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-xl font-bold uppercase tracking-wider hover:bg-orange-600 transition shadow-lg disabled:opacity-50 cursor-pointer"
              >
                {rulesSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                İNDİRİMLERİ KAYDET
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Company Tab Content - Firma Ayarları */
        <div className="space-y-6 animate-fadeIn text-left">
          {/* 1. FİRMA BİLGİLERİ Card */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-sm font-extrabold text-slate-850 uppercase tracking-wider flex items-center gap-2">
                <Building className="w-5 h-5 text-orange-500" />
                {companyName || "Firma"} - FİRMA BİLGİLERİ
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Resmi unvan, vergi, adres ve iletişim koordinatlarını güncelleyin.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              {/* Row 1 */}
              <div className="md:col-span-2 space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-semibold">Firma</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-orange-500 bg-white text-slate-800 font-medium transition"
                  placeholder="Örn: Pekefe Geleneksel GIDA SANAYİ VE TİCARET LİMİTED ŞİRKETİ"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-semibold">Ad</label>
                <input
                  type="text"
                  value={companyOwnerName}
                  onChange={e => setCompanyOwnerName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-orange-500 bg-white text-slate-800 font-medium transition"
                  placeholder="Örn: Adı"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-semibold">Soyad</label>
                <input
                  type="text"
                  value={companyOwnerSurname}
                  onChange={e => setCompanyOwnerSurname(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-orange-500 bg-white text-slate-800 font-medium transition"
                  placeholder="Örn: Soyadı"
                />
              </div>

              {/* Row 2 */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-semibold">Vergi No</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={companyTaxNo}
                    onChange={e => setCompanyTaxNo(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-orange-500 bg-white text-slate-800 font-medium transition font-mono"
                    placeholder="Örn: 5901316817"
                  />
                  <button
                    type="button"
                    onClick={handleFetchFromGib}
                    disabled={gibLoading}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-bold transition shadow-sm cursor-pointer disabled:opacity-50 shrink-0"
                    title="GİB / Maliyeden sorgula"
                  >
                    {gibLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5" />
                    )}
                    <span>Sorgula</span>
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-semibold">Vergi Dairesi</label>
                <input
                  type="text"
                  value={companyTaxOffice}
                  onChange={e => setCompanyTaxOffice(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-orange-500 bg-white text-slate-800 font-medium transition"
                  placeholder="Örn: Vergi Dairesi"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-semibold">E-Posta</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={e => setContactEmail(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-orange-500 bg-white text-slate-800 font-medium transition"
                  placeholder="Örn: info@firmamiz.com"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-semibold">Tel</label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={e => setContactPhone(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-orange-500 bg-white text-slate-800 font-medium transition"
                  placeholder="Örn: 0212 123 45 67"
                />
              </div>

              {/* Row 3 */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-semibold">Fax</label>
                <input
                  type="text"
                  value={companyFax}
                  onChange={e => setCompanyFax(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-orange-500 bg-white text-slate-800 font-medium transition"
                  placeholder="Örn: 0212 123 45 68"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-semibold">Gsm</label>
                <input
                  type="text"
                  value={companyGsm}
                  onChange={e => setCompanyGsm(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-orange-500 bg-white text-slate-800 font-medium transition font-mono"
                  placeholder="Örn: 0555 123 45 67"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-semibold">WhatsApp</label>
                <input
                  type="text"
                  value={socialWhatsapp}
                  onChange={e => setSocialWhatsapp(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-orange-500 bg-white text-slate-800 font-medium transition font-mono"
                  placeholder="Örn: 0555 123 45 67"
                />
              </div>
              <div className="hidden md:block" />

              {/* Row 4 */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-semibold">KEP Adresi</label>
                <input
                  type="text"
                  value={companyKepAddress}
                  onChange={e => setCompanyKepAddress(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-orange-500 bg-white text-slate-800 font-medium transition"
                  placeholder="Örn: firmaadi@hs01.kep.tr"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-semibold">Mersis No</label>
                <input
                  type="text"
                  value={companyMersisNo}
                  onChange={e => setCompanyMersisNo(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-orange-500 bg-white text-slate-800 font-medium transition font-mono"
                  placeholder="Örn: Mersis No"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-semibold">Sicil No</label>
                <input
                  type="text"
                  value={companySicilNo}
                  onChange={e => setCompanySicilNo(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-orange-500 bg-white text-slate-800 font-medium transition font-mono"
                  placeholder="Örn: Ticari Sicil No"
                />
              </div>
              <div className="hidden md:block" />

              {/* Row 5 */}
              <div className="md:col-span-4 space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-semibold">Adres</label>
                <textarea
                  value={contactAddress}
                  onChange={e => setContactAddress(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:border-orange-500 bg-white text-slate-800 font-medium transition resize-y"
                  placeholder="Örn: Merkez Mahallesi, Atatürk Caddesi No: 20/A, Kat: 1"
                />
              </div>

              {/* Row 6 */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-semibold">Bölge</label>
                <input
                  type="text"
                  value={companyRegion}
                  onChange={e => setCompanyRegion(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-orange-500 bg-white text-slate-800 font-medium transition"
                  placeholder="Örn: Bölge (Marmara)"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-semibold">Ülke</label>
                <input
                  type="text"
                  value={companyCountry}
                  onChange={e => setCompanyCountry(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-orange-500 bg-white text-slate-800 font-medium transition"
                  placeholder="Örn: TÜRKİYE"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-semibold">Şehir</label>
                <select
                  value={companyCity}
                  onChange={e => {
                    const newCity = e.target.value;
                    setCompanyCity(newCity);
                    const districts = turkeyLocations[newCity] || [];
                    setCompanyDistrict(districts[0] || "");
                  }}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-orange-500 bg-white text-slate-800 font-medium transition"
                >
                  <option value="">Seçiniz</option>
                  {Object.keys(turkeyLocations).sort((a, b) => a.localeCompare(b, 'tr')).map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-semibold">İlçe</label>
                <select
                  value={companyDistrict}
                  onChange={e => setCompanyDistrict(e.target.value)}
                  disabled={!companyCity}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-orange-500 bg-white text-slate-800 font-medium transition disabled:bg-slate-50 disabled:text-slate-400"
                >
                  <option value="">Seçiniz</option>
                  {companyCity && (turkeyLocations[companyCity] || []).map(dist => (
                    <option key={dist} value={dist}>{dist}</option>
                  ))}
                </select>
              </div>

              {/* Row 7 */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-semibold">Bina Adı</label>
                <input
                  type="text"
                  value={companyBuildingName}
                  onChange={e => setCompanyBuildingName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-orange-500 bg-white text-slate-800 font-medium transition"
                  placeholder="Örn: Plaza / İş Merkezi"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-semibold">Bina No</label>
                <input
                  type="text"
                  value={companyBuildingNo}
                  onChange={e => setCompanyBuildingNo(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-orange-500 bg-white text-slate-800 font-medium transition"
                  placeholder="Örn: 20/A"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-semibold">Sokak</label>
                <input
                  type="text"
                  value={companyStreet}
                  onChange={e => setCompanyStreet(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-orange-500 bg-white text-slate-800 font-medium transition"
                  placeholder="Örn: Karanfil Sokak"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-semibold">P.K Kodu</label>
                <input
                  type="text"
                  value={companyPostalCode}
                  onChange={e => setCompanyPostalCode(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-orange-500 bg-white text-slate-800 font-medium transition font-mono"
                  placeholder="Örn: 34000"
                />
              </div>

              {/* Row 8 */}
              <div className="md:col-span-2 space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-semibold">Web Site</label>
                <input
                  type="text"
                  value={companyWebsite}
                  onChange={e => setCompanyWebsite(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-orange-500 bg-white text-slate-800 font-medium transition font-mono"
                  placeholder="Örn: www.firmaadi.com"
                />
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-semibold">Logo URI</label>
                <input
                  type="text"
                  value={companyLogoUrl}
                  onChange={e => setCompanyLogoUrl(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-orange-500 bg-white text-slate-800 font-medium transition font-mono"
                  placeholder="Örn: /uploads/logo.png"
                />
              </div>
            </div>
          </div>

          {/* 2. FİRMA VARSAYILANLARI Card */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-sm font-extrabold text-slate-850 uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-5 h-5 text-orange-500" />
                FİRMA VARSAYILANLARI
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Sistem geneli varsayılan değerleri, iade ve KDV kurallarını belirleyin.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-semibold">Kdv</label>
                <input
                  type="number"
                  value={companyDefaultKdv}
                  onChange={e => setCompanyDefaultKdv(Number(e.target.value))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-orange-500 bg-white text-slate-800 font-medium transition"
                  placeholder="1"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-semibold">Birim</label>
                <select
                  value={companyDefaultUnit}
                  onChange={e => setCompanyDefaultUnit(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-orange-500 bg-white text-slate-850 font-bold transition"
                >
                  <option value="Adet">Adet</option>
                  <option value="KG">Kilogram (KG)</option>
                  <option value="Litre">Litre</option>
                  <option value="Metre">Metre</option>
                  <option value="Paket">Paket</option>
                  <option value="Koli">Koli</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-semibold">Perakende İade Günü</label>
                <input
                  type="number"
                  value={companyDefaultReturnDays}
                  onChange={e => setCompanyDefaultReturnDays(Number(e.target.value))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-orange-500 bg-white text-slate-800 font-medium transition"
                  placeholder="-30"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="salesKdv"
                  checked={companySalesKdvIncluded}
                  onChange={e => setCompanySalesKdvIncluded(e.target.checked)}
                  className="w-4 h-4 rounded text-orange-500 focus:ring-orange-400 border-slate-300"
                />
                <label htmlFor="salesKdv" className="text-xs font-bold text-slate-750 select-none cursor-pointer">
                  Satış Kdv Dahil
                </label>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="purchaseKdv"
                  checked={companyPurchaseKdvIncluded}
                  onChange={e => setCompanyPurchaseKdvIncluded(e.target.checked)}
                  className="w-4 h-4 rounded text-orange-500 focus:ring-orange-400 border-slate-300"
                />
                <label htmlFor="purchaseKdv" className="text-xs font-bold text-slate-750 select-none cursor-pointer">
                  Alış Kdv Dahil
                </label>
              </div>

              <div className="hidden md:block" />

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-semibold">Diller</label>
                <input
                  type="text"
                  value={companyDefaultLanguages}
                  onChange={e => setCompanyDefaultLanguages(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-orange-500 bg-white text-slate-800 font-medium transition"
                  placeholder="TR, EN..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-semibold">Karakter Dışla</label>
                <input
                  type="text"
                  value={companyExcludedChars}
                  onChange={e => setCompanyExcludedChars(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-orange-500 bg-white text-slate-850 font-medium transition"
                  placeholder="Örn: *?/_"
                />
              </div>

              <div className="hidden md:block" />

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-semibold">Satır Tevkifat Kodu</label>
                <select
                  value={companyDefaultTevkifatCode}
                  onChange={e => setCompanyDefaultTevkifatCode(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-orange-500 bg-white text-slate-800 font-medium transition"
                >
                  <option value="">Seç...</option>
                  <option value="601">601 - Yapım İşleri</option>
                  <option value="602">602 - Et ve Et Ürünleri</option>
                  <option value="603">603 - Bakır ve Çinko</option>
                  <option value="650">650 - Diğer Hizmetler</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-semibold">Fatura/Sipariş Listele (Başlangıç Günü)</label>
                <input
                  type="number"
                  value={companyListStartDay}
                  onChange={e => setCompanyListStartDay(Number(e.target.value))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-orange-500 bg-white text-slate-800 font-medium transition"
                  placeholder="15"
                />
              </div>
            </div>
          </div>

          {/* 3. FİRMA PARAMETRELERİ Card */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-sm font-extrabold text-slate-850 uppercase tracking-wider flex items-center gap-2">
                <Settings className="w-5 h-5 text-orange-500" />
                FİRMA PARAMETRELERİ
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Süreç ve otomasyon davranışlarını aktif veya deaktif edin.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-bold text-slate-700">
              {/* Column 1 */}
              <div className="space-y-4">
                <div className="flex items-start gap-2.5 p-3 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <input
                    type="checkbox"
                    id="autoEarsivMail"
                    checked={companyAutoSendEarsivMail}
                    onChange={e => setCompanyAutoSendEarsivMail(e.target.checked)}
                    className="w-4 h-4 rounded text-orange-500 focus:ring-orange-400 border-slate-350 shrink-0 mt-0.5"
                  />
                  <label htmlFor="autoEarsivMail" className="select-none cursor-pointer leading-tight font-bold text-slate-750">
                    Otomatik E-Arşiv Mail Gönder
                  </label>
                </div>
                <div className="flex items-start gap-2.5 p-3 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <input
                    type="checkbox"
                    id="usePaymentPlan"
                    checked={companyUsePaymentPlan}
                    onChange={e => setCompanyUsePaymentPlan(e.target.checked)}
                    className="w-4 h-4 rounded text-orange-500 focus:ring-orange-400 border-slate-350 shrink-0 mt-0.5"
                  />
                  <label htmlFor="usePaymentPlan" className="select-none cursor-pointer leading-tight font-bold text-slate-750">
                    Ödeme Tahsilat Plan Kullanımı
                  </label>
                </div>
                <div className="flex items-start gap-2.5 p-3 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <input
                    type="checkbox"
                    id="autoUpdatePriceByMargin"
                    checked={companyAutoUpdatePriceByMargin}
                    onChange={e => setCompanyAutoUpdatePriceByMargin(e.target.checked)}
                    className="w-4 h-4 rounded text-orange-500 focus:ring-orange-400 border-slate-350 shrink-0 mt-0.5"
                  />
                  <label htmlFor="autoUpdatePriceByMargin" className="select-none cursor-pointer leading-tight font-bold text-slate-750">
                    Satış fiyatını kar marjına göre oto. güncelle
                  </label>
                </div>
              </div>

              {/* Column 2 */}
              <div className="space-y-4">
                <div className="flex items-start gap-2.5 p-3 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <input
                    type="checkbox"
                    id="useCurrencyInPurchase"
                    checked={companyUseCurrencyInPurchase}
                    onChange={e => setCompanyUseCurrencyInPurchase(e.target.checked)}
                    className="w-4 h-4 rounded text-orange-500 focus:ring-orange-400 border-slate-350 shrink-0 mt-0.5"
                  />
                  <label htmlFor="useCurrencyInPurchase" className="select-none cursor-pointer leading-tight font-bold text-slate-750">
                    Alış Faturalarında Döviz Kullan
                  </label>
                </div>
                <div className="flex items-start gap-2.5 p-3 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <input
                    type="checkbox"
                    id="autoDeductInstallments"
                    checked={companyAutoDeductInstallments}
                    onChange={e => setCompanyAutoDeductInstallments(e.target.checked)}
                    className="w-4 h-4 rounded text-orange-500 focus:ring-orange-400 border-slate-350 shrink-0 mt-0.5"
                  />
                  <label htmlFor="autoDeductInstallments" className="select-none cursor-pointer leading-tight font-bold text-slate-750">
                    Taksitleri Otomatik Düş
                  </label>
                </div>
              </div>

              {/* Column 3 */}
              <div className="space-y-4">
                <div className="flex items-start gap-2.5 p-3 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <input
                    type="checkbox"
                    id="useRowRateInPurchase"
                    checked={companyUseRowRateInPurchase}
                    onChange={e => setCompanyUseRowRateInPurchase(e.target.checked)}
                    className="w-4 h-4 rounded text-orange-500 focus:ring-orange-400 border-slate-350 shrink-0 mt-0.5"
                  />
                  <label htmlFor="useRowRateInPurchase" className="select-none cursor-pointer leading-tight font-bold text-slate-750">
                    Alış Faturalarında Satır Kurunu Kullan
                  </label>
                </div>
                <div className="flex items-start gap-2.5 p-3 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <input
                    type="checkbox"
                    id="checkCurrentVkn"
                    checked={companyCheckCurrentVkn}
                    onChange={e => setCompanyCheckCurrentVkn(e.target.checked)}
                    className="w-4 h-4 rounded text-orange-500 focus:ring-orange-400 border-slate-350 shrink-0 mt-0.5"
                  />
                  <label htmlFor="checkCurrentVkn" className="select-none cursor-pointer leading-tight font-bold text-slate-750">
                    Cari VKN Kontrolü
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* 4. E-FATURA AYARLARI Card */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-sm font-extrabold text-slate-850 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-500" />
                E-FATURA AYARLARI
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Logo, imza kaşesi ve fatura altı HTML bilgi notunu düzenleyin.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-left">
              {/* Logo Upload */}
              <div className="space-y-2.5 border border-slate-100 p-5 rounded-2xl bg-slate-50/50">
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">FİRMA LOGO</span>
                
                {/* Logo Preview */}
                <div className="w-32 h-32 border border-slate-200 bg-white rounded-2xl flex items-center justify-center overflow-hidden relative group">
                  {companyLogoFile || companyLogoUrl ? (
                    <Image
                      src={companyLogoFile ? URL.createObjectURL(companyLogoFile) : companyLogoUrl}
                      alt="Firma Logo Preview"
                      fill
                      sizes="128px"
                      unoptimized
                      className="object-contain p-2"
                    />
                  ) : (
                    <div className="text-center text-[10px] text-slate-400 p-2 font-bold">
                      Henüz yüklenmedi
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <input
                    type="file"
                    accept="image/*"
                    id="logo-upload"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setCompanyLogoFile(e.target.files[0]);
                      }
                    }}
                  />
                  <label
                    htmlFor="logo-upload"
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-bold text-[10px] cursor-pointer shadow-sm transition"
                  >
                    Dosya Seç
                  </label>
                  <span className="text-[10px] text-slate-450 ml-2 font-semibold">
                    {companyLogoFile ? companyLogoFile.name : "Dosya seçilmedi"}
                  </span>
                </div>
              </div>

              {/* Stamp Upload */}
              <div className="space-y-2.5 border border-slate-100 p-5 rounded-2xl bg-slate-50/50">
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-semibold">FİRMA KAŞE İMZA</span>
                
                {/* Stamp Preview */}
                <div className="w-32 h-32 border border-slate-200 bg-white rounded-2xl flex items-center justify-center overflow-hidden relative group">
                  {companyStampFile || companyStampUrl ? (
                    <Image
                      src={companyStampFile ? URL.createObjectURL(companyStampFile) : companyStampUrl}
                      alt="Firma Kaşe/İmza Preview"
                      fill
                      sizes="128px"
                      unoptimized
                      className="object-contain p-2"
                    />
                  ) : (
                    <div className="text-center text-[10px] text-slate-400 p-2 font-bold">
                      Henüz yüklenmedi
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <input
                    type="file"
                    accept="image/*"
                    id="stamp-upload"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setCompanyStampFile(e.target.files[0]);
                      }
                    }}
                  />
                  <label
                    htmlFor="stamp-upload"
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-bold text-[10px] cursor-pointer shadow-sm transition"
                  >
                    Dosya Seç
                  </label>
                  <span className="text-[10px] text-slate-450 ml-2 font-semibold">
                    {companyStampFile ? companyStampFile.name : "Dosya seçilmedi"}
                  </span>
                </div>
              </div>

              {/* Fatura Alt Bilgi HTML input */}
              <div className="md:col-span-2 space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-semibold">Fatura Alt Bilgi (HTML formatında)</label>
                <div className="flex gap-2 items-start">
                  <textarea
                    value={companyInvoiceFooter}
                    onChange={e => setCompanyInvoiceFooter(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-slate-250 rounded-xl outline-none focus:border-orange-500 bg-white text-slate-800 font-mono text-[11px] leading-relaxed transition text-left"
                    dir="ltr"
                    placeholder='<table style="height: auto;"> <tbody> <tr> <td> <p style="margin: 0">BANKA HESAP NUMARALARIMIZ</p> </td> </tr> </tbody> </table>'
                  />
                  <button 
                    type="button" 
                    title="Görsel Editör ile Düzenle"
                    onClick={() => {
                      setEditorContent(companyInvoiceFooter);
                      setIsHtmlEditorOpen(true);
                      setShowSource(false);
                    }} 
                    className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-orange-500 hover:text-orange-600 transition cursor-pointer"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    type="button" 
                    title="Temizle"
                    onClick={() => setCompanyInvoiceFooter("")} 
                    className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                  E-Fatura ve E-Arşiv çıktılarının altında gösterilecek resmi banka hesapları, teşekkür metni ve yasal dipnotları HTML formatında ekleyebilirsiniz.
                </p>
              </div>
            </div>
          </div>

          {/* Action Save Button */}
          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleSaveRules}
              disabled={rulesSaving}
              className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-xl font-bold uppercase tracking-wider hover:bg-orange-600 transition shadow-lg disabled:opacity-50 cursor-pointer"
            >
              {rulesSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Bilgileri Güncelle
            </button>
          </div>
        </div>
      )}

      {/* Bank Account Add / Edit Modal */}
      {isBankModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setIsBankModalOpen(false)} />
          <div className="bg-white relative z-10 w-full max-w-lg rounded-3xl shadow-2xl p-6 space-y-5 animate-fadeIn">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">{editingBank ? "Banka Hesabını Düzenle" : "Yeni Banka Hesabı Ekle"}</h2>
              <button type="button" onClick={() => setIsBankModalOpen(false)} className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full hover:text-red-500 transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs text-slate-600">
              <div className="col-span-2 space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Banka Adı *</label>
                <input
                  type="text"
                  required
                  value={bankForm.name}
                  onChange={e => setBankForm({ ...bankForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-bold focus:border-orange-500 bg-white text-slate-700"
                  placeholder="Örn: Garanti BBVA"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Hesap Türü</label>
                <select
                  value={bankForm.type}
                  onChange={e => setBankForm({ ...bankForm, type: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-bold bg-white text-slate-700"
                >
                  <option value="VADESIZ">VADESİZ</option>
                  <option value="VADELI">VADELİ</option>
                  <option value="KREDI">KREDİ HESABI</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Para Birimi</label>
                <select
                  value={bankForm.currency}
                  onChange={e => setBankForm({ ...bankForm, currency: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-bold bg-white text-slate-700"
                >
                  <option value="TRY">TRY (₺)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>

              <div className="col-span-2 space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">IBAN *</label>
                <input
                  type="text"
                  required
                  value={bankForm.iban}
                  onChange={e => setBankForm({ ...bankForm, iban: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-mono font-bold focus:border-orange-500 bg-white text-slate-700"
                  placeholder="TR00 0000 0000 0000 0000 0000 00"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Hesap Numarası</label>
                <input
                  type="text"
                  value={bankForm.accountNumber}
                  onChange={e => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-bold focus:border-orange-500 bg-white text-slate-700"
                  placeholder="12345678"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Şube</label>
                <input
                  type="text"
                  value={bankForm.branch}
                  onChange={e => setBankForm({ ...bankForm, branch: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-bold focus:border-orange-500 bg-white text-slate-700"
                  placeholder="Şube Adı veya Kodu"
                />
              </div>

              <div className="col-span-2 flex gap-3 pt-3 border-t border-slate-50">
                <button type="button" onClick={() => setIsBankModalOpen(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition cursor-pointer">
                  İptal
                </button>
                <button type="button" onClick={handleSaveBank} className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold transition shadow-sm cursor-pointer">
                  Kaydet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress & Operation Modal */}
      {progressVisible && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6 text-center animate-fadeIn">
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-slate-800 border-t-orange-500 animate-spin" />
                <Database className="w-6 h-6 text-orange-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
              </div>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-white font-bold text-lg">{progressText}</h3>
              <p className="text-xs text-slate-400">Lütfen işlem tamamlanana kadar sayfayı kapatmayın.</p>
            </div>

            <div className="space-y-2">
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700/50">
                <div 
                  className="bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 h-full rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-xs font-mono text-slate-400">{progressPercent}% Tamamlandı</span>
            </div>
          </div>
        </div>
      )}

      {/* Double Confirmation Restore Modal */}
      {confirmModalVisible && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-100 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-amber-50 text-amber-600">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="space-y-1.5 flex-1">
                <h3 className="text-gray-900 font-bold text-lg">Kritik Geri Yükleme Onayı</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Şu anki veritabanı tamamen silinecek ve seçilen yedeğin verileri yüklenerek sistem eski durumuna dönecektir. Geri yükleme sırasında kısa süreli kesintiler oluşabilir.
                </p>
                <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 text-xs text-amber-800 font-medium">
                  Seçilen Yedek: <span className="font-mono">{backupToRestore}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="block text-sm font-semibold text-gray-700">
                İşlemi onaylamak için lütfen kutuya <span className="text-amber-600 font-bold">GERİ YÜKLE</span> yazın:
              </label>
              <input
                type="text"
                placeholder="GERİ YÜKLE"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition text-center uppercase tracking-widest font-bold bg-white text-slate-800"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                onClick={() => setConfirmModalVisible(false)}
                className="px-4 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900 border border-gray-200 hover:bg-gray-50 rounded-xl transition cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                onClick={triggerRestore}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-xl shadow-sm transition cursor-pointer"
              >
                Geri Yüklemeyi Başlat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HTML Rich Text Editor Modal */}
      {isHtmlEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" 
            onClick={() => setIsHtmlEditorOpen(false)} 
          />
          
          {/* Modal Container */}
          <div className="bg-white relative z-10 w-full max-w-4xl rounded-3xl shadow-2xl p-6 space-y-4 animate-fadeIn text-left border border-slate-100 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Code className="w-5 h-5 text-orange-500" />
                Html Düzenleme Formu
              </h2>
              <button 
                type="button" 
                onClick={() => setIsHtmlEditorOpen(false)} 
                className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full hover:text-red-500 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* WYSIWYG Toolbar */}
            {!showSource && (
              <div className="flex flex-wrap gap-1 p-2 bg-slate-50 border border-slate-200 rounded-2xl items-center text-slate-700">
                {/* Alan Ekle Select */}
                <div className="relative flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2 py-1 text-xs font-bold hover:bg-slate-50">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Alan Ekle:</span>
                  <select
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!val) return;
                      if (val === "bank_table") {
                        const bankTableHtml = `
                          <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-family: sans-serif; font-size: 12px; text-align: left;">
                            <tbody>
                              <tr style="background-color: #f8fafc;">
                                <td colspan="2" style="border: 1px solid #e2e8f0; padding: 8px; font-weight: bold; text-align: center;">BANKA HESAP NUMARALARIMIZ</td>
                              </tr>
                              <tr style="font-weight: bold; background-color: #f1f5f9;">
                                <td style="border: 1px solid #e2e8f0; padding: 8px; width: 40%;">BANKA</td>
                                <td style="border: 1px solid #e2e8f0; padding: 8px; width: 60%;">IBAN</td>
                              </tr>
                              <tr>
                                <td style="border: 1px solid #e2e8f0; padding: 8px; font-weight: bold;">Ziraat Bankası</td>
                                <td style="border: 1px solid #e2e8f0; padding: 8px; font-family: monospace;">TR44 0001 0001 1297 8223 5950 01</td>
                              </tr>
                            </tbody>
                          </table>
                        `;
                        insertHTMLAtCursor(bankTableHtml);
                      } else {
                        insertHTMLAtCursor(` ${val} `);
                      }
                      e.target.value = "";
                    }}
                    className="outline-none bg-transparent cursor-pointer font-bold text-xs pr-2"
                  >
                    <option value="">Seç...</option>
                    <option value="bank_table">Banka Hesap Tablosu</option>
                    <option value="{{FirmaAdı}}">Firma Ünvanı</option>
                    <option value="{{VergiNo}}">Vergi No</option>
                    <option value="{{VergiDairesi}}">Vergi Dairesi</option>
                    <option value="{{WebSitesi}}">Web Sitesi</option>
                    <option value="{{Eposta}}">E-Posta</option>
                    <option value="{{Telefon}}">Telefon</option>
                  </select>
                </div>

                <div className="w-[1px] h-6 bg-slate-200 mx-1" />

                {/* Normal metin Dropdown */}
                <select
                  onChange={(e) => executeEditorCommand('formatBlock', e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-2 py-1 text-xs font-semibold outline-none cursor-pointer"
                  defaultValue="p"
                >
                  <option value="p">Normal Metin</option>
                  <option value="h1">Başlık 1</option>
                  <option value="h2">Başlık 2</option>
                  <option value="h3">Başlık 3</option>
                  <option value="h4">Başlık 4</option>
                  <option value="pre">Kod Blok</option>
                </select>

                {/* Font Size Dropdown */}
                <select
                  onChange={(e) => executeEditorCommand('fontSize', e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-2 py-1 text-xs font-semibold outline-none cursor-pointer"
                  title="Boyut"
                >
                  <option value="3">Boyut</option>
                  <option value="1">Çok Küçük</option>
                  <option value="2">Küçük</option>
                  <option value="3">Normal</option>
                  <option value="4">Orta</option>
                  <option value="5">Büyük</option>
                  <option value="6">Çok Büyük</option>
                  <option value="7">Devasa</option>
                </select>

                <div className="w-[1px] h-6 bg-slate-200 mx-1" />

                {/* Undo / Redo */}
                <button type="button" onClick={() => executeEditorCommand('undo')} className="p-1.5 hover:bg-slate-200 rounded-lg transition cursor-pointer" title="Geri Al">
                  <Undo className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => executeEditorCommand('redo')} className="p-1.5 hover:bg-slate-200 rounded-lg transition cursor-pointer" title="İleri Al">
                  <Redo className="w-3.5 h-3.5" />
                </button>

                <div className="w-[1px] h-6 bg-slate-200 mx-1" />

                {/* Bold / Italic / Underline */}
                <button type="button" onClick={() => executeEditorCommand('bold')} className="p-1.5 hover:bg-slate-200 rounded-lg transition cursor-pointer font-bold" title="Kalın">
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => executeEditorCommand('italic')} className="p-1.5 hover:bg-slate-200 rounded-lg transition cursor-pointer" title="İtalik">
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => executeEditorCommand('underline')} className="p-1.5 hover:bg-slate-200 rounded-lg transition cursor-pointer" title="Altı Çizili">
                  <Underline className="w-3.5 h-3.5" />
                </button>

                <div className="w-[1px] h-6 bg-slate-200 mx-1" />

                {/* Lists */}
                <button type="button" onClick={() => executeEditorCommand('insertUnorderedList')} className="p-1.5 hover:bg-slate-200 rounded-lg transition cursor-pointer" title="Madde İşaretli Liste">
                  <List className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => executeEditorCommand('insertOrderedList')} className="p-1.5 hover:bg-slate-200 rounded-lg transition cursor-pointer" title="Numaralı Liste">
                  <ListOrdered className="w-3.5 h-3.5" />
                </button>

                <div className="w-[1px] h-6 bg-slate-200 mx-1" />

                {/* Alignments */}
                <button type="button" onClick={() => executeEditorCommand('justifyLeft')} className="p-1.5 hover:bg-slate-200 rounded-lg transition cursor-pointer" title="Sola Hizala">
                  <AlignLeft className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => executeEditorCommand('justifyCenter')} className="p-1.5 hover:bg-slate-200 rounded-lg transition cursor-pointer" title="Ortala">
                  <AlignCenter className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => executeEditorCommand('justifyRight')} className="p-1.5 hover:bg-slate-200 rounded-lg transition cursor-pointer" title="Sağa Hizala">
                  <AlignRight className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => executeEditorCommand('justifyFull')} className="p-1.5 hover:bg-slate-200 rounded-lg transition cursor-pointer" title="İki Yana Yasla">
                  <AlignJustify className="w-3.5 h-3.5" />
                </button>

                <div className="w-[1px] h-6 bg-slate-200 mx-1" />

                {/* Link & Image */}
                <button 
                  type="button" 
                  onClick={() => {
                    const url = prompt("Bağlantı URL'sini girin:", "https://");
                    if (url) executeEditorCommand('createLink', url);
                  }} 
                  className="p-1.5 hover:bg-slate-200 rounded-lg transition cursor-pointer" 
                  title="Link Ekle"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    const src = prompt("Resim URL'sini girin:");
                    if (src) executeEditorCommand('insertImage', src);
                  }} 
                  className="p-1.5 hover:bg-slate-200 rounded-lg transition cursor-pointer" 
                  title="Resim Ekle"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                </button>

                <div className="w-[1px] h-6 bg-slate-200 mx-1" />

                {/* Eraser */}
                <button type="button" onClick={() => executeEditorCommand('removeFormat')} className="p-1.5 hover:bg-slate-200 rounded-lg transition cursor-pointer" title="Biçimlendirmeyi Temizle">
                  <Eraser className="w-3.5 h-3.5" />
                </button>

                {/* Blockquote */}
                <button type="button" onClick={() => executeEditorCommand('formatBlock', '<blockquote>')} className="p-1.5 hover:bg-slate-200 rounded-lg transition cursor-pointer" title="Alıntı">
                  <Quote className="w-3.5 h-3.5" />
                </button>
                
                {/* Palette */}
                <input 
                  type="color" 
                  onChange={(e) => executeEditorCommand('foreColor', e.target.value)} 
                  className="w-6 h-6 border border-slate-300 rounded cursor-pointer p-0 bg-transparent" 
                  title="Yazı Rengi"
                />
              </div>
            )}

            {/* Source View Control */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  if (!showSource) {
                    // Update editorContent state from contentEditable ref
                    const editorEl = document.getElementById("wysiwyg-editor");
                    if (editorEl) {
                      setEditorContent(editorEl.innerHTML);
                    }
                  } else {
                    // Update contentEditable content from editorContent state
                    setTimeout(() => {
                      const editorEl = document.getElementById("wysiwyg-editor");
                      if (editorEl) {
                        editorEl.innerHTML = editorContent;
                      }
                    }, 50);
                  }
                  setShowSource(!showSource);
                }}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-bold transition border cursor-pointer ${
                  showSource 
                    ? 'bg-orange-50 border-orange-200 text-orange-650' 
                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                {showSource ? "Görsel Düzenleyiciye Geç" : "Kaynak Kodunu Göster"}
              </button>
            </div>

            {/* Editor Workspace */}
            <div className="flex-1 min-h-[300px] border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-inner flex flex-col">
              {showSource ? (
                <textarea
                  value={editorContent}
                  onChange={(e) => setEditorContent(e.target.value)}
                  className="w-full flex-1 p-4 outline-none font-mono text-xs leading-relaxed resize-none bg-slate-950 text-slate-200 border-none text-left"
                  dir="ltr"
                  placeholder="<h2>Fatura Alt Bilgi HTML Kodlarınız</h2>"
                />
              ) : (
                <div
                  id="wysiwyg-editor"
                  contentEditable
                  suppressContentEditableWarning
                  onInput={(e) => setEditorContent(e.currentTarget.innerHTML)}
                  className="w-full flex-1 p-4 overflow-y-auto outline-none prose prose-sm max-w-none text-slate-800 bg-white text-left"
                  dir="ltr"
                  style={{ minHeight: "300px", direction: "ltr", textAlign: "left" }}
                  dangerouslySetInnerHTML={{ __html: editorContent }}
                />
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => setIsHtmlEditorOpen(false)}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs transition shadow-sm cursor-pointer"
              >
                <X className="w-4 h-4" />
                İptal
              </button>
              <button
                type="button"
                onClick={() => {
                  let finalHtml = editorContent;
                  if (!showSource) {
                    const editorEl = document.getElementById("wysiwyg-editor");
                    if (editorEl) {
                      finalHtml = editorEl.innerHTML;
                    }
                  }
                  setCompanyInvoiceFooter(finalHtml);
                  setIsHtmlEditorOpen(false);
                  toast.success("Fatura alt bilgisi geçici olarak güncellendi. Ayarları kaydetmek için lütfen 'Bilgileri Güncelle' butonuna tıklayın.");
                }}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-lime-600 hover:bg-lime-700 text-white rounded-xl font-bold text-xs transition shadow-sm cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

