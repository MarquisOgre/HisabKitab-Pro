import { Building2, User, Shield, Printer, Database, Bell, Globe, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your business and application settings</p>
      </div>

      <Tabs defaultValue="business" className="w-full">
        <TabsList className="bg-secondary/50 p-1 flex-wrap h-auto">
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="branches">Branches</TabsTrigger>
          <TabsTrigger value="license">License</TabsTrigger>
        </TabsList>

        <TabsContent value="business" className="mt-4">
          <div className="stat-card space-y-6">
            <h3 className="font-semibold text-foreground flex items-center gap-2"><Building2 className="w-4 h-4" /> Business Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Business Name" value="My Business Pvt Ltd" />
              <FormField label="GSTIN" value="27AABCU9603R1ZM" />
              <FormField label="Phone" value="+91 98765 43210" />
              <FormField label="Email" value="business@example.com" />
              <FormField label="Address" value="123 Main Street, Mumbai, MH 400001" />
              <FormField label="State" value="Maharashtra" />
            </div>
            <Button>Save Changes</Button>
          </div>
        </TabsContent>

        <TabsContent value="profile" className="mt-4">
          <div className="stat-card space-y-6">
            <h3 className="font-semibold text-foreground flex items-center gap-2"><User className="w-4 h-4" /> User Profile</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Full Name" value="Admin User" />
              <FormField label="Email" value="admin@business.com" />
              <FormField label="Phone" value="+91 98765 43210" />
              <FormField label="Role" value="Owner / Admin" />
            </div>
            <Button>Update Profile</Button>
          </div>
        </TabsContent>

        <TabsContent value="billing" className="mt-4">
          <div className="stat-card space-y-6">
            <h3 className="font-semibold text-foreground flex items-center gap-2"><Printer className="w-4 h-4" /> Invoice Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Invoice Prefix" value="INV" />
              <FormField label="Next Invoice Number" value="0156" />
              <FormField label="Default GST Rate" value="18%" />
              <FormField label="Currency" value="INR (₹)" />
            </div>
            <Button>Save Settings</Button>
          </div>
        </TabsContent>

        {["branches", "license"].map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-4">
            <div className="stat-card flex items-center justify-center h-48">
              <div className="text-center">
                <Shield className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Coming soon</p>
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function FormField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
      <input
        defaultValue={value}
        className="w-full mt-1.5 px-3 py-2 text-sm bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
      />
    </div>
  );
}
