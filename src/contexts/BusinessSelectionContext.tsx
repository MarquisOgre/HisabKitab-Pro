import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Business {
  id: string;
  user_id: string;
  name: string;
  gstin: string | null;
  pan: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  logo_url: string | null;
  is_default: boolean | string;
  is_active: boolean | string;
  created_at: string;
  updated_at: string;
}

interface BusinessSelectionContextType {
  businesses: Business[];
  selectedBusiness: Business | null;
  loading: boolean;
  selectBusiness: (business: Business) => void;
  refetchBusinesses: () => Promise<void>;
  createBusiness: (data: Partial<Business>) => Promise<Business | null>;
  updateBusiness: (id: string, data: Partial<Business>) => Promise<boolean>;
  deleteBusiness: (id: string) => Promise<boolean>;
  maxBusinesses: number;
  canCreateBusiness: boolean;
  canManageBusinesses: boolean;
}

const BusinessSelectionContext = createContext<BusinessSelectionContextType | undefined>(undefined);

const SELECTED_BUSINESS_KEY = "hisabkitab_selected_business_id";

export function BusinessSelectionProvider({ children }: { children: ReactNode }) {
  const { user, isAdmin } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [maxBusinesses, setMaxBusinesses] = useState(1);

  const fetchBusinesses = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // First check if user is a child account
      const { data: userRole } = await supabase
        .from("user_roles")
        .select("parent_user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      const isChildAccount = !!userRole?.parent_user_id;
      const parentUserId = userRole?.parent_user_id;

      console.log("Business fetch - User:", user.email, "Is child:", isChildAccount, "Parent:", parentUserId);

      // Fetch businesses - RLS will handle which businesses user can see
      // For child accounts, businesses are linked via get_family_user_ids() in RLS
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('*')
        .eq('is_active', 'true')
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: true });

      if (businessError) throw businessError;

      console.log("Fetched businesses:", businessData?.length || 0);

      // Fetch max_businesses from license settings
      let maxBiz = 1;
      
      // First try user's own license
      const { data: ownLicense } = await supabase
        .from('license_settings')
        .select('max_businesses')
        .eq('user_email', user.email)
        .maybeSingle();

      if (ownLicense?.max_businesses) {
        maxBiz = ownLicense.max_businesses;
      } else if (parentUserId) {
        // Child account - get parent's license limits
        const { data: parentProfile } = await supabase
          .from("profiles")
          .select("email")
          .eq("user_id", parentUserId)
          .maybeSingle();

        if (parentProfile?.email) {
          const { data: parentLicense } = await supabase
            .from("license_settings")
            .select("max_businesses")
            .eq("user_email", parentProfile.email)
            .maybeSingle();

          if (parentLicense?.max_businesses) {
            maxBiz = parentLicense.max_businesses;
          }
        }
      }

      setMaxBusinesses(maxBiz);

      const fetchedBusinesses = (businessData || []) as Business[];
      setBusinesses(fetchedBusinesses);

      // Restore selected business from localStorage or select default
      const savedBusinessId = localStorage.getItem(SELECTED_BUSINESS_KEY);
      let businessToSelect = fetchedBusinesses.find(b => b.id === savedBusinessId);
      
      if (!businessToSelect) {
        businessToSelect = fetchedBusinesses.find(b => b.is_default) || fetchedBusinesses[0];
      }

      if (businessToSelect) {
        setSelectedBusiness(businessToSelect);
        localStorage.setItem(SELECTED_BUSINESS_KEY, businessToSelect.id);
      }
    } catch (error) {
      console.error('Error fetching businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, [user]);

  const selectBusiness = (business: Business) => {
    setSelectedBusiness(business);
    localStorage.setItem(SELECTED_BUSINESS_KEY, business.id);
    toast.success(`Switched to ${business.name}`);
  };

  const createBusiness = async (data: Partial<Business>): Promise<Business | null> => {
    if (!user) return null;
    if (!isAdmin) {
      toast.error("Only admins can create businesses");
      return null;
    }

    try {
      const isFirstBusiness = businesses.length === 0;
      
      const { data: newBusiness, error } = await supabase
        .from('businesses')
        .insert({
          user_id: user.id,
          name: data.name || 'New Business',
          gstin: data.gstin,
          pan: data.pan,
          email: data.email,
          phone: data.phone,
          address: data.address,
          logo_url: data.logo_url,
          is_default: isFirstBusiness ? 'true' : 'false',
          is_active: 'true',
        })
        .select()
        .single();

      if (error) throw error;

      const createdBusiness = newBusiness as Business;
      setBusinesses(prev => [...prev, createdBusiness]);
      
      if (isFirstBusiness) {
        setSelectedBusiness(createdBusiness);
        localStorage.setItem(SELECTED_BUSINESS_KEY, createdBusiness.id);
      }

      toast.success(`Business "${createdBusiness.name}" created successfully`);
      return createdBusiness;
    } catch (error: any) {
      console.error('Error creating business:', error);
      toast.error(error.message || 'Failed to create business');
      return null;
    }
  };

  const updateBusiness = async (id: string, data: Partial<Business>): Promise<boolean> => {
    if (!isAdmin) {
      toast.error("Only admins can update businesses");
      return false;
    }
    try {
      const { error } = await supabase
        .from('businesses')
        .update(data)
        .eq('id', id);

      if (error) throw error;

      setBusinesses(prev => 
        prev.map(b => b.id === id ? { ...b, ...data } : b)
      );

      if (selectedBusiness?.id === id) {
        setSelectedBusiness(prev => prev ? { ...prev, ...data } : null);
      }

      toast.success('Business updated successfully');
      return true;
    } catch (error: any) {
      console.error('Error updating business:', error);
      toast.error(error.message || 'Failed to update business');
      return false;
    }
  };

  const deleteBusiness = async (id: string): Promise<boolean> => {
    if (!isAdmin) {
      toast.error("Only admins can delete businesses");
      return false;
    }
    try {
      const { error } = await supabase
        .from('businesses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      const updatedBusinesses = businesses.filter(b => b.id !== id);
      setBusinesses(updatedBusinesses);

      if (selectedBusiness?.id === id) {
        const newSelected = updatedBusinesses.find(b => b.is_default) || updatedBusinesses[0] || null;
        setSelectedBusiness(newSelected);
        if (newSelected) {
          localStorage.setItem(SELECTED_BUSINESS_KEY, newSelected.id);
        } else {
          localStorage.removeItem(SELECTED_BUSINESS_KEY);
        }
      }

      toast.success('Business deleted successfully');
      return true;
    } catch (error: any) {
      console.error('Error deleting business:', error);
      toast.error(error.message || 'Failed to delete business');
      return false;
    }
  };

  const canCreateBusiness = businesses.length < maxBusinesses && isAdmin;
  const canManageBusinesses = isAdmin;

  return (
    <BusinessSelectionContext.Provider 
      value={{ 
        businesses, 
        selectedBusiness, 
        loading, 
        selectBusiness, 
        refetchBusinesses: fetchBusinesses,
        createBusiness,
        updateBusiness,
        deleteBusiness,
        maxBusinesses,
        canCreateBusiness,
        canManageBusinesses
      }}
    >
      {children}
    </BusinessSelectionContext.Provider>
  );
}

export function useBusinessSelection() {
  const context = useContext(BusinessSelectionContext);
  if (context === undefined) {
    throw new Error('useBusinessSelection must be used within a BusinessSelectionProvider');
  }
  return context;
}
