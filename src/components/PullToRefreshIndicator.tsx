import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  isRefreshing: boolean;
  progress: number;
}

export function PullToRefreshIndicator({
  pullDistance,
  isRefreshing,
  progress,
}: PullToRefreshIndicatorProps) {
  if (pullDistance === 0 && !isRefreshing) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 flex justify-center items-center z-50 pointer-events-none"
      style={{ 
        height: `${Math.max(pullDistance, isRefreshing ? 50 : 0)}px`,
        transition: isRefreshing ? 'height 0.2s ease' : 'none'
      }}
    >
      <div
        className={cn(
          "w-10 h-10 rounded-full bg-background border shadow-lg flex items-center justify-center",
          isRefreshing && "animate-pulse"
        )}
        style={{
          opacity: Math.min(progress, 1),
          transform: `scale(${0.5 + progress * 0.5})`,
        }}
      >
        <RefreshCw
          className={cn(
            "w-5 h-5 text-primary transition-transform",
            isRefreshing && "animate-spin"
          )}
          style={{
            transform: isRefreshing ? undefined : `rotate(${progress * 360}deg)`,
          }}
        />
      </div>
    </div>
  );
}
