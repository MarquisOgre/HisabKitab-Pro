import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface BusinessSettings {
  business_name: string | null;
  gstin: string | null;
  pan: string | null;
  email: string | null;
  phone: string | null;
  business_address: string | null;
  invoice_prefix: string | null;
  invoice_terms: string | null;
  logo_url: string | null;
  financial_year_start: string | null;
  next_invoice_number: number | null;
  estimation_prefix: string | null;
  purchase_prefix: string | null;
  default_payment_terms: number | null;
  gst_registration_type: string | null;
  state_code: string | null;
  gst_receivable: number | null;
  gst_payable: number | null;
  tcs_receivable: number | null;
  tcs_payable: number | null;
  tds_receivable: number | null;
  tds_payable: number | null;
}

interface BusinessContextType {
  businessSettings: BusinessSettings | null;
  loading: boolean;
  refetch: () => Promise<void>;
  getCurrentFinancialYear: () => string;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export function BusinessProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // First try to get the user's own settings
      let { data, error } = await supabase
        .from('business_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      // If no settings found for this user, get the first available settings (shared business)
      if (!data) {
        const { data: sharedData, error: sharedError } = await supabase
          .from('business_settings')
          .select('*')
          .limit(1)
          .maybeSingle();
        
        if (!sharedError && sharedData) {
          data = sharedData;
        }
      }

      if (error) {
        console.error('Error fetching business settings:', error);
      }

      if (data) {
        let finalData = data as BusinessSettings;
        
        // If business_name is not set in business_settings, try to get it from businesses table
        if (!finalData.business_name && data.business_id) {
          const { data: businessData } = await supabase
            .from('businesses')
            .select('name, address, phone, email, gstin')
            .eq('id', data.business_id)
            .maybeSingle();
          
          if (businessData) {
            finalData = {
              ...finalData,
              business_name: businessData.name || finalData.business_name,
              business_address: businessData.address || finalData.business_address,
              phone: businessData.phone || finalData.phone,
              email: businessData.email || finalData.email,
              gstin: businessData.gstin || finalData.gstin,
            };
          }
        }
        
        setBusinessSettings(finalData);
      }
    } catch (error) {
      console.error('Error fetching business settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [user]);

  const refetch = async () => {
    await fetchSettings();
  };

  const getCurrentFinancialYear = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const fyStart = businessSettings?.financial_year_start || 'april';
    
    if (fyStart === 'april') {
      if (month >= 3) { // April onwards (0-indexed, so 3 = April)
        return `${year}-${(year + 1).toString().slice(-2)}`;
      } else {
        return `${year - 1}-${year.toString().slice(-2)}`;
      }
    } else {
      // January start - calendar year
      return `${year}`;
    }
  };

  return (
    <BusinessContext.Provider value={{ businessSettings, loading, refetch, getCurrentFinancialYear }}>
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusinessSettings() {
  const context = useContext(BusinessContext);
  if (context === undefined) {
    throw new Error('useBusinessSettings must be used within a BusinessProvider');
  }
  return context;
}
