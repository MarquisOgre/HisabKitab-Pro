import { Shield, Calendar } from "lucide-react";
import { useLicenseSettings } from "@/hooks/useLicenseSettings";
import { cn } from "@/lib/utils";

export function Footer() {
  const { licenseSettings, isLicenseValid, getDaysRemaining, formatExpiryDate, isLoading } = useLicenseSettings();
  
  const daysRemaining = getDaysRemaining();
  const isExpiringSoon = daysRemaining <= 30 && daysRemaining > 0;
  const licenseValid = isLicenseValid();

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-[hsl(199,89%,48%)] to-[hsl(172,66%,50%)] text-white py-3 px-6 z-40">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm max-w-screen-2xl mx-auto">
        {/* Left - Branding */}
        <div className="flex items-center gap-2">
          <span className="font-semibold">Hisab Kitab</span>
          <span className="text-white/70">•</span>
          <span className="text-white/90">Business Accounting Software</span>
        </div>

        {/* Center - License Info */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Shield className="w-4 h-4" />
            <span>{licenseSettings?.license_type || 'Professional'} License</span>
          </div>
          <span className="text-white/50">|</span>
          <div className={cn(
            "flex items-center gap-1.5",
            isExpiringSoon && "text-yellow-200 font-medium"
          )}>
            <Calendar className="w-4 h-4" />
            {isLoading ? (
              <span>Loading...</span>
            ) : licenseValid ? (
              isExpiringSoon ? (
                <span>Expires in {daysRemaining} days</span>
              ) : (
                <span>Valid until {formatExpiryDate()}</span>
              )
            ) : (
              <span className="text-red-200">Expired</span>
            )}
          </div>
        </div>

        {/* Right - Copyright */}
        <div className="text-white/70 text-xs">
          <p className="text-xs text-white/90">
              © {new Date().getFullYear()} HisabKitab. All rights reserved. • Created by{" "}
              <a
                href="https://dexorzo.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-white/70 hover:text-white underline-offset-4 hover:underline"
              >
                Dexorzo Creations
              </a>
            </p>
        </div>
      </div>
    </footer>
  );
}
