import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MonthFilterProps {
  selectedMonth: string;
  onMonthChange: (month: string) => void;
}

export function MonthFilter({ selectedMonth, onMonthChange }: MonthFilterProps) {
  // Generate last 12 months plus "all"
  const months = [
    { value: "all", label: "All Time" },
    ...Array.from({ length: 12 }, (_, i) => {
      const date = subMonths(new Date(), i);
      return {
        value: format(date, "yyyy-MM"),
        label: format(date, "MMMM yyyy"),
      };
    }),
  ];

  return (
    <Select value={selectedMonth} onValueChange={onMonthChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select month" />
      </SelectTrigger>
      <SelectContent>
        {months.map((month) => (
          <SelectItem key={month.value} value={month.value}>
            {month.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function filterByMonth<T extends { invoice_date: string }>(
  items: T[],
  selectedMonth: string
): T[] {
  if (selectedMonth === "all") return items;
  
  const [year, month] = selectedMonth.split("-").map(Number);
  const startDate = startOfMonth(new Date(year, month - 1));
  const endDate = endOfMonth(new Date(year, month - 1));
  
  return items.filter((item) => {
    const itemDate = new Date(item.invoice_date);
    return itemDate >= startDate && itemDate <= endDate;
  });
}

export function getMonthTotal<T extends { total_amount: number | null }>(
  items: T[],
  selectedMonth: string,
  invoiceDateKey: keyof T = "invoice_date" as keyof T
): number {
  if (selectedMonth === "all") {
    return items.reduce((sum, item) => sum + (item.total_amount || 0), 0);
  }
  
  const [year, month] = selectedMonth.split("-").map(Number);
  const startDate = startOfMonth(new Date(year, month - 1));
  const endDate = endOfMonth(new Date(year, month - 1));
  
  return items
    .filter((item) => {
      const itemDate = new Date(item[invoiceDateKey] as unknown as string);
      return itemDate >= startDate && itemDate <= endDate;
    })
    .reduce((sum, item) => sum + (item.total_amount || 0), 0);
}
