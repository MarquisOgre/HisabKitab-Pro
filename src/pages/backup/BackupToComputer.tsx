import { useState } from "react";
import { Download, HardDrive, FileText, Database, Users, Package, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useBackups } from "@/hooks/useBackup";
import { format } from "date-fns";

export default function BackupToComputer() {
  const [selectedData, setSelectedData] = useState<string[]>(["all"]);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const { backups, downloadBackup } = useBackups();

  const dataTypes = [
    { id: "all", label: "All Data", icon: Database, description: "Complete backup of all data" },
    { id: "parties", label: "Parties", icon: Users, description: "Customer and supplier data" },
    { id: "items", label: "Items", icon: Package, description: "Product inventory data" },
    { id: "invoices", label: "Invoices", icon: FileText, description: "All sales and purchase invoices" },
    { id: "transactions", label: "Transactions", icon: HardDrive, description: "Payment and expense records" },
  ];

  const toggleSelection = (id: string) => {
    if (id === "all") {
      setSelectedData(selectedData.includes("all") ? [] : ["all"]);
    } else {
      const newSelection = selectedData.filter(s => s !== "all");
      if (newSelection.includes(id)) {
        setSelectedData(newSelection.filter(s => s !== id));
      } else {
        setSelectedData([...newSelection, id]);
      }
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    setProgress(0);
    
    // Simulate progress while downloading
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          return prev;
        }
        return prev + 10;
      });
    }, 200);

    await downloadBackup();
    
    clearInterval(interval);
    setProgress(100);
    
    setTimeout(() => {
      setIsExporting(false);
      setProgress(0);
    }, 1000);
  };

  const lastDownload = backups.find(b => b.backup_type === "manual");
  const totalRecords = backups.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Backup to Computer</h1>
          <p className="text-muted-foreground">Download your data as a backup file</p>
        </div>
      </div>

      {/* Info Card */}
      <div className="metric-card bg-primary/5 border-primary/20">
        <div className="flex items-start gap-4">
          <Download className="w-8 h-8 text-primary" />
          <div>
            <h3 className="font-semibold">Download Complete Backup</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Export your data as a JSON backup file that can be stored on your computer or external drive. 
              This backup can be restored anytime using the Restore Backup feature.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Data Selection */}
        <div className="metric-card">
          <h3 className="font-semibold mb-4">Select Data to Export</h3>
          
          <div className="space-y-4">
            {dataTypes.map((type) => {
              const Icon = type.icon;
              return (
                <div
                  key={type.id}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => toggleSelection(type.id)}
                >
                  <Checkbox
                    checked={selectedData.includes(type.id) || selectedData.includes("all")}
                    onCheckedChange={() => toggleSelection(type.id)}
                  />
                  <Icon className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <Label className="cursor-pointer">{type.label}</Label>
                    <p className="text-xs text-muted-foreground">{type.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Export Options */}
        <div className="metric-card">
          <h3 className="font-semibold mb-4">Export Details</h3>
          
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/30 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Format</span>
                <span className="font-medium">JSON Backup (.json)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Backups Created</span>
                <span className="font-medium">{totalRecords}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Data Period</span>
                <span className="font-medium">All Time</span>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Last Downloaded</span>
              </div>
              {lastDownload ? (
                <p className="font-medium">
                  {format(new Date(lastDownload.backup_date), "dd MMM yyyy, hh:mm a")}
                </p>
              ) : (
                <p className="font-medium text-muted-foreground">Never</p>
              )}
            </div>

            {isExporting && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2">
                    {progress === 100 ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-success" />
                        Download complete!
                      </>
                    ) : (
                      "Preparing backup..."
                    )}
                  </span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}

            <Button
              className="btn-gradient w-full gap-2"
              onClick={handleExport}
              disabled={isExporting || selectedData.length === 0}
            >
              <Download className="w-4 h-4" />
              {isExporting ? "Preparing..." : "Download Backup"}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Your backup will be downloaded as a JSON file
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
