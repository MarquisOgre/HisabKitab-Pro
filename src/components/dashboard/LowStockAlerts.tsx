interface LowStockItem {
  name: string;
  stock: number;
  minStock: number;
}

interface LowStockAlertsProps {
  items: LowStockItem[];
}

export function LowStockAlerts({ items }: LowStockAlertsProps) {
  return (
    <div className="metric-card p-3 md:p-4">
      <h3 className="font-semibold text-base md:text-lg mb-3 md:mb-4">Low Stock Alerts</h3>
      {items.length === 0 ? (
        <div className="text-center py-6 md:py-8 text-muted-foreground">
          <p className="text-sm md:text-base">No low stock alerts</p>
          <p className="text-xs md:text-sm">All items are well-stocked</p>
        </div>
      ) : (
        <div className="space-y-2 md:space-y-3">
          {items.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 md:p-3 rounded-lg bg-destructive/5 border border-destructive/20"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-xs md:text-sm truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  Min. stock: {item.minStock}
                </p>
              </div>
              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-destructive/10 text-destructive shrink-0 ml-2">
                {item.stock} left
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
