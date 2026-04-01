export default function SparkIcon({ size = 24, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v1M12 20v1M4.22 4.22l.71.71M18.36 18.36l.71.71M3 12h1M20 12h1M4.22 19.78l.71-.71M18.36 5.64l.71-.71" strokeOpacity="0.5" />
        <path d="M12 8l-1 4 1 4 1-4z" fill="currentColor" fillOpacity="0.8" />
    </svg>
  );
}
