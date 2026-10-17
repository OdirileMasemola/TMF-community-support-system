import { Alert } from "react-native";
import * as WebBrowser from "expo-web-browser";
import {
  getDonationProofUrl,
  PROOF_FILE_ERROR_MESSAGE,
  PROOF_FILE_MISSING_MESSAGE,
  type ProofWithDonation,
} from "@/services/donations";

/** Opens a proof of payment in the in-app browser using a short-lived signed URL. */
export async function openDonationProof(
  proof: Pick<ProofWithDonation, "id" | "file_path" | "signed_url">,
  options: { onUrlReady?: () => void } = {},
): Promise<void> {
  try {
    const url = await getDonationProofUrl(proof);
    options.onUrlReady?.();
    await WebBrowser.openBrowserAsync(url);
  } catch (error) {
    const message =
      error instanceof Error && error.message === PROOF_FILE_MISSING_MESSAGE ? PROOF_FILE_MISSING_MESSAGE : PROOF_FILE_ERROR_MESSAGE;
    Alert.alert("Proof of payment", message);
  }
}
