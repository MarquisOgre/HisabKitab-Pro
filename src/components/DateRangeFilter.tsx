import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface DateRange {
  from: Date;
  to: Date;
}

interface DateRangeFilterProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  className?: string;
}

type PresetValue = "today" | "yesterday" | "this-week" | "last-week" | "this-month" | "last-month" | "this-quarter" | "last-quarter" | "this-year" | "last-year" | "custom";

const presets: { value: PresetValue; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "this-week", label: "This Week" },
  { value: "last-week", label: "Last Week" },
  { value: "this-month", label: "This Month" },
  { value: "last-month", label: "Last Month" },
  { value: "this-quarter", label: "This Quarter" },
  { value: "last-quarter", label: "Last Quarter" },
  { value: "this-year", label: "This Year" },
  { value: "last-year", label: "Last Year" },
  { value: "custom", label: "Custom Range" },
];

function getPresetDateRange(preset: PresetValue): DateRange {
  const today = new Date();
  
  switch (preset) {
    case "today":
      return { from: startOfDay(today), to: endOfDay(today) };
    case "yesterday":
      const yesterday = subDays(today, 1);
      return { from: startOfDay(yesterday), to: endOfDay(yesterday) };
    case "this-week":
      return { from: startOfWeek(today, { weekStartsOn: 1 }), to: endOfWeek(today, { weekStartsOn: 1 }) };
    case "last-week":
      const lastWeek = subDays(today, 7);
      return { from: startOfWeek(lastWeek, { weekStartsOn: 1 }), to: endOfWeek(lastWeek, { weekStartsOn: 1 }) };
    case "this-month":
      return { from: startOfMonth(today), to: endOfMonth(today) };
    case "last-month":
      const lastMonth = subDays(startOfMonth(today), 1);
      return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
    case "this-quarter":
      return { from: startOfQuarter(today), to: endOfQuarter(today) };
    case "last-quarter":
      const lastQuarter = subDays(startOfQuarter(today), 1);
      return { from: startOfQuarter(lastQuarter), to: endOfQuarter(lastQuarter) };
    case "this-year":
      return { from: startOfYear(today), to: endOfYear(today) };
    case "last-year":
      const lastYear = subDays(startOfYear(today), 1);
      return { from: startOfYear(lastYear), to: endOfYear(lastYear) };
    default:
      return { from: startOfMonth(today), to: endOfMonth(today) };
  }
}

export function DateRangeFilter({ dateRange, onDateRangeChange, className }: DateRangeFilterProps) {
  const [selectedPreset, setSelectedPreset] = useState<PresetValue>("this-month");
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);

  const handlePresetChange = (value: PresetValue) => {
    setSelectedPreset(value);
    if (value !== "custom") {
      onDateRangeChange(getPresetDateRange(value));
    }
  };

  const handleFromDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedPreset("custom");
      onDateRangeChange({ from: startOfDay(date), to: dateRange.to });
      setFromOpen(false);
    }
  };

  const handleToDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedPreset("custom");
      onDateRangeChange({ from: dateRange.from, to: endOfDay(date) });
      setToOpen(false);
    }
  };

  return (
    <div className={cn("flex flex-wrap gap-2 items-center", className)}>
      <Select value={selectedPreset} onValueChange={(v) => handlePresetChange(v as PresetValue)}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Select period" />
        </SelectTrigger>
        <SelectContent>
          {presets.map((preset) => (
            <SelectItem key={preset.value} value={preset.value}>
              {preset.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Popover open={fromOpen} onOpenChange={setFromOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-[130px] justify-start text-left font-normal",
              !dateRange.from && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange.from ? format(dateRange.from, "dd MMM yyyy") : "From"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={dateRange.from}
            onSelect={handleFromDateChange}
            initialFocus
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>

      <span className="text-muted-foreground">to</span>

      <Popover open={toOpen} onOpenChange={setToOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-[130px] justify-start text-left font-normal",
              !dateRange.to && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange.to ? format(dateRange.to, "dd MMM yyyy") : "To"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={dateRange.to}
            onSelect={handleToDateChange}
            initialFocus
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function getDefaultDateRange(): DateRange {
  return getPresetDateRange("this-month");
}

export function filterByDateRange<T>(
  items: T[],
  dateRange: DateRange,
  dateField: keyof T
): T[] {
  return items.filter((item) => {
    const itemDate = new Date(item[dateField] as string);
    return itemDate >= dateRange.from && itemDate <= dateRange.to;
  });
}