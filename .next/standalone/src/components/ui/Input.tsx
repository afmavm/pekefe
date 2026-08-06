import React, { ForwardedRef, forwardRef, useImperativeHandle, useRef } from "react";
import { formatTurkishCurrency, formatTurkishPhone, formatTurkishDate } from "@/lib/utils";

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  type?: React.InputHTMLAttributes<HTMLInputElement>["type"] | "currency" | "phone" | "turkishDate";
}

export const Input = forwardRef(function Input(
  { type = "text", onChange, className = "", ...props }: InputProps,
  ref: ForwardedRef<HTMLInputElement>
) {
  const inputRef = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => inputRef.current!);

  const formatValue = (rawValue: string, currentType: string) => {
    if (currentType === "currency") {
      return formatTurkishCurrency(rawValue);
    }
    if (currentType === "phone" || currentType === "tel") {
      return formatTurkishPhone(rawValue);
    }
    if (currentType === "turkishDate") {
      return formatTurkishDate(rawValue);
    }
    return rawValue;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (type === "currency" || type === "phone" || type === "tel" || type === "turkishDate") {
      const selectionStart = e.target.selectionStart;
      const originalLength = e.target.value.length;
      
      const formatted = formatValue(e.target.value, type);
      e.target.value = formatted;

      // Adjust cursor position to feel smooth
      if (selectionStart !== null) {
        const newLength = formatted.length;
        const diff = newLength - originalLength;
        const newPosition = Math.max(0, selectionStart + diff);
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.setSelectionRange(newPosition, newPosition);
          }
        }, 0);
      }
    }
    onChange?.(e);
  };

  // Map custom type to standard HTML input type
  const htmlType = (type === "currency" || type === "phone" || type === "tel" || type === "turkishDate") ? "text" : type;

  return (
    <input
      {...props}
      ref={inputRef}
      type={htmlType}
      onChange={handleChange}
      className={className}
    />
  );
});
