// @ts-nocheck
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
        // Create default settings - all columns are text type
        const now = new Date().toISOString();
        const { data: newData, error: insertError } = await supabase
          .from("backup_settings")
          .insert({
            user_id: user.id,
            auto_backup_enabled: "true",
            frequency: "daily",
            backup_time: "23:30:00",
            retention_days: "30",
            created_at: now,
            updated_at: now,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        setSettings(parseSettings(newData));
      } else {
        setSettings(parseSettings(data));
      }
    } catch (error) {
      console.error("Error fetching backup settings:", error);
    } finally {
      setLoading(false);
    }
  };

  // Parse text columns to proper types for the UI
  const parseSettings = (data: any): BackupSettings => ({
    ...data,
    auto_backup_enabled: data.auto_backup_enabled === "true" || data.auto_backup_enabled === true,
    retention_days: parseInt(data.retention_days) || 30,
  });

  const updateSettings = async (updates: Partial<BackupSettings>) => {
    if (!user || !settings) return;

    try {
      // Convert back to text for DB storage
      const dbUpdates: Record<string, any> = { updated_at: new Date().toISOString() };
      if (updates.auto_backup_enabled !== undefined) {
        dbUpdates.auto_backup_enabled = String(updates.auto_backup_enabled);
      }
      if (updates.frequency !== undefined) dbUpdates.frequency = updates.frequency;
      if (updates.backup_time !== undefined) dbUpdates.backup_time = updates.backup_time;
      if (updates.retention_days !== undefined) {
        dbUpdates.retention_days = String(updates.retention_days);
      }

      const { error } = await supabase
        .from("backup_settings")
        .update(dbUpdates)
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
        { data: cashTransactions },
        { data: bankTransactions },
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
        supabase.from("cash_transactions").select("*"),
        supabase.from("bank_transactions").select("*"),
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
        cashTransactions: cashTransactions || [],
        bankTransactions: bankTransactions || [],
        exportedAt: new Date().toISOString(),
        version: "3.1",
      };

      const jsonString = JSON.stringify(backupData, null, 2);
      const sizeInBytes = new Blob([jsonString]).size;
      const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);

      const backupName = `${type === "auto" ? "Auto" : "Manual"} Backup - ${new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })}`;

      const now = new Date().toISOString();

      // Save backup record
      const { data: backupRecord, error } = await supabase
        .from("backups")
        .insert({
          user_id: user.id,
          backup_name: backupName,
          backup_type: type,
          file_size: `${sizeInMB} MB`,
          status: "success",
          backup_date: now,
          created_at: now,
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
        created_at: now,
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
        created_at: new Date().toISOString(),
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
    a.download = `hisabkitab-backup-${new Date().toISOString().split("T")[0]}.json`;
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

      setProgress(5);

      // Validate backup structure
      if (!backupData.version || !backupData.exportedAt) {
        throw new Error("Invalid backup file format. Missing version or exportedAt field.");
      }

      setProgress(10);

      // Restore categories first (dependencies)
      if (backupData.categories?.length > 0) {
        for (const category of backupData.categories) {
          await supabase.from("categories").upsert(
            { ...category, user_id: user.id },
            { onConflict: "id" }
          );
        }
      }
      setProgress(20);

      // Restore parties
      if (backupData.parties?.length > 0) {
        for (const party of backupData.parties) {
          await supabase.from("parties").upsert(
            { ...party, user_id: user.id },
            { onConflict: "id" }
          );
        }
      }
      setProgress(30);

      // Restore items
      if (backupData.items?.length > 0) {
        for (const item of backupData.items) {
          await supabase.from("items").upsert(
            { ...item, user_id: user.id },
            { onConflict: "id" }
          );
        }
      }
      setProgress(40);

      // Restore sale invoices
      if (backupData.saleInvoices?.length > 0) {
        for (const invoice of backupData.saleInvoices) {
          await supabase.from("sale_invoices").upsert(
            { ...invoice, user_id: user.id },
            { onConflict: "id" }
          );
        }
      }
      setProgress(50);

      // Restore sale invoice items
      if (backupData.saleInvoiceItems?.length > 0) {
        for (const item of backupData.saleInvoiceItems) {
          await supabase.from("sale_invoice_items").upsert(
            item,
            { onConflict: "id" }
          );
        }
      }
      setProgress(55);

      // Restore purchase invoices
      if (backupData.purchaseInvoices?.length > 0) {
        for (const invoice of backupData.purchaseInvoices) {
          await supabase.from("purchase_invoices").upsert(
            { ...invoice, user_id: user.id },
            { onConflict: "id" }
          );
        }
      }
      setProgress(65);

      // Restore purchase invoice items
      if (backupData.purchaseInvoiceItems?.length > 0) {
        for (const item of backupData.purchaseInvoiceItems) {
          await supabase.from("purchase_invoice_items").upsert(
            item,
            { onConflict: "id" }
          );
        }
      }
      setProgress(70);

      // Restore payments
      if (backupData.payments?.length > 0) {
        for (const payment of backupData.payments) {
          await supabase.from("payments").upsert(
            { ...payment, user_id: user.id },
            { onConflict: "id" }
          );
        }
      }
      setProgress(80);

      // Restore bank accounts
      if (backupData.bankAccounts?.length > 0) {
        for (const account of backupData.bankAccounts) {
          await supabase.from("bank_accounts").upsert(
            { ...account, user_id: user.id },
            { onConflict: "id" }
          );
        }
      }
      setProgress(85);

      // Restore expenses
      if (backupData.expenses?.length > 0) {
        for (const expense of backupData.expenses) {
          await supabase.from("expenses").upsert(
            { ...expense, user_id: user.id },
            { onConflict: "id" }
          );
        }
      }
      setProgress(90);

      // Restore cash transactions (v3.1+)
      if (backupData.cashTransactions?.length > 0) {
        for (const txn of backupData.cashTransactions) {
          await supabase.from("cash_transactions").upsert(
            { ...txn, user_id: user.id },
            { onConflict: "id" }
          );
        }
      }
      setProgress(95);

      // Restore bank transactions (v3.1+)
      if (backupData.bankTransactions?.length > 0) {
        for (const txn of backupData.bankTransactions) {
          await supabase.from("bank_transactions").upsert(
            { ...txn, user_id: user.id },
            { onConflict: "id" }
          );
        }
      }
      setProgress(100);

      // Create notification
      await supabase.from("notifications").insert({
        user_id: user.id,
        title: "Restore Complete",
        message: "Your data has been restored successfully from the backup file.",
        type: "success",
        created_at: new Date().toISOString(),
      });

      toast.success("Backup restored successfully!");
      return true;
    } catch (error: any) {
      console.error("Error restoring backup:", error);
      toast.error("Failed to restore backup: " + (error.message || "Please check the file format."));

      await supabase.from("notifications").insert({
        user_id: user.id,
        title: "Restore Failed",
        message: "There was an error restoring your backup. Please try again.",
        type: "error",
        created_at: new Date().toISOString(),
      });

      return false;
    } finally {
      setRestoring(false);
    }
  };

  return { restoring, progress, restoreFromFile };
}
