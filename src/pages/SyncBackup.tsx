import { RefreshCw, Cloud, Download, Upload, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function SyncBackup() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Sync & Backup</h1>
          <p className="text-sm text-muted-foreground">Keep your data safe and synchronized</p>
        </div>
      </div>

      <Tabs defaultValue="sync">
        <TabsList className="grid w-full grid-cols-4 max-w-xl">
          <TabsTrigger value="sync">Sync & Share</TabsTrigger>
          <TabsTrigger value="auto">Auto Backup</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
          <TabsTrigger value="restore">Restore</TabsTrigger>
        </TabsList>

        <TabsContent value="sync" className="space-y-4">
          <div className="stat-card max-w-lg">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"><Cloud className="w-6 h-6 text-primary" /></div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Cloud Sync</h3>
                <p className="text-sm text-muted-foreground mt-1">Your data is automatically synced to Supabase cloud in real-time.</p>
                <div className="flex items-center gap-2 mt-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs text-muted-foreground">Connected & Syncing</span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="auto" className="space-y-4">
          <div className="stat-card max-w-lg">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center"><Clock className="w-6 h-6 text-accent" /></div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Auto Backup</h3>
                <p className="text-sm text-muted-foreground mt-1">Automatic daily backups are managed by Supabase. Your data is backed up every 24 hours.</p>
                <p className="text-xs text-muted-foreground mt-2">Last backup: Today at 03:00 AM</p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="backup" className="space-y-4">
          <div className="stat-card max-w-lg">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"><Download className="w-6 h-6 text-primary" /></div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Backup to Computer</h3>
                <p className="text-sm text-muted-foreground mt-1">Export all your business data as a JSON file to your computer.</p>
                <Button className="mt-3 gap-2" onClick={() => toast.info("Backup feature coming soon")}><Download className="w-4 h-4" /> Download Backup</Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="restore" className="space-y-4">
          <div className="stat-card max-w-lg">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center"><Upload className="w-6 h-6 text-destructive" /></div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Restore Backup</h3>
                <p className="text-sm text-muted-foreground mt-1">Restore your data from a previously downloaded backup file. This will overwrite current data.</p>
                <Button variant="outline" className="mt-3 gap-2" onClick={() => toast.info("Restore feature coming soon")}><Upload className="w-4 h-4" /> Upload Backup File</Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
