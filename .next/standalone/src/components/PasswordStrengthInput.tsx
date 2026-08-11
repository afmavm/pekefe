"use client";

import React, { useState, useId } from "react";
import { Lock, Eye, EyeOff, Check, X as XIcon } from "lucide-react";

// ────────────────────────────────────────────────────────────
// Şifre kuralları
// ────────────────────────────────────────────────────────────
export interface PasswordRule {
  label: string;
  test: (v: string) => boolean;
}

export const DEFAULT_PASSWORD_RULES: PasswordRule[] = [
  { label: "En az 8 karakter",               test: (v) => v.length >= 8 },
  { label: "Büyük harf (A–Z)",                test: (v) => /[A-Z]/.test(v) },
  { label: "Küçük harf (a–z)",                test: (v) => /[a-z]/.test(v) },
  { label: "Rakam (0–9)",                     test: (v) => /[0-9]/.test(v) },
  { label: "Özel karakter (!@#$%^&*…)",       test: (v) => /[^A-Za-z0-9]/.test(v) },
];

// ────────────────────────────────────────────────────────────
// Şifre gücü hesaplama
// ────────────────────────────────────────────────────────────
export function getPasswordStrength(password: string, rules: PasswordRule[]) {
  const passed = rules.filter((r) => r.test(password)).length;
  if (password.length === 0) return { score: 0, label: "", color: "" };
  if (passed <= 1)            return { score: 1, label: "Çok Zayıf",  color: "#ef4444" };
  if (passed === 2)           return { score: 2, label: "Zayıf",      color: "#f97316" };
  if (passed === 3)           return { score: 3, label: "Orta",       color: "#eab308" };
  if (passed === 4)           return { score: 4, label: "İyi",        color: "#22c55e" };
  return                             { score: 5, label: "Güçlü 🔒",  color: "#10b981" };
}

// ────────────────────────────────────────────────────────────
// Props
// ────────────────────────────────────────────────────────────
interface Props {
  /** Controlled value */
  value: string;
  onChange: (v: string) => void;
  /** react-hook-form register spread (optional) */
  registerProps?: React.InputHTMLAttributes<HTMLInputElement>;
  name?: string;
  id?: string;
  placeholder?: string;
  required?: boolean;
  /** Which icon size & input height variant to use */
  size?: "sm" | "md";
  /** Extra class overrides on the outer wrapper */
  className?: string;
  rules?: PasswordRule[];
}

// ────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────
export default function PasswordStrengthInput({
  value,
  onChange,
  registerProps,
  name = "password",
  id,
  placeholder = "En az 8 karakter",
  required = true,
  size = "md",
  className = "",
  rules = DEFAULT_PASSWORD_RULES,
}: Props) {
  const [show, setShow] = useState(false);
  const generatedId = useId();
  const inputId = id ?? generatedId;

  const { score, label, color } = getPasswordStrength(value, rules);
  const totalRules = rules.length;

  const inputH   = size === "sm" ? "h-12" : "h-14";
  const textSize = size === "sm" ? "text-sm" : "text-[15px]";
  const iconSize = size === "sm" ? "w-4 h-4"  : "w-5 h-5";
  const padL     = size === "sm" ? "pl-10"    : "pl-12";
  const padR     = size === "sm" ? "pr-11"    : "pr-14";
  const iconLeft = size === "sm" ? "left-3"   : "left-4";
  const iconRight= size === "sm" ? "right-3"  : "right-4";

  return (
    <div className={`space-y-2 ${className}`}>
      {/* ── Input satırı ── */}
      <div className="relative group">
        {/* Sol kilit ikonu */}
        <Lock
          className={`absolute ${iconLeft} top-1/2 -translate-y-1/2 ${iconSize} text-slate-400 dark:text-zinc-550 group-focus-within:text-[#F4B400] transition-colors pointer-events-none`}
        />

        <input
          {...registerProps}
          type={show ? "text" : "password"}
          id={inputId}
          name={name}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full ${inputH} bg-slate-50 dark:bg-[#242428] border border-slate-200 dark:border-zinc-700 rounded-xl ${padL} ${padR} ${textSize} font-semibold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:border-[#F4B400] focus:ring-1 focus:ring-[#F4B400]/20 outline-none transition-all`}
        />

        {/* Sağ göz butonu */}
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          title={show ? "Şifreyi gizle" : "Şifreyi göster"}
          className={`absolute ${iconRight} top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 dark:text-zinc-400 hover:text-[#F4B400] hover:bg-[#F4B400]/10 transition-all cursor-pointer`}
        >
          {show ? <EyeOff className={iconSize} /> : <Eye className={iconSize} />}
        </button>
      </div>

      {/* ── Güç çubuğu (sadece yazıldığında) ── */}
      {value.length > 0 && (
        <div className="space-y-2 animate-fade-in">
          {/* Segment çubukları */}
          <div className="flex gap-1">
            {Array.from({ length: totalRules }).map((_, i) => (
              <div
                key={i}
                className={`flex-grow h-1.5 rounded-full transition-all duration-300 ${i < score ? "" : "bg-slate-200 dark:bg-zinc-800"}`}
                style={i < score ? { backgroundColor: color } : undefined}
              />
            ))}
          </div>

          {/* Güç etiketi + kurallar */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold" style={{ color: color || "#71717a" }}>
              {label}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-zinc-550 font-medium">
              {score}/{totalRules} kural sağlandı
            </span>
          </div>

          {/* Kural listesi */}
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
            {rules.map((rule) => {
              const ok = rule.test(value);
              return (
                <li
                  key={rule.label}
                  className={`flex items-center gap-1.5 text-[11px] font-semibold transition-colors ${
                    ok ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-zinc-500"
                  }`}
                >
                  {ok ? (
                    <Check className="w-3 h-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <XIcon className="w-3 h-3 shrink-0 text-slate-300 dark:text-zinc-600" />
                  )}
                  {rule.label}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
