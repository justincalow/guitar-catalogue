export function AmpSilhouette({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 220"
      fill="none"
      aria-hidden="true"
      role="presentation"
    >
      <rect
        x="28"
        y="18"
        width="144"
        height="168"
        rx="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <circle cx="100" cy="92" r="42" stroke="currentColor" strokeWidth="3" />
      <circle cx="100" cy="92" r="16" stroke="currentColor" strokeWidth="3" />
      <path
        d="M52 154h96M64 168h72"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M78 186h44"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path d="M70 204h16M114 204h16" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
