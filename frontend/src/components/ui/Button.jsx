const variants = {
  primary:
    "bg-primary text-on-primary shadow-[0_4px_12px_rgba(15,82,56,0.2)] hover:bg-primary-container",
  secondary:
    "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest",
  danger:
    "bg-error/10 text-error border border-error/20 hover:bg-error/15",
  accent:
    "bg-role-accent text-on-secondary-fixed hover:opacity-90 shadow-md",
};

export default function Button({
  children,
  variant = "primary",
  icon,
  className = "",
  loading = false,
  disabled,
  type = "button",
  ...rest
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`flex items-center justify-center gap-2 font-bold rounded-2xl py-3.5 px-5 text-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 ${variants[variant]} ${className}`}
      {...rest}
    >
      {loading ? (
        <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
      ) : (
        icon && <span className="material-symbols-outlined text-base">{icon}</span>
      )}
      {children}
    </button>
  );
}
