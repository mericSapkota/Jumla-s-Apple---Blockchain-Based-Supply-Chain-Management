export default function Icon({ name, className = "", filled = false, size }) {
  const style = size ? { fontSize: size } : undefined;
  return (
    <span
      className={`material-symbols-outlined ${filled ? "filled" : ""} ${className}`}
      style={style}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}
