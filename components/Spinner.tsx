type SpinnerProps = {
  className?: string;
  label?: string;
};

export function Spinner({ className = "h-4 w-4", label }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label ?? "Loading"}
      className={`inline-block animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-800 ${className}`}
    />
  );
}
