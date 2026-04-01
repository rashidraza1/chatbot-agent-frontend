export default function BotMagicIcon({ size = 24, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="10" width="16" height="10" rx="3" />
        <path d="M8 14h.01M16 14h.01" />
        <path d="M12 6V2M8 4l2 2M16 4l-2 2" strokeOpacity="0.5" />
        <path d="M18 4l1 1M19 7l1 1M3 3l1.5 1.5" strokeOpacity="0.8" />
    </svg>
  );
}
