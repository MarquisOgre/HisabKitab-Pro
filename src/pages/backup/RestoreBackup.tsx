import { useState } from "react";
import { Upload, AlertTriangle, FileText, CheckCircle, Clock, HardDrive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useBackups, useRestoreBackup } from "@/hooks/useBackup";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function RestoreBackup() {
  const { backups, loading: backupsLoading } = useBackups();
  const { restoring, progress, restoreFromFile } = useRestoreBackup();
  
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [restoreMethod, setRestoreMethod] = useState<"cloud" | "file">("cloud");

  const handleRestore = async () => {
    if (restoreMethod === "file" && uploadedFile) {
      const success = await restoreFromFile(uploadedFile);
      if (success) {
        setUploadedFile(null);
        setSelectedBackup(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Restore Backup</h1>
          <p className="text-muted-foreground">Restore your data from a previous backup</p>
        </div>
      </div>

      {/* Warning */}
      <div className="metric-card bg-warning/10 border-warning/20">
        <div className="flex items-start gap-4">
          <AlertTriangle className="w-8 h-8 text-warning" />
          <div>
            <h3 className="font-semibold text-warning">Important Warning</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Restoring a backup will merge data with your current data. 
              Duplicate entries may be created. We recommend creating a backup of current data before restoring.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cloud Backups */}
        <div className="metric-card">
          <div className="flex items-center gap-2 mb-4">
            <HardDrive className="w-5 h-5" />
            <h3 className="font-semibold">Available Backups</h3>
          </div>
          
          {backupsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : backups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <HardDrive className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No backups available</p>
              <p className="text-sm">Create a backup first to restore later</p>
            </div>
          ) : (
            <div className="space-y-3">
              {backups.map((backup) => (
                <div
                  key={backup.id}
                  onClick={() => {
                    setSelectedBackup(backup.id);
                    setRestoreMethod("cloud");
                    setUploadedFile(null);
                  }}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedBackup === backup.id && restoreMethod === "cloud"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {selectedBackup === backup.id && restoreMethod === "cloud" ? (
                      <CheckCircle className="w-5 h-5 text-primary" />
                    ) : (
                      <Clock className="w-5 h-5 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{backup.backup_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(backup.backup_date), "dd MMM yyyy, hh:mm a")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs bg-muted px-2 py-1 rounded">{backup.file_size}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upload Backup */}
        <div className="metric-card">
          <div className="flex items-center gap-2 mb-4">
            <Upload className="w-5 h-5" />
            <h3 className="font-semibold">Restore from File</h3>
          </div>
          
          <div className="space-y-4">
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
                      {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2">Drag and drop your backup file here</p>
                  <p className="text-sm text-muted-foreground">or</p>
                </>
              )}
              <Label htmlFor="backup-file" className="cursor-pointer">
                <Input
                  id="backup-file"
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setUploadedFile(e.target.files[0]);
                      setRestoreMethod("file");
                      setSelectedBackup(null);
                    }
                  }}
                />
                <Button variant="outline" className="mt-4" asChild>
                  <span>Browse Files</span>
                </Button>
              </Label>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Supported format: .json (Hisab Kitab backup files)
            </p>
          </div>
        </div>
      </div>

      {/* Restore Action */}
      <div className="metric-card">
        <h3 className="font-semibold mb-4">Restore Data</h3>
        
        {restoring && (
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-2">
                {progress === 100 ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-success" />
                    Restore complete!
                  </>
                ) : (
                  "Restoring backup..."
                )}
              </span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        <div className="flex gap-4">
          <Button
            className="btn-gradient gap-2"
            onClick={handleRestore}
            disabled={restoring || (!selectedBackup && !uploadedFile) || restoreMethod === "cloud"}
          >
            <Upload className="w-4 h-4" />
            {restoring ? "Restoring..." : "Restore from File"}
          </Button>
          
          {(selectedBackup || uploadedFile) && (
            <Button
              variant="outline"
              onClick={() => {
                setSelectedBackup(null);
                setUploadedFile(null);
              }}
            >
              Clear Selection
            </Button>
          )}
        </div>

        {restoreMethod === "cloud" && selectedBackup && (
          <p className="text-sm text-muted-foreground mt-4">
            Note: Cloud backup restore is for reference only. To restore, please download the backup first and then upload it.
          </p>
        )}
      </div>
    </div>
  );
}
