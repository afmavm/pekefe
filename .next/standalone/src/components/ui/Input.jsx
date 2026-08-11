"use client";

import React, { useId } from "react";

export const Input = React.forwardRef(
  (
    {
      label,
      error,
      helperText,
      className = "",
      type = "text",
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = props.id || generatedId;
    const errorId = `${id}-error`;
    const helperId = `${id}-helper`;

    // Design System inputs styling
    const baseInputStyle =
      "w-full bg-white py-3.5 px-4 rounded-lg border focus:outline-none focus:ring-2 transition-all text-sm font-body-md shadow-inner";
    
    const stateStyle = error
      ? "border-error focus:border-error focus:ring-error/15 text-error-container"
      : "border-outline-variant/50 focus:border-primary focus:ring-primary/10 text-on-surface";

    return (
      <div className={`flex flex-col gap-1.5 w-full ${className}`}>
        {label && (
          <label
            htmlFor={id}
            className="font-label-sm text-xs font-bold uppercase tracking-wider text-on-surface-variant"
          >
            {label}
          </label>
        )}
        <input
          id={id}
          ref={ref}
          type={type}
          aria-invalid={!!error}
          aria-describedby={`${error ? errorId : ""} ${helperText ? helperId : ""}`.trim() || undefined}
          className={`${baseInputStyle} ${stateStyle}`}
          {...props}
        />
        {error && (
          <p id={errorId} role="alert" className="text-xs font-semibold text-error mt-0.5">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={helperId} className="text-[11px] text-on-surface-variant/80 font-light mt-0.5">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
