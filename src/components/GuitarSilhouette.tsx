export function GuitarSilhouette({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 160 300"
      fill="none"
      aria-hidden="true"
      role="presentation"
    >
      {/* six-in-line headstock */}
      <path
        d="M74 10h28c7 0 14 6 12 14l-10 36H76L64 24C62 16 67 10 74 10Z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M104 20h12M102 32h12M100 44h12"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* nut + slim neck */}
      <path d="M76 60h28" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <rect
        x="82"
        y="62"
        width="16"
        height="92"
        rx="2"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        d="M86 80h8M86 98h8M86 116h8"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* body with cutaway */}
      <path
        d="M90 152
           C62 154 42 168 36 190
           C28 220 48 242 70 252
           C78 256 82 268 82 280
           h16
           c0-12 4-24 12-28
           c28-12 50-32 46-62
           C152 164 128 152 108 152
           C112 140 104 134 96 146
           C94 149 92 151 90 152Z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <circle cx="90" cy="208" r="13" stroke="currentColor" strokeWidth="3" />
      <path d="M90 195v40" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
