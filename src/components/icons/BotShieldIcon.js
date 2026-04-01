export default function BotShieldIcon({ size = 24, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeOpacity="0.2" />
        <rect x="7" y="9" width="10" height="8" rx="2" />
        <path d="M10 13h.01M14 13h.01" />
        <path d="M12 6V9" />
    </svg>
  );
}
