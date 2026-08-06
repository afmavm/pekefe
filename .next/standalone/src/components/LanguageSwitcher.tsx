"use client";

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/navigation';
import { Globe, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const locales = [
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' }
  ];

  const handleLocaleChange = (newLocale: string) => {
    if (newLocale === locale) {
      setIsOpen(false);
      return;
    }
    
    router.replace(pathname, { locale: newLocale });
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 h-[38px] rounded-xl border border-slate-200 dark:border-zinc-800/80 bg-white/60 dark:bg-zinc-950/60 hover:border-amber-500/40 dark:hover:border-amber-500/40 hover:bg-slate-50 dark:hover:bg-zinc-900/50 hover:shadow-sm transition-all group shrink-0"
      >
        <Globe className="w-4 h-4 text-slate-400 group-hover:text-amber-500 transition-colors" />
        <span className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">
          {locale}
        </span>
        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 py-2 z-50 animate-in fade-in slide-in-from-top-2">
          {locales.map((l) => (
            <button
              key={l.code}
              onClick={() => handleLocaleChange(l.code)}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-bold transition-colors hover:bg-slate-50 dark:hover:bg-zinc-800/50 ${
                locale === l.code ? 'text-[#b45309] dark:text-amber-400 bg-amber-50/50 dark:bg-amber-500/10' : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>{l.flag}</span>
                <span>{l.name}</span>
              </div>
              {locale === l.code && <div className="w-1.5 h-1.5 rounded-full bg-[#b45309] dark:bg-amber-500"></div>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
