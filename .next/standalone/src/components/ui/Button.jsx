"use client";

import React from "react";

export const Button = React.forwardRef(
  (
    {
      children,
      variant = "primary", // primary, secondary, outline, text
      size = "md", // sm, md, lg
      isLoading = false,
      disabled = false,
      className = "",
      type = "button",
      ...props
    },
    ref
  ) => {
    // Premium Design System variant styles
    const baseStyle =
      "inline-flex items-center justify-center font-label-sm font-bold tracking-widest uppercase rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/20 select-none cursor-pointer disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";

    const variants = {
      primary: "bg-primary text-white hover:bg-primary-container shadow-sm",
      secondary: "bg-secondary text-white hover:bg-secondary-container shadow-sm",
      outline: "border border-outline-variant/50 text-on-surface hover:bg-surface-container-low hover:border-outline",
      text: "text-primary hover:bg-primary/5 border-none shadow-none"
    };

    const sizes = {
      sm: "py-2 px-4 text-[10px] tracking-wider",
      md: "py-3.5 px-6 text-xs tracking-widest",
      lg: "py-4.5 px-8 text-sm tracking-widest"
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-3 h-4 w-4 text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Yükleniyor...
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
