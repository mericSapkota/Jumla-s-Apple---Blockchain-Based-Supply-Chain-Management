import { forwardRef } from "react";

const Select = forwardRef(function Select(
  { label, error, options, placeholder, className = "", ...rest },
  ref
) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1">
          {label}
        </label>
      )}
      <select
        ref={ref}
        className={`w-full bg-surface-container-low border-none rounded-2xl px-4 py-3.5 text-sm text-on-surface focus:ring-2 focus:ring-primary-fixed outline-none transition-all appearance-none ${
          error ? "ring-2 ring-error/50" : ""
        } ${className}`}
        {...rest}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-error px-1">{error}</p>}
    </div>
  );
});

export default Select;
