import * as React from "react";
import { cn } from "@/lib/utils";

interface NumberInputProps extends Omit<React.ComponentProps<"input">, "type" | "onChange"> {
  value: number | string;
  onChange: (value: number) => void;
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ className, value, onChange, onWheel, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState<string>(String(value));
    const inputRef = React.useRef<HTMLInputElement>(null);

    // Use the forwarded ref or our internal ref
    React.useImperativeHandle(ref, () => inputRef.current!);

    React.useEffect(() => {
      // Only update display if the actual value changed from outside
      const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
      if (document.activeElement !== inputRef.current) {
        setDisplayValue(numValue === 0 ? "0" : String(numValue));
      }
    }, [value]);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      // Clear if value is 0
      if (parseFloat(displayValue) === 0 || displayValue === "0") {
        setDisplayValue("");
      }
      // Select all text for easy replacement
      e.target.select();
    };

    const handleBlur = () => {
      // If empty, set to 0
      if (displayValue === "" || displayValue === "-") {
        setDisplayValue("0");
        onChange(0);
      } else {
        const numValue = parseFloat(displayValue) || 0;
        setDisplayValue(String(numValue));
        onChange(numValue);
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      // Allow empty, negative sign, numbers, and decimal point
      if (newValue === "" || newValue === "-" || /^-?\d*\.?\d*$/.test(newValue)) {
        setDisplayValue(newValue);
        const numValue = parseFloat(newValue) || 0;
        onChange(numValue);
      }
    };

    const handleWheel = React.useCallback((e: React.WheelEvent<HTMLInputElement>) => {
      e.currentTarget.blur();
      e.preventDefault();
      onWheel?.(e);
    }, [onWheel]);

    return (
      <input
        type="text"
        inputMode="decimal"
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm text-right",
          className,
        )}
        ref={inputRef}
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onWheel={handleWheel}
        {...props}
      />
    );
  },
);
NumberInput.displayName = "NumberInput";

export { NumberInput };