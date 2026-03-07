// @ts-nocheck
import { useState, useEffect } from "react";
import { 
  Building2, 
  FileText, 
  Bell, 
  Palette, 
  Printer,
  Mail,
  Phone,
  MapPin,
  Save,
  Loader2,
  Check,
  Sun,
  Moon,
  ChevronDown,
  ChevronUp,
  Ruler,
  Plus,
  Trash2
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useBusinessSelection } from "@/contexts/BusinessSelectionContext";
import { useTheme } from "next-themes";
import { toast } from "sonner";
// @ts-nocheck
// All Indian states and union territories
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

const ACCENT_COLORS = [
  { name: 'Blue', value: '199 89% 48%' },
  { name: 'Green', value: '142 76% 36%' },
  { name: 'Purple', value: '262 83% 58%' },
  { name: 'Orange', value: '38 92% 50%' },
  { name: 'Red', value: '0 84% 60%' },
  { name: 'Pink', value: '330 81% 60%' },
];

export function BusinessSettingsSection() {
  const { user, isAdmin } = useAuth();
  const { selectedBusiness, updateBusiness, refetchBusinesses } = useBusinessSelection();
  const { theme, setTheme } = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Section open states
  const [businessOpen, setBusinessOpen] = useState(true);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [taxOpen, setTaxOpen] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);

  // Business details
  const [name, setName] = useState("");
  const [gstin, setGstin] = useState("");
  const [pan, setPan] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [financialYearStart, setFinancialYearStart] = useState("april");

  // Invoice settings
  const [invoicePrefix, setInvoicePrefix] = useState("INV-");
  const [purchasePrefix, setPurchasePrefix] = useState("PUR-");
  const [estimationPrefix, setEstimationPrefix] = useState("EST-");
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState(1);
  const [invoiceTerms, setInvoiceTerms] = useState("");
  const [defaultPaymentTerms, setDefaultPaymentTerms] = useState("30");

  // Tax settings
  const [gstRegistrationType, setGstRegistrationType] = useState("regular");
  const [stateCode, setStateCode] = useState("KA");
  const [gstReceivable, setGstReceivable] = useState(0);
  const [gstPayable, setGstPayable] = useState(0);
  const [tcsReceivable, setTcsReceivable] = useState(0);
  const [tcsPayable, setTcsPayable] = useState(0);
  const [tdsReceivable, setTdsReceivable] = useState(0);
  const [tdsPayable, setTdsPayable] = useState(0);

  // Print settings
  const [paperSize, setPaperSize] = useState("a4");
  const [invoiceTemplate, setInvoiceTemplate] = useState("modern");
  const [showLogoOnInvoice, setShowLogoOnInvoice] = useState(true);
  const [showBankDetails, setShowBankDetails] = useState(true);
  const [showQrCode, setShowQrCode] = useState(false);
  const [autoPrintOnSave, setAutoPrintOnSave] = useState(false);

  // Alerts settings
  const [paymentReminders, setPaymentReminders] = useState(true);
  const [lowStockAlerts, setLowStockAlerts] = useState(true);
  const [dailySummary, setDailySummary] = useState(false);

  // Theme settings (stored in localStorage per business)
  const [accentColor, setAccentColor] = useState("199 89% 48%");
  const [compactMode, setCompactMode] = useState(false);

  useEffect(() => {
    if (selectedBusiness) {
      loadBusinessData();
      loadLocalPreferences();
    }
  }, [selectedBusiness?.id]);

  const loadLocalPreferences = () => {
    if (!selectedBusiness) return;
    const key = `business_prefs_${selectedBusiness.id}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const prefs = JSON.parse(saved);
        if (prefs.accentColor) setAccentColor(prefs.accentColor);
        if (prefs.compactMode !== undefined) setCompactMode(prefs.compactMode);
      } catch (e) {
        console.error('Error loading preferences:', e);
      }
    }
  };

  const saveLocalPreferences = () => {
    if (!selectedBusiness) return;
    const key = `business_prefs_${selectedBusiness.id}`;
    localStorage.setItem(key, JSON.stringify({
      accentColor,
      compactMode
    }));
  };

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
        setNextInvoiceNumber(Number(settings.next_invoice_number) || 1);
        setInvoiceTerms(settings.invoice_terms || "");
        setDefaultPaymentTerms(String(settings.default_payment_terms || 30));
        setGstRegistrationType(settings.gst_registration_type || "regular");
        setStateCode(settings.state_code || "KA");
        setFinancialYearStart(settings.financial_year_start || "april");
        setGstReceivable(Number(settings.gst_receivable) || 0);
        setGstPayable(Number(settings.gst_payable) || 0);
        setTcsReceivable(Number(settings.tcs_receivable) || 0);
        setTcsPayable(Number(settings.tcs_payable) || 0);
        setTdsReceivable(Number(settings.tds_receivable) || 0);
        setTdsPayable(Number(settings.tds_payable) || 0);
        setPaperSize(settings.paper_size || "a4");
        setInvoiceTemplate(settings.invoice_template || "modern");
        setShowLogoOnInvoice(settings.show_logo_on_invoice === 'true' || settings.show_logo_on_invoice === true as any);
        setShowBankDetails(settings.show_bank_details === 'true' || settings.show_bank_details === true as any);
        setShowQrCode(settings.show_qr_code === 'true' || settings.show_qr_code === true as any);
        setAutoPrintOnSave(settings.auto_print_on_save === 'true' || settings.auto_print_on_save === true as any);
      }
    } catch (error) {
      console.error('Error loading business data:', error);
      toast.error('Failed to load business settings');
    } finally {
      setLoading(false);
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
          next_invoice_number: nextInvoiceNumber,
          invoice_terms: invoiceTerms,
          default_payment_terms: parseInt(defaultPaymentTerms),
          gst_registration_type: gstRegistrationType,
          state_code: stateCode,
          financial_year_start: financialYearStart,
          gst_receivable: gstReceivable,
          gst_payable: gstPayable,
          tcs_receivable: tcsReceivable,
          tcs_payable: tcsPayable,
          tds_receivable: tdsReceivable,
          tds_payable: tdsPayable,
          paper_size: paperSize,
          invoice_template: invoiceTemplate,
          show_logo_on_invoice: showLogoOnInvoice,
          show_bank_details: showBankDetails,
          show_qr_code: showQrCode,
          auto_print_on_save: autoPrintOnSave,
          updated_at: new Date().toISOString(),
        }, { 
          onConflict: 'business_id',
          ignoreDuplicates: false 
        });

      if (settingsError) throw settingsError;

      // Save local preferences
      saveLocalPreferences();

      await refetchBusinesses();
      toast.success('Business settings saved successfully! Refreshing...');
      
      // Hard refresh the page to ensure all components get the updated settings
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error: any) {
      console.error('Error saving business settings:', error);
      toast.error('Failed to save settings: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAccentColorChange = (color: string) => {
    setAccentColor(color);
    document.documentElement.style.setProperty('--primary', color);
  };

  const handleCompactModeChange = (checked: boolean) => {
    setCompactMode(checked);
    document.documentElement.classList.toggle('compact', checked);
  };

  if (!selectedBusiness) {
    return (
      <div className="metric-card">
        <p className="text-muted-foreground text-center py-8">
          Please select a business from the dropdown above to configure settings.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const SectionHeader = ({ 
    icon: Icon, 
    title, 
    open, 
    onToggle 
  }: { 
    icon: any; 
    title: string; 
    open: boolean; 
    onToggle: () => void;
  }) => (
    <CollapsibleTrigger 
      onClick={onToggle}
      className="flex items-center justify-between w-full p-4 hover:bg-muted/50 rounded-lg transition-colors"
    >
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-primary" />
        <span className="font-semibold">{title}</span>
      </div>
      {open ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
    </CollapsibleTrigger>
  );

  return (
    <div className="space-y-4">
      {/* Header with Save Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Business Settings
          </h2>
          <p className="text-sm text-muted-foreground">
            Configure settings for: <span className="font-medium">{selectedBusiness.name}</span>
          </p>
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

      {!isAdmin && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-600 dark:text-yellow-400 px-4 py-3 rounded-lg">
          Only admins can modify settings. You have view-only access.
        </div>
      )}

      {/* Business Information */}
      <Collapsible open={businessOpen} onOpenChange={setBusinessOpen}>
        <div className="metric-card p-0 overflow-hidden">
          <SectionHeader 
            icon={Building2} 
            title="Business Information" 
            open={businessOpen} 
            onToggle={() => setBusinessOpen(!businessOpen)} 
          />
          <CollapsibleContent>
            <div className="p-4 pt-0 space-y-6">
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
                  <div className="space-y-2">
                    <Label>Financial Year Start</Label>
                    <Select value={financialYearStart} onValueChange={setFinancialYearStart} disabled={!isAdmin}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="january">January</SelectItem>
                        <SelectItem value="april">April</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Contact Information */}
                <div className="space-y-4">
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
                  <div className="space-y-2">
                    <Label htmlFor="address">
                      <MapPin className="w-4 h-4 inline mr-2" />
                      Address
                    </Label>
                    <Textarea
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      rows={3}
                      disabled={!isAdmin}
                      placeholder="Enter business address"
                    />
                  </div>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Invoice & Taxes */}
      <Collapsible open={invoiceOpen} onOpenChange={setInvoiceOpen}>
        <div className="metric-card p-0 overflow-hidden">
          <SectionHeader 
            icon={FileText} 
            title="Invoice & Taxes" 
            open={invoiceOpen} 
            onToggle={() => setInvoiceOpen(!invoiceOpen)} 
          />
          <CollapsibleContent>
            <div className="p-4 pt-0 space-y-6">
              {/* Invoice Numbering */}
              <div>
                <h4 className="font-medium mb-4">Invoice Numbering</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Invoice Prefix</Label>
                    <Input
                      value={invoicePrefix}
                      onChange={(e) => setInvoicePrefix(e.target.value)}
                      disabled={!isAdmin}
                      placeholder="INV-"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Purchase Prefix</Label>
                    <Input
                      value={purchasePrefix}
                      onChange={(e) => setPurchasePrefix(e.target.value)}
                      disabled={!isAdmin}
                      placeholder="PUR-"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Estimation Prefix</Label>
                    <Input
                      value={estimationPrefix}
                      onChange={(e) => setEstimationPrefix(e.target.value)}
                      disabled={!isAdmin}
                      placeholder="EST-"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Next Invoice #</Label>
                    <Input
                      type="number"
                      value={nextInvoiceNumber}
                      onChange={(e) => setNextInvoiceNumber(parseInt(e.target.value) || 1)}
                      disabled={!isAdmin}
                    />
                  </div>                  
                </div>
              </div>

              {/* Invoice Terms */}
              <div className="border-t pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Terms & Conditions</Label>
                    <Textarea
                      rows={3}
                      value={invoiceTerms}
                      onChange={(e) => setInvoiceTerms(e.target.value)}
                      placeholder="Enter default invoice terms..."
                      disabled={!isAdmin}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Default Payment Terms</Label>
                    <Select value={defaultPaymentTerms} onValueChange={setDefaultPaymentTerms} disabled={!isAdmin}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Due on Receipt</SelectItem>
                        <SelectItem value="7">Net 7 Days</SelectItem>
                        <SelectItem value="15">Net 15 Days</SelectItem>
                        <SelectItem value="30">Net 30 Days</SelectItem>
                        <SelectItem value="45">Net 45 Days</SelectItem>
                        <SelectItem value="60">Net 60 Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Tax Settings */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-4">Tax Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label>GST Registration Type</Label>
                    <Select value={gstRegistrationType} onValueChange={setGstRegistrationType} disabled={!isAdmin}>
                      <SelectTrigger>
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
                    <Label>State</Label>
                    <Select value={stateCode} onValueChange={setStateCode} disabled={!isAdmin}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-64">
                        {INDIAN_STATES.map((state) => (
                          <SelectItem key={state.code} value={state.code}>
                            {state.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Tax Rates */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">GST Receivable %</Label>
                      <Input
                        type="number"
                        value={gstReceivable}
                        onChange={(e) => setGstReceivable(Number(e.target.value))}
                        disabled={!isAdmin}
                        min={0}
                        max={100}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">GST Payable %</Label>
                      <Input
                        type="number"
                        value={gstPayable}
                        onChange={(e) => setGstPayable(Number(e.target.value))}
                        disabled={!isAdmin}
                        min={0}
                        max={100}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">TCS Receivable %</Label>
                      <Input
                        type="number"
                        value={tcsReceivable}
                        onChange={(e) => setTcsReceivable(Number(e.target.value))}
                        disabled={!isAdmin}
                        min={0}
                        max={100}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">TCS Payable %</Label>
                      <Input
                        type="number"
                        value={tcsPayable}
                        onChange={(e) => setTcsPayable(Number(e.target.value))}
                        disabled={!isAdmin}
                        min={0}
                        max={100}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">TDS Receivable %</Label>
                      <Input
                        type="number"
                        value={tdsReceivable}
                        onChange={(e) => setTdsReceivable(Number(e.target.value))}
                        disabled={!isAdmin}
                        min={0}
                        max={100}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">TDS Payable %</Label>
                      <Input
                        type="number"
                        value={tdsPayable}
                        onChange={(e) => setTdsPayable(Number(e.target.value))}
                        disabled={!isAdmin}
                        min={0}
                        max={100}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Print Settings */}
      <Collapsible open={printOpen} onOpenChange={setPrintOpen}>
        <div className="metric-card p-0 overflow-hidden">
          <SectionHeader 
            icon={Printer} 
            title="Print Settings" 
            open={printOpen} 
            onToggle={() => setPrintOpen(!printOpen)} 
          />
          <CollapsibleContent>
            <div className="p-4 pt-0 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Paper Size</Label>
                  <Select value={paperSize} onValueChange={setPaperSize} disabled={!isAdmin}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="a4">A4</SelectItem>
                      <SelectItem value="a5">A5</SelectItem>
                      <SelectItem value="letter">Letter</SelectItem>
                      <SelectItem value="thermal">Thermal (3 inch)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Invoice Template</Label>
                  <Select value={invoiceTemplate} onValueChange={setInvoiceTemplate} disabled={!isAdmin}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="modern">Modern</SelectItem>
                      <SelectItem value="classic">Classic</SelectItem>
                      <SelectItem value="minimal">Minimal</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Show Logo on Invoice</p>
                    <p className="text-sm text-muted-foreground">Display business logo on printed invoices</p>
                  </div>
                  <Switch checked={showLogoOnInvoice} onCheckedChange={setShowLogoOnInvoice} disabled={!isAdmin} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Show Bank Details</p>
                    <p className="text-sm text-muted-foreground">Print bank account details on invoices</p>
                  </div>
                  <Switch checked={showBankDetails} onCheckedChange={setShowBankDetails} disabled={!isAdmin} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Show QR Code</p>
                    <p className="text-sm text-muted-foreground">Display UPI QR code for payments</p>
                  </div>
                  <Switch checked={showQrCode} onCheckedChange={setShowQrCode} disabled={!isAdmin} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Auto Print on Save</p>
                    <p className="text-sm text-muted-foreground">Automatically open print dialog when saving</p>
                  </div>
                  <Switch checked={autoPrintOnSave} onCheckedChange={setAutoPrintOnSave} disabled={!isAdmin} />
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Alerts */}
      <Collapsible open={alertsOpen} onOpenChange={setAlertsOpen}>
        <div className="metric-card p-0 overflow-hidden">
          <SectionHeader 
            icon={Bell} 
            title="Alerts & Notifications" 
            open={alertsOpen} 
            onToggle={() => setAlertsOpen(!alertsOpen)} 
          />
          <CollapsibleContent>
            <div className="p-4 pt-0 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Payment Reminders</p>
                  <p className="text-sm text-muted-foreground">Send reminders for pending payments</p>
                </div>
                <Switch checked={paymentReminders} onCheckedChange={setPaymentReminders} disabled={!isAdmin} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Low Stock Alerts</p>
                  <p className="text-sm text-muted-foreground">Notify when items are running low</p>
                </div>
                <Switch checked={lowStockAlerts} onCheckedChange={setLowStockAlerts} disabled={!isAdmin} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Daily Summary</p>
                  <p className="text-sm text-muted-foreground">Receive daily business summary</p>
                </div>
                <Switch checked={dailySummary} onCheckedChange={setDailySummary} disabled={!isAdmin} />
              </div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Theme */}
      <Collapsible open={themeOpen} onOpenChange={setThemeOpen}>
        <div className="metric-card p-0 overflow-hidden">
          <SectionHeader 
            icon={Palette} 
            title="Theme & Appearance" 
            open={themeOpen} 
            onToggle={() => setThemeOpen(!themeOpen)} 
          />
          <CollapsibleContent>
            <div className="p-4 pt-0 space-y-6">
              {/* Theme Selection */}
              <div>
                <Label className="mb-3 block">Theme</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div 
                    className={`border rounded-lg p-4 text-center cursor-pointer transition-all ${theme === 'light' ? 'border-primary ring-2 ring-primary/20' : 'hover:border-primary'}`}
                    onClick={() => setTheme('light')}
                  >
                    <div className="w-full h-12 bg-white border rounded mb-2 flex items-center justify-center">
                      <Sun className="w-5 h-5 text-yellow-500" />
                    </div>
                    <p className="text-sm font-medium">Light</p>
                    {theme === 'light' && <Check className="w-4 h-4 text-primary mx-auto mt-1" />}
                  </div>
                  <div 
                    className={`border rounded-lg p-4 text-center cursor-pointer transition-all ${theme === 'dark' ? 'border-primary ring-2 ring-primary/20' : 'hover:border-primary'}`}
                    onClick={() => setTheme('dark')}
                  >
                    <div className="w-full h-12 bg-gray-900 rounded mb-2 flex items-center justify-center">
                      <Moon className="w-5 h-5 text-blue-400" />
                    </div>
                    <p className="text-sm font-medium">Dark</p>
                    {theme === 'dark' && <Check className="w-4 h-4 text-primary mx-auto mt-1" />}
                  </div>
                </div>
              </div>

              {/* Accent Color */}
              <div className="border-t pt-4">
                <Label className="mb-3 block">Accent Color</Label>
                <div className="flex gap-3">
                  {ACCENT_COLORS.map((color) => (
                    <button
                      key={color.value}
                      className={`w-10 h-10 rounded-full border-2 transition-all ${
                        accentColor === color.value ? 'border-foreground ring-2 ring-offset-2 ring-primary' : 'border-transparent hover:border-foreground/50'
                      }`}
                      style={{ backgroundColor: `hsl(${color.value})` }}
                      onClick={() => handleAccentColorChange(color.value)}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              {/* Display Options */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Compact Mode</p>
                    <p className="text-sm text-muted-foreground">Reduce spacing for more content</p>
                  </div>
                  <Switch checked={compactMode} onCheckedChange={handleCompactModeChange} />
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </div>
  );
}
