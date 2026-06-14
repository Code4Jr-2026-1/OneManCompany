import { ChessMateMark } from "@/components/chessmate-logo"
import { SignOutButton } from "@/components/sign-out-button"

export function PortalNav({ title, userName }: { title: string; userName?: string | null }) {
  return (
    <nav className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <ChessMateMark size={32} />
        <div>
          <p className="font-bold text-foreground text-sm leading-tight">ChessMate</p>
          <p className="text-xs text-muted-foreground leading-tight">{title}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-muted-foreground text-sm">{userName}</span>
        <SignOutButton />
      </div>
    </nav>
  )
}
