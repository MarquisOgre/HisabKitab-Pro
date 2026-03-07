import { useState } from "react";
import { AlertTriangle, Mail, Phone, Calendar, Shield, RefreshCw, UserX, LogOut, MessageCircle } from "lucide-react";
import { useLicenseSettings } from "@/hooks/useLicenseSettings";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function LicenseExpired() {
  const { licenseSettings, formatExpiryDate } = useLicenseSettings();
  const { user, signOut } = useAuth();
  const [showPhonePopup, setShowPhonePopup] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error("Failed to log out");
    } finally {
      setIsLoggingOut(false);
    }
  };
  
  const hasLicense = !!licenseSettings;
  const supportEmail = licenseSettings?.support_email || "support@hisabkitab.com";
  const supportPhone = licenseSettings?.support_phone || "+91 98765 43210";
  const supportWhatsapp = licenseSettings?.support_whatsapp || "+919876543210";
  const licenseType = licenseSettings?.license_type || "Professional";

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Main Card */}
        <div className="bg-card rounded-2xl shadow-2xl overflow-hidden border border-border">
          {/* Header with Gradient */}
          <div className="bg-gradient-to-r from-destructive/90 to-warning/90 p-8 text-white text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
              {hasLicense ? <AlertTriangle className="w-10 h-10" /> : <UserX className="w-10 h-10" />}
            </div>
            <h1 className="text-3xl font-bold mb-2">
              {hasLicense ? "License Expired" : "No License Found"}
            </h1>
            <p className="text-white/90">
              {hasLicense ? "Your subscription has ended" : "Your email is not associated with a license"}
            </p>
          </div>

          {/* Content */}
          <div className="p-8 space-y-6">
            {/* User Email Info */}
            <div className="bg-muted/50 border border-border rounded-xl p-6 text-center">
              <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
                <Mail className="w-5 h-5" />
                <span className="font-semibold">Logged in as</span>
              </div>
              <p className="text-xl font-bold text-foreground">{user?.email}</p>
              <Button 
                variant="ghost" 
                size="sm" 
                className="mt-3 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                <LogOut className="w-4 h-4 mr-2" />
                {isLoggingOut ? "Logging out..." : "Logout"}
              </Button>
            </div>

            {hasLicense && (
              <>
                {/* Expiry Info */}
                <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-6 text-center">
                  <div className="flex items-center justify-center gap-2 text-destructive mb-2">
                    <Calendar className="w-5 h-5" />
                    <span className="font-semibold">Expired on</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{formatExpiryDate()}</p>
                </div>

                {/* License Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Shield className="w-4 h-4" />
                      <span className="text-sm">License Type</span>
                    </div>
                    <p className="font-semibold">{licenseType}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <RefreshCw className="w-4 h-4" />
                      <span className="text-sm">Status</span>
                    </div>
                    <p className="font-semibold text-destructive">Inactive</p>
                  </div>
                </div>
              </>
            )}

            {/* Contact Section */}
            <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-xl p-6 border border-primary/10">
              <h3 className="font-semibold text-lg mb-4 text-center">Contact System Administrator</h3>
              <p className="text-muted-foreground text-center mb-6">
                {hasLicense 
                  ? "To renew your license and continue using Hisab Kitab, please contact our support team."
                  : "To obtain a license for your email address, please contact our support team."}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href={`mailto:${supportEmail}`}>
                  <Button className="btn-gradient gap-2 w-full sm:w-auto">
                    <Mail className="w-4 h-4" />
                    {supportEmail}
                  </Button>
                </a>
                <Button 
                  variant="outline" 
                  className="gap-2 w-full sm:w-auto"
                  onClick={() => setShowPhonePopup(true)}
                >
                  <Phone className="w-4 h-4" />
                  Call Support
                </Button>
                <a 
                  href={`https://wa.me/${supportWhatsapp.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button 
                    variant="outline" 
                    className="gap-2 w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white border-green-500 hover:border-green-600"
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp
                  </Button>
                </a>
              </div>
            </div>

            {/* Footer Note */}
            <p className="text-center text-sm text-muted-foreground">
              {hasLicense 
                ? "Your data is safe and will be accessible once the license is renewed."
                : "Please ensure you're logged in with the correct email address."}
            </p>
          </div>
        </div>

        {/* Branding */}
        <div className="text-center mt-6">
          <img src="/hisabkitab_dark_logo.png" alt="Hisab Kitab" className="h-32 mx-auto opacity-70" />
        </div>
      </div>

      {/* Phone Number Popup */}
      <Dialog open={showPhonePopup} onOpenChange={setShowPhonePopup}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-primary" />
              Support Phone Number
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <p className="text-2xl font-bold text-primary">{supportPhone}</p>
            <p className="text-muted-foreground text-sm text-center">
              Call this number to speak with our support team about license renewal.
            </p>
            <a href={`tel:${supportPhone.replace(/\s/g, "")}`}>
              <Button className="btn-gradient gap-2">
                <Phone className="w-4 h-4" />
                Call Now
              </Button>
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
