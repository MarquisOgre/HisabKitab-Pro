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
      bank_accounts: {
        Row: {
          account_name: string
          account_number: string | null
          account_type: string | null
          balance: number | null
          bank_name: string | null
          created_at: string
          id: string
          ifsc_code: string | null
          is_default: boolean | null
          user_id: string
        }
        Insert: {
          account_name: string
          account_number?: string | null
          account_type?: string | null
          balance?: number | null
          bank_name?: string | null
          created_at?: string
          id?: string
          ifsc_code?: string | null
          is_default?: boolean | null
          user_id: string
        }
        Update: {
          account_name?: string
          account_number?: string | null
          account_type?: string | null
          balance?: number | null
          bank_name?: string | null
          created_at?: string
          id?: string
          ifsc_code?: string | null
          is_default?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          balance: number | null
          city: string | null
          created_at: string
          email: string | null
          gst_number: string | null
          id: string
          mobile: string | null
          name: string
          state: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          balance?: number | null
          city?: string | null
          created_at?: string
          email?: string | null
          gst_number?: string | null
          id?: string
          mobile?: string | null
          name: string
          state?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          balance?: number | null
          city?: string | null
          created_at?: string
          email?: string | null
          gst_number?: string | null
          id?: string
          mobile?: string | null
          name?: string
          state?: string | null
          user_id?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string | null
          expense_date: string
          expense_number: string | null
          id: string
          notes: string | null
          payment_mode: string | null
          user_id: string
        }
        Insert: {
          amount?: number
          category: string
          created_at?: string
          description?: string | null
          expense_date?: string
          expense_number?: string | null
          id?: string
          notes?: string | null
          payment_mode?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string | null
          expense_date?: string
          expense_number?: string | null
          id?: string
          notes?: string | null
          payment_mode?: string | null
          user_id?: string
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          discount: number | null
          gst_amount: number | null
          gst_rate: number | null
          id: string
          invoice_id: string
          price: number
          product_id: string | null
          product_name: string
          quantity: number
          total: number | null
        }
        Insert: {
          discount?: number | null
          gst_amount?: number | null
          gst_rate?: number | null
          id?: string
          invoice_id: string
          price?: number
          product_id?: string | null
          product_name: string
          quantity?: number
          total?: number | null
        }
        Update: {
          discount?: number | null
          gst_amount?: number | null
          gst_rate?: number | null
          id?: string
          invoice_id?: string
          price?: number
          product_id?: string | null
          product_name?: string
          quantity?: number
          total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_paid: number | null
          created_at: string
          customer_id: string | null
          discount: number | null
          due_date: string | null
          gst_amount: number | null
          id: string
          invoice_date: string
          invoice_number: string
          invoice_type: string
          notes: string | null
          status: string | null
          subtotal: number | null
          total: number | null
          user_id: string
        }
        Insert: {
          amount_paid?: number | null
          created_at?: string
          customer_id?: string | null
          discount?: number | null
          due_date?: string | null
          gst_amount?: number | null
          id?: string
          invoice_date?: string
          invoice_number: string
          invoice_type?: string
          notes?: string | null
          status?: string | null
          subtotal?: number | null
          total?: number | null
          user_id: string
        }
        Update: {
          amount_paid?: number | null
          created_at?: string
          customer_id?: string | null
          discount?: number | null
          due_date?: string | null
          gst_amount?: number | null
          id?: string
          invoice_date?: string
          invoice_number?: string
          invoice_type?: string
          notes?: string | null
          status?: string | null
          subtotal?: number | null
          total?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          bank_account_id: string | null
          created_at: string
          id: string
          notes: string | null
          party_id: string | null
          party_type: string | null
          payment_date: string
          payment_mode: string | null
          payment_number: string | null
          payment_type: string
          user_id: string
        }
        Insert: {
          amount?: number
          bank_account_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          party_id?: string | null
          party_type?: string | null
          payment_date?: string
          payment_mode?: string | null
          payment_number?: string | null
          payment_type: string
          user_id: string
        }
        Update: {
          amount?: number
          bank_account_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          party_id?: string | null
          party_type?: string | null
          payment_date?: string
          payment_mode?: string | null
          payment_number?: string | null
          payment_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          created_at: string
          current_stock: number
          gst_rate: number | null
          hsn_code: string | null
          id: string
          is_deleted: boolean | null
          low_stock_alert: number | null
          name: string
          opening_stock: number
          purchase_price: number
          sale_price: number
          unit: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          current_stock?: number
          gst_rate?: number | null
          hsn_code?: string | null
          id?: string
          is_deleted?: boolean | null
          low_stock_alert?: number | null
          name: string
          opening_stock?: number
          purchase_price?: number
          sale_price?: number
          unit?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          current_stock?: number
          gst_rate?: number | null
          hsn_code?: string | null
          id?: string
          is_deleted?: boolean | null
          low_stock_alert?: number | null
          name?: string
          opening_stock?: number
          purchase_price?: number
          sale_price?: number
          unit?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          business_name: string | null
          cash_in_hand: number | null
          city: string | null
          created_at: string
          email: string | null
          gst_number: string | null
          id: string
          logo_url: string | null
          mobile: string | null
          owner_name: string | null
          state: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          business_name?: string | null
          cash_in_hand?: number | null
          city?: string | null
          created_at?: string
          email?: string | null
          gst_number?: string | null
          id: string
          logo_url?: string | null
          mobile?: string | null
          owner_name?: string | null
          state?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          business_name?: string | null
          cash_in_hand?: number | null
          city?: string | null
          created_at?: string
          email?: string | null
          gst_number?: string | null
          id?: string
          logo_url?: string | null
          mobile?: string | null
          owner_name?: string | null
          state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      purchase_items: {
        Row: {
          gst_amount: number | null
          gst_rate: number | null
          id: string
          price: number
          product_id: string | null
          product_name: string
          purchase_id: string
          quantity: number
          total: number | null
        }
        Insert: {
          gst_amount?: number | null
          gst_rate?: number | null
          id?: string
          price?: number
          product_id?: string | null
          product_name: string
          purchase_id: string
          quantity?: number
          total?: number | null
        }
        Update: {
          gst_amount?: number | null
          gst_rate?: number | null
          id?: string
          price?: number
          product_id?: string | null
          product_name?: string
          purchase_id?: string
          quantity?: number
          total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_items_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases: {
        Row: {
          amount_paid: number | null
          created_at: string
          gst_amount: number | null
          id: string
          notes: string | null
          purchase_date: string
          purchase_number: string
          status: string | null
          subtotal: number | null
          supplier_id: string | null
          total: number | null
          user_id: string
        }
        Insert: {
          amount_paid?: number | null
          created_at?: string
          gst_amount?: number | null
          id?: string
          notes?: string | null
          purchase_date?: string
          purchase_number: string
          status?: string | null
          subtotal?: number | null
          supplier_id?: string | null
          total?: number | null
          user_id: string
        }
        Update: {
          amount_paid?: number | null
          created_at?: string
          gst_amount?: number | null
          id?: string
          notes?: string | null
          purchase_date?: string
          purchase_number?: string
          status?: string | null
          subtotal?: number | null
          supplier_id?: string | null
          total?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          created_at: string
          id: string
          movement_type: string
          notes: string | null
          product_id: string
          quantity: number
          reference_id: string | null
          reference_type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          movement_type: string
          notes?: string | null
          product_id: string
          quantity: number
          reference_id?: string | null
          reference_type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          movement_type?: string
          notes?: string | null
          product_id?: string
          quantity?: number
          reference_id?: string | null
          reference_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          balance: number | null
          city: string | null
          created_at: string
          email: string | null
          gst_number: string | null
          id: string
          mobile: string | null
          name: string
          state: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          balance?: number | null
          city?: string | null
          created_at?: string
          email?: string | null
          gst_number?: string | null
          id?: string
          mobile?: string | null
          name: string
          state?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          balance?: number | null
          city?: string | null
          created_at?: string
          email?: string | null
          gst_number?: string | null
          id?: string
          mobile?: string | null
          name?: string
          state?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
