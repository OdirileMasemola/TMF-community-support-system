import { useCallback, useState } from "react";
import { openDonationProof } from "@/lib/proofs";
import type { ProofWithDonation } from "@/services/donations";

type ViewableProof = Pick<ProofWithDonation, "id" | "file_path" | "signed_url">;

/** Opens a proof of payment and tracks which one is loading, so its View button can show a spinner. */
export function useProofViewer() {
  const [openingId, setOpeningId] = useState<string | null>(null);

  const open = useCallback(async (proof: ViewableProof) => {
    setOpeningId(proof.id);
    try {
      await openDonationProof(proof, { onUrlReady: () => setOpeningId(null) });
    } finally {
      setOpeningId(null);
    }
  }, []);

  return { openingId, open };
}
