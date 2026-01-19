export function GridLegend() {
  return (
    <div className="flex flex-wrap gap-4 text-sm">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded border bg-background" />
        <span className="text-muted-foreground">Available</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded border bg-yellow-100 dark:bg-yellow-900/30" />
        <span className="text-muted-foreground">Reserved (Pending Payment)</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded border bg-green-100 dark:bg-green-900/30" />
        <span className="text-muted-foreground">Confirmed</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded border-2 border-primary bg-yellow-200 dark:bg-yellow-800/50" />
        <span className="text-muted-foreground">Your Square</span>
      </div>
    </div>
  );
}
