import { useState } from "react";
import {
  Cloud,
  RefreshCw,
  Download,
  Upload,
  CheckCircle,
  Clock,
  Smartphone,
  Monitor,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { useBackups, useBackupSettings } from "@/hooks/useBackup";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";

const syncedDevices = [
  { id: 1, name: "Current Browser", type: "desktop", lastSync: "Just now", status: "synced" },
];

export default function SyncShare() {
  const { backups, createBackup } = useBackups();
  const { settings } = useBackupSettings();
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    await createBackup("auto");
    setSyncing(false);
    toast.success("Data synced successfully");
  };

  const lastBackup = backups[0];
  const totalSize = backups.reduce((acc, b) => {
    const size = parseFloat(b.file_size?.replace(" MB", "") || "0");
    return acc + size;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sync & Share</h1>
          <p className="text-muted-foreground">Manage data synchronization and sharing</p>
        </div>
        <Button 
          className="btn-gradient gap-2" 
          onClick={handleSync}
          disabled={syncing}
        >
          <RefreshCw className={cn("w-4 h-4", syncing && "animate-spin")} />
          {syncing ? "Syncing..." : "Sync Now"}
        </Button>
      </div>

      {/* Sync Status */}
      <div className="metric-card bg-gradient-to-r from-primary to-accent text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">
                {settings?.auto_backup_enabled ? "Auto Sync Enabled" : "Manual Sync Mode"}
              </span>
            </div>
            <p className="text-2xl font-bold">
              {lastBackup 
                ? `Last sync: ${formatDistanceToNow(new Date(lastBackup.backup_date), { addSuffix: true })}`
                : "No sync yet"
              }
            </p>
            <p className="text-sm opacity-80 mt-2">
              {backups.length} backups • {totalSize.toFixed(2)} MB total data
            </p>
          </div>
          <Cloud className="w-20 h-20 opacity-30" />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Synced Devices */}
        <div className="metric-card">
          <h3 className="font-semibold text-lg mb-4">Active Sessions</h3>
          <div className="space-y-4">
            {syncedDevices.map((device) => (
              <div
                key={device.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    {device.type === "mobile" ? (
                      <Smartphone className="w-5 h-5 text-primary" />
                    ) : (
                      <Monitor className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{device.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {device.lastSync}
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    "px-2 py-1 text-xs font-medium rounded-full",
                    device.status === "synced"
                      ? "bg-success/10 text-success"
                      : "bg-warning/10 text-warning"
                  )}
                >
                  {device.status}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 rounded-lg bg-muted/30 text-center">
            <p className="text-sm text-muted-foreground">
              Your data is stored securely in the cloud and accessible from this browser.
            </p>
          </div>
        </div>

        {/* Recent Backups */}
        <div className="metric-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Recent Backups</h3>
          </div>
          <div className="space-y-4">
            {backups.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Cloud className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No backups yet</p>
                <p className="text-sm">Click "Sync Now" to create your first backup</p>
              </div>
            ) : (
              backups.slice(0, 4).map((backup) => (
                <div
                  key={backup.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{backup.backup_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(backup.backup_date), "dd MMM yyyy, hh:mm a")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-muted">
                      {backup.file_size}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Backup Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="metric-card text-center">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Cloud className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-semibold">Auto Backup</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {settings?.auto_backup_enabled 
              ? `${settings.frequency} at ${settings.backup_time?.slice(0, 5)}`
              : "Disabled"
            }
          </p>
          <Button variant="outline" className="mt-4 w-full" asChild>
            <Link to="/backup/auto">Configure</Link>
          </Button>
        </div>
        <div className="metric-card text-center">
          <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <Download className="w-6 h-6 text-accent" />
          </div>
          <h3 className="font-semibold">Download Backup</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Download data to your computer
          </p>
          <Button variant="outline" className="mt-4 w-full" asChild>
            <Link to="/backup/download">Download</Link>
          </Button>
        </div>
        <div className="metric-card text-center">
          <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center mx-auto mb-4">
            <Upload className="w-6 h-6 text-warning" />
          </div>
          <h3 className="font-semibold">Restore Backup</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Restore data from a backup file
          </p>
          <Button variant="outline" className="mt-4 w-full" asChild>
            <Link to="/backup/restore">Restore</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
