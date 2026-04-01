export default function BotIcon({ size = 24, className = "" }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
      stroke="currentColor"
    >
        <rect x="4" y="9" width="16" height="11" rx="4" strokeWidth="2"/>
        <path d="M9 13H10M14 13H15" strokeWidth="2" strokeLinecap="round"/>
        <path d="M10 17C10 17 11 18 12 18C13 18 14 17 14 17" strokeWidth="2" strokeLinecap="round"/>
        <path d="M9 6L12 9L15 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="12" cy="4" r="2" fill="currentColor"/>
    </svg>
  );
}
