export default function ClockDigitalIcon({ size = 18, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2" strokeOpacity="0.2" />
        <path d="M7 12h4M13 12h4" strokeWidth="3" />
        <path d="M12 8v8" strokeDasharray="2 2" />
    </svg>
  );
}
