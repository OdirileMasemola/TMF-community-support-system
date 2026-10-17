import type { Tables, TablesInsert, TablesUpdate } from "@/types/database.types";
import { apiData, apiList } from "@/lib/apiClient";
import { getSupabaseClientOrNull } from "@/lib/supabaseClient";
import { logSupabaseError } from "@/lib/errors";

export type DonationRow = Tables<"donations">;
export type DonationProofRow = Tables<"donation_proofs">;

export type DonationWithCampaign = DonationRow & {
  campaigns: Pick<Tables<"campaigns">, "id" | "title" | "category" | "image_url"> | null;
};

export type DonationWithDonor = DonationRow & {
  donor_profiles:
    | (Pick<Tables<"donor_profiles">, "id" | "user_id"> & {
        profiles: Pick<Tables<"profiles">, "full_name" | "email"> | null;
      })
    | null;
  campaigns: Pick<Tables<"campaigns">, "id" | "title"> | null;
};

export type ProofWithDonation = DonationProofRow & {
  /** Short-lived signed URL from the admin review endpoint, when the API provided one. */
  signed_url?: string | null;
  donations:
    | (Pick<DonationRow, "id" | "amount" | "payment_reference" | "donation_date" | "status"> & {
        campaigns: Pick<Tables<"campaigns">, "title"> | null;
      })
    | null;
};

type MyDonation = DonationRow & {
  campaigns: { id: string; title: string } | null;
  // file_path and the other details are returned by newer API builds; older ones only send the first three.
  donation_proofs: Array<
    Pick<DonationProofRow, "id" | "verification_status" | "uploaded_at"> &
      Partial<Pick<DonationProofRow, "file_path" | "file_name" | "payment_reference" | "payment_date" | "admin_comment">>
  >;
};

type ReviewProof = DonationProofRow & {
  signed_url?: string | null;
  donations:
    | (Pick<DonationRow, "id" | "amount" | "payment_reference" | "donation_date" | "status"> & {
        campaigns: { id: string; title: string } | null;
      })
    | null;
};

function toDonationWithCampaign(row: MyDonation): DonationWithCampaign {
  return {
    id: row.id,
    donor_id: row.donor_id,
    campaign_id: row.campaign_id,
    amount: row.amount,
    donation_date: row.donation_date,
    payment_method: row.payment_method,
    status: row.status,
    receipt_number: row.receipt_number,
    donation_kind: row.donation_kind,
    item_description: row.item_description,
    item_quantity: row.item_quantity,
    payment_reference: row.payment_reference,
    notes: row.notes,
    campaigns: row.campaigns
      ? { id: row.campaigns.id, title: row.campaigns.title, category: null, image_url: null }
      : null,
  };
}

function proofFromMine(donation: MyDonation, proof: MyDonation["donation_proofs"][number]): ProofWithDonation {
  return {
    id: proof.id,
    donation_id: donation.id,
    file_path: proof.file_path ?? "",
    file_name: proof.file_name ?? null,
    payment_reference: proof.payment_reference ?? donation.payment_reference,
    payment_date: proof.payment_date ?? null,
    admin_comment: proof.admin_comment ?? null,
    verification_status: proof.verification_status,
    reviewed_by: null,
    reviewed_at: null,
    uploaded_at: proof.uploaded_at,
    donations: {
      id: donation.id,
      amount: donation.amount,
      payment_reference: donation.payment_reference,
      donation_date: donation.donation_date,
      status: donation.status,
      campaigns: donation.campaigns ? { title: donation.campaigns.title } : null,
    },
  };
}

function donationBody(payload: TablesInsert<"donations">): Record<string, unknown> {
  const kind = payload.donation_kind ?? "money";
  const body: Record<string, unknown> = { donation_kind: kind };
  if (payload.campaign_id !== undefined) body.campaign_id = payload.campaign_id;
  if (payload.payment_method !== undefined) body.payment_method = payload.payment_method;
  if (payload.payment_reference !== undefined) body.payment_reference = payload.payment_reference;
  if (payload.notes !== undefined) body.notes = payload.notes;
  if (kind === "money") {
    if (payload.amount !== undefined) body.amount = payload.amount;
  } else {
    if (payload.item_description !== undefined) body.item_description = payload.item_description;
    if (payload.item_quantity !== undefined) body.item_quantity = payload.item_quantity;
  }
  return body;
}

export async function fetchDonorDonations(donorProfileId: string): Promise<DonationWithCampaign[]> {
  if (!getSupabaseClientOrNull() || !donorProfileId) return [];
  const rows = await apiList<MyDonation>("/api/v1/donations/me");
  return rows.map(toDonationWithCampaign);
}

export async function fetchAllDonations(limit = 100): Promise<DonationWithDonor[]> {
  if (!getSupabaseClientOrNull()) return [];
  return apiList<DonationWithDonor>("/api/v1/donations", undefined, limit);
}

export async function createDonation(payload: TablesInsert<"donations">): Promise<DonationRow> {
  if (!getSupabaseClientOrNull()) throw new Error("Supabase is not configured.");
  return apiData<DonationRow>("/api/v1/donations", { method: "POST", body: donationBody(payload) });
}

