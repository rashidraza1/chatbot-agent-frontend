export default function BotGlitchIcon({ size = 24, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="10" width="18" height="10" rx="3" strokeDasharray="4 2" />
        <path d="M7 14h.01M17 14h.01" />
        <path d="M12 6V2M8 4l2 2M16 4l-2 2" strokeDasharray="1 1" />
        <path d="M21 14h2M1 14h2" strokeOpacity="0.5" />
    </svg>
  );
}
