export default function HistoryIcon({ size = 18, className = "" }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" strokeOpacity="0.1" />
      <path d="M12 6v6l4 2" />
      <path d="M20 12a8 8 0 1 0-8 8" />
      <path d="M12 20l-3-3 3-3" />
    </svg>
  );
}
