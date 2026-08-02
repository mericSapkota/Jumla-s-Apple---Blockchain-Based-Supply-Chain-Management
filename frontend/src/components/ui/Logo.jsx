export default function Logo({ size = 40, className = "" }) {
  return (
    <img
      src="/logo.png"
      alt="Jumla Trace"
      width={size}
      height={size}
      className={`object-contain ${className}`}
    />
  );
}
