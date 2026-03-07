import { Button } from "@/components/ui/button";
import { Printer, FileDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PrintButtonProps {
  onPrint: () => void;
  onExportPDF?: () => void;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export function PrintButton({ onPrint, onExportPDF, variant = "outline", size = "default" }: PrintButtonProps) {
  if (!onExportPDF) {
    return (
      <Button variant={variant} size={size} onClick={onPrint} className="gap-2">
        <Printer className="w-4 h-4" />
        Print
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className="gap-2">
          <Printer className="w-4 h-4" />
          Print / Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onPrint} className="gap-2">
          <Printer className="w-4 h-4" />
          Print
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onExportPDF} className="gap-2">
          <FileDown className="w-4 h-4" />
          Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
