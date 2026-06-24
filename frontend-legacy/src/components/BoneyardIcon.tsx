interface BoneyardIconProps {
  className?: string;
}

export function BoneyardIcon({ className = 'h-8 w-8' }: BoneyardIconProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <rect x="4" y="14" width="10" height="18" rx="1.5" fill="#fff" stroke="#111" strokeWidth="1.5" />
      <line x1="5.5" y1="23" x2="12.5" y2="23" stroke="#111" strokeWidth="1" />
      <circle cx="7" cy="18" r="1" fill="#111" />
      <circle cx="11" cy="26" r="1" fill="#111" />

      <rect x="11" y="10" width="10" height="18" rx="1.5" fill="#fff" stroke="#111" strokeWidth="1.5" />
      <line x1="12.5" y1="19" x2="19.5" y2="19" stroke="#111" strokeWidth="1" />
      <circle cx="14" cy="14" r="1" fill="#111" />
      <circle cx="18" cy="24" r="1" fill="#111" />

      <rect x="18" y="6" width="10" height="18" rx="1.5" fill="#fff" stroke="#111" strokeWidth="1.5" />
      <line x1="19.5" y1="15" x2="26.5" y2="15" stroke="#111" strokeWidth="1" />
      <circle cx="21" cy="10" r="1" fill="#111" />
      <circle cx="25" cy="20" r="1" fill="#111" />
    </svg>
  );
}
