"use client";

import { useState, useEffect, useRef } from "react";
import {
  HeadphonesIcon, Search, RefreshCw, Loader2,
  Clock, CheckCircle2, AlertCircle, MessageCircle,
  ChevronDown, User, Calendar, MessageSquare, Plus,
  Trash2, Phone, Mail, MapPin, Sparkles, Bell, ArrowRight, ArrowLeft, X
} from "lucide-react";
import { toast } from "sonner";


const playNotificationSound = (type: "send" | "receive") => {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    if (type === "send") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880.00, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else {
      const playTone = (freq: number, startTime: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.12, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };
      playTone(880.00, ctx.currentTime, 0.3); // A5
      playTone(1174.66, ctx.currentTime + 0.1, 0.4); // D6
    }
  } catch (e) {
    console.error("Failed to play sound", e);
  }
};

interface Ticket {
  id: string;
  email: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  currentAccount?: {
    id?: string;
    name: string;
    type?: string;
    phone?: string;
    balance?: number;
    currency?: string;
  } | null;
  messages?: { sender?: string; message: string; createdAt: string }[];
}

interface CRMTask {
  id: string;
  cariName: string;
  type: "TELEFON" | "EPOSTA" | "YUZYUZE";
  personnel: string;
  content: string;
  reminderDate: string;
  alarm: boolean;
  status: "TODO" | "PROGRESS" | "DONE";
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  ACIK:       { label: "Açık",       cls: "bg-blue-50 text-blue-700 border-blue-200"     },
  BEKLEMEDE:  { label: "Beklemede",  cls: "bg-amber-50 text-amber-700 border-amber-200"  },
  CEVAPLANDI: { label: "Cevaplandı", cls: "bg-purple-50 text-purple-700 border-purple-200" },
  KAPALI:     { label: "Sonuçlandırıldı", cls: "bg-gray-100 text-gray-600 border-gray-200"    },
};

const PRIORITY_MAP: Record<string, { label: string; cls: string }> = {
  DUSUK:   { label: "Düşük",   cls: "text-gray-500" },
  NORMAL:  { label: "Normal",  cls: "text-blue-600"  },
  YUKSEK:  { label: "Yüksek",  cls: "text-amber-600" },
  KRITIK:  { label: "Kritik",  cls: "text-red-600"   },
};

const INITIAL_CRM_TASKS: CRMTask[] = [];

const QUICK_REPLIES = [
  { label: "Talep Alındı", text: "Merhaba, talebiniz alınmıştır. En kısa sürede inceleyip size geri dönüş sağlayacağız." },
  { label: "Çözüm İletildi", text: "Merhaba, belirttiğiniz konu/sorun incelenmiş ve çözüme kavuşturulmuştur. Yardımcı olabileceğimiz başka bir konu var mı?" },
  { label: "Ek Bilgi Talebi", text: "Merhaba, konuyu detaylandırabilmemiz için ek belgelere veya ekran görüntülerine ihtiyacımız bulunmaktadır. İlgili dosyaları paylaşabilir misiniz?" },
  { label: "Bayilik Başvurusu", text: "Merhaba, bayilik başvurunuz için teşekkür ederiz. Belgeleriniz onay sürecindedir. Temsilciniz en kısa sürede sizinle irtibata geçecektir." }
];

const parseContactMessage = (msgText?: string) => {
  if (!msgText) return null;
  const senderMatch = msgText.match(/Gönderen:\s*([^\n]+)/i);
  const phoneMatch = msgText.match(/Telefon:\s*([^\n]+)/i);
  const contentMatch = msgText.match(/Mesaj:\s*([\s\S]+)/i);
  
  if (!senderMatch && !phoneMatch) return null;
  
  return {
    senderName: senderMatch ? senderMatch[1].trim() : null,
    phone: phoneMatch ? phoneMatch[1].trim() : null,
    messageContent: contentMatch ? contentMatch[1].trim() : msgText
  };
};

