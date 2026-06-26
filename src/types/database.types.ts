export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: "administrator" | "volunteer" | "beneficiary" | "donor" | "sponsor";
          full_name: string;
          email: string;
          phone_number: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role: "administrator" | "volunteer" | "beneficiary" | "donor" | "sponsor";
          full_name: string;
          email: string;
          phone_number?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      campaigns: {
        Row: {
          id: string;
          admin_id: string;
          title: string;
          description: string;
          location: string;
          start_date: string;
          end_date: string | null;
          status: "draft" | "active" | "closed" | "cancelled";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          admin_id: string;
          title: string;
          description: string;
          location: string;
          start_date: string;
          end_date?: string | null;
          status?: "draft" | "active" | "closed" | "cancelled";
        };
        Update: Partial<Database["public"]["Tables"]["campaigns"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
