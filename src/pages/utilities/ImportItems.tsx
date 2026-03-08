// @ts-nocheck
import { useState } from "react";
import { Upload, FileText, CheckCircle, AlertCircle, Download, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminUserId } from "@/hooks/useAdminUserId";
import { useBusinessSelection } from "@/contexts/BusinessSelectionContext";
import { toast } from "sonner";

interface ImportedItem {
  name: string;
  category?: string;
  unit?: string;
  hsn_code?: string;
  purchase_price?: number;
  sale_price?: number;
  opening_stock?: number;
  current_stock?: number;
  low_stock_alert?: number;
}

export default function ImportItems() {
  const { user } = useAuth();
  const { adminUserId } = useAdminUserId();
  const { selectedBusiness } = useBusinessSelection();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const [duplicateAction, setDuplicateAction] = useState("skip");

  const downloadTemplate = () => {
    const headers = [
      "Category",
      "Item Name",
      "Unit",
      "HSN Code",
      "Purchase Price",
      "Sale Price",
      "Opening Stock",
      "Current Stock",
      "Minimum Stock Level"
    ];
    
    const sampleData = [
      ["Electronics", "Laptop Dell Inspiron", "PCS", "8471", "35000", "45000", "10", "10", "5"],
      ["Accessories", "Wireless Mouse", "PCS", "8471", "350", "500", "50", "50", "10"],
      ["Accessories", "USB Cable Type-C", "Bottles", "8544", "100", "150", "100", "100", "20"],
    ];

    const csvContent = [
      headers.join(","),
      ...sampleData.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "items_import_template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Template downloaded successfully!");
  };

  const parseCSV = (text: string): ImportedItem[] => {
    const lines = text.split("\n").filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
    const items: ImportedItem[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map(v => v.trim());
      
      const getCol = (possibleNames: string[]): string => {
        const idx = headers.findIndex(h => possibleNames.some(n => h.includes(n)));
        return idx >= 0 ? values[idx] || "" : "";
      };

      const name = getCol(["item name", "name", "item"]);
      if (!name) continue;

      items.push({
        name,
        category: getCol(["category", "cat"]) || undefined,
        unit: getCol(["unit"]) || "Bottles",
        hsn_code: getCol(["hsn code", "hsn", "hsncode"]) || undefined,
        purchase_price: parseFloat(getCol(["purchase price", "purchase", "cost price", "cost"])) || 0,
        sale_price: parseFloat(getCol(["sale price", "sale", "selling price"])) || 0,
        opening_stock: parseFloat(getCol(["opening stock"])) || 0,
        current_stock: parseFloat(getCol(["current stock", "stock", "qty", "quantity"])) || 0,
        low_stock_alert: parseFloat(getCol(["minimum stock", "min stock", "low stock", "alert"])) || 10,
      });
    }

    return items;
  };

  const handleImport = async () => {
    if (!uploadedFile || !user || !adminUserId) return;
    
    if (!selectedBusiness) {
      toast.error("Please select a business first");
      return;
    }
    
    setIsImporting(true);
    setProgress(0);
    setImportResult(null);

    try {
      const text = await uploadedFile.text();
      const items = parseCSV(text);

      if (items.length === 0) {
        toast.error("No valid items found in the file");
        setIsImporting(false);
        return;
      }

      // Get existing items for duplicate check (filter by business_id)
      const { data: existingItems } = await supabase
        .from('items')
        .select('name')
        .eq('user_id', adminUserId)
        .eq('business_id', selectedBusiness.id)
        .neq('is_deleted', 'true');

      const existingNames = new Set(existingItems?.map(i => i.name.toLowerCase()) || []);

      // Get or create categories
      const { data: existingCategories } = await supabase
        .from('categories')
        .select('id, name')
        .eq('user_id', adminUserId);

      const categoryMap = new Map(existingCategories?.map(c => [c.name.toLowerCase(), c.id]) || []);

      let success = 0;
      let failed = 0;
      const errors: string[] = [];

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        setProgress(Math.round(((i + 1) / items.length) * 100));

        const isDuplicate = existingNames.has(item.name.toLowerCase());

        if (isDuplicate) {
          if (duplicateAction === "skip") {
            failed++;
            errors.push(`Skipped duplicate: ${item.name}`);
            continue;
          } else if (duplicateAction === "update") {
            // Update existing item
            const { error } = await supabase
              .from('items')
              .update({
                unit: item.unit,
                hsn_code: item.hsn_code || null,
                purchase_price: item.purchase_price,
                sale_price: item.sale_price,
                low_stock_alert: item.low_stock_alert,
              })
              .eq('user_id', adminUserId)
              .eq('business_id', selectedBusiness.id)
              .ilike('name', item.name);

            if (error) {
              failed++;
              errors.push(`Failed to update: ${item.name}`);
            } else {
              success++;
            }
            continue;
          }
          // If "create", continue to create new item
        }

        // Get or create category
        let categoryId: string | null = null;
        if (item.category) {
          categoryId = categoryMap.get(item.category.toLowerCase()) || null;
          if (!categoryId) {
            const { data: newCat } = await supabase
              .from('categories')
              .insert({ name: item.category, user_id: adminUserId, business_id: selectedBusiness.id })
              .select('id')
              .single();
            if (newCat) {
              categoryId = newCat.id;
              categoryMap.set(item.category.toLowerCase(), newCat.id);
            }
          }
        }

        const openingStock = item.opening_stock || 0;
        const currentStock = item.current_stock || openingStock;

        const { error } = await supabase.from('items').insert({
          user_id: adminUserId,
          business_id: selectedBusiness.id,
          name: item.name,
          category_id: categoryId,
          unit: item.unit || "Bottles",
          hsn_code: item.hsn_code || null,
          purchase_price: item.purchase_price || 0,
          sale_price: item.sale_price || 0,
          opening_stock: openingStock,
          current_stock: currentStock,
          low_stock_alert: item.low_stock_alert || 10,
        });

        if (error) {
          failed++;
          errors.push(`Failed: ${item.name} - ${error.message}`);
        } else {
          success++;
          existingNames.add(item.name.toLowerCase());
        }
      }

      setImportResult({ success, failed, errors });
      if (success > 0) {
        toast.success(`Successfully imported ${success} items`);
      }
    } catch (error: any) {
      console.error("Import error:", error);
      toast.error("Failed to import items: " + error.message);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Import Items</h1>
          <p className="text-muted-foreground">Import items from Excel or CSV file</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={downloadTemplate}>
          <Download className="w-4 h-4" />
          Download Template
        </Button>
      </div>

      {/* Show selected business - items will be imported here */}
      {selectedBusiness && (
        <div className="metric-card bg-accent/50 border-accent">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="font-medium">Importing to:</span>
            <span className="text-primary font-semibold">{selectedBusiness.name}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            All items will be linked to this business. Switch business from the header if needed.
          </p>
        </div>
      )}

      {/* Instructions */}
      <div className="metric-card bg-primary/5 border-primary/20">
        <h3 className="font-semibold mb-3">Import Instructions</h3>
        <ul className="text-sm text-muted-foreground space-y-2">
          <li>• Download the sample template to see the required format</li>
          <li>• Fill in your item data in the template</li>
          <li>• Required columns: Item Name</li>
          <li>• Optional columns: Category, Unit (default: Bottles), HSN Code, Purchase Price, Sale Price, Opening Stock, Current Stock, Minimum Stock Level</li>
          <li>• Upload the completed file (CSV format)</li>
        </ul>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <div className="metric-card">
          <h3 className="font-semibold mb-4">Upload File</h3>
          
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              uploadedFile ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
            }`}
          >
            {uploadedFile ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="w-8 h-8 text-primary" />
                <div className="text-left">
                  <p className="font-medium">{uploadedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(uploadedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setUploadedFile(null);
                    setImportResult(null);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <>
                <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">Drag and drop your file here</p>
                <p className="text-sm text-muted-foreground">or</p>
              </>
            )}
            <Label htmlFor="import-file" className="cursor-pointer">
              <Input
                id="import-file"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    setUploadedFile(e.target.files[0]);
                    setImportResult(null);
                  }
                }}
              />
              {!uploadedFile && (
                <Button variant="outline" className="mt-4" asChild>
                  <span>Browse Files</span>
                </Button>
              )}
            </Label>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-2">
            Supported format: .csv
          </p>
        </div>

        {/* Import Options */}
        <div className="metric-card">
          <h3 className="font-semibold mb-4">Import Options</h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>If duplicate item found</Label>
              <Select value={duplicateAction} onValueChange={setDuplicateAction}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="skip">Skip duplicate items</SelectItem>
                  <SelectItem value="update">Update existing items</SelectItem>
                  <SelectItem value="create">Create as new item</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isImporting && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Importing items...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}

            {importResult && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <span className="font-medium text-success">{importResult.success} items imported successfully</span>
                </div>
                {importResult.failed > 0 && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10">
                    <AlertCircle className="w-5 h-5 text-destructive" />
                    <span className="font-medium text-destructive">{importResult.failed} items failed to import</span>
                  </div>
                )}
                {importResult.errors.length > 0 && (
                  <div className="max-h-32 overflow-y-auto text-xs text-muted-foreground bg-muted/50 rounded p-2">
                    {importResult.errors.slice(0, 10).map((err, i) => (
                      <p key={i}>{err}</p>
                    ))}
                    {importResult.errors.length > 10 && (
                      <p>...and {importResult.errors.length - 10} more errors</p>
                    )}
                  </div>
                )}
              </div>
            )}

            <Button
              className="btn-gradient w-full gap-2"
              onClick={handleImport}
              disabled={isImporting || !uploadedFile}
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Import Items
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}