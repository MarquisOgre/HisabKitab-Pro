import React, { useState, useEffect, useCallback } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { BusinessProvider } from "@/contexts/BusinessContext";
import { BusinessSelectionProvider } from "@/contexts/BusinessSelectionContext";
import { supabase } from "@/integrations/supabase/client";
import { MFAVerification } from "@/components/MFAVerification";
import { isSuperAdminEmail } from "@/lib/superadmin";

import { ThemeProvider } from "next-themes";
import { Loader2 } from "lucide-react";

// Pages
import Auth from "./pages/Auth";
import Landing from "./pages/Landing";
import Signup from "./pages/Signup";
import Checkout from "./pages/Checkout";
import PaymentPending from "./pages/PaymentPending";
import Dashboard from "./pages/Dashboard";
import PartiesList from "./pages/parties/PartiesList";
import AddParty from "./pages/parties/AddParty";
import EditParty from "./pages/parties/EditParty";
import ViewParty from "./pages/parties/ViewParty";
import PartyTransactions from "./pages/parties/PartyTransactions";
import ItemsList from "./pages/items/ItemsList";
import AddItem from "./pages/items/AddItem";
import EditItem from "./pages/items/EditItem";
import Categories from "./pages/items/Categories";

import SaleInvoices from "./pages/sale/SaleInvoices";
import CreateSaleInvoice from "./pages/sale/CreateSaleInvoice";
import ViewSaleInvoice from "./pages/sale/ViewSaleInvoice";
import EditSaleInvoice from "./pages/sale/EditSaleInvoice";
import PaymentInList from "./pages/sale/PaymentInList";
import PaymentIn from "./pages/sale/PaymentIn";
import ViewPaymentIn from "./pages/sale/ViewPaymentIn";
import DeliveryChallanList from "./pages/sale/DeliveryChallanList";
import CreateDeliveryChallan from "./pages/sale/CreateDeliveryChallan";
import PurchaseBills from "./pages/purchase/PurchaseBills";
import CreatePurchaseBill from "./pages/purchase/CreatePurchaseBill";
import ViewPurchaseInvoice from "./pages/purchase/ViewPurchaseInvoice";
import EditPurchaseInvoice from "./pages/purchase/EditPurchaseInvoice";
import PaymentOutList from "./pages/purchase/PaymentOutList";
import PaymentOut from "./pages/purchase/PaymentOut";
import ViewPaymentOut from "./pages/purchase/ViewPaymentOut";
import ExpensesList from "./pages/purchase/ExpensesList";
import CreateExpense from "./pages/purchase/CreateExpense";
import ViewExpense from "./pages/purchase/ViewExpense";
import EditExpense from "./pages/purchase/EditExpense";
import BankAccounts from "./pages/cash-bank/BankAccounts";
import CashInHand from "./pages/cash-bank/CashInHand";
// Reports
import SaleReport from "./pages/reports/SaleReport";
import PurchaseReport from "./pages/reports/PurchaseReport";
import ProfitLoss from "./pages/reports/ProfitLoss";
import BillWisePnL from "./pages/reports/BillWisePnL";
import BalanceSheet from "./pages/reports/BalanceSheet";
import StockReport from "./pages/reports/StockReport";
import TaxesReport from "./pages/reports/TaxesReport";
import ItemWisePnL from "./pages/reports/ItemWisePnL";
import ExpenseReport from "./pages/reports/ExpenseReport";
// Backup
import SyncShare from "./pages/backup/SyncShare";
import AutoBackup from "./pages/backup/AutoBackup";
import BackupToComputer from "./pages/backup/BackupToComputer";
import RestoreBackup from "./pages/backup/RestoreBackup";
// Utilities
import ImportItems from "./pages/utilities/ImportItems";
import BulkUpdate from "./pages/utilities/BulkUpdate";
import RecycleBin from "./pages/utilities/RecycleBin";
import ResetDatabase from "./pages/utilities/ResetDatabase";
// Settings
import Settings from "./pages/settings/Settings";
import BusinessSettings from "./pages/settings/BusinessSettings";
import NotFound from "./pages/NotFound";
// Onboarding
import BusinessOnboarding from "./pages/onboarding/BusinessOnboarding";
import { useBusinessSelection } from "@/contexts/BusinessSelectionContext";

const queryClient = new QueryClient();

