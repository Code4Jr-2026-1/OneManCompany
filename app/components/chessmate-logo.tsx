export function ChessMateMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cm-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1E3A8A" />
        </linearGradient>
      </defs>

      {/* Background */}
      <rect width="40" height="40" rx="10" fill="url(#cm-grad)" />

      {/* Chess Knight — geometric flat style */}
      {/* Base */}
      <rect x="8" y="28" width="24" height="4" rx="2" fill="white" fillOpacity="0.95" />
      {/* Lower body */}
      <rect x="11" y="23" width="18" height="6" rx="1.5" fill="white" fillOpacity="0.95" />
      {/* Neck */}
      <rect x="13" y="18" width="10" height="6" rx="1.5" fill="white" fillOpacity="0.95" />
      {/* Head (angled forward) */}
      <path d="M12 18 L17 7 L28 10 L26 18 Z" fill="white" fillOpacity="0.95" />
      {/* Ear */}
      <path d="M17 7 L14 4 L19 6 Z" fill="white" fillOpacity="0.9" />
      {/* Eye */}
      <circle cx="22" cy="12" r="2" fill="#1E3A8A" />
      {/* Nostril / snout detail */}
      <path d="M13 17 L15 15" stroke="#1E3A8A" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

export function ChessMateWordmark({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const textSize = size === "sm" ? "text-sm" : size === "lg" ? "text-3xl" : "text-base"
  return (
    <span className={`font-bold tracking-tight ${textSize}`}>
      <span className="text-gray-900">Chess</span>
      <span className="text-blue-600">Mate</span>
    </span>
  )
}

export function ChessMateLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const iconSize = size === "sm" ? 28 : size === "lg" ? 56 : 36
  return (
    <div className="flex items-center gap-2.5">
      <ChessMateMark size={iconSize} />
      <ChessMateWordmark size={size} />
    </div>
  )
}
