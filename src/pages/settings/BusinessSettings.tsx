import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Building2, 
  Save, 
  Upload, 
  Loader2,
  ArrowLeft,
  FileText,
  Mail,
  Phone,
  MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useBusinessSelection } from "@/contexts/BusinessSelectionContext";
import { toast } from "sonner";

const INDIAN_STATES = [
  { code: "AN", name: "Andaman and Nicobar Islands" },
  { code: "AP", name: "Andhra Pradesh" },
  { code: "AR", name: "Arunachal Pradesh" },
  { code: "AS", name: "Assam" },
  { code: "BR", name: "Bihar" },
  { code: "CH", name: "Chandigarh" },
  { code: "CT", name: "Chhattisgarh" },
  { code: "DN", name: "Dadra and Nagar Haveli and Daman and Diu" },
  { code: "DL", name: "Delhi" },
  { code: "GA", name: "Goa" },
  { code: "GJ", name: "Gujarat" },
  { code: "HR", name: "Haryana" },
  { code: "HP", name: "Himachal Pradesh" },
  { code: "JK", name: "Jammu and Kashmir" },
  { code: "JH", name: "Jharkhand" },
  { code: "KA", name: "Karnataka" },
  { code: "KL", name: "Kerala" },
  { code: "LA", name: "Ladakh" },
  { code: "LD", name: "Lakshadweep" },
  { code: "MP", name: "Madhya Pradesh" },
  { code: "MH", name: "Maharashtra" },
  { code: "MN", name: "Manipur" },
  { code: "ML", name: "Meghalaya" },
  { code: "MZ", name: "Mizoram" },
  { code: "NL", name: "Nagaland" },
  { code: "OR", name: "Odisha" },
  { code: "PY", name: "Puducherry" },
  { code: "PB", name: "Punjab" },
  { code: "RJ", name: "Rajasthan" },
  { code: "SK", name: "Sikkim" },
  { code: "TN", name: "Tamil Nadu" },
  { code: "TG", name: "Telangana" },
  { code: "TR", name: "Tripura" },
  { code: "UP", name: "Uttar Pradesh" },
  { code: "UK", name: "Uttarakhand" },
  { code: "WB", name: "West Bengal" },
];

