import { apiList } from "@/lib/apiClient";
import { getSupabaseClientOrNull } from "@/lib/supabaseClient";
import {
  fetchDonorProofs,
  getDonationProofUrl,
  PROOF_FILE_ERROR_MESSAGE,
  PROOF_FILE_MISSING_MESSAGE,
} from "@/services/donations";

jest.mock("@/lib/supabaseClient", () => ({ getSupabaseClientOrNull: jest.fn() }));
jest.mock("@/lib/apiClient", () => ({ apiList: jest.fn(), apiData: jest.fn() }));

const mockedGetClient = getSupabaseClientOrNull as jest.Mock;
const mockedApiList = apiList as jest.Mock;

const USER = "11111111-1111-4111-8111-111111111111";
const PATH = `${USER}/1760000000000-pop.pdf`;

type Result = { data: unknown; error: unknown };

function fakeClient(options: { lookup?: Result; sign?: Result }) {
  const calls: unknown[][] = [];
  const builder = {
    select: (...args: unknown[]) => (calls.push(["select", ...args]), builder),
    eq: (...args: unknown[]) => (calls.push(["eq", ...args]), builder),
    maybeSingle: () => Promise.resolve(options.lookup ?? { data: null, error: null }),
  };
  const client = {
    from: (table: string) => (calls.push(["from", table]), builder),
    storage: {
      from: (bucket: string) => ({
        createSignedUrl: (path: string, ttl: number) => {
          calls.push(["sign", bucket, path, ttl]);
          return Promise.resolve(options.sign ?? { data: { signedUrl: `https://signed.example/${path}` }, error: null });
        },
      }),
    },
  };
  mockedGetClient.mockReturnValue(client);
  return calls;
}

beforeEach(() => {
  jest.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
  mockedGetClient.mockReset();
  mockedApiList.mockReset();
});

describe("fetchDonorProofs", () => {
  const donation = {
    id: "d1",
    donor_id: "donor-1",
    campaign_id: null,
    amount: 100,
    donation_date: "2026-10-10T10:00:00Z",
    payment_method: "EFT",
    status: "pending",
    receipt_number: null,
    donation_kind: "money",
    item_description: null,
    item_quantity: null,
    payment_reference: "DON-REF",
    notes: null,
    campaigns: null,
  };

  it("keeps the stored file path and details the API returns", async () => {
    fakeClient({});
    mockedApiList.mockResolvedValue([
      {
        ...donation,
        donation_proofs: [
          {
            id: "p1",
            file_path: PATH,
            file_name: "pop.pdf",
            payment_reference: "POP-REF",
            payment_date: "2026-10-09",
            admin_comment: "Looks good",
            verification_status: "approved",
            uploaded_at: "2026-10-10T11:00:00Z",
          },
        ],
      },
    ]);
    const [proof] = await fetchDonorProofs("donor-1");
    expect(proof).toMatchObject({
      id: "p1",
      file_path: PATH,
      file_name: "pop.pdf",
      payment_reference: "POP-REF",
      payment_date: "2026-10-09",
      admin_comment: "Looks good",
    });
  });

  it("still works with an older API that only sends id, status and date", async () => {
    fakeClient({});
    mockedApiList.mockResolvedValue([
      { ...donation, donation_proofs: [{ id: "p1", verification_status: "pending", uploaded_at: "2026-10-10T11:00:00Z" }] },
    ]);
    const [proof] = await fetchDonorProofs("donor-1");
    expect(proof).toMatchObject({ id: "p1", file_path: "", file_name: null, payment_reference: "DON-REF" });
  });
});

describe("getDonationProofUrl", () => {
  it("signs the stored path in the private donation-proofs bucket", async () => {
    const calls = fakeClient({});
    await expect(getDonationProofUrl({ id: "p1", file_path: PATH })).resolves.toBe(`https://signed.example/${PATH}`);
    expect(calls).toEqual([["sign", "donation-proofs", PATH, 300]]);
  });

  it("prefers a fresh signature over a possibly expired list URL", async () => {
    const calls = fakeClient({});
    await getDonationProofUrl({ id: "p1", file_path: PATH, signed_url: "https://old.example/expired" });
    expect(calls).toEqual([["sign", "donation-proofs", PATH, 300]]);
  });

  it("looks the path up (under RLS) when the list did not include it", async () => {
    const calls = fakeClient({ lookup: { data: { file_path: PATH }, error: null } });
    await expect(getDonationProofUrl({ id: "p1", file_path: "" })).resolves.toBe(`https://signed.example/${PATH}`);
    expect(calls).toEqual([
      ["from", "donation_proofs"],
      ["select", "file_path"],
      ["eq", "id", "p1"],
      ["sign", "donation-proofs", PATH, 300],
    ]);
  });

  it("uses the API signed URL when there is no path to sign", async () => {
    const calls = fakeClient({});
    await expect(getDonationProofUrl({ id: "p1", file_path: "", signed_url: "https://api.example/signed" })).resolves.toBe(
      "https://api.example/signed",
    );
    expect(calls).toEqual([]);
  });

  it("reports a missing file clearly", async () => {
    fakeClient({ sign: { data: null, error: { name: "StorageApiError", message: "Object not found", statusCode: "404" } } });
    await expect(getDonationProofUrl({ id: "p1", file_path: PATH })).rejects.toThrow(PROOF_FILE_MISSING_MESSAGE);
  });

  it("reports a proof that is not visible to the caller as missing", async () => {
    fakeClient({ lookup: { data: null, error: null } });
    await expect(getDonationProofUrl({ id: "p1", file_path: "" })).rejects.toThrow(PROOF_FILE_MISSING_MESSAGE);
  });

  it("gives a generic message for other storage errors", async () => {
    fakeClient({ sign: { data: null, error: { name: "StorageApiError", message: "boom", statusCode: "500" } } });
    await expect(getDonationProofUrl({ id: "p1", file_path: PATH })).rejects.toThrow(PROOF_FILE_ERROR_MESSAGE);
  });

  it("rejects a path that tries to leave the folder", async () => {
    const calls = fakeClient({});
    await expect(getDonationProofUrl({ id: "p1", file_path: `${USER}/../other/pop.pdf` })).rejects.toThrow(PROOF_FILE_MISSING_MESSAGE);
    expect(calls).toEqual([]);
  });
});
