"use client";

import { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  RefreshCw,
  Code2,
  Eye,
  EyeOff,
  Copy,
  Check,
  ShieldCheck,
  AlertTriangle,
  Database,
  Zap,
  TrendingUp,
  Package,
  Users,
  FileText,
  Clock,
  ChevronDown,
  ChevronUp,
  X,
  Bot,
  User,
  BarChart3
} from "lucide-react";

// ─── Tip Tanımları ─────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sql?: string | null;
  rows?: any[];
  rowCount?: number;
  executionMs?: number;
  blocked?: boolean;
  error?: boolean;
  timestamp: Date;
}

// ─── Örnek Sorular ─────────────────────────────────────────────────────────────

const EXAMPLE_QUESTIONS = [
  { icon: TrendingUp,  color: "text-emerald-600 bg-emerald-50 border-emerald-100", text: "Bu ay toplam satışımız ve sipariş sayısı nedir?" },
  { icon: Package,     color: "text-amber-600 bg-amber-50 border-amber-100",   text: "Stoku kritik seviyenin altına düşmüş ürünler hangileri?" },
  { icon: Users,       color: "text-blue-600 bg-blue-50 border-blue-100",     text: "En yüksek bakiyeli müşteri alacaklarımızı listele" },
  { icon: FileText,    color: "text-violet-600 bg-violet-50 border-violet-100", text: "Bu ayki fatura toplamı ve ödeme bekleyen faturalar" },
  { icon: BarChart3,   color: "text-orange-600 bg-orange-50 border-orange-100", text: "Bugün depodan en çok çıkış yapan 5 ürünü göster" },
  { icon: TrendingUp,  color: "text-rose-600 bg-rose-50 border-rose-100",    text: "Son 30 günde hangi müşteri en fazla sipariş verdi?" },
];

// ─── Yardımcı Bileşenler ───────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-end gap-3">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-md">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1.5 items-center h-5">
          <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}

function SQLBlock({ sql }: { sql: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-3 rounded-xl overflow-hidden border border-slate-200 bg-slate-950">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Code2 className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Üretilen SQL (Read-Only)</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-[10px] text-slate-400 hover:text-slate-200 transition"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Kopyalandı!" : "Kopyala"}
        </button>
      </div>
      <pre className="px-4 py-3 text-[11px] text-emerald-300 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">
        {sql}
      </pre>
    </div>
  );
}

