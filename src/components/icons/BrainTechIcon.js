export default function BrainTechIcon({ size = 24, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.5 2C13.6 2 17 5.4 17 9.5a7.5 7.5 0 0 1-7.5 7.5c-4.1 0-7.5-3.4-7.5-7.5C2 5.4 5.4 2 9.5 2Z" />
        <path d="M14.5 17a5.5 5.5 0 0 1-5.5 5.5" strokeDasharray="3 2" />
        <circle cx="9.5" cy="9.5" r="3" strokeOpacity="0.3" />
        <path d="M9.5 6.5v6M6.5 9.5h6" />
    </svg>
  );
}