export default function TicketsAndCRMPage() {
  const [activeMainTab, setActiveMainTab] = useState<"crm" | "tickets">("crm");

  // ---------------- TICKETS STATE ----------------
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const prevMessagesCountRef = useRef<number>(0);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // ---------------- CRM STATE ----------------
  const [crmTasks, setCrmTasks] = useState<CRMTask[]>([]);
  const [isAddCrmModalOpen, setIsAddCrmModalOpen] = useState(false);
  const [newCrm, setNewCrm] = useState({
    cariName: "",
    type: "TELEFON" as any,
    personnel: "",
    content: "",
    reminderDate: "",
    alarm: true
  });

  // Load CRM tasks from local storage or set empty array
  useEffect(() => {
    const saved = localStorage.getItem("pekefe_crm_tasks_v2");
    if (saved) {
      try {
        setCrmTasks(JSON.parse(saved));
      } catch {
        setCrmTasks([]);
      }
    } else {
      setCrmTasks([]);
    }
  }, []);

  const saveCrmTasks = (newTasks: CRMTask[]) => {
    setCrmTasks(newTasks);
    localStorage.setItem("pekefe_crm_tasks_v2", JSON.stringify(newTasks));
  };

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      const res = await fetch(`/api/tickets?${params}`);
      const data = await res.json();
      setTickets(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Talepler yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTicket = async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedTicket(data);
      }
    } catch (e) {
      console.error(e);
    }
  };


  useEffect(() => {
    if (selectedTicket?.messages) {
      const currentCount = selectedTicket.messages.length;
      const prevCount = prevMessagesCountRef.current;
      if (prevCount > 0 && currentCount > prevCount) {
        const lastMessage = selectedTicket.messages[currentCount - 1];
        if (lastMessage && lastMessage.sender !== "ADMIN") {
          playNotificationSound("receive");
        }
      }
      prevMessagesCountRef.current = currentCount;
    } else {
      prevMessagesCountRef.current = 0;
    }
  }, [selectedTicket]);

  useEffect(() => {
    if (selectedTicket?.messages && chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [selectedTicket?.messages]);

  useEffect(() => { 
    if (activeMainTab === "tickets") {
      fetchTickets(); 
    }
  }, [statusFilter, activeMainTab]);

  // Auto-poll tickets and selected ticket details every 4 seconds for real-time updates without page flicker
  useEffect(() => {
    if (activeMainTab !== "tickets") return;
    const interval = setInterval(() => {
      const fetchSilent = async () => {
        try {
          const params = new URLSearchParams();
          if (statusFilter !== "ALL") params.set("status", statusFilter);
          const res = await fetch(`/api/tickets?${params}`);
          if (res.ok) {
            const data = await res.json();
            setTickets(Array.isArray(data) ? data : []);
          }
          if (selectedTicket?.id) {
            const detailRes = await fetch(`/api/tickets/${selectedTicket.id}`);
            if (detailRes.ok) {
              const detailData = await detailRes.json();
              setSelectedTicket(detailData);
            }
          }
        } catch (e) {
          console.error("Silent poll error", e);
        }
      };
      fetchSilent();
    }, 4000);
    return () => clearInterval(interval);
  }, [statusFilter, activeMainTab, selectedTicket?.id]);

  const filteredTickets = tickets.filter((t) =>
    t.subject?.toLowerCase().includes(search.toLowerCase()) ||
    t.currentAccount?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const openTickets = tickets.filter(t => t.status === "ACIK").length;
  const waitingTickets = tickets.filter(t => t.status === "BEKLEMEDE").length;
  const closedTickets = tickets.filter(t => t.status === "KAPALI").length;

  const handleReply = async () => {
    if (!selectedTicket || !reply.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/tickets/${selectedTicket.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: reply }),
      });
      if (res.ok) {
        toast.success("Cevap gönderildi");
        playNotificationSound("send");
        setReply("");
        fetchTickets();
        // Reload selected ticket to show new message
        const updatedRes = await fetch(`/api/tickets/${selectedTicket.id}`);
        if (updatedRes.ok) {
          const updatedData = await updatedRes.json();
          setSelectedTicket(updatedData);
        }
      } else {
        toast.error("Gönderilemedi");
      }
    } catch {
      toast.error("Gönderilemedi");
    } finally {
      setSending(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/tickets/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newStatus }),
      });
      if (res.ok) {
        toast.success(`Talep durumu "${STATUS_MAP[newStatus]?.label ?? newStatus}" olarak güncellendi`);
        setSelectedTicket(prev => prev ? { ...prev, status: newStatus } : prev);
        fetchTickets();
      } else {
        toast.error("Durum güncellenemedi");
      }
    } catch {
      toast.error("Bağlantı hatası");
    }
  };

  // ---------------- CRM ACTIONS ----------------
  const handleAddCrmTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCrm.cariName.trim() || !newCrm.content.trim()) {
      toast.error("Lütfen cari hesap adını ve görüşme notunu girin.");
      return;
    }

    const task: CRMTask = {
      id: `crm-${Date.now()}`,
      cariName: newCrm.cariName,
      type: newCrm.type,
      personnel: newCrm.personnel || "Aktif Personel",
      content: newCrm.content,
      reminderDate: newCrm.reminderDate || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      alarm: newCrm.alarm,
      status: "TODO"
    };

    const updated = [task, ...crmTasks];
    saveCrmTasks(updated);
    setIsAddCrmModalOpen(false);
    setNewCrm({
      cariName: "",
      type: "TELEFON",
      personnel: "",
      content: "",
      reminderDate: "",
      alarm: true
    });
    toast.success("Yeni CRM görevi başarıyla oluşturuldu.");
  };

  const handleMoveCrmTask = (id: string, newStatus: "TODO" | "PROGRESS" | "DONE") => {
    const updated = crmTasks.map((t) => t.id === id ? { ...t, status: newStatus } : t);
    saveCrmTasks(updated);
    toast.success("Gövre/Not aşaması güncellendi.");
  };

  const handleDeleteCrmTask = (id: string) => {
    const updated = crmTasks.filter((t) => t.id !== id);
    saveCrmTasks(updated);
    toast.success("CRM kaydı silindi.");
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-gradient-to-r from-white via-slate-50/50 to-white border border-slate-200 p-6 rounded-3xl shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-md shadow-amber-500/10 shrink-0">
            <MessageSquare className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              CRM &amp; Cari Destek Merkezi
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Müşteri Etkileşim Notları, Görevler, Randevular ve Destek Talepleri Entegrasyonu
            </p>
          </div>
        </div>
        <div className="flex gap-1.5 bg-slate-200/60 p-1.5 rounded-2xl shrink-0 border border-slate-300/40 backdrop-blur-sm">
          <button
            onClick={() => setActiveMainTab("crm")}
            className={`px-4.5 py-2 rounded-xl text-xs font-black tracking-wide transition-all duration-300 cursor-pointer ${
              activeMainTab === "crm"
                ? "bg-slate-900 text-white shadow-md shadow-slate-900/15 scale-105"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
          >
            CRM Notları (Kanban)
          </button>
          <button
            onClick={() => setActiveMainTab("tickets")}
            className={`px-4.5 py-2 rounded-xl text-xs font-black tracking-wide transition-all duration-300 cursor-pointer ${
              activeMainTab === "tickets"
                ? "bg-slate-900 text-white shadow-md shadow-slate-900/15 scale-105"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
          >
            Destek Talepleri (Tickets)
          </button>
        </div>
      </div>

      {/* Main Switcher Panels */}
      {activeMainTab === "crm" ? (
        <div className="space-y-6">
          
          {/* CRM Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white border border-slate-200 p-4.5 rounded-2xl shadow-sm">
            <div className="text-xs text-slate-500 font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
              Kayıtlı <span className="font-black text-slate-900 px-2 py-0.5 bg-slate-100 rounded-lg">{crmTasks.length}</span> adet Cari etkileşim ve görev notu listeleniyor.
            </div>
            <button
              onClick={() => setIsAddCrmModalOpen(true)}
              className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 transition-all duration-300 shadow-md shadow-amber-500/10 hover:shadow-lg active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Yeni Etkinlik &amp; Görev Ekle
            </button>
          </div>

          {/* CRM KANBAN BOARD */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Column 1: TODO */}
            <div className="bg-slate-50/70 border border-slate-200 rounded-3xl p-5 flex flex-col min-h-[500px] shadow-sm">
              <div className="flex justify-between items-center mb-4 pb-2.5 border-b border-slate-200">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                  Yapılacaklar / Planlanan
                </span>
                <span className="bg-slate-200/80 text-slate-700 px-2.5 py-0.5 rounded-full text-[10px] font-black">
                  {crmTasks.filter(t => t.status === "TODO").length}
                </span>
              </div>
              <div className="space-y-4 flex-1 overflow-y-auto max-h-[600px] pr-1">
                {crmTasks.filter(t => t.status === "TODO").map(task => (
                  <CRMTaskCard key={task.id} task={task} onMove={handleMoveCrmTask} onDelete={handleDeleteCrmTask} />
                ))}
                {crmTasks.filter(t => t.status === "TODO").length === 0 && (
                  <div className="text-center py-20 text-slate-400 text-xs italic bg-white/50 border border-dashed border-slate-200 rounded-2xl">Planlanmış bir görev bulunmuyor.</div>
                )}
              </div>
            </div>

            {/* Column 2: PROGRESS */}
            <div className="bg-slate-50/70 border border-slate-200 rounded-3xl p-5 flex flex-col min-h-[500px] shadow-sm">
              <div className="flex justify-between items-center mb-4 pb-2.5 border-b border-slate-200">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                  Süreçtekiler / Görüşülen
                </span>
                <span className="bg-amber-100 text-amber-800 border border-amber-200/50 px-2.5 py-0.5 rounded-full text-[10px] font-black">
                  {crmTasks.filter(t => t.status === "PROGRESS").length}
                </span>
              </div>
              <div className="space-y-4 flex-1 overflow-y-auto max-h-[600px] pr-1">
                {crmTasks.filter(t => t.status === "PROGRESS").map(task => (
                  <CRMTaskCard key={task.id} task={task} onMove={handleMoveCrmTask} onDelete={handleDeleteCrmTask} />
                ))}
                {crmTasks.filter(t => t.status === "PROGRESS").length === 0 && (
                  <div className="text-center py-20 text-slate-400 text-xs italic bg-white/50 border border-dashed border-slate-200 rounded-2xl">Aktif görüşme bulunmuyor.</div>
                )}
              </div>
            </div>

            {/* Column 3: DONE */}
            <div className="bg-slate-50/70 border border-slate-200 rounded-3xl p-5 flex flex-col min-h-[500px] shadow-sm">
              <div className="flex justify-between items-center mb-4 pb-2.5 border-b border-slate-200">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  Tamamlanan / Kaydedilen
                </span>
                <span className="bg-emerald-100 text-emerald-800 border border-emerald-200/50 px-2.5 py-0.5 rounded-full text-[10px] font-black">
                  {crmTasks.filter(t => t.status === "DONE").length}
                </span>
              </div>
              <div className="space-y-4 flex-1 overflow-y-auto max-h-[600px] pr-1">
                {crmTasks.filter(t => t.status === "DONE").map(task => (
                  <CRMTaskCard key={task.id} task={task} onMove={handleMoveCrmTask} onDelete={handleDeleteCrmTask} />
                ))}
                {crmTasks.filter(t => t.status === "DONE").length === 0 && (
                  <div className="text-center py-20 text-slate-400 text-xs italic bg-white/50 border border-dashed border-slate-200 rounded-2xl">Tamamlanan işlem bulunmuyor.</div>
                )}
              </div>
            </div>

          </div>

        </div>
      ) : (
        // ---------------- TICKETS WRAPPER ----------------
        <div className="space-y-6">
          
          {/* Summary Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { label: "Açık Talepler", value: openTickets, icon: <AlertCircle className="w-5 h-5 text-blue-500" />, cls: "bg-gradient-to-br from-blue-50 to-indigo-50/30 border-blue-150 text-blue-950 shadow-sm" },
              { label: "Bekleyenler", value: waitingTickets, icon: <Clock className="w-5 h-5 text-amber-500 animate-pulse" />, cls: "bg-gradient-to-br from-amber-50 to-yellow-50/30 border-amber-150 text-amber-950 shadow-sm" },
              { label: "Kapatılanlar", value: closedTickets, icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />, cls: "bg-gradient-to-br from-emerald-50 to-teal-50/30 border-emerald-150 text-emerald-950 shadow-sm" },
            ].map((s) => (
              <div key={s.label} className={`${s.cls} rounded-2xl p-6 border flex items-center justify-between transition hover:-translate-y-0.5 hover:shadow-md duration-300`}>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{s.label}</p>
                  <p className="text-3xl font-black tracking-tight mt-1.5">{s.value}</p>
                </div>
                <div className="p-3.5 bg-white rounded-2xl shadow-sm border border-slate-100/50">
                  {s.icon}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: ticket list */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white border border-slate-200 p-4.5 rounded-2xl shadow-sm flex gap-3 items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Konu veya cari hesap ara..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-2xl outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-all font-semibold placeholder:text-slate-400"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3.5 py-2.5 text-sm border border-slate-200 rounded-2xl bg-white focus:outline-none focus:border-amber-500 font-bold cursor-pointer"
                >
                  <option value="ALL">Tüm Durumlar</option>
                  {Object.entries(STATUS_MAP).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
                <button onClick={fetchTickets} className="p-2.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 border border-slate-200 rounded-xl transition cursor-pointer">
                  <RefreshCw className="w-4.5 h-4.5" />
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                {loading ? (
                  <div className="flex items-center justify-center py-24 gap-2 text-slate-500 text-xs font-bold">
                    <Loader2 className="w-5 h-5 animate-spin text-amber-500" /> Yükleniyor...
                  </div>
                ) : filteredTickets.length === 0 ? (
                  <div className="py-24 text-center text-slate-400 text-xs font-semibold flex flex-col items-center justify-center gap-3">
                    <div className="w-14 h-14 bg-slate-50 border border-slate-250/50 rounded-full flex items-center justify-center mb-1">
                      <MessageCircle className="w-6 h-6 text-slate-400" />
                    </div>
                    <div>
                      <p className="font-black text-slate-700">Talep Bulunamadı</p>
                      <p className="text-slate-400 text-xs mt-0.5">Kriterlere uygun herhangi bir destek talebi bulunmuyor.</p>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {filteredTickets.map((t) => {
                      const st = STATUS_MAP[t.status] ?? { label: t.status, cls: "bg-slate-100 text-slate-600 border-slate-200" };
                      const pr = PRIORITY_MAP[t.priority] ?? { label: t.priority, cls: "text-slate-500" };
                      
                      // Peak at latest message
                      const latestMsg = t.messages?.[0]?.message;
                      const parsedLatest = latestMsg ? parseContactMessage(latestMsg) : null;
                      const snippet = parsedLatest ? parsedLatest.messageContent : latestMsg;
                      const isSelected = selectedTicket?.id === t.id;

                      return (
                        <button
                          key={t.id}
                          onClick={() => handleSelectTicket(t)}
                          className={`w-full text-left px-5 py-4.5 transition-all border-b border-slate-100 flex items-stretch gap-0.5 border-l-4 ${
                            isSelected 
                              ? "bg-zinc-950 text-zinc-100 border-l-amber-500 shadow-md scale-[1.005]" 
                              : "bg-white hover:bg-slate-50/70 border-l-transparent text-slate-800"
                          }`}
                        >
                          <div className="flex-1 flex flex-col justify-between min-w-0 pr-4">
                            <div>
                              <p className={`text-sm font-black truncate leading-normal ${isSelected ? "text-white" : "text-slate-800"}`}>
                                {t.subject}
                              </p>
                              
                              {/* Preview Snippet */}
                              {snippet && (
                                <p className={`text-xs mt-1.5 line-clamp-1 italic font-medium leading-relaxed ${isSelected ? "text-amber-250/80" : "text-slate-500"}`}>
                                  {snippet}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-2.5 mt-3 pt-1 border-t border-slate-100/50">
                              <span className={`text-[11px] font-black flex items-center gap-1.5 ${isSelected ? "text-zinc-300" : "text-slate-500"}`}>
                                <User className="w-3.5 h-3.5" /> {t.currentAccount?.name ?? "Misafir"}
                              </span>
                              <span className="text-zinc-300/40">|</span>
                              <span className={`text-[11px] font-bold ${isSelected ? "text-zinc-400" : "text-slate-400"}`}>
                                {new Date(t.updatedAt).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end justify-between shrink-0 pl-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider shadow-sm ${st.cls}`}>{st.label}</span>
                            {t.priority && <span className={`text-[10px] font-black uppercase tracking-wider mt-2.5 ${pr.cls}`}>{pr.label}</span>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
 
            {/* Right: detail / reply */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl shadow-sm p-6 flex flex-col gap-5 h-fit relative min-h-[500px]">
              {selectedTicket ? (
                <>
                  {/* Subject and Customer Info Header */}
                  <div className="pb-4.5 border-b border-slate-100">
                    <h3 className="text-lg font-black text-slate-900 leading-snug tracking-tight">{selectedTicket.subject}</h3>
                    
                    {/* Customer Info Card */}
                    {(() => {
                       const firstMsg = selectedTicket.messages?.[0]?.message;
                       const parsedContact = firstMsg ? parseContactMessage(firstMsg) : null;
                       
                       const displayName = parsedContact?.senderName || selectedTicket.currentAccount?.name || "Misafir Kullanıcı";
                       const displayPhone = parsedContact?.phone || selectedTicket.currentAccount?.phone;
                       const hasAccount = !!selectedTicket.currentAccount;
                       
                       return (
                         <div className="mt-4 bg-slate-50/60 border border-slate-200/80 rounded-2xl p-4.5 space-y-3.5 shadow-sm relative overflow-hidden">
                           <div className="flex items-start justify-between gap-3">
                             <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-black text-sm uppercase shrink-0 border border-amber-500/20">
                                 {displayName[0]}
                               </div>
                               <div>
                                 <p className="text-sm font-black text-slate-800 leading-snug">{displayName}</p>
                                 <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${hasAccount ? "bg-emerald-50 text-emerald-700 border border-emerald-250" : "bg-slate-200 text-slate-600"}`}>
                                   {hasAccount ? `${selectedTicket.currentAccount?.type === "MUSTERI" ? "Kayıtlı Bayi" : "Kayıtlı Cari"}` : "Ziyaretçi / Misafir"}
                                 </span>
                               </div>
                             </div>
                             {hasAccount && selectedTicket.currentAccount?.id && (
                               <a 
                                 href={`/admin/muhasebe/cari?id=${selectedTicket.currentAccount.id}`} 
                                 className="text-xs font-black text-amber-700 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 px-3 py-2 rounded-xl transition flex items-center gap-1 shrink-0 hover:scale-[1.02] duration-300 shadow-sm"
                               >
                                 Cari Kartı <ArrowRight className="w-2.5 h-2.5" />
                               </a>
                             )}
                           </div>
                           
                           <div className="grid grid-cols-1 gap-2 text-xs text-slate-650 font-semibold pt-2.5 border-t border-slate-200">
                             <div className="flex items-center gap-2">
                               <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                               <a href={`mailto:${selectedTicket.email}`} className="text-slate-700 hover:text-amber-600 truncate transition leading-none">{selectedTicket.email}</a>
                             </div>
                             {displayPhone && (
                               <div className="flex items-center gap-2">
                                 <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                                 <a href={`tel:${displayPhone}`} className="text-slate-700 hover:text-amber-600 transition leading-none">{displayPhone}</a>
                               </div>
                             )}
                             {hasAccount && typeof selectedTicket.currentAccount?.balance === 'number' && (
                               <div className="flex items-center justify-between text-xs font-black text-slate-500 bg-slate-200/50 px-3 py-2 rounded-lg mt-1 border border-slate-200/30">
                                 <span>Cari Hesap Bakiyesi:</span>
                                 <span className={selectedTicket.currentAccount.balance >= 0 ? "text-slate-800" : "text-rose-600"}>
                                   {selectedTicket.currentAccount.balance.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} {selectedTicket.currentAccount.currency || "TRY"}
                                 </span>
                               </div>
                             )}
                           </div>
                         </div>
                       );
                    })()}
                  </div>

                  {/* Messages Thread */}
                  <div ref={chatContainerRef} className="flex-1 space-y-4 max-h-[380px] min-h-[220px] overflow-y-auto pr-1 flex flex-col py-2 scrollbar-thin bg-slate-50/80 border border-slate-200 rounded-2xl p-4 shadow-inner">
                    {(selectedTicket.messages ?? []).map((m, i) => {
                      const isSystemAdmin = m.sender === "ADMIN";
                      
                      // If this is the client's first message, check if it matches contact format to render parsed text only.
                      let renderedText = m.message;
                      if (!isSystemAdmin && i === 0) {
                        const parsed = parseContactMessage(m.message);
                        if (parsed) renderedText = parsed.messageContent;
                      }

                      return (
                        <div key={i} className={`flex items-start gap-2.5 max-w-[85%] ${isSystemAdmin ? "self-end flex-row-reverse" : "self-start"}`}>
                          <div className={`w-8 h-8 rounded-2xl flex items-center justify-center font-black text-[10px] shrink-0 border shadow-sm ${
                            isSystemAdmin 
                              ? "bg-slate-900 border-slate-700 text-amber-500" 
                              : "bg-amber-100 border-amber-250 text-amber-800"
                          }`}>
                            {isSystemAdmin ? "A" : (selectedTicket.currentAccount?.name?.[0] || selectedTicket.email?.[0] || "?").toUpperCase()}
                          </div>
                          
                          <div className="flex flex-col">
                            <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                              isSystemAdmin 
                                ? "bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 font-extrabold rounded-tr-none border border-amber-600/10" 
                                : "bg-white border border-slate-200 text-slate-800 rounded-tl-none"
                            }`}>
                              <p className="whitespace-pre-line break-words">{renderedText}</p>
                            </div>
                            <span className={`text-[10px] font-black text-slate-400 mt-1.5 uppercase tracking-wider px-1.5 ${isSystemAdmin ? "text-right" : "text-left"}`}>
                              {isSystemAdmin ? "Destek Ekibi" : "Müşteri / Misafir"} · {new Date(m.createdAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    {(!selectedTicket.messages || selectedTicket.messages.length === 0) && (
                      <p className="text-xs text-slate-400 text-center py-4 italic">Herhangi bir mesajlaşma geçmişi bulunmuyor.</p>
                    )}
                  </div>

                  {/* Status Update Buttons */}
                  <div className="border-t border-slate-100 pt-4">
                    <p className="text-xs font-black text-slate-450 uppercase tracking-wider mb-2.5">Talep Durumunu Güncelle</p>
                    <div className="flex flex-wrap gap-2 mb-1">
                      {selectedTicket.status !== "BEKLEMEDE" && (
                        <button
                          onClick={() => handleUpdateStatus(selectedTicket.id, "BEKLEMEDE")}
                          className="px-3.5 py-2 text-xs font-black text-amber-800 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 hover:text-amber-900 transition-all cursor-pointer shadow-sm"
                        >
                          ⏳ Beklemede
                        </button>
                      )}
                      {selectedTicket.status !== "CEVAPLANDI" && (
                        <button
                          onClick={() => handleUpdateStatus(selectedTicket.id, "CEVAPLANDI")}
                          className="px-3.5 py-2 text-xs font-black text-purple-800 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 hover:text-purple-900 transition-all cursor-pointer shadow-sm"
                        >
                          ✉️ Cevaplandı
                        </button>
                      )}
                      {selectedTicket.status !== "KAPALI" && (
                        <button
                          onClick={() => handleUpdateStatus(selectedTicket.id, "KAPALI")}
                          className="px-3.5 py-2 text-xs font-black text-rose-800 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 hover:text-rose-900 transition-all cursor-pointer shadow-sm"
                        >
                          🔒 Sonuçlandır
                        </button>
                      )}
                      {selectedTicket.status === "KAPALI" && (
                        <button
                          onClick={() => handleUpdateStatus(selectedTicket.id, "ACIK")}
                          className="px-3.5 py-2 text-xs font-black text-blue-800 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:text-blue-900 transition-all cursor-pointer shadow-sm"
                        >
                          🔓 Yeniden Aç
                        </button>
                      )}
                    </div>
                  </div>
  
                  {/* Reply Area with Quick Replies */}
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <div className="space-y-1.5">
                      <p className="text-xs font-black text-slate-450 uppercase tracking-wider">Hızlı Şablonlar</p>
                      <div className="flex flex-wrap gap-1.5">
                        {QUICK_REPLIES.map((qr, index) => (
                          <button
                            key={index}
                            onClick={() => setReply(qr.text)}
                            className="px-3 py-1.5 text-xs font-bold text-slate-650 bg-slate-100 border border-slate-200 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-800 rounded-lg transition-all cursor-pointer"
                          >
                            ⚡ {qr.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <textarea
                      rows={3}
                      placeholder="Cevabınızı yazın..."
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      className="w-full text-sm border border-slate-200 rounded-2xl px-4 py-3 resize-none outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-all placeholder:text-slate-400 font-semibold leading-relaxed"
                    />
                    <button
                      onClick={handleReply}
                      disabled={sending || !reply.trim()}
                      className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black uppercase tracking-wider text-sm rounded-2xl shadow-xl shadow-amber-500/15 hover:shadow-amber-500/25 active:scale-[0.98] transition-all duration-300 cursor-pointer disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-1.5"
                    >
                      {sending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Gönderiliyor...
                        </>
                      ) : (
                        <>
                          Cevabı İlet <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <div className="py-24 text-center text-slate-400 flex flex-col items-center justify-center gap-3.5">
                  <div className="w-14 h-14 bg-slate-50 border border-slate-200 rounded-3xl flex items-center justify-center mb-1">
                    <HeadphonesIcon className="w-6 h-6 text-slate-400 animate-pulse" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-800">Talep Seçilmedi</p>
                    <p className="text-[10px] font-semibold text-slate-500 mt-1 max-w-[220px] mx-auto leading-relaxed">İletişim ve destek detaylarını görüntülemek için sol taraftaki listeden bir talep seçin.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* CRM TASK CREATION MODAL */}
      {isAddCrmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 animate-in fade-in duration-200">
          <div className="bg-white relative z-10 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-orange-100 text-orange-500 rounded-lg">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800">Yeni CRM Görüşme / Görev Kartı</h3>
                  <p className="text-[9px] font-semibold text-slate-400 mt-0.5">Müşteri İlişkileri Takip Girişi</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddCrmModalOpen(false)}
                className="w-7 h-7 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddCrmTask} className="p-6 space-y-4">
              
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-0.5">İlişkili Cari Unvanı *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Örn: Zeta Dağıtım A.Ş. veya Ahmet Yılmaz" 
                  value={newCrm.cariName}
                  onChange={(e) => setNewCrm({...newCrm, cariName: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:bg-white focus:border-orange-400 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-0.5">İletişim Kanalı</label>
                  <select 
                    value={newCrm.type}
                    onChange={(e) => setNewCrm({...newCrm, type: e.target.value as any})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:bg-white focus:border-orange-400 transition cursor-pointer"
                  >
                    <option value="TELEFON">Telefon Görüşmesi</option>
                    <option value="EPOSTA">E-Posta Gönderimi</option>
                    <option value="YUZYUZE">Yüz Yüze Toplantı</option>
                  </select>
                </div>
                
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-0.5">Görüşmeyi Yapan Personel</label>
                  <input 
                    type="text" 
                    placeholder="Örn: Ahmet Şahin" 
                    value={newCrm.personnel}
                    onChange={(e) => setNewCrm({...newCrm, personnel: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:bg-white focus:border-orange-400 transition"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-0.5">Görüşme Notu / Detay *</label>
                <textarea 
                  rows={4}
                  required
                  placeholder="Görüşme detayları, alınan kararlar veya planlanan aksiyon notları..." 
                  value={newCrm.content}
                  onChange={(e) => setNewCrm({...newCrm, content: e.target.value})}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:bg-white focus:border-orange-400 transition resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 items-center bg-slate-50 p-4 rounded-xl border border-slate-200/50">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-0.5">Hatırlatma Vadesi</label>
                  <input 
                    type="datetime-local" 
                    value={newCrm.reminderDate}
                    onChange={(e) => setNewCrm({...newCrm, reminderDate: e.target.value})}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:border-orange-400 outline-none"
                  />
                </div>
                
                <div className="flex items-center gap-2 mt-4 ml-4">
                  <input 
                    type="checkbox" 
                    id="modalAlarmToggle"
                    checked={newCrm.alarm}
                    onChange={(e) => setNewCrm({...newCrm, alarm: e.target.checked})}
                    className="w-4 h-4 text-orange-500 focus:ring-orange-500 border-slate-300 rounded cursor-pointer"
                  />
                  <label htmlFor="modalAlarmToggle" className="text-xs text-slate-600 font-bold cursor-pointer select-none flex items-center gap-1">
                    <Bell className="w-3.5 h-3.5 text-orange-500" /> Hatırlatma Alarmı
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t border-slate-100 pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddCrmModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Görevi Kaydet
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// ---------------- SUB-COMPONENTS ----------------

function CRMTaskCard({ task, onMove, onDelete }: { task: CRMTask; onMove: (id: string, s: any) => void; onDelete: (id: string) => void }) {
  const dateFormatted = new Date(task.reminderDate).toLocaleDateString("tr-TR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  
  const typeIcons = {
    TELEFON: <Phone className="w-3.5 h-3.5 text-blue-500" />,
    EPOSTA: <Mail className="w-3.5 h-3.5 text-purple-500" />,
    YUZYUZE: <MapPin className="w-3.5 h-3.5 text-emerald-500" />
  };
  
  const typeLabels = {
    TELEFON: "Telefon",
    EPOSTA: "E-Posta",
    YUZYUZE: "Yüz Yüze"
  };

  const channelBorders = {
    TELEFON: "border-l-4 border-l-blue-500",
    EPOSTA: "border-l-4 border-l-purple-500",
    YUZYUZE: "border-l-4 border-l-emerald-500"
  };

  return (
    <div className={`bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 space-y-3 group relative ${channelBorders[task.type]}`}>
      <div className="flex justify-between items-start gap-2">
        <div className="min-w-0">
          <h4 className="font-black text-xs text-slate-800 truncate leading-snug tracking-tight">{task.cariName}</h4>
          <div className="flex items-center gap-1.5 mt-1.5 text-[9px] text-slate-400 font-extrabold">
            <User className="w-3 h-3 text-slate-350" />
            <span>Temsilci: {task.personnel}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="p-1.5 rounded-xl bg-slate-50 border border-slate-200/60 inline-flex items-center justify-center shadow-inner" title={typeLabels[task.type]}>
            {typeIcons[task.type]}
          </span>
          <button
            onClick={() => onDelete(task.id)}
            className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
            title="Kayıt Sil"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <p className="text-[11px] text-slate-650 leading-relaxed font-semibold bg-slate-50/50 border border-slate-200/40 p-3 rounded-xl">{task.content}</p>

      <div className="flex justify-between items-center text-[9px] font-black text-slate-400 pt-2.5 border-t border-slate-100/50">
        <span className="flex items-center gap-1.5 bg-slate-100/60 border border-slate-200/30 px-2.5 py-1 rounded-lg">
          <Calendar className="w-3 h-3 text-slate-400" /> {dateFormatted}
          {task.alarm && <Bell className="w-2.5 h-2.5 text-orange-500 fill-orange-500/10 animate-bounce" aria-label="Alarm Açık" />}
        </span>
        
        {/* Kanban Move triggers */}
        <div className="flex items-center gap-1">
          {task.status !== "TODO" && (
            <button 
              onClick={() => onMove(task.id, task.status === "DONE" ? "PROGRESS" : "TODO")}
              className="p-1 hover:bg-slate-100 hover:text-slate-700 text-slate-450 rounded-lg transition cursor-pointer"
              title="Bir önceki aşamaya taşı"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          )}
          {task.status !== "DONE" && (
            <button 
              onClick={() => onMove(task.id, task.status === "TODO" ? "PROGRESS" : "DONE")}
              className="p-1 hover:bg-slate-100 hover:text-slate-700 text-slate-450 rounded-lg transition cursor-pointer"
              title="Bir sonraki aşamaya taşı"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

