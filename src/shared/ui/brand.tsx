export function Brand({ compact = false }: { compact?: boolean }): React.ReactNode {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid size-8 place-items-center rounded-[10px] bg-accent text-sm font-bold text-accent-foreground">
        D
      </div>
      {!compact && <span className="text-sm font-semibold tracking-tight">DSA Coach</span>}
    </div>
  );
}
