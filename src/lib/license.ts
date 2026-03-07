// License/Validity Configuration
// Hardcoded expiry date - change this to extend validity
export const LICENSE_CONFIG = {
  expiryDate: new Date("2026-03-31"), // Format: YYYY-MM-DD
  licenseType: "Professional",
  licensedTo: "Your Business Name",
  supportEmail: "support@hisabkitab.com",
  supportPhone: "+91 98765 43210",
};

export function isLicenseValid(): boolean {
  const now = new Date();
  return now <= LICENSE_CONFIG.expiryDate;
}

export function getDaysRemaining(): number {
  const now = new Date();
  const diff = LICENSE_CONFIG.expiryDate.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function formatExpiryDate(): string {
  return LICENSE_CONFIG.expiryDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
