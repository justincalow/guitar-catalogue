export function GuitarSilhouette({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 220 280"
      fill="none"
      aria-hidden="true"
      role="presentation"
    >
      <path
        d="M110 18c8 0 14 5 16 13l4 12h12c10 0 18 8 18 18v8c0 5-2 9-5 12l-10 9v18c22 10 38 34 38 62 0 18-8 34-21 45 16 12 27 32 27 55 0 38-36 62-79 62s-79-24-79-62c0-23 11-43 27-55-13-11-21-27-21-45 0-28 16-52 38-62V90l-10-9c-3-3-5-7-5-12v-8c0-10 8-18 18-18h12l4-12c2-8 8-13 16-13Z"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinejoin="round"
      />
      <circle cx="110" cy="168" r="18" stroke="currentColor" strokeWidth="3" />
      <path d="M110 150v76" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path
        d="M86 44h48M92 54h36"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
