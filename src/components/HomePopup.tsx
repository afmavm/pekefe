"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useCMS } from "@/context/CMSContext";
import { X } from "lucide-react";
import { Link } from "@/navigation";

export default function HomePopup() {
  const { cmsData } = useCMS();
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    if (cmsData?.popupConfig) {
      try {
        const parsed = typeof cmsData.popupConfig === 'string'
          ? JSON.parse(cmsData.popupConfig)
          : cmsData.popupConfig;
          
        setConfig(parsed);
        
        // Show if active and not dismissed in this session
        if (parsed.isActive && !sessionStorage.getItem('homePopupDismissed')) {
          // Slight delay for better UX
          const timer = setTimeout(() => setIsOpen(true), 1500);
          return () => clearTimeout(timer);
        }
      } catch (e) {
        console.error("Error parsing popupConfig", e);
      }
    }
  }, [cmsData?.popupConfig]);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem('homePopupDismissed', 'true');
  };

  if (!isOpen || !config) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-500"
        onClick={handleClose}
      />
      
      <div className="relative bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden w-full max-w-4xl flex flex-col md:flex-row z-10 animate-in zoom-in-95 duration-500">
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 z-20 w-10 h-10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md hover:bg-white dark:hover:bg-zinc-800 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 group cursor-pointer"
        >
          <X className="w-5 h-5 text-zinc-500 dark:text-zinc-400 group-hover:text-red-500" />
        </button>

        {config.imageUrl && (
          <div className="md:w-1/2 h-64 md:h-auto relative">
            <Image 
              src={config.imageUrl} 
              alt={config.title} 
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20 md:to-transparent md:from-black/10" />
          </div>
        )}

        <div className={`p-10 md:p-14 flex flex-col justify-center ${config.imageUrl ? 'md:w-1/2' : 'w-full text-center items-center'}`}>
          <h2 className="text-3xl md:text-4xl font-extrabold text-zinc-900 dark:text-white mb-4 tracking-tight leading-tight">
            {config.title}
          </h2>
          <p className="text-lg text-zinc-600 dark:text-zinc-350 font-medium leading-relaxed mb-8">
            {config.description}
          </p>
          
          {config.buttonText && config.buttonLink && (
            <Link 
              href={config.buttonLink}
              onClick={handleClose}
              className="inline-flex items-center justify-center px-8 py-4 font-bold text-white rounded-xl shadow-lg transition-transform hover:scale-105 active:scale-95 text-lg"
              style={{ backgroundColor: cmsData.primaryColor || '#b45309' }}
            >
              {config.buttonText}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
