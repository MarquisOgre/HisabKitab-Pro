import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

interface MFAVerificationProps {
  factorId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function MFAVerification({ factorId, onSuccess, onCancel }: MFAVerificationProps) {
  const [otpCode, setOtpCode] = useState("");
  const [verifying, setVerifying] = useState(false);

  const handleVerification = async () => {
    if (!factorId || otpCode.length !== 6) {
      toast.error("Please enter the 6-digit code");
      return;
    }

    setVerifying(true);
    try {
      // Create a challenge
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId
      });

      if (challengeError) throw challengeError;

      // Verify the challenge with the OTP code
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: otpCode
      });

      if (verifyError) throw verifyError;

      toast.success("Verification successful!");
      onSuccess();
    } catch (error: any) {
      console.error("2FA verification error:", error);
      toast.error(error.message || "Invalid verification code");
      setOtpCode("");
    } finally {
      setVerifying(false);
    }
  };

  // Auto-submit when 6 digits are entered
  useEffect(() => {
    if (otpCode.length === 6) {
      handleVerification();
    }
  }, [otpCode]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-primary/10">
              <Shield className="w-12 h-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Two-Factor Authentication</CardTitle>
          <CardDescription>
            Enter the 6-digit code from your authenticator app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={otpCode}
              onChange={setOtpCode}
              disabled={verifying}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>
          
          <Button 
            onClick={handleVerification} 
            className="w-full" 
            disabled={verifying || otpCode.length !== 6}
          >
            {verifying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify & Continue"
            )}
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={onCancel}
            disabled={verifying}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
