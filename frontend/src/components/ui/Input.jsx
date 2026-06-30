import { forwardRef } from "react";

const Input = forwardRef(function Input(
  { label, error, icon, className = "", ...rest },
  ref
) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          className={`w-full bg-surface-container-low border-none rounded-2xl px-4 py-3.5 text-sm text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary-fixed outline-none transition-all ${
            icon ? "pl-11" : ""
          } ${error ? "ring-2 ring-error/50" : ""} ${className}`}
          {...rest}
        />
        {icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary text-base material-symbols-outlined">
            {icon}
          </span>
        )}
      </div>
      {error && <p className="text-xs text-error px-1">{error}</p>}
    </div>
  );
});

export default Input;
