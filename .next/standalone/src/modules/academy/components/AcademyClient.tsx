"use client";

import React, { useState } from "react";
import Image from "next/image";
import { BookOpen, GraduationCap, Clock, Award, CheckCircle2, ArrowRight, PlayCircle, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AcademyCourse } from "../types";

const INITIAL_COURSES: AcademyCourse[] = [
  {
    id: "course-pekefe-masterclass",
    title: "Yüksek Rakım Geleneksel geleneksel lezzetler Ustalık Sınıfı",
    category: "geleneksel lezzetler",
    instructor: "İlhan Efe (Baş Arıcı & Usta Zanaatkar)",
    duration: "6 Hafta (Modüler)",
    lessonsCount: 18,
    level: "Ustalık Sınıfı",
    image: "https://images.unsplash.com/photo-1587049352851-8d4e89133924?auto=format&fit=crop&w=1200&q=80",
    description: "2000m+ rakımda flora tespiti, bahar bakımı, arı ırkı seçimi, polen ve propolis toplama teknikleri ile bal süzme etiği.",
    modules: ["1. Modül: Yayla Florası ve Neşet Analizi", "2. Modül: Kovan İçi İklimlendirme & Kışlatma", "3. Modül: Şifa Değerli Bal Süzme Teknikleri"],
    isFeatured: true
  },
  {
    id: "course-pekmez-gastronomi",
    title: "Anadolu Yavaş Gıda: Geleneksel Dut Pekmezi Zanaatı",
    category: "Gastronomi",
    instructor: "Gurme Şef & Pekmez Ustaları",
    duration: "4 Hafta",
    lessonsCount: 12,
    level: "Orta Seviye",
    image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=1200&q=80",
    description: "İspir dutlarının toplanmasından bakır kazan ateşi yönetimine, kıvam kontrolünden cam kavanoz mühürlemeye kadar tüm asamalar.",
    modules: ["1. Modül: Meyve Olgunluk İndeksi ve Serin Hasat", "2. Modül: Odun Ateşinde Isı Yönetimi", "3. Modül: Doğal Şeker Dengenleme & Saklama"],
    isFeatured: false
  }
];

export default function AcademyClient() {
  const [courses] = useState<AcademyCourse[]>(INITIAL_COURSES);
  const [selectedCourse, setSelectedCourse] = useState<AcademyCourse | null>(null);
  const [formData, setFormData] = useState({ fullName: "", email: "", phone: "", occupation: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/academy/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: selectedCourse.id,
          ...formData
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMessage(true);
        toast.success("Akademi kayıt başvurunuz alındı.");
      } else {
        toast.error(data.message || "Kayıt oluşturulamadı.");
      }
    } catch {
      toast.error("Bağlantı hatası.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#FAF8F5] dark:bg-zinc-950 text-[#1e293b] dark:text-zinc-100 min-h-screen py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Editorial Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-900/5 dark:bg-amber-500/10 border border-amber-900/15 dark:border-amber-500/20 text-[#6b1d2f] dark:text-amber-400 text-xs font-bold uppercase tracking-[0.2em]">
            <GraduationCap className="w-3.5 h-3.5" />
            PEKEFE Gurme Akademisi
          </div>
          <h1 className="text-3xl md:text-5xl font-serif font-black text-slate-900 dark:text-white tracking-tight">
            Anadolu Zanaat Mirasını <span className="italic font-normal text-[#6b1d2f] dark:text-amber-400">Geleceğe Taşımak</span>
          </h1>
          <p className="text-sm md:text-base text-slate-600 dark:text-zinc-400 font-medium leading-relaxed">
            İspir'de usta arıcılar ve geleneksel pekmez ustaları tarafından verilen sertifikalı eğitimlerle kadim gıda kültürünü öğrenin.
          </p>
        </div>

        {/* Courses List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {courses.map((c) => (
            <div key={c.id} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="relative h-64 w-full overflow-hidden">
                  <Image src={c.image} alt={c.title} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-4 left-4 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-[#6b1d2f] dark:text-amber-400">
                    {c.category}
                  </div>
                </div>

                <div className="p-8 space-y-4">
                  <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-[#6b1d2f]" /> {c.duration}</span>
                    <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5 text-[#6b1d2f]" /> {c.lessonsCount} Ders</span>
                    <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5 text-[#6b1d2f]" /> {c.level}</span>
                  </div>

                  <h3 className="text-2xl font-serif font-bold text-slate-900 dark:text-white leading-tight">{c.title}</h3>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Eğitmen: {c.instructor}</p>
                  <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">{c.description}</p>

                  <div className="space-y-2 pt-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Eğitim Modülleri</span>
                    {c.modules.map((m, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{m}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-8 pt-0">
                <button
                  onClick={() => {
                    setSelectedCourse(c);
                    setSuccessMessage(false);
                  }}
                  className="w-full py-4 bg-[#6b1d2f] hover:bg-[#521624] text-white font-bold rounded-2xl transition-transform active:scale-95 flex items-center justify-center gap-2 text-xs uppercase tracking-wider cursor-pointer"
                >
                  <span>Programa Başvur</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Form */}
        {selectedCourse && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setSelectedCourse(null)} />
            <div className="relative bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-8 max-w-lg w-full z-10">
              
              {successMessage ? (
                <div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-serif font-bold">Kayıt Başvurusu Alındı</h3>
                  <p className="text-xs text-slate-500"><strong>{selectedCourse.title}</strong> için kontenjan bilgilendirmesi e-posta adresinize iletilecektir.</p>
                  <button onClick={() => setSelectedCourse(null)} className="px-6 py-2.5 bg-[#6b1d2f] text-white font-bold rounded-xl text-xs uppercase">Kapat</button>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-serif font-bold text-xl">{selectedCourse.title}</h3>
                    <button onClick={() => setSelectedCourse(null)} className="text-slate-400 font-bold">✕</button>
                  </div>

                  <form onSubmit={handleEnroll} className="space-y-4 text-xs font-medium">
                    <div>
                      <label className="block font-bold uppercase tracking-wider mb-1">Ad Soyad *</label>
                      <input required type="text" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} placeholder="Mehmet Demir" className="w-full px-4 py-3 bg-[#FAF8F5] dark:bg-zinc-950 border border-slate-200 rounded-xl" />
                    </div>
                    <div>
                      <label className="block font-bold uppercase tracking-wider mb-1">E-Posta *</label>
                      <input required type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="mehmet@example.com" className="w-full px-4 py-3 bg-[#FAF8F5] dark:bg-zinc-950 border border-slate-200 rounded-xl" />
                    </div>
                    <div>
                      <label className="block font-bold uppercase tracking-wider mb-1">Telefon *</label>
                      <input required type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="0532 000 0000" className="w-full px-4 py-3 bg-[#FAF8F5] dark:bg-zinc-950 border border-slate-200 rounded-xl" />
                    </div>
                    <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-[#6b1d2f] text-white font-bold rounded-xl uppercase tracking-wider">
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Başvuruyu Tamamla"}
                    </button>
                  </form>
                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
