export default function BotHeadsetIcon({ size = 24, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 11v-1a9 9 0 0 1 18 0v1" />
        <rect x="2" y="11" width="4" height="6" rx="1" />
        <rect x="18" y="11" width="4" height="6" rx="1" />
        <rect x="6" y="11" width="12" height="10" rx="3" />
        <path d="M10 16h.01M14 16h.01" />
    </svg>
  );
}