// Protected Route wrapper with business check and MFA verification
function ProtectedRoute({ children, requireBusiness = true, skipLayout = false }: { children: React.ReactNode; requireBusiness?: boolean; skipLayout?: boolean }) {
  const { user, loading: authLoading, role, signOut } = useAuth();
  const { businesses, loading: businessLoading } = useBusinessSelection();
  const [isChildAccount, setIsChildAccount] = React.useState<boolean | null>(null);
  const [checkingChildStatus, setCheckingChildStatus] = React.useState(true);
  
  // MFA state
  const [checkingMFA, setCheckingMFA] = useState(false);
  const [requiresMFA, setRequiresMFA] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaChecked, setMfaChecked] = useState(false);

  // Check MFA requirement
  const checkMFARequirement = useCallback(async () => {
    if (!user || mfaChecked) return;
    
    setCheckingMFA(true);
    try {
      const { data: aalData, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      
      if (aalError) {
        console.error("Error checking AAL:", aalError);
        setMfaChecked(true);
        return;
      }

      console.log("AAL Data:", aalData);

      // If user has enrolled factors but current level is aal1, they need to verify 2FA
      if (aalData.currentLevel === 'aal1' && aalData.nextLevel === 'aal2') {
        const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
        
        if (factorsError) {
          console.error("Error listing factors:", factorsError);
          setMfaChecked(true);
          return;
        }

        console.log("MFA Factors:", factorsData);

        const totpFactor = factorsData.totp.find(f => f.status === 'verified');
        
        if (totpFactor) {
          console.log("2FA required, factor ID:", totpFactor.id);
          setMfaFactorId(totpFactor.id);
          setRequiresMFA(true);
        }
      }
    } catch (error) {
      console.error("Error in MFA check:", error);
    } finally {
      setCheckingMFA(false);
      setMfaChecked(true);
    }
  }, [user, mfaChecked]);

  // Check MFA when user is available
  useEffect(() => {
    if (user && !mfaChecked) {
      checkMFARequirement();
    }
  }, [user, mfaChecked, checkMFARequirement]);

  // Check if user is a child account
  React.useEffect(() => {
    const checkChildStatus = async () => {
      if (!user) {
        setCheckingChildStatus(false);
        return;
      }

      try {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("parent_user_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (roleData?.parent_user_id) {
          setIsChildAccount(true);
        } else {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("parent_user_id")
            .eq("user_id", user.id)
            .maybeSingle();
          
          setIsChildAccount(!!profileData?.parent_user_id);
        }
      } catch (error) {
        console.error("Error checking child status:", error);
        setIsChildAccount(false);
      } finally {
        setCheckingChildStatus(false);
      }
    };

    checkChildStatus();
  }, [user]);

  // Handle MFA verification success
  const handleMFASuccess = () => {
    setRequiresMFA(false);
    setMfaFactorId(null);
  };

  // Handle MFA cancel (sign out)
  const handleMFACancel = async () => {
    await signOut();
    setRequiresMFA(false);
    setMfaFactorId(null);
    setMfaChecked(false);
  };

  if (authLoading || businessLoading || checkingChildStatus || checkingMFA) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          {checkingMFA && <p className="text-sm text-muted-foreground">Checking security settings...</p>}
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Show MFA verification screen if required
  if (requiresMFA && mfaFactorId) {
    return (
      <MFAVerification 
        factorId={mfaFactorId} 
        onSuccess={handleMFASuccess} 
        onCancel={handleMFACancel} 
      />
    );
  }

  // Redirect to onboarding if no business exists and business is required
  // BUT skip this for child accounts and SuperAdmins
  const isSuperAdmin = isSuperAdminEmail(user?.email);
  if (requireBusiness && businesses.length === 0 && !isChildAccount && !isSuperAdmin) {
    return <Navigate to="/onboarding/business" replace />;
  }

  // Skip layout for onboarding pages
  if (skipLayout) {
    return <>{children}</>;
  }

  return <AppLayout>{children}</AppLayout>;
}

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/payment-pending" element={<PaymentPending />} />
      <Route path="/onboarding/business" element={<ProtectedRoute requireBusiness={false} skipLayout={true}><BusinessOnboarding /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      {/* Parties */}
      <Route path="/parties" element={<ProtectedRoute><PartiesList /></ProtectedRoute>} />
      <Route path="/parties/add" element={<ProtectedRoute><AddParty /></ProtectedRoute>} />
      <Route path="/parties/edit/:id" element={<ProtectedRoute><EditParty /></ProtectedRoute>} />
      <Route path="/parties/:id" element={<ProtectedRoute><ViewParty /></ProtectedRoute>} />
      <Route path="/parties/:id/transactions" element={<ProtectedRoute><PartyTransactions /></ProtectedRoute>} />
      {/* Items */}
      <Route path="/items" element={<ProtectedRoute><ItemsList /></ProtectedRoute>} />
      <Route path="/items/add" element={<ProtectedRoute><AddItem /></ProtectedRoute>} />
      <Route path="/items/edit/:id" element={<ProtectedRoute><EditItem /></ProtectedRoute>} />
      <Route path="/items/categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
      {/* Sale */}
      <Route path="/sale/invoices" element={<ProtectedRoute><SaleInvoices /></ProtectedRoute>} />
      <Route path="/sale/invoices/new" element={<ProtectedRoute><CreateSaleInvoice /></ProtectedRoute>} />
      <Route path="/sale/invoices/:id" element={<ProtectedRoute><ViewSaleInvoice /></ProtectedRoute>} />
      <Route path="/sale/invoices/:id/edit" element={<ProtectedRoute><EditSaleInvoice /></ProtectedRoute>} />
      <Route path="/sale/payment-in" element={<ProtectedRoute><PaymentInList /></ProtectedRoute>} />
      <Route path="/sale/payment-in/new" element={<ProtectedRoute><PaymentIn /></ProtectedRoute>} />
      <Route path="/sale/payment-in/:id" element={<ProtectedRoute><ViewPaymentIn /></ProtectedRoute>} />
      <Route path="/sale/dc" element={<ProtectedRoute><DeliveryChallanList /></ProtectedRoute>} />
      <Route path="/sale/dc/new" element={<ProtectedRoute><CreateDeliveryChallan /></ProtectedRoute>} />
      {/* Purchase */}
      <Route path="/purchase/bills" element={<ProtectedRoute><PurchaseBills /></ProtectedRoute>} />
      <Route path="/purchase/bills/new" element={<ProtectedRoute><CreatePurchaseBill /></ProtectedRoute>} />
      <Route path="/purchase/bills/:id" element={<ProtectedRoute><ViewPurchaseInvoice /></ProtectedRoute>} />
      <Route path="/purchase/bills/:id/edit" element={<ProtectedRoute><EditPurchaseInvoice /></ProtectedRoute>} />
      <Route path="/purchase/payment-out" element={<ProtectedRoute><PaymentOutList /></ProtectedRoute>} />
      <Route path="/purchase/payment-out/new" element={<ProtectedRoute><PaymentOut /></ProtectedRoute>} />
      <Route path="/purchase/payment-out/:id" element={<ProtectedRoute><ViewPaymentOut /></ProtectedRoute>} />
      <Route path="/purchase/expenses" element={<ProtectedRoute><ExpensesList /></ProtectedRoute>} />
      <Route path="/purchase/expenses/new" element={<ProtectedRoute><CreateExpense /></ProtectedRoute>} />
      <Route path="/purchase/expenses/:id" element={<ProtectedRoute><ViewExpense /></ProtectedRoute>} />
      <Route path="/purchase/expenses/:id/edit" element={<ProtectedRoute><EditExpense /></ProtectedRoute>} />
      {/* Cash & Bank */}
      <Route path="/cash-bank/accounts" element={<ProtectedRoute><BankAccounts /></ProtectedRoute>} />
      <Route path="/cash-bank/cash" element={<ProtectedRoute><CashInHand /></ProtectedRoute>} />
      {/* Reports */}
      <Route path="/reports/sale" element={<ProtectedRoute><SaleReport /></ProtectedRoute>} />
      <Route path="/reports/purchase" element={<ProtectedRoute><PurchaseReport /></ProtectedRoute>} />
      <Route path="/reports/pnl" element={<ProtectedRoute><ProfitLoss /></ProtectedRoute>} />
      <Route path="/reports/bill-wise-pnl" element={<ProtectedRoute><BillWisePnL /></ProtectedRoute>} />
      <Route path="/reports/balance-sheet" element={<ProtectedRoute><BalanceSheet /></ProtectedRoute>} />
      <Route path="/reports/stock" element={<ProtectedRoute><StockReport /></ProtectedRoute>} />
      <Route path="/reports/item-wise-pnl" element={<ProtectedRoute><ItemWisePnL /></ProtectedRoute>} />
      <Route path="/reports/taxes" element={<ProtectedRoute><TaxesReport /></ProtectedRoute>} />
      <Route path="/reports/expense" element={<ProtectedRoute><ExpenseReport /></ProtectedRoute>} />
      {/* Backup */}
      <Route path="/backup/sync" element={<ProtectedRoute><SyncShare /></ProtectedRoute>} />
      <Route path="/backup/auto" element={<ProtectedRoute><AutoBackup /></ProtectedRoute>} />
      <Route path="/backup/download" element={<ProtectedRoute><BackupToComputer /></ProtectedRoute>} />
      <Route path="/backup/restore" element={<ProtectedRoute><RestoreBackup /></ProtectedRoute>} />
      {/* Utilities */}
      <Route path="/utilities/import" element={<ProtectedRoute><ImportItems /></ProtectedRoute>} />
      <Route path="/utilities/bulk-update" element={<ProtectedRoute><BulkUpdate /></ProtectedRoute>} />
      <Route path="/utilities/recycle-bin" element={<ProtectedRoute><RecycleBin /></ProtectedRoute>} />
      <Route path="/utilities/reset" element={<ProtectedRoute><ResetDatabase /></ProtectedRoute>} />
      {/* Settings */}
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/settings/business" element={<ProtectedRoute><BusinessSettings /></ProtectedRoute>} />
      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" disableTransitionOnChange>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <BusinessProvider>
              <BusinessSelectionProvider>
                <AppRoutes />
              </BusinessSelectionProvider>
            </BusinessProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
