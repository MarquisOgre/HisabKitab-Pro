import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, Smartphone, Key, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function TwoFactorAuth() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

  // Check existing 2FA status on mount
  useEffect(() => {
    checkExisting2FAStatus();
  }, [user]);

  const checkExisting2FAStatus = async () => {
    if (!user) {
      setCheckingStatus(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      
      if (error) {
        console.error("Error checking 2FA status:", error);
        setCheckingStatus(false);
        return;
      }

      // Check if there's a verified TOTP factor
      const verifiedFactor = data.totp.find(f => f.status === 'verified');
      
      if (verifiedFactor) {
        setIs2FAEnabled(true);
        setFactorId(verifiedFactor.id);
      } else {
        setIs2FAEnabled(false);
        setFactorId(null);
      }
    } catch (error) {
      console.error("Error checking 2FA status:", error);
    } finally {
      setCheckingStatus(false);
    }
  };

  const enrollTOTP = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Hisab Kitab Authenticator'
      });

      if (error) throw error;

      setFactorId(data.id);
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
    } catch (error: any) {
      toast.error(error.message || "Failed to enable 2FA");
    } finally {
      setLoading(false);
    }
  };

  const verifyAndEnable = async () => {
    if (!factorId || !verificationCode) {
      toast.error("Please enter the verification code");
      return;
    }

    setVerifying(true);
    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId
      });

      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: verificationCode
      });

      if (verifyError) throw verifyError;

      setIs2FAEnabled(true);
      setQrCode(null);
      setSecret(null);
      setVerificationCode("");
      toast.success("Two-Factor Authentication enabled successfully! You will need to enter a code from your authenticator app on your next login.");
    } catch (error: any) {
      toast.error(error.message || "Failed to verify code");
    } finally {
      setVerifying(false);
    }
  };

  const disable2FA = async () => {
    if (!factorId) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({
        factorId
      });

      if (error) throw error;

      setIs2FAEnabled(false);
      setFactorId(null);
      toast.success("Two-Factor Authentication disabled");
    } catch (error: any) {
      toast.error(error.message || "Failed to disable 2FA");
    } finally {
      setLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          Two-Factor Authentication (2FA)
        </CardTitle>
        <CardDescription>
          Add an extra layer of security to your account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {is2FAEnabled ? (
          <Alert className="border-green-500/50 bg-green-500/10">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-600">
              Two-Factor Authentication is enabled on your account. You will be prompted to enter a verification code from your authenticator app when logging in.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Two-Factor Authentication adds an extra layer of security by requiring a code from your phone in addition to your password.
            </AlertDescription>
          </Alert>
        )}

        {!qrCode && !is2FAEnabled && (
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Smartphone className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h4 className="font-medium">Authenticator App</h4>
                <p className="text-sm text-muted-foreground">
                  Use an authenticator app like Google Authenticator, Authy, or Microsoft Authenticator to generate verification codes.
                </p>
              </div>
            </div>
            
            <Button onClick={enrollTOTP} disabled={loading} className="btn-gradient">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up...
                </>
              ) : (
                "Enable 2FA"
              )}
            </Button>
          </div>
        )}

        {qrCode && (
          <div className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-medium">Step 1: Scan QR Code</h4>
              <p className="text-sm text-muted-foreground">
                Open your authenticator app and scan this QR code:
              </p>
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
              </div>
            </div>

            {secret && (
              <div className="space-y-2">
                <h4 className="font-medium">Manual Entry</h4>
                <p className="text-sm text-muted-foreground">
                  If you can't scan the QR code, enter this secret key manually:
                </p>
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-muted-foreground" />
                  <code className="flex-1 p-2 bg-muted rounded text-sm font-mono break-all">
                    {secret}
                  </code>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <h4 className="font-medium">Step 2: Verify Code</h4>
              <p className="text-sm text-muted-foreground">
                Enter the 6-digit code from your authenticator app:
              </p>
              <div className="flex gap-4">
                <Input
                  type="text"
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="w-32 text-center text-lg font-mono tracking-wider"
                />
                <Button 
                  onClick={verifyAndEnable} 
                  disabled={verifying || verificationCode.length !== 6}
                  className="btn-gradient"
                >
                  {verifying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify & Enable"
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {is2FAEnabled && (
          <Button variant="destructive" onClick={disable2FA} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Disabling...
              </>
            ) : (
              "Disable 2FA"
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
