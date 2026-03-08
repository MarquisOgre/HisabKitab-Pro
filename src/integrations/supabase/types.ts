export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      active_sessions: {
        Row: {
          created_at: string | null
          device_info: string | null
          id: string | null
          ip_address: string | null
          last_activity: string | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          device_info?: string | null
          id?: string | null
          ip_address?: string | null
          last_activity?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          device_info?: string | null
          id?: string | null
          ip_address?: string | null
          last_activity?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      backup_settings: {
        Row: {
          auto_backup_enabled: string | null
          backup_time: string | null
          created_at: string | null
          frequency: string | null
          id: string | null
          retention_days: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          auto_backup_enabled?: string | null
          backup_time?: string | null
          created_at?: string | null
          frequency?: string | null
          id?: string | null
          retention_days?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          auto_backup_enabled?: string | null
          backup_time?: string | null
          created_at?: string | null
          frequency?: string | null
          id?: string | null
          retention_days?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      backups: {
        Row: {
          backup_date: string | null
          backup_name: string | null
          backup_type: string | null
          created_at: string | null
          file_size: string | null
          id: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          backup_date?: string | null
          backup_name?: string | null
          backup_type?: string | null
          created_at?: string | null
          file_size?: string | null
          id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          backup_date?: string | null
          backup_name?: string | null
          backup_type?: string | null
          created_at?: string | null
          file_size?: string | null
          id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      bank_accounts: {
        Row: {
          account_name: string | null
          account_number: string | null
          bank_name: string | null
          business_id: string | null
          created_at: string | null
          current_balance: string | null
          id: string | null
          ifsc_code: string | null
          is_primary: string | null
          opening_balance: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          account_name?: string | null
          account_number?: string | null
          bank_name?: string | null
          business_id?: string | null
          created_at?: string | null
          current_balance?: string | null
          id?: string | null
          ifsc_code?: string | null
          is_primary?: string | null
          opening_balance?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          account_name?: string | null
          account_number?: string | null
          bank_name?: string | null
          business_id?: string | null
          created_at?: string | null
          current_balance?: string | null
          id?: string | null
          ifsc_code?: string | null
          is_primary?: string | null
          opening_balance?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      bank_transactions: {
        Row: {
          amount: string | null
          bank_account_id: string | null
          business_id: string | null
          created_at: string | null
          description: string | null
          id: string | null
          reference_id: string | null
          reference_type: string | null
          transaction_date: string | null
          transaction_type: string | null
          user_id: string | null
        }
        Insert: {
          amount?: string | null
          bank_account_id?: string | null
          business_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          reference_id?: string | null
          reference_type?: string | null
          transaction_date?: string | null
          transaction_type?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: string | null
          bank_account_id?: string | null
          business_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          reference_id?: string | null
          reference_type?: string | null
          transaction_date?: string | null
          transaction_type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      business_settings: {
        Row: {
          auto_print_on_save: string | null
          business_address: string | null
          business_id: string | null
          business_name: string | null
          created_at: string | null
          default_payment_terms: string | null
          email: string | null
          estimation_prefix: string | null
          financial_year_start: string | null
          global_logo_url: string | null
          gst_payable: string | null
          gst_receivable: string | null
          gst_registration_type: string | null
          gstin: string | null
          id: string | null
          invoice_prefix: string | null
          invoice_template: string | null
          invoice_terms: string | null
          logo_url: string | null
          next_invoice_number: string | null
          pan: string | null
          paper_size: string | null
          phone: string | null
          purchase_prefix: string | null
          show_bank_details: string | null
          show_logo_on_invoice: string | null
          show_qr_code: string | null
          state_code: string | null
          tcs_payable: string | null
          tcs_receivable: string | null
          tds_payable: string | null
          tds_receivable: string | null
          updated_at: string | null
          use_global_logo: string | null
          user_id: string | null
        }
        Insert: {
          auto_print_on_save?: string | null
          business_address?: string | null
          business_id?: string | null
          business_name?: string | null
          created_at?: string | null
          default_payment_terms?: string | null
          email?: string | null
          estimation_prefix?: string | null
          financial_year_start?: string | null
          global_logo_url?: string | null
          gst_payable?: string | null
          gst_receivable?: string | null
          gst_registration_type?: string | null
          gstin?: string | null
          id?: string | null
          invoice_prefix?: string | null
          invoice_template?: string | null
          invoice_terms?: string | null
          logo_url?: string | null
          next_invoice_number?: string | null
          pan?: string | null
          paper_size?: string | null
          phone?: string | null
          purchase_prefix?: string | null
          show_bank_details?: string | null
          show_logo_on_invoice?: string | null
          show_qr_code?: string | null
          state_code?: string | null
          tcs_payable?: string | null
          tcs_receivable?: string | null
          tds_payable?: string | null
          tds_receivable?: string | null
          updated_at?: string | null
          use_global_logo?: string | null
          user_id?: string | null
        }
        Update: {
          auto_print_on_save?: string | null
          business_address?: string | null
          business_id?: string | null
          business_name?: string | null
          created_at?: string | null
          default_payment_terms?: string | null
          email?: string | null
          estimation_prefix?: string | null
          financial_year_start?: string | null
          global_logo_url?: string | null
          gst_payable?: string | null
          gst_receivable?: string | null
          gst_registration_type?: string | null
          gstin?: string | null
          id?: string | null
          invoice_prefix?: string | null
          invoice_template?: string | null
          invoice_terms?: string | null
          logo_url?: string | null
          next_invoice_number?: string | null
          pan?: string | null
          paper_size?: string | null
          phone?: string | null
          purchase_prefix?: string | null
          show_bank_details?: string | null
          show_logo_on_invoice?: string | null
          show_qr_code?: string | null
          state_code?: string | null
          tcs_payable?: string | null
          tcs_receivable?: string | null
          tds_payable?: string | null
          tds_receivable?: string | null
          updated_at?: string | null
          use_global_logo?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      businesses: {
        Row: {
          address: string | null
          created_at: string | null
          email: string | null
          gstin: string | null
          id: string | null
          is_active: string | null
          is_default: string | null
          logo_url: string | null
          name: string | null
          pan: string | null
          phone: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          gstin?: string | null
          id?: string | null
          is_active?: string | null
          is_default?: string | null
          logo_url?: string | null
          name?: string | null
          pan?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          gstin?: string | null
          id?: string | null
          is_active?: string | null
          is_default?: string | null
          logo_url?: string | null
          name?: string | null
          pan?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      cash_transactions: {
        Row: {
          amount: string | null
          business_id: string | null
          created_at: string | null
          description: string | null
          id: string | null
          reference_id: string | null
          reference_type: string | null
          transaction_date: string | null
          transaction_type: string | null
          user_id: string | null
        }
        Insert: {
          amount?: string | null
          business_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          reference_id?: string | null
          reference_type?: string | null
          transaction_date?: string | null
          transaction_type?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: string | null
          business_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          reference_id?: string | null
          reference_type?: string | null
          transaction_date?: string | null
          transaction_type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          business_id: string | null
          created_at: string | null
          description: string | null
          id: string | null
          name: string | null
          user_id: string | null
        }
        Insert: {
          business_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          name?: string | null
          user_id?: string | null
        }
        Update: {
          business_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          created_at: string | null
          email: string | null
          id: string | null
          is_read: string | null
          message: string | null
          name: string | null
          phone: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_read?: string | null
          message?: string | null
          name?: string | null
          phone?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_read?: string | null
          message?: string | null
          name?: string | null
          phone?: string | null
        }
        Relationships: []
      }
      email_settings: {
        Row: {
          created_at: string | null
          from_email: string | null
          from_name: string | null
          id: string | null
          is_active: boolean | null
          provider: string | null
          resend_api_key: string | null
          superadmin_email: string | null
          updated_at: string | null
          zoho_email: string | null
          zoho_password: string | null
          zoho_smtp_host: string | null
          zoho_smtp_port: number | null
        }
        Insert: {
          created_at?: string | null
          from_email?: string | null
          from_name?: string | null
          id?: string | null
          is_active?: boolean | null
          provider?: string | null
          resend_api_key?: string | null
          superadmin_email?: string | null
          updated_at?: string | null
          zoho_email?: string | null
          zoho_password?: string | null
          zoho_smtp_host?: string | null
          zoho_smtp_port?: number | null
        }
        Update: {
          created_at?: string | null
          from_email?: string | null
          from_name?: string | null
          id?: string | null
          is_active?: boolean | null
          provider?: string | null
          resend_api_key?: string | null
          superadmin_email?: string | null
          updated_at?: string | null
          zoho_email?: string | null
          zoho_password?: string | null
          zoho_smtp_host?: string | null
          zoho_smtp_port?: number | null
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: string | null
          business_id: string | null
          category: string | null
          created_at: string | null
          expense_date: string | null
          expense_number: string | null
          id: string | null
          notes: string | null
          payment_mode: string | null
          reference_number: string | null
          user_id: string | null
        }
        Insert: {
          amount?: string | null
          business_id?: string | null
          category?: string | null
          created_at?: string | null
          expense_date?: string | null
          expense_number?: string | null
          id?: string | null
          notes?: string | null
          payment_mode?: string | null
          reference_number?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: string | null
          business_id?: string | null
          category?: string | null
          created_at?: string | null
          expense_date?: string | null
          expense_number?: string | null
          id?: string | null
          notes?: string | null
          payment_mode?: string | null
          reference_number?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      items: {
        Row: {
          business_id: string | null
          category_id: string | null
          created_at: string | null
          current_stock: string | null
          deleted_at: string | null
          hsn_code: string | null
          id: string | null
          is_deleted: string | null
          low_stock_alert: string | null
          name: string | null
          opening_stock: string | null
          purchase_price: string | null
          sale_price: string | null
          unit: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          business_id?: string | null
          category_id?: string | null
          created_at?: string | null
          current_stock?: string | null
          deleted_at?: string | null
          hsn_code?: string | null
          id?: string | null
          is_deleted?: string | null
          low_stock_alert?: string | null
          name?: string | null
          opening_stock?: string | null
          purchase_price?: string | null
          sale_price?: string | null
          unit?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          business_id?: string | null
          category_id?: string | null
          created_at?: string | null
          current_stock?: string | null
          deleted_at?: string | null
          hsn_code?: string | null
          id?: string | null
          is_deleted?: string | null
          low_stock_alert?: string | null
          name?: string | null
          opening_stock?: string | null
          purchase_price?: string | null
          sale_price?: string | null
          unit?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      license_plans: {
        Row: {
          created_at: string | null
          description: string | null
          duration_days: number | null
          id: string | null
          is_active: boolean | null
          plan_name: string | null
          price: number | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          duration_days?: number | null
          id?: string | null
          is_active?: boolean | null
          plan_name?: string | null
          price?: number | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          duration_days?: number | null
          id?: string | null
          is_active?: boolean | null
          plan_name?: string | null
          price?: number | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      license_settings: {
        Row: {
          created_at: string | null
          expiry_date: string | null
          id: string | null
          license_type: string | null
          licensed_to: string | null
          max_businesses: number | null
          max_simultaneous_logins: number | null
          max_users: number | null
          support_email: string | null
          support_phone: string | null
          support_whatsapp: string | null
          updated_at: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          expiry_date?: string | null
          id?: string | null
          license_type?: string | null
          licensed_to?: string | null
          max_businesses?: number | null
          max_simultaneous_logins?: number | null
          max_users?: number | null
          support_email?: string | null
          support_phone?: string | null
          support_whatsapp?: string | null
          updated_at?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          expiry_date?: string | null
          id?: string | null
          license_type?: string | null
          licensed_to?: string | null
          max_businesses?: number | null
          max_simultaneous_logins?: number | null
          max_users?: number | null
          support_email?: string | null
          support_phone?: string | null
          support_whatsapp?: string | null
          updated_at?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string | null
          is_read: string | null
          message: string | null
          title: string | null
          type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          is_read?: string | null
          message?: string | null
          title?: string | null
          type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          is_read?: string | null
          message?: string | null
          title?: string | null
          type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      parties: {
        Row: {
          billing_address: string | null
          business_id: string | null
          created_at: string | null
          credit_limit: string | null
          email: string | null
          gstin: string | null
          id: string | null
          name: string | null
          opening_balance: string | null
          party_type: string | null
          phone: string | null
          shipping_address: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          billing_address?: string | null
          business_id?: string | null
          created_at?: string | null
          credit_limit?: string | null
          email?: string | null
          gstin?: string | null
          id?: string | null
          name?: string | null
          opening_balance?: string | null
          party_type?: string | null
          phone?: string | null
          shipping_address?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          billing_address?: string | null
          business_id?: string | null
          created_at?: string | null
          credit_limit?: string | null
          email?: string | null
          gstin?: string | null
          id?: string | null
          name?: string | null
          opening_balance?: string | null
          party_type?: string | null
          phone?: string | null
          shipping_address?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      payment_settings: {
        Row: {
          bank_account_holder: string | null
          bank_account_number: string | null
          bank_ifsc: string | null
          bank_name: string | null
          created_at: string | null
          id: string | null
          razorpay_enabled: string | null
          razorpay_key_id: string | null
          razorpay_key_secret: string | null
          updated_at: string | null
          upi_id: string | null
          upi_name: string | null
        }
        Insert: {
          bank_account_holder?: string | null
          bank_account_number?: string | null
          bank_ifsc?: string | null
          bank_name?: string | null
          created_at?: string | null
          id?: string | null
          razorpay_enabled?: string | null
          razorpay_key_id?: string | null
          razorpay_key_secret?: string | null
          updated_at?: string | null
          upi_id?: string | null
          upi_name?: string | null
        }
        Update: {
          bank_account_holder?: string | null
          bank_account_number?: string | null
          bank_ifsc?: string | null
          bank_name?: string | null
          created_at?: string | null
          id?: string | null
          razorpay_enabled?: string | null
          razorpay_key_id?: string | null
          razorpay_key_secret?: string | null
          updated_at?: string | null
          upi_id?: string | null
          upi_name?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: string | null
          business_id: string | null
          created_at: string | null
          id: string | null
          notes: string | null
          party_id: string | null
          payment_date: string | null
          payment_mode: string | null
          payment_number: string | null
          payment_type: string | null
          purchase_invoice_id: string | null
          reference_number: string | null
          sale_invoice_id: string | null
          user_id: string | null
        }
        Insert: {
          amount?: string | null
          business_id?: string | null
          created_at?: string | null
          id?: string | null
          notes?: string | null
          party_id?: string | null
          payment_date?: string | null
          payment_mode?: string | null
          payment_number?: string | null
          payment_type?: string | null
          purchase_invoice_id?: string | null
          reference_number?: string | null
          sale_invoice_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: string | null
          business_id?: string | null
          created_at?: string | null
          id?: string | null
          notes?: string | null
          party_id?: string | null
          payment_date?: string | null
          payment_mode?: string | null
          payment_number?: string | null
          payment_type?: string | null
          purchase_invoice_id?: string | null
          reference_number?: string | null
          sale_invoice_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      plan_payments: {
        Row: {
          amount: number | null
          created_at: string | null
          id: string | null
          manual_reference_id: string | null
          notes: string | null
          payment_method: string | null
          plan_id: string | null
          plan_name: string | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          status: string | null
          updated_at: string | null
          user_email: string | null
          user_id: string | null
          user_name: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          id?: string | null
          manual_reference_id?: string | null
          notes?: string | null
          payment_method?: string | null
          plan_id?: string | null
          plan_name?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          id?: string | null
          manual_reference_id?: string | null
          notes?: string | null
          payment_method?: string | null
          plan_id?: string | null
          plan_name?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string | null
          parent_user_id: string | null
          phone: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          parent_user_id?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          parent_user_id?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      purchase_invoice_items: {
        Row: {
          business_id: string | null
          created_at: string | null
          discount_amount: string | null
          discount_percent: string | null
          hsn_code: string | null
          id: string | null
          item_id: string | null
          item_name: string | null
          purchase_invoice_id: string | null
          quantity: number | null
          rate: number | null
          tax_amount: string | null
          tax_rate: string | null
          total: number | null
          unit: string | null
        }
        Insert: {
          business_id?: string | null
          created_at?: string | null
          discount_amount?: string | null
          discount_percent?: string | null
          hsn_code?: string | null
          id?: string | null
          item_id?: string | null
          item_name?: string | null
          purchase_invoice_id?: string | null
          quantity?: number | null
          rate?: number | null
          tax_amount?: string | null
          tax_rate?: string | null
          total?: number | null
          unit?: string | null
        }
        Update: {
          business_id?: string | null
          created_at?: string | null
          discount_amount?: string | null
          discount_percent?: string | null
          hsn_code?: string | null
          id?: string | null
          item_id?: string | null
          item_name?: string | null
          purchase_invoice_id?: string | null
          quantity?: number | null
          rate?: number | null
          tax_amount?: string | null
          tax_rate?: string | null
          total?: number | null
          unit?: string | null
        }
        Relationships: []
      }
      purchase_invoices: {
        Row: {
          balance_due: number | null
          business_id: string | null
          created_at: string | null
          deleted_at: string | null
          discount_amount: string | null
          due_date: string | null
          id: string | null
          invoice_date: string | null
          invoice_number: string | null
          invoice_type: string | null
          is_deleted: boolean | null
          notes: string | null
          paid_amount: string | null
          party_id: string | null
          status: string | null
          subtotal: number | null
          tax_amount: string | null
          tcs_amount: number | null
          tds_amount: string | null
          terms: string | null
          total_amount: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          balance_due?: number | null
          business_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          discount_amount?: string | null
          due_date?: string | null
          id?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_type?: string | null
          is_deleted?: boolean | null
          notes?: string | null
          paid_amount?: string | null
          party_id?: string | null
          status?: string | null
          subtotal?: number | null
          tax_amount?: string | null
          tcs_amount?: number | null
          tds_amount?: string | null
          terms?: string | null
          total_amount?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          balance_due?: number | null
          business_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          discount_amount?: string | null
          due_date?: string | null
          id?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_type?: string | null
          is_deleted?: boolean | null
          notes?: string | null
          paid_amount?: string | null
          party_id?: string | null
          status?: string | null
          subtotal?: number | null
          tax_amount?: string | null
          tcs_amount?: number | null
          tds_amount?: string | null
          terms?: string | null
          total_amount?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      sale_invoice_items: {
        Row: {
          business_id: string | null
          created_at: string | null
          discount_amount: string | null
          discount_percent: string | null
          hsn_code: string | null
          id: string | null
          item_id: string | null
          item_name: string | null
          quantity: number | null
          rate: number | null
          sale_invoice_id: string | null
          tax_amount: string | null
          tax_rate: string | null
          total: number | null
          unit: string | null
        }
        Insert: {
          business_id?: string | null
          created_at?: string | null
          discount_amount?: string | null
          discount_percent?: string | null
          hsn_code?: string | null
          id?: string | null
          item_id?: string | null
          item_name?: string | null
          quantity?: number | null
          rate?: number | null
          sale_invoice_id?: string | null
          tax_amount?: string | null
          tax_rate?: string | null
          total?: number | null
          unit?: string | null
        }
        Update: {
          business_id?: string | null
          created_at?: string | null
          discount_amount?: string | null
          discount_percent?: string | null
          hsn_code?: string | null
          id?: string | null
          item_id?: string | null
          item_name?: string | null
          quantity?: number | null
          rate?: number | null
          sale_invoice_id?: string | null
          tax_amount?: string | null
          tax_rate?: string | null
          total?: number | null
          unit?: string | null
        }
        Relationships: []
      }
      sale_invoices: {
        Row: {
          balance_due: number | null
          business_id: string | null
          created_at: string | null
          deleted_at: string | null
          discount_amount: string | null
          due_date: string | null
          id: string | null
          invoice_date: string | null
          invoice_number: string | null
          invoice_type: string | null
          is_deleted: boolean | null
          notes: string | null
          paid_amount: string | null
          party_id: string | null
          status: string | null
          subtotal: number | null
          tax_amount: string | null
          tcs_amount: string | null
          tds_amount: string | null
          terms: string | null
          total_amount: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          balance_due?: number | null
          business_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          discount_amount?: string | null
          due_date?: string | null
          id?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_type?: string | null
          is_deleted?: boolean | null
          notes?: string | null
          paid_amount?: string | null
          party_id?: string | null
          status?: string | null
          subtotal?: number | null
          tax_amount?: string | null
          tcs_amount?: string | null
          tds_amount?: string | null
          terms?: string | null
          total_amount?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          balance_due?: number | null
          business_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          discount_amount?: string | null
          due_date?: string | null
          id?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_type?: string | null
          is_deleted?: boolean | null
          notes?: string | null
          paid_amount?: string | null
          party_id?: string | null
          status?: string | null
          subtotal?: number | null
          tax_amount?: string | null
          tcs_amount?: string | null
          tds_amount?: string | null
          terms?: string | null
          total_amount?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      trial_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          business_name: string | null
          created_at: string | null
          email: string | null
          id: string | null
          name: string | null
          notes: string | null
          phone: string | null
          status: string | null
          trial_end_date: string | null
          trial_start_date: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          business_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string | null
          name?: string | null
          notes?: string | null
          phone?: string | null
          status?: string | null
          trial_end_date?: string | null
          trial_start_date?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          business_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string | null
          name?: string | null
          notes?: string | null
          phone?: string | null
          status?: string | null
          trial_end_date?: string | null
          trial_start_date?: string | null
        }
        Relationships: []
      }
      units: {
        Row: {
          created_at: string | null
          id: string | null
          is_default: string | null
          name: string | null
          symbol: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          is_default?: string | null
          name?: string | null
          symbol?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          is_default?: string | null
          name?: string | null
          symbol?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string | null
          parent_user_id: string | null
          role: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          parent_user_id?: string | null
          role?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          parent_user_id?: string | null
          role?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_effective_license_settings: {
        Args: { _user_id: string }
        Returns: {
          created_at: string | null
          expiry_date: string | null
          id: string | null
          license_type: string | null
          licensed_to: string | null
          max_businesses: number | null
          max_simultaneous_logins: number | null
          max_users: number | null
          support_email: string | null
          support_phone: string | null
          support_whatsapp: string | null
          updated_at: string | null
          user_email: string | null
          user_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "license_settings"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_effective_user_id: { Args: { _user_id: string }; Returns: string }
      is_superadmin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