export async function updateDonation(id: string, values: TablesUpdate<"donations">): Promise<void> {
  if (!getSupabaseClientOrNull()) throw new Error("Supabase is not configured.");
  const status = values.status;
  if (status !== "successful" && status !== "failed") {
    throw new Error("Donation status is changed by reviewing the proof of payment.");
  }
  const proofs = await apiList<ReviewProof>("/api/v1/admin/donation-proofs", { status: "pending" });
  const proof = proofs.find((item) => item.donation_id === id);
  if (!proof) throw new Error("No pending proof of payment was found for this donation.");
  await updateDonationProof(proof.id, { verification_status: status === "successful" ? "approved" : "rejected" });
}

export async function fetchDonorProofs(donorProfileId: string): Promise<ProofWithDonation[]> {
  if (!getSupabaseClientOrNull() || !donorProfileId) return [];
  const rows = await apiList<MyDonation>("/api/v1/donations/me");
  return rows
    .flatMap((donation) => donation.donation_proofs.map((proof) => proofFromMine(donation, proof)))
    .sort((left, right) => right.uploaded_at.localeCompare(left.uploaded_at));
}

export async function fetchPendingProofs(limit = 100): Promise<ProofWithDonation[]> {
  if (!getSupabaseClientOrNull()) return [];
  const rows = await apiList<ReviewProof>("/api/v1/admin/donation-proofs", { status: "pending" }, limit);
  return rows.map((proof) => ({
    id: proof.id,
    donation_id: proof.donation_id,
    file_path: proof.file_path,
    file_name: proof.file_name,
    payment_reference: proof.payment_reference,
    payment_date: proof.payment_date,
    admin_comment: proof.admin_comment,
    verification_status: proof.verification_status,
    reviewed_by: proof.reviewed_by,
    reviewed_at: proof.reviewed_at,
    uploaded_at: proof.uploaded_at,
    signed_url: proof.signed_url ?? null,
    donations: proof.donations
      ? {
          id: proof.donations.id,
          amount: proof.donations.amount,
          payment_reference: proof.donations.payment_reference,
          donation_date: proof.donations.donation_date,
          status: proof.donations.status,
          campaigns: proof.donations.campaigns ? { title: proof.donations.campaigns.title } : null,
        }
      : null,
  }));
}

export async function createDonationProof(payload: TablesInsert<"donation_proofs">): Promise<DonationProofRow> {
  if (!getSupabaseClientOrNull()) throw new Error("Supabase is not configured.");
  return apiData<DonationProofRow>(`/api/v1/donations/${payload.donation_id}/proofs`, {
    method: "POST",
    body: {
      file_path: payload.file_path,
      file_name: payload.file_name ?? null,
      payment_reference: payload.payment_reference ?? null,
      payment_date: payload.payment_date ?? null,
    },
  });
}

export async function updateDonationProof(id: string, values: TablesUpdate<"donation_proofs">): Promise<void> {
  if (!getSupabaseClientOrNull()) throw new Error("Supabase is not configured.");
  const status = values.verification_status;
  if (status !== "approved" && status !== "rejected") {
    throw new Error("Only approving or rejecting a proof is available on the API.");
  }
  const body: { verification_status: "approved" | "rejected"; admin_comment?: string | null } = {
    verification_status: status,
  };
  if (values.admin_comment !== undefined) body.admin_comment = values.admin_comment;
  await apiData(`/api/v1/admin/donation-proofs/${id}`, { method: "PATCH", body });
}

const DONATION_PROOFS_BUCKET = "donation-proofs";
const PROOF_URL_TTL_SECONDS = 5 * 60;

export const PROOF_FILE_MISSING_MESSAGE = "This proof file could not be found. Please upload it again.";
export const PROOF_FILE_ERROR_MESSAGE = "Could not open proof file.";

function isStorageNotFound(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const { statusCode, status, message } = error as { statusCode?: unknown; status?: unknown; message?: unknown };
  return String(statusCode) === "404" || status === 404 || (typeof message === "string" && /not found/i.test(message));
}

/**
 * Returns a short-lived signed URL for a proof of payment. The donation-proofs bucket is private, so a
 * public URL never works: the file is signed with the caller's own session, and storage RLS only allows
 * the uploader (first folder = their auth id) or an administrator. When the list did not include the
 * stored path, it is read from donation_proofs, which RLS limits to the donor's own proofs and admins.
 */
export async function getDonationProofUrl(proof: Pick<ProofWithDonation, "id" | "file_path" | "signed_url">): Promise<string> {
  // A signed URL from the list may have expired, so a fresh one is made whenever the path is known.
  if (!proof.file_path && proof.signed_url) return proof.signed_url;
  const client = getSupabaseClientOrNull();
  if (!client) throw new Error(PROOF_FILE_ERROR_MESSAGE);

  let path = proof.file_path;
  if (!path) {
    const { data, error } = await client
      .from("donation_proofs")
      .select("file_path")
      .eq("id", proof.id)
      .maybeSingle<{ file_path: string }>();
    if (error) {
      logSupabaseError("getDonationProofUrl.lookup", error);
      throw new Error(PROOF_FILE_ERROR_MESSAGE);
    }
    path = data?.file_path ?? "";
  }
  if (!path || path.includes("..")) throw new Error(PROOF_FILE_MISSING_MESSAGE);

  const { data, error } = await client.storage.from(DONATION_PROOFS_BUCKET).createSignedUrl(path, PROOF_URL_TTL_SECONDS);
  if (error || !data?.signedUrl) {
    logSupabaseError("getDonationProofUrl.sign", error);
    throw new Error(isStorageNotFound(error) ? PROOF_FILE_MISSING_MESSAGE : PROOF_FILE_ERROR_MESSAGE);
  }
  return data.signedUrl;
}