function DataTable({ rows, maxRows = 10 }: { rows: any[]; maxRows?: number }) {
  const [expanded, setExpanded] = useState(false);
  if (!rows || rows.length === 0) return null;

  const headers = Object.keys(rows[0]);
  const displayRows = expanded ? rows : rows.slice(0, maxRows);

  return (
    <div className="mt-3 rounded-xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {headers.map(h => (
                <th key={h} className="px-3 py-2 font-bold text-slate-500 uppercase tracking-wider text-[9px] whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 bg-white">
            {displayRows.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50">
                {headers.map(h => (
                  <td key={h} className="px-3 py-2 text-slate-700 whitespace-nowrap">
                    {typeof row[h] === "number"
                      ? Number(row[h]).toLocaleString("tr-TR", { maximumFractionDigits: 2 })
                      : String(row[h] ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > maxRows && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-50 border-t border-slate-100 transition"
        >
          {expanded ? (
            <><ChevronUp className="w-3.5 h-3.5" /> Daralt</>
          ) : (
            <><ChevronDown className="w-3.5 h-3.5" /> {rows.length - maxRows} satır daha göster</>
          )}
        </button>
      )}
    </div>
  );
}

function MessageBubble({
  message,
  debugMode
}: {
  message: Message;
  debugMode: boolean;
}) {
  const [showData, setShowData] = useState(false);
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex items-end gap-3 justify-end">
        <div className="max-w-[75%] bg-gradient-to-br from-violet-600 to-indigo-700 text-white rounded-2xl rounded-br-sm px-5 py-3 shadow-md">
          <p className="text-sm leading-relaxed">{message.content}</p>
        </div>
        <div className="w-8 h-8 rounded-xl bg-slate-700 flex items-center justify-center shrink-0 shadow">
          <User className="w-4 h-4 text-slate-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-md mt-0.5">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 max-w-[85%]">
        {/* Ana cevap balonu */}
        <div className={`rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm border ${
          message.blocked
            ? "bg-red-50 border-red-200 text-red-800"
            : message.error
            ? "bg-amber-50 border-amber-200 text-amber-800"
            : "bg-white border-slate-200 text-slate-800"
        }`}>
          {message.blocked && (
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-red-500" />
              <span className="text-[10px] font-bold text-red-500 uppercase tracking-wide">Güvenlik Engeli</span>
            </div>
          )}
          {message.error && !message.blocked && (
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wide">Hata</span>
            </div>
          )}
          <p className="text-sm leading-relaxed whitespace-pre-line">{message.content}</p>

          {/* Meta bilgiler */}
          {message.executionMs !== undefined && !message.blocked && (
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100">
              <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                <Clock className="w-3 h-3" /> {message.executionMs}ms
              </span>
              {message.rowCount !== undefined && (
                <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                  <Database className="w-3 h-3" /> {message.rowCount} satır
                </span>
              )}
              {message.rows && message.rows.length > 0 && (
                <button
                  onClick={() => setShowData(!showData)}
                  className="text-[10px] font-bold text-violet-600 hover:text-violet-800 flex items-center gap-1 ml-auto"
                >
                  {showData ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  {showData ? "Tabloyu Gizle" : "Tabloyu Gör"}
                </button>
              )}
            </div>
          )}
        </div>

        {/* SQL Bloğu (debug modu veya elle açılınca) */}
        {debugMode && message.sql && <SQLBlock sql={message.sql} />}

        {/* Veri tablosu */}
        {showData && message.rows && <DataTable rows={message.rows} />}

        {/* Zaman */}
        <p className="text-[10px] text-slate-400 mt-1.5 ml-1">
          {message.timestamp.toLocaleTimeString("tr-TR")}
        </p>
      </div>
    </div>
  );
}

// ─── Ana Sayfa ─────────────────────────────────────────────────────────────────

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Merhaba! Ben Atak ERP Asistanı. Size doğal Türkçe ile veritabanı sorguları yapmanızda yardımcı olabilirim.\n\nAşağıdaki örnek sorulardan birini seçebilir veya kendi sorunuzu yazabilirsiniz.",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [apiMode, setApiMode] = useState<"live" | "mock" | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // API durumunu kontrol et
  useEffect(() => {
    fetch("/api/ai-assistant/ask")
      .then(r => r.json())
      .then(d => setApiMode(d.mode))
      .catch(() => setApiMode("mock"));
  }, []);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (question: string) => {
    if (!question.trim() || loading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: question.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai-assistant/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim(), debug: true })
      });

      const data = await res.json();

      const assistantMsg: Message = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: data.answer || "Yanıt alınamadı.",
        sql: data.sql || null,
        rows: data.rows || [],
        rowCount: data.rowCount ?? 0,
        executionMs: data.executionMs,
        blocked: data.blocked || res.status === 403,
        error: !data.success && !data.blocked,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: "Bağlantı hatası oluştu. Lütfen internet bağlantınızı ve sunucu durumunu kontrol edin.",
        error: true,
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearMessages = () => {
    setMessages([{
      id: "welcome-reset",
      role: "assistant",
      content: "Sohbet temizlendi. Size nasıl yardımcı olabilirim?",
      timestamp: new Date()
    }]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] max-w-5xl mx-auto p-4 gap-4">

      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-lg font-black text-slate-900">Atak ERP Asistanı</h1>
            <span className="px-2 py-0.5 bg-violet-100 text-violet-700 text-[9px] font-black rounded-full border border-violet-200 uppercase tracking-wider">
              NL2SQL
            </span>
          </div>
          <p className="text-xs text-slate-500">Doğal Türkçe ile ERP veritabanınızı sorgulayın. Tüm sorgular salt-okunur (read-only) güvencesiyle çalışır.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* API modu göstergesi */}
          {apiMode && (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-bold ${
              apiMode === "live"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-amber-50 text-amber-700 border-amber-200"
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${apiMode === "live" ? "bg-emerald-500" : "bg-amber-500"} animate-pulse`} />
              {apiMode === "live" ? "Gemini Aktif" : "Mock Mod"}
            </div>
          )}
          {/* Debug toggle */}
          <button
            onClick={() => setDebugMode(!debugMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-bold transition ${
              debugMode
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            {debugMode ? "SQL Görünüyor" : "SQL Göster"}
          </button>
          {/* Temizle */}
          <button
            onClick={clearMessages}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
            title="Sohbeti temizle"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ─── Güvenlik Badge ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-100 rounded-xl">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
        <p className="text-xs text-emerald-700">
          <strong>Güvenlik Güvencesi:</strong> Bu asistan yalnızca <code className="bg-emerald-100 px-1 rounded font-mono text-[10px]">SELECT</code> sorguları çalıştırır.
          INSERT, UPDATE, DELETE, DROP ve diğer yazma komutları çok katmanlı filtreyle engellenir.
        </p>
      </div>

      {/* ─── Mesaj Alanı ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-2 custom-scrollbar">
        {/* Örnek Sorular (yalnızca başta göster) */}
        {messages.length <= 1 && (
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">Örnek Sorular</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {EXAMPLE_QUESTIONS.map((q, idx) => {
                const Icon = q.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => sendMessage(q.text)}
                    className={`flex items-start gap-3 p-3 rounded-xl border text-left text-xs font-medium text-slate-700 hover:shadow-md transition-all duration-150 bg-white hover:scale-[1.01] ${q.color.split(" ")[1]} ${q.color.split(" ")[2]}`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${q.color.split(" ")[1]} border ${q.color.split(" ")[2]}`}>
                      <Icon className={`w-3.5 h-3.5 ${q.color.split(" ")[0]}`} />
                    </div>
                    <span className="leading-relaxed">{q.text}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Mesajlar */}
        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} debugMode={debugMode} />
        ))}

        {/* Yükleniyor */}
        {loading && <TypingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      {/* ─── Input Alanı ─────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-lg p-3 flex items-end gap-3">
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Sorunuzu Türkçe yazın... (Örn: Bu ay en çok satan ürünlerim hangileri?)"
            className="w-full text-sm text-slate-800 placeholder-slate-400 resize-none border-none outline-none bg-transparent leading-relaxed min-h-[20px] max-h-[120px]"
            rows={1}
            style={{ fieldSizing: "content" } as any}
            disabled={loading}
          />
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
            <p className="text-[10px] text-slate-400">
              <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-[9px] font-mono">Enter</kbd> gönder ·{" "}
              <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-[9px] font-mono">Shift+Enter</kbd> yeni satır
            </p>
            <span className={`text-[10px] font-semibold ${input.length > 450 ? "text-red-500" : "text-slate-400"}`}>
              {input.length}/500
            </span>
          </div>
        </div>
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || loading}
          className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 disabled:from-slate-200 disabled:to-slate-300 text-white flex items-center justify-center transition-all duration-200 shadow-md disabled:shadow-none shrink-0"
        >
          {loading
            ? <RefreshCw className="w-4 h-4 animate-spin" />
            : <Send className="w-4 h-4" />}
        </button>
      </div>

      {/* ─── Mock Mod Uyarısı ─────────────────────────────────────────────── */}
      {apiMode === "mock" && (
        <div className="flex items-start gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-700">
            <strong>Mock Mod Aktif:</strong> Gerçek AI yanıtları için{" "}
            <code className="bg-amber-100 px-1 rounded font-mono text-[10px]">.env</code>{" "}
            dosyasına <code className="bg-amber-100 px-1 rounded font-mono text-[10px]">GEMINI_API_KEY=</code>{" "}
            satırını ekleyin.{" "}
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold underline hover:text-amber-900"
            >
              Ücretsiz API anahtarı al →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

