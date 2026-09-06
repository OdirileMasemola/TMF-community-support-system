export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = "administrator" | "volunteer" | "beneficiary" | "donor" | "sponsor";
export type CampaignStatus = "draft" | "active" | "closed" | "cancelled";
export type ApplicationStatus = "pending" | "approved" | "rejected";
export type RequestStatus = "pending" | "under_review" | "approved" | "rejected" | "completed";
export type PaymentStatus = "pending" | "successful" | "failed" | "cancelled";
export type VerificationStatus = "pending" | "approved" | "rejected";
export type NotificationStatus = "unread" | "read";
export type ReportStatus = "generated" | "archived";
export type DonationKind = "money" | "in_kind";
export type AccountStatus = "pending" | "active" | "suspended";
export type AssignmentStatus = "upcoming" | "active" | "completed";
export type EventStatus = "draft" | "scheduled" | "completed" | "cancelled";
export type SponsorshipRequestStatus = "open" | "accepted" | "declined" | "closed";
export type CollectionScheduleStatus = "upcoming" | "confirmed" | "completed" | "missed";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          full_name: string;
          email: string;
          phone_number: string | null;
          account_status: AccountStatus;
          invited_by: string | null;
          invited_at: string | null;
          avatar_url: string | null;
          avatar_change_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: UserRole;
          full_name: string;
          email: string;
          phone_number?: string | null;
          account_status?: AccountStatus;
          invited_by?: string | null;
          invited_at?: string | null;
          avatar_url?: string | null;
          avatar_change_count?: number;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      administrator_profiles: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["administrator_profiles"]["Insert"]>;
        Relationships: [];
      };
      volunteer_profiles: {
        Row: {
          id: string;
          user_id: string;
          residential_address: string | null;
          availability_status: string | null;
          preferred_area: string | null;
          member_since: string | null;
          status: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          residential_address?: string | null;
          availability_status?: string | null;
          preferred_area?: string | null;
          member_since?: string | null;
          status?: string | null;
          avatar_url?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["volunteer_profiles"]["Insert"]>;
        Relationships: [];
      };
      beneficiary_profiles: {
        Row: {
          id: string;
          user_id: string;
          residential_address: string | null;
          assistance_type: string | null;
          avatar_url: string | null;
          eligibility_status: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          residential_address?: string | null;
          assistance_type?: string | null;
          avatar_url?: string | null;
          eligibility_status?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["beneficiary_profiles"]["Insert"]>;
        Relationships: [];
      };
      donor_profiles: {
        Row: {
          id: string;
          user_id: string;
          donation_preference: string | null;
          avatar_url: string | null;
          member_since: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          donation_preference?: string | null;
          avatar_url?: string | null;
          member_since?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["donor_profiles"]["Insert"]>;
        Relationships: [];
      };
      sponsor_profiles: {
        Row: {
          id: string;
          user_id: string;
          organisation_name: string;
          sponsorship_type: string | null;
          representative_name: string | null;
          business_address: string | null;
          sponsor_level: string | null;
          logo_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          organisation_name: string;
          sponsorship_type?: string | null;
          representative_name?: string | null;
          business_address?: string | null;
          sponsor_level?: string | null;
          logo_url?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["sponsor_profiles"]["Insert"]>;
        Relationships: [];
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
          status: CampaignStatus;
          category: string | null;
          image_url: string | null;
          funding_goal: number | null;
          amount_raised: number;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          admin_id: string;
          title: string;
          description: string;
          location: string;
          start_date: string;
          end_date?: string | null;
          status?: CampaignStatus;
          category?: string | null;
          image_url?: string | null;
          funding_goal?: number | null;
          amount_raised?: number;
          is_public?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["campaigns"]["Insert"]>;
        Relationships: [];
      };
      campaign_applications: {
        Row: {
          id: string;
          volunteer_id: string;
          campaign_id: string;
          application_date: string;
          status: ApplicationStatus;
          participation_role: string | null;
        };
        Insert: {
          id?: string;
          volunteer_id: string;
          campaign_id: string;
          application_date?: string;
          status?: ApplicationStatus;
          participation_role?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["campaign_applications"]["Insert"]>;
        Relationships: [];
      };
      donations: {
        Row: {
          id: string;
          donor_id: string;
          campaign_id: string | null;
          amount: number | null;
          donation_date: string;
          payment_method: string;
          status: PaymentStatus;
          receipt_number: string | null;
          donation_kind: DonationKind;
          item_description: string | null;
          item_quantity: number | null;
          payment_reference: string | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          donor_id: string;
          campaign_id?: string | null;
          amount?: number | null;
          donation_date?: string;
          payment_method: string;
          status?: PaymentStatus;
          receipt_number?: string | null;
          donation_kind?: DonationKind;
          item_description?: string | null;
          item_quantity?: number | null;
          payment_reference?: string | null;
          notes?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["donations"]["Insert"]>;
        Relationships: [];
      };
      donation_proofs: {
        Row: {
          id: string;
          donation_id: string;
          file_path: string;
          file_name: string | null;
          payment_reference: string | null;
          payment_date: string | null;
          admin_comment: string | null;
          verification_status: VerificationStatus;
          reviewed_by: string | null;
          reviewed_at: string | null;
          uploaded_at: string;
        };
        Insert: {
          id?: string;
          donation_id: string;
          file_path: string;
          file_name?: string | null;
          payment_reference?: string | null;
          payment_date?: string | null;
          admin_comment?: string | null;
          verification_status?: VerificationStatus;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["donation_proofs"]["Insert"]>;
        Relationships: [];
      };
      sponsorships: {
        Row: {
          id: string;
          sponsor_id: string;
          campaign_id: string | null;
          amount: number;
          sponsorship_date: string;
          sponsorship_type: string | null;
          status: PaymentStatus;
        };
        Insert: {
          id?: string;
          sponsor_id: string;
          campaign_id?: string | null;
          amount: number;
          sponsorship_date?: string;
          sponsorship_type?: string | null;
          status?: PaymentStatus;
        };
        Update: Partial<Database["public"]["Tables"]["sponsorships"]["Insert"]>;
        Relationships: [];
      };
      sponsorship_requests: {
        Row: {
          id: string;
          campaign_id: string | null;
          title: string;
          requested_support: string;
          category: string | null;
          priority: string | null;
          deadline: string | null;
          estimated_impact: string | null;
          status: SponsorshipRequestStatus;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          campaign_id?: string | null;
          title: string;
          requested_support: string;
          category?: string | null;
          priority?: string | null;
          deadline?: string | null;
          estimated_impact?: string | null;
          status?: SponsorshipRequestStatus;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["sponsorship_requests"]["Insert"]>;
        Relationships: [];
      };
      sponsorship_request_responses: {
        Row: {
          id: string;
          request_id: string;
          sponsor_id: string;
          sponsorship_id: string | null;
          status: string;
          notes: string | null;
          responded_at: string;
        };
        Insert: {
          id?: string;
          request_id: string;
          sponsor_id: string;
          sponsorship_id?: string | null;
          status?: string;
          notes?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["sponsorship_request_responses"]["Insert"]>;
        Relationships: [];
      };
      assistance_requests: {
        Row: {
          id: string;
          beneficiary_id: string;
          request_date: string;
          request_type: string;
          description: string;
          status: RequestStatus;
          priority: string | null;
          preferred_collection_area: string | null;
          admin_notes: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
        };
        Insert: {
          id?: string;
          beneficiary_id: string;
          request_date?: string;
          request_type: string;
          description: string;
          status?: RequestStatus;
          priority?: string | null;
          preferred_collection_area?: string | null;
          admin_notes?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["assistance_requests"]["Insert"]>;
        Relationships: [];
      };
      supporting_documents: {
        Row: {
          id: string;
          request_id: string;
          document_name: string;
          document_type: string | null;
          file_path: string;
          upload_date: string;
          verification_status: VerificationStatus;
        };
        Insert: {
          id?: string;
          request_id: string;
          document_name: string;
          document_type?: string | null;
          file_path: string;
          verification_status?: VerificationStatus;
        };
        Update: Partial<Database["public"]["Tables"]["supporting_documents"]["Insert"]>;
        Relationships: [];
      };
      collection_schedules: {
        Row: {
          id: string;
          request_id: string | null;
          programme_name: string | null;
          location: string;
          collection_date: string;
          collection_time: string | null;
          status: CollectionScheduleStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          request_id?: string | null;
          programme_name?: string | null;
          location: string;
          collection_date: string;
          collection_time?: string | null;
          status?: CollectionScheduleStatus;
        };
        Update: Partial<Database["public"]["Tables"]["collection_schedules"]["Insert"]>;
        Relationships: [];
      };
      volunteer_assignments: {
        Row: {
          id: string;
          application_id: string | null;
          volunteer_id: string;
          campaign_id: string;
          role: string;
          location: string | null;
          schedule: string | null;
          start_date: string | null;
          end_date: string | null;
          status: AssignmentStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          application_id?: string | null;
          volunteer_id: string;
          campaign_id: string;
          role: string;
          location?: string | null;
          schedule?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          status?: AssignmentStatus;
        };
        Update: Partial<Database["public"]["Tables"]["volunteer_assignments"]["Insert"]>;
        Relationships: [];
      };
      volunteer_hours: {
        Row: {
          id: string;
          assignment_id: string | null;
          volunteer_id: string;
          hours: number;
          work_date: string;
          notes: string | null;
          recorded_at: string;
        };
        Insert: {
          id?: string;
          assignment_id?: string | null;
          volunteer_id: string;
          hours: number;
          work_date: string;
          notes?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["volunteer_hours"]["Insert"]>;
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          admin_id: string;
          campaign_id: string | null;
          title: string;
          description: string | null;
          location: string;
          event_date: string;
          status: EventStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          admin_id: string;
          campaign_id?: string | null;
          title: string;
          description?: string | null;
          location: string;
          event_date: string;
          status?: EventStatus;
        };
        Update: Partial<Database["public"]["Tables"]["events"]["Insert"]>;
        Relationships: [];
      };
      contact_messages: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          email: string;
          subject: string;
          message: string;
          status: "unread" | "read" | "archived";
          created_at: string;
        };
        Insert: {
          id?: string;
          first_name: string;
          last_name: string;
          email: string;
          subject: string;
          message: string;
          status?: "unread" | "read" | "archived";
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["contact_messages"]["Insert"]>;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          message: string;
          notification_date: string;
          notification_type: string;
          status: NotificationStatus;
          title: string | null;
          link_url: string | null;
          related_entity_type: string | null;
          related_entity_id: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          message: string;
          notification_date?: string;
          notification_type: string;
          status?: NotificationStatus;
          title?: string | null;
          link_url?: string | null;
          related_entity_type?: string | null;
          related_entity_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
        Relationships: [];
      };
      reports: {
        Row: {
          id: string;
          admin_id: string;
          report_name: string;
          generated_at: string;
          report_type: string;
          status: ReportStatus;
          metadata: Json;
          file_path: string | null;
        };
        Insert: {
          id?: string;
          admin_id: string;
          report_name: string;
          report_type: string;
          status?: ReportStatus;
          metadata?: Json;
          file_path?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["reports"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      current_user_role: { Args: Record<string, never>; Returns: UserRole };
      is_admin: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: {
      user_role: UserRole;
      campaign_status: CampaignStatus;
      application_status: ApplicationStatus;
      request_status: RequestStatus;
      payment_status: PaymentStatus;
      verification_status: VerificationStatus;
      notification_status: NotificationStatus;
      report_status: ReportStatus;
      donation_kind: DonationKind;
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Update"];
