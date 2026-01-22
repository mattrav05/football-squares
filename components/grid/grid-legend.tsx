export function GridLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm p-3 bg-muted/50 rounded-lg">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Legend:</span>
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-md border-2 border-dashed border-muted-foreground/30 bg-background" />
        <span className="text-muted-foreground">Available</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-md bg-yellow-400/80 dark:bg-yellow-500/60" />
        <span className="text-muted-foreground">Reserved</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-md bg-green-500/80 dark:bg-green-500/60" />
        <span className="text-muted-foreground">Confirmed</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-md border-2 border-primary bg-primary/20" />
        <span className="text-muted-foreground">Your Square</span>
      </div>
    </div>
  );
}
