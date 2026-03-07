import { useState, useEffect } from "react";
import { Clock, HardDrive, Settings, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useBackupSettings, useBackups } from "@/hooks/useBackup";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function AutoBackup() {
  const { settings, loading: settingsLoading, updateSettings } = useBackupSettings();
  const { backups, loading: backupsLoading, createBackup } = useBackups();

  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);
  const [frequency, setFrequency] = useState("daily");
  const [time, setTime] = useState("23:30");
  const [retention, setRetention] = useState("30");
  const [saving, setSaving] = useState(false);
  const [creatingBackup, setCreatingBackup] = useState(false);

  useEffect(() => {
    if (settings) {
      setAutoBackupEnabled(settings.auto_backup_enabled);
      setFrequency(settings.frequency);
      setTime(settings.backup_time?.slice(0, 5) || "23:30");
      setRetention(String(settings.retention_days));
    }
  }, [settings]);

  const handleSaveSettings = async () => {
    setSaving(true);
    await updateSettings({
      auto_backup_enabled: autoBackupEnabled,
      frequency,
      backup_time: `${time}:00`,
      retention_days: parseInt(retention),
    });
    setSaving(false);
  };

  const handleCreateBackup = async () => {
    setCreatingBackup(true);
    await createBackup("auto");
    setCreatingBackup(false);
  };

  const successfulBackups = backups.filter((b) => b.status === "success");
  const lastBackup = backups[0];
  const totalSize = backups.reduce((acc, b) => {
    const size = parseFloat(b.file_size?.replace(" MB", "") || "0");
    return acc + size;
  }, 0);

  if (settingsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Auto Backup</h1>
          <p className="text-muted-foreground">Configure automatic data backups</p>
        </div>
        <Button 
          className="btn-gradient gap-2" 
          onClick={handleCreateBackup}
          disabled={creatingBackup}
        >
          {creatingBackup ? "Creating..." : "Create Backup Now"}
        </Button>
      </div>

      {/* Status Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="metric-card">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Auto Backup Status</p>
            {autoBackupEnabled ? (
              <CheckCircle className="w-5 h-5 text-success" />
            ) : (
              <AlertCircle className="w-5 h-5 text-warning" />
            )}
          </div>
          <p className={`text-xl font-bold mt-2 ${autoBackupEnabled ? 'text-success' : 'text-warning'}`}>
            {autoBackupEnabled ? 'Enabled' : 'Disabled'}
          </p>
        </div>
        <div className="metric-card">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Last Backup</p>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </div>
          {lastBackup ? (
            <>
              <p className="text-xl font-bold mt-2">
                {format(new Date(lastBackup.backup_date), "dd MMM yyyy")}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(lastBackup.backup_date), "hh:mm a")}
              </p>
            </>
          ) : (
            <p className="text-xl font-bold mt-2">No backups yet</p>
          )}
        </div>
        <div className="metric-card">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Total Backups</p>
            <HardDrive className="w-4 h-4 text-muted-foreground" />
          </div>
          <p className="text-xl font-bold mt-2">{backups.length}</p>
          <p className="text-xs text-muted-foreground">{totalSize.toFixed(2)} MB total</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings */}
        <div className="metric-card">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Backup Settings
          </h3>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Enable Auto Backup</Label>
                <p className="text-sm text-muted-foreground">Automatically backup your data</p>
              </div>
              <Switch
                checked={autoBackupEnabled}
                onCheckedChange={setAutoBackupEnabled}
              />
            </div>

            <div className="space-y-2">
              <Label>Backup Frequency</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Every Hour</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Backup Time</Label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="space-y-2">
              <Label>Retention Period</Label>
              <Select value={retention} onValueChange={setRetention}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 Days</SelectItem>
                  <SelectItem value="14">14 Days</SelectItem>
                  <SelectItem value="30">30 Days</SelectItem>
                  <SelectItem value="90">90 Days</SelectItem>
                  <SelectItem value="365">1 Year</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Backups older than {retention} days will be automatically deleted
              </p>
            </div>

            <Button 
              className="btn-gradient w-full" 
              onClick={handleSaveSettings}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </div>

        {/* Backup History */}
        <div className="metric-card">
          <h3 className="font-semibold mb-4">Recent Backups</h3>
          
          {backupsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : backups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <HardDrive className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No backups yet</p>
              <p className="text-sm">Create your first backup to see it here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {backups.slice(0, 5).map((backup) => (
                <div
                  key={backup.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    {backup.status === "success" ? (
                      <CheckCircle className="w-5 h-5 text-success" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-destructive" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{backup.backup_name}</p>
                      <p className="text-xs text-muted-foreground">{backup.file_size}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    backup.status === "success" 
                      ? "bg-success/10 text-success" 
                      : "bg-destructive/10 text-destructive"
                  }`}>
                    {backup.status === "success" ? "Success" : "Failed"}
                  </span>
                </div>
              ))}
            </div>
          )}

          {backups.length > 5 && (
            <Button variant="outline" className="w-full mt-4">
              View All Backups ({backups.length})
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