export default function BusinessSettings() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { selectedBusiness, updateBusiness, refetchBusinesses } = useBusinessSelection();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Business details
  const [name, setName] = useState("");
  const [gstin, setGstin] = useState("");
  const [pan, setPan] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  // Business-specific settings (from business_settings table)
  const [invoicePrefix, setInvoicePrefix] = useState("INV-");
  const [purchasePrefix, setPurchasePrefix] = useState("PUR-");
  const [estimationPrefix, setEstimationPrefix] = useState("EST-");
  const [gstRegistrationType, setGstRegistrationType] = useState("regular");
  const [stateCode, setStateCode] = useState("KA");
  const [invoiceTerms, setInvoiceTerms] = useState("");
  const [financialYearStart, setFinancialYearStart] = useState("april");
  const [showLogoOnInvoice, setShowLogoOnInvoice] = useState(true);
  const [showBankDetails, setShowBankDetails] = useState(true);

  useEffect(() => {
    if (selectedBusiness) {
      loadBusinessData();
    }
  }, [selectedBusiness]);

  const loadBusinessData = async () => {
    if (!selectedBusiness || !user) return;
    
    setLoading(true);
    try {
      // Load business basic info
      setName(selectedBusiness.name || "");
      setGstin(selectedBusiness.gstin || "");
      setPan(selectedBusiness.pan || "");
      setEmail(selectedBusiness.email || "");
      setPhone(selectedBusiness.phone || "");
      setAddress(selectedBusiness.address || "");
      setLogoUrl(selectedBusiness.logo_url || "");

      // Load business-specific settings
      const { data: settings, error } = await supabase
        .from('business_settings')
        .select('*')
        .eq('business_id', selectedBusiness.id)
        .maybeSingle();

      if (error) throw error;

      if (settings) {
        setInvoicePrefix(settings.invoice_prefix || "INV-");
        setPurchasePrefix(settings.purchase_prefix || "PUR-");
        setEstimationPrefix(settings.estimation_prefix || "EST-");
        setGstRegistrationType(settings.gst_registration_type || "regular");
        setStateCode(settings.state_code || "KA");
        setInvoiceTerms(settings.invoice_terms || "");
        setFinancialYearStart(settings.financial_year_start || "april");
        setShowLogoOnInvoice(settings.show_logo_on_invoice ?? true);
        setShowBankDetails(settings.show_bank_details ?? true);
      }
    } catch (error) {
      console.error('Error loading business data:', error);
      toast.error('Failed to load business settings');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user || !selectedBusiness) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be less than 2MB');
      return;
    }

    if (!['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(file.type)) {
      toast.error('Only PNG, JPG, and WebP images are allowed');
      return;
    }

    setUploadingLogo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${selectedBusiness.id}/logo.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('business-logos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('business-logos')
        .getPublicUrl(fileName);

      const newLogoUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      setLogoUrl(newLogoUrl);
      toast.success('Logo uploaded successfully!');
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo: ' + error.message);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async () => {
    if (!user || !selectedBusiness) {
      toast.error('No business selected');
      return;
    }

    if (!isAdmin) {
      toast.error('Only admins can modify business settings');
      return;
    }

    setSaving(true);
    try {
      // Update business table
      await updateBusiness(selectedBusiness.id, {
        name,
        gstin,
        pan,
        email,
        phone,
        address,
        logo_url: logoUrl,
      });

      // Upsert business_settings for this business
      const { error: settingsError } = await supabase
        .from('business_settings')
        .upsert({
          user_id: user.id,
          business_id: selectedBusiness.id,
          business_name: name,
          gstin,
          pan,
          email,
          phone,
          business_address: address,
          logo_url: logoUrl,
          invoice_prefix: invoicePrefix,
          purchase_prefix: purchasePrefix,
          estimation_prefix: estimationPrefix,
          gst_registration_type: gstRegistrationType,
          state_code: stateCode,
          invoice_terms: invoiceTerms,
          financial_year_start: financialYearStart,
          show_logo_on_invoice: showLogoOnInvoice,
          show_bank_details: showBankDetails,
          updated_at: new Date().toISOString(),
        }, { 
          onConflict: 'business_id',
          ignoreDuplicates: false 
        });

      if (settingsError) throw settingsError;

      await refetchBusinesses();
      toast.success('Business settings saved successfully!');
    } catch (error: any) {
      console.error('Error saving business settings:', error);
      toast.error('Failed to save settings: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (!selectedBusiness) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">No business selected</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 md:p-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Building2 className="h-6 w-6" />
                Business Settings
              </h1>
              <p className="text-muted-foreground text-sm">
                Configure settings for: {selectedBusiness.name}
              </p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving || !isAdmin}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>

        <div className="space-y-6">
          {/* Business Information */}
          <div className="metric-card">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Business Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Business Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={!isAdmin}
                    placeholder="Enter business name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gstin">GSTIN</Label>
                  <Input
                    id="gstin"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    disabled={!isAdmin}
                    placeholder="22AAAAA0000A1Z5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pan">PAN</Label>
                  <Input
                    id="pan"
                    value={pan}
                    onChange={(e) => setPan(e.target.value.toUpperCase())}
                    disabled={!isAdmin}
                    placeholder="AAAAA0000A"
                  />
                </div>
              </div>
              
              {/* Logo Upload */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Business Logo</Label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={handleLogoUpload}
                    disabled={!isAdmin || uploadingLogo}
                  />
                  <div 
                    className={`border-2 border-dashed border-border rounded-lg p-6 text-center ${isAdmin ? 'cursor-pointer hover:border-primary transition-colors' : ''}`}
                    onClick={() => isAdmin && fileInputRef.current?.click()}
                  >
                    {uploadingLogo ? (
                      <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                    ) : logoUrl ? (
                      <img src={logoUrl} alt="Business Logo" className="max-h-24 mx-auto mb-2 object-contain" />
                    ) : (
                      <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    )}
                    <p className="text-sm text-muted-foreground">
                      {uploadingLogo ? 'Uploading...' : logoUrl ? 'Click to change logo' : 'Click to upload logo'}
                    </p>
                    <p className="text-xs text-muted-foreground">PNG, JPG up to 2MB</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="metric-card">
            <h3 className="font-semibold mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!isAdmin}
                  placeholder="business@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Phone
                </Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={!isAdmin}
                  placeholder="+91 98765 43210"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  Address
                </Label>
                <Textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  disabled={!isAdmin}
                  placeholder="Enter business address"
                />
              </div>
            </div>
          </div>

          {/* Invoice Settings */}
          <div className="metric-card">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Invoice Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invoicePrefix">Invoice Prefix</Label>
                <Input
                  id="invoicePrefix"
                  value={invoicePrefix}
                  onChange={(e) => setInvoicePrefix(e.target.value)}
                  disabled={!isAdmin}
                  placeholder="INV-"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchasePrefix">Purchase Prefix</Label>
                <Input
                  id="purchasePrefix"
                  value={purchasePrefix}
                  onChange={(e) => setPurchasePrefix(e.target.value)}
                  disabled={!isAdmin}
                  placeholder="PUR-"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimationPrefix">Estimation Prefix</Label>
                <Input
                  id="estimationPrefix"
                  value={estimationPrefix}
                  onChange={(e) => setEstimationPrefix(e.target.value)}
                  disabled={!isAdmin}
                  placeholder="EST-"
                />
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <Label htmlFor="invoiceTerms">Invoice Terms & Conditions</Label>
              <Textarea
                id="invoiceTerms"
                value={invoiceTerms}
                onChange={(e) => setInvoiceTerms(e.target.value)}
                rows={3}
                disabled={!isAdmin}
                placeholder="Enter default invoice terms and conditions..."
              />
            </div>
          </div>

          {/* Tax & GST Settings */}
          <div className="metric-card">
            <h3 className="font-semibold mb-4">Tax & GST Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gstType">GST Registration Type</Label>
                <Select value={gstRegistrationType} onValueChange={setGstRegistrationType} disabled={!isAdmin}>
                  <SelectTrigger id="gstType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="composition">Composition</SelectItem>
                    <SelectItem value="unregistered">Unregistered</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="stateCode">State</Label>
                <Select value={stateCode} onValueChange={setStateCode} disabled={!isAdmin}>
                  <SelectTrigger id="stateCode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INDIAN_STATES.map((state) => (
                      <SelectItem key={state.code} value={state.code}>
                        {state.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="financialYear">Financial Year Start</Label>
                <Select value={financialYearStart} onValueChange={setFinancialYearStart} disabled={!isAdmin}>
                  <SelectTrigger id="financialYear">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="january">January</SelectItem>
                    <SelectItem value="april">April</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Print & Display Settings */}
          <div className="metric-card">
            <h3 className="font-semibold mb-4">Print & Display Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Logo on Invoice</Label>
                  <p className="text-sm text-muted-foreground">Display your business logo on printed invoices</p>
                </div>
                <Switch
                  checked={showLogoOnInvoice}
                  onCheckedChange={setShowLogoOnInvoice}
                  disabled={!isAdmin}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Bank Details</Label>
                  <p className="text-sm text-muted-foreground">Display bank account details on invoices</p>
                </div>
                <Switch
                  checked={showBankDetails}
                  onCheckedChange={setShowBankDetails}
                  disabled={!isAdmin}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
