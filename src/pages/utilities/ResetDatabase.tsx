import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Trash2, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { isSuperAdminEmail } from "@/lib/superadmin";

export default function ResetDatabase() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [confirmText, setConfirmText] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);
  const [progress, setProgress] = useState<string[]>([]);

  const isSuperAdmin = isSuperAdminEmail(user?.email);
  const CONFIRM_PHRASE = "DELETE ALL DATA";

  const addProgress = (message: string) => {
    setProgress(prev => [...prev, message]);
  };

  const handleReset = async () => {
    if (!user || !isSuperAdmin) {
      toast.error("Only Super Admin can reset the database");
      return;
    }

    if (confirmText !== CONFIRM_PHRASE) {
      toast.error("Please type the confirmation phrase exactly");
      return;
    }

    setIsResetting(true);
    setProgress([]);

    try {
      addProgress("Calling reset database function...");
      
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      
      const { data, error } = await supabase.functions.invoke("reset-database", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (error) throw error;

      if (data?.log) {
        data.log.forEach((msg: string) => addProgress(msg));
      }
      if (data?.errors?.length) {
        data.errors.forEach((msg: string) => addProgress("⚠️ " + msg));
      }

      addProgress("Database reset complete!");
      setResetComplete(true);
      toast.success("Database has been reset successfully");
    } catch (error: any) {
      console.error("Error resetting database:", error);
      addProgress("❌ Error: " + error.message);
      toast.error("Failed to reset database. Please try again.");
    } finally {
      setIsResetting(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="space-y-6">
        <div>
        <h1 className="text-2xl font-bold">Reset My Data</h1>
        <p className="text-muted-foreground">Clear your business data only</p>
        </div>

        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <XCircle className="w-12 h-12 text-destructive" />
              <div>
                <h3 className="font-semibold text-lg">Access Denied</h3>
                <p className="text-muted-foreground">
                  Only Super Admin can reset the database. Please contact the Super Admin if you need this action performed.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (resetComplete) {
    return (
      <div className="space-y-6">
        <div>
        <h1 className="text-2xl font-bold">Reset My Data</h1>
        <p className="text-muted-foreground">Clear your business data only</p>
        </div>

        <Card className="border-success/50 bg-success/5">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 py-8">
              <CheckCircle2 className="w-16 h-16 text-success" />
              <div className="text-center">
                <h3 className="font-semibold text-xl">Your Data Reset Complete</h3>
                <p className="text-muted-foreground mt-2">
                  All your business data has been permanently deleted. Other users' data is unaffected. You can now start fresh.
                </p>
              </div>
              <Button onClick={() => navigate("/")} className="mt-4">
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>

        {progress.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Reset Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-mono bg-muted p-4 rounded-lg max-h-48 overflow-y-auto">
                {progress.map((msg, i) => (
                  <div key={i} className="py-0.5">{msg}</div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reset My Data</h1>
        <p className="text-muted-foreground">Clear your business data only (other users' data is unaffected)</p>
      </div>

      {/* Warning Card */}
      <Card className="border-destructive/50 bg-destructive/5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-destructive" />
            <div>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>This action cannot be undone</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-background rounded-lg border border-destructive/30">
            <h4 className="font-semibold mb-2">The following <span className="text-destructive">YOUR</span> data will be permanently deleted:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Your parties (customers & suppliers)</li>
              <li>Your items, categories & units</li>
              <li>Your invoices (sales & purchases)</li>
              <li>Your payments (in & out)</li>
              <li>Your expenses</li>
              <li>Your cash transactions</li>
              <li>Your bank account records</li>
              <li>Your notifications & backups</li>
            </ul>
          </div>

          <div className="p-4 bg-warning/10 border border-warning/30 rounded-lg">
            <p className="text-sm font-medium">
              ⚠️ Your user account and settings will NOT be deleted. Only YOUR business transaction data will be removed. Other admins' and users' data will NOT be affected.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Confirmation Required</CardTitle>
          <CardDescription>Please complete the following steps to reset the database</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1 */}
          <div className={`p-4 rounded-lg border ${step >= 1 ? 'border-primary bg-primary/5' : 'border-muted'}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                1
              </div>
              <h4 className="font-semibold">Understand the consequences</h4>
            </div>
            <p className="text-sm text-muted-foreground ml-11">
              I understand that all my business data will be permanently deleted and cannot be recovered.
            </p>
            {step === 1 && (
              <Button className="ml-11 mt-3" onClick={() => setStep(2)}>
                I Understand, Continue
              </Button>
            )}
          </div>

          {/* Step 2 */}
          <div className={`p-4 rounded-lg border ${step >= 2 ? 'border-primary bg-primary/5' : 'border-muted'}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                2
              </div>
              <h4 className="font-semibold">Backup recommendation</h4>
            </div>
            <p className="text-sm text-muted-foreground ml-11">
              We strongly recommend creating a backup before proceeding. Have you backed up your data?
            </p>
            {step === 2 && (
              <div className="ml-11 mt-3 flex gap-2">
                <Button variant="outline" onClick={() => navigate("/backup/download")}>
                  Create Backup First
                </Button>
                <Button onClick={() => setStep(3)}>
                  Continue Without Backup
                </Button>
              </div>
            )}
          </div>

          {/* Step 3 */}
          <div className={`p-4 rounded-lg border ${step >= 3 ? 'border-destructive bg-destructive/5' : 'border-muted'}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 3 ? 'bg-destructive text-destructive-foreground' : 'bg-muted text-muted-foreground'}`}>
                3
              </div>
              <h4 className="font-semibold">Final confirmation</h4>
            </div>
            {step === 3 && (
              <div className="ml-11 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="confirm">
                    Type <span className="font-mono font-bold text-destructive">{CONFIRM_PHRASE}</span> to confirm
                  </Label>
                  <Input
                    id="confirm"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="Type the phrase above"
                    className="max-w-sm"
                  />
                </div>
                <Button
                  variant="destructive"
                  onClick={handleReset}
                  disabled={confirmText !== CONFIRM_PHRASE || isResetting}
                  className="gap-2"
                >
                  {isResetting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Resetting Database...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Reset Database Permanently
                    </>
                  )}
                </Button>

                {isResetting && progress.length > 0 && (
                  <div className="text-sm font-mono bg-muted p-4 rounded-lg max-h-32 overflow-y-auto">
                    {progress.map((msg, i) => (
                      <div key={i} className="py-0.5">{msg}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}