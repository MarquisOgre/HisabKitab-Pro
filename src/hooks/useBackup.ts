import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface BackupSettings {
  id: string;
  user_id: string;
  auto_backup_enabled: boolean;
  frequency: string;
  backup_time: string;
  retention_days: number;
  created_at: string;
  updated_at: string;
}

export interface Backup {
  id: string;
  user_id: string;
  backup_name: string;
  backup_type: string;
  file_size: string | null;
  status: string;
  backup_date: string;
  created_at: string;
}

export function useBackupSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<BackupSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("backup_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        // Create default settings if none exist
        const { data: newData, error: insertError } = await supabase
          .from("backup_settings")
          .insert({
            user_id: user.id,
            auto_backup_enabled: true,
            frequency: "daily",
            backup_time: "23:30:00",
            retention_days: 30,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        setSettings(newData);
      } else {
        setSettings(data);
      }
    } catch (error) {
      console.error("Error fetching backup settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<BackupSettings>) => {
    if (!user || !settings) return;

    try {
      const { error } = await supabase
        .from("backup_settings")
        .update(updates)
        .eq("user_id", user.id);

      if (error) throw error;
      
      setSettings({ ...settings, ...updates });
      toast.success("Backup settings saved successfully");
    } catch (error) {
      console.error("Error updating backup settings:", error);
      toast.error("Failed to save settings");
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [user]);

  return { settings, loading, updateSettings, refetch: fetchSettings };
}

export function useBackups() {
  const { user } = useAuth();
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBackups = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("backups")
        .select("*")
        .eq("user_id", user.id)
        .order("backup_date", { ascending: false });

      if (error) throw error;
      setBackups(data || []);
    } catch (error) {
      console.error("Error fetching backups:", error);
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async (type: "auto" | "manual") => {
    if (!user) return null;

    try {
      // Fetch all user data for backup
      const [
        { data: parties },
        { data: items },
        { data: saleInvoices },
        { data: purchaseInvoices },
        { data: saleInvoiceItems },
        { data: purchaseInvoiceItems },
        { data: payments },
        { data: expenses },
        { data: categories },
        { data: bankAccounts },
      ] = await Promise.all([
        supabase.from("parties").select("*"),
        supabase.from("items").select("*"),
        supabase.from("sale_invoices").select("*"),
        supabase.from("purchase_invoices").select("*"),
        supabase.from("sale_invoice_items").select("*"),
        supabase.from("purchase_invoice_items").select("*"),
        supabase.from("payments").select("*"),
        supabase.from("expenses").select("*"),
        supabase.from("categories").select("*"),
        supabase.from("bank_accounts").select("*"),
      ]);

      const backupData = {
        parties: parties || [],
        items: items || [],
        saleInvoices: saleInvoices || [],
        purchaseInvoices: purchaseInvoices || [],
        saleInvoiceItems: saleInvoiceItems || [],
        purchaseInvoiceItems: purchaseInvoiceItems || [],
        payments: payments || [],
        expenses: expenses || [],
        categories: categories || [],
        bankAccounts: bankAccounts || [],
        exportedAt: new Date().toISOString(),
        version: "3.0",
      };

      const jsonString = JSON.stringify(backupData, null, 2);
      const sizeInBytes = new Blob([jsonString]).size;
      const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);

      const backupName = `${type === "auto" ? "Auto" : "Manual"} Backup - ${new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })}`;

      // Save backup record
      const { data: backupRecord, error } = await supabase
        .from("backups")
        .insert({
          user_id: user.id,
          backup_name: backupName,
          backup_type: type,
          file_size: `${sizeInMB} MB`,
          status: "success",
        })
        .select()
        .single();

      if (error) throw error;

      // Create notification
      await supabase.from("notifications").insert({
        user_id: user.id,
        title: "Backup Created",
        message: `${backupName} completed successfully (${sizeInMB} MB)`,
        type: "success",
      });

      await fetchBackups();
      
      return { backupRecord, backupData: jsonString };
    } catch (error) {
      console.error("Error creating backup:", error);
      
      // Create failure notification
      await supabase.from("notifications").insert({
        user_id: user.id,
        title: "Backup Failed",
        message: "There was an error creating your backup. Please try again.",
        type: "error",
      });
      
      return null;
    }
  };

  const downloadBackup = async () => {
    const result = await createBackup("manual");
    if (!result) {
      toast.error("Failed to create backup");
      return;
    }

    // Trigger download
    const blob = new Blob([result.backupData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hisahkitab-backup-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Backup downloaded successfully");
  };

  useEffect(() => {
    fetchBackups();
  }, [user]);

  return { backups, loading, createBackup, downloadBackup, refetch: fetchBackups };
}

export function useRestoreBackup() {
  const { user } = useAuth();
  const [restoring, setRestoring] = useState(false);
  const [progress, setProgress] = useState(0);

  const restoreFromFile = async (file: File): Promise<boolean> => {
    if (!user) return false;

    setRestoring(true);
    setProgress(0);

    try {
      const content = await file.text();
      const backupData = JSON.parse(content);

      setProgress(10);

      // Validate backup structure
      if (!backupData.version || !backupData.exportedAt) {
        throw new Error("Invalid backup file format");
      }

      setProgress(20);

      // Restore categories first (dependencies)
      if (backupData.categories?.length > 0) {
        for (const category of backupData.categories) {
          const { id, ...categoryData } = category;
          await supabase.from("categories").upsert({
            ...categoryData,
            user_id: user.id,
          });
        }
      }
      setProgress(30);

      // Restore parties
      if (backupData.parties?.length > 0) {
        for (const party of backupData.parties) {
          const { id, ...partyData } = party;
          await supabase.from("parties").upsert({
            ...partyData,
            user_id: user.id,
          });
        }
      }
      setProgress(50);

      // Restore items
      if (backupData.items?.length > 0) {
        for (const item of backupData.items) {
          const { id, ...itemData } = item;
          await supabase.from("items").upsert({
            ...itemData,
            user_id: user.id,
          });
        }
      }
      setProgress(70);

      // Restore bank accounts
      if (backupData.bankAccounts?.length > 0) {
        for (const account of backupData.bankAccounts) {
          const { id, ...accountData } = account;
          await supabase.from("bank_accounts").upsert({
            ...accountData,
            user_id: user.id,
          });
        }
      }
      setProgress(85);

      // Restore expenses
      if (backupData.expenses?.length > 0) {
        for (const expense of backupData.expenses) {
          const { id, ...expenseData } = expense;
          await supabase.from("expenses").upsert({
            ...expenseData,
            user_id: user.id,
          });
        }
      }
      setProgress(100);

      // Create notification
      await supabase.from("notifications").insert({
        user_id: user.id,
        title: "Restore Complete",
        message: "Your data has been restored successfully from the backup file.",
        type: "success",
      });

      toast.success("Backup restored successfully!");
      return true;
    } catch (error) {
      console.error("Error restoring backup:", error);
      toast.error("Failed to restore backup. Please check the file format.");

      await supabase.from("notifications").insert({
        user_id: user.id,
        title: "Restore Failed",
        message: "There was an error restoring your backup. Please try again.",
        type: "error",
      });

      return false;
    } finally {
      setRestoring(false);
    }
  };

  return { restoring, progress, restoreFromFile };
}
