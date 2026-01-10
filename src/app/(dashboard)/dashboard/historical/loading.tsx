export default function HistoricalLoading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
        </div>
        <div className="space-y-2">
          <p className="text-lg font-semibold text-foreground">Loading Historical Questions</p>
          <p className="text-sm text-muted-foreground">Fetching available dates...</p>
        </div>
      </div>
    </div>
  );
}
