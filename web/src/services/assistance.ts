import type { Tables, TablesInsert, TablesUpdate } from "@/types/database.types";
import { getSupabaseClientOrNull } from "@/lib/supabaseClient";
import { logSupabaseError } from "@/lib/errors";

export type AssistanceRequestRow = Tables<"assistance_requests">;
export type SupportingDocumentRow = Tables<"supporting_documents">;
export type CollectionScheduleRow = Tables<"collection_schedules">;

export type AssistanceWithBeneficiary = AssistanceRequestRow & {
  beneficiary_profiles:
    | (Pick<Tables<"beneficiary_profiles">, "id" | "user_id"> & {
        profiles: Pick<Tables<"profiles">, "full_name" | "email"> | null;
      })
    | null;
};

export async function fetchBeneficiaryRequests(beneficiaryProfileId: string): Promise<AssistanceRequestRow[]> {
  const client = getSupabaseClientOrNull();
  if (!client) return [];

  const { data, error } = await client
    .from("assistance_requests")
    .select(
      "id, beneficiary_id, request_date, request_type, description, status, priority, preferred_collection_area, admin_notes, reviewed_by, reviewed_at",
    )
    .eq("beneficiary_id", beneficiaryProfileId)
    .order("request_date", { ascending: false });

  if (error) {
    logSupabaseError("fetchBeneficiaryRequests", error);
    throw error;
  }
  return data ?? [];
}

export async function fetchAllAssistanceRequests(limit = 100): Promise<AssistanceWithBeneficiary[]> {
  const client = getSupabaseClientOrNull();
  if (!client) return [];

  const { data, error } = await client
    .from("assistance_requests")
    .select(
      "id, beneficiary_id, request_date, request_type, description, status, priority, preferred_collection_area, admin_notes, reviewed_by, reviewed_at, beneficiary_profiles(id, user_id, profiles(full_name, email))",
    )
    .order("request_date", { ascending: false })
    .limit(limit);

  if (error) {
    logSupabaseError("fetchAllAssistanceRequests", error);
    throw error;
  }
  return (data ?? []) as unknown as AssistanceWithBeneficiary[];
}

export async function createAssistanceRequest(payload: TablesInsert<"assistance_requests">): Promise<AssistanceRequestRow> {
  const client = getSupabaseClientOrNull();
  if (!client) throw new Error("Supabase is not configured.");

  const { data, error } = await client
    .from("assistance_requests")
    .insert(payload)
    .select(
      "id, beneficiary_id, request_date, request_type, description, status, priority, preferred_collection_area, admin_notes, reviewed_by, reviewed_at",
    )
    .single();

  if (error) {
    logSupabaseError("createAssistanceRequest", error);
    throw error;
  }
  return data;
}

export async function updateAssistanceRequest(id: string, values: TablesUpdate<"assistance_requests">): Promise<void> {
  const client = getSupabaseClientOrNull();
  if (!client) throw new Error("Supabase is not configured.");
  const { error } = await client.from("assistance_requests").update(values).eq("id", id);
  if (error) {
    logSupabaseError("updateAssistanceRequest", error);
    throw error;
  }
}

export async function fetchSupportingDocuments(requestId: string): Promise<SupportingDocumentRow[]> {
  const client = getSupabaseClientOrNull();
  if (!client) return [];

  const { data, error } = await client
    .from("supporting_documents")
    .select("id, request_id, document_name, document_type, file_path, upload_date, verification_status")
    .eq("request_id", requestId)
    .order("upload_date", { ascending: false });

  if (error) {
    logSupabaseError("fetchSupportingDocuments", error);
    throw error;
  }
  return data ?? [];
}

export async function createSupportingDocument(payload: TablesInsert<"supporting_documents">): Promise<SupportingDocumentRow> {
  const client = getSupabaseClientOrNull();
  if (!client) throw new Error("Supabase is not configured.");
  const { data, error } = await client
    .from("supporting_documents")
    .insert(payload)
    .select("id, request_id, document_name, document_type, file_path, upload_date, verification_status")
    .single();
  if (error) {
    logSupabaseError("createSupportingDocument", error);
    throw error;
  }
  return data;
}

export async function fetchCollectionSchedulesForRequests(requestIds: string[]): Promise<CollectionScheduleRow[]> {
  const client = getSupabaseClientOrNull();
  if (!client || requestIds.length === 0) return [];

  const { data, error } = await client
    .from("collection_schedules")
    .select("id, request_id, programme_name, location, collection_date, collection_time, status, created_at")
    .in("request_id", requestIds)
    .order("collection_date", { ascending: true });

  if (error) {
    logSupabaseError("fetchCollectionSchedulesForRequests", error);
    throw error;
  }
  return data ?? [];
}

export async function createCollectionSchedule(payload: TablesInsert<"collection_schedules">): Promise<CollectionScheduleRow> {
  const client = getSupabaseClientOrNull();
  if (!client) throw new Error("Supabase is not configured.");
  const { data, error } = await client
    .from("collection_schedules")
    .insert(payload)
    .select("id, request_id, programme_name, location, collection_date, collection_time, status, created_at")
    .single();
  if (error) {
    logSupabaseError("createCollectionSchedule", error);
    throw error;
  }
  return data;
}
