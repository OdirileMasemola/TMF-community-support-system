import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Clipboard from "expo-clipboard";
import * as ImagePicker from "expo-image-picker";
import { Check, Copy, Paperclip } from "lucide-react-native";
import { useAuth } from "@/auth/AuthProvider";
import {
  AppButton,
  Card,
  ChipSelect,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeading,
  Screen,
  SectionCard,
  SuccessBanner,
  TextField,
} from "@/components/ui";
import { bankingDetails } from "@/data/donationData";
import { useRoleProfile } from "@/hooks/useRoleProfile";
import { formatCurrency } from "@/lib/display";
import { fetchCampaigns } from "@/services/campaigns";
import { createDonation, createDonationProof } from "@/services/donations";
import { uploadUserFile } from "@/services/storage";
import { useTheme, useThemedStyles } from "@/theme/ThemeProvider";
import { spacing, typography, type ThemeColors } from "@/theme/tokens";

type Allocation = "campaign" | "general";
type PickedFile = { uri: string; name: string; mimeType?: string };

const today = () => new Date().toISOString().slice(0, 10);

export default function DonorDonateScreen() {
  const { session } = useAuth();
  const { roleProfileId, isLoading: profileLoading } = useRoleProfile();
  const queryClient = useQueryClient();
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();

  const [allocation, setAllocation] = useState<Allocation>("campaign");
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [paymentDate, setPaymentDate] = useState(today);
  const [donationId, setDonationId] = useState<string | null>(null);
  const [proof, setProof] = useState<PickedFile | null>(null);
  const [proofSubmitted, setProofSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const campaignsQuery = useQuery({
    queryKey: ["campaigns", "public"],
    queryFn: () => fetchCampaigns({ publicOnly: true }),
  });

  const campaigns = campaignsQuery.data ?? [];

  useEffect(() => {
    if (!campaignId && campaigns[0]?.id) setCampaignId(campaigns[0].id);
  }, [campaignId, campaigns]);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!roleProfileId) throw new Error("Donor profile was not found.");
      const parsed = Number(amount.replace(/[^0-9.]/g, ""));
      if (!Number.isFinite(parsed) || parsed <= 0) throw new Error("Enter a valid donation amount.");
      if (!reference.trim()) throw new Error("Enter the payment reference you used.");
      if (allocation === "campaign" && !campaignId) throw new Error("Select a campaign.");

      return createDonation({
        donor_id: roleProfileId,
        campaign_id: allocation === "campaign" ? campaignId : null,
        amount: parsed,
        donation_date: paymentDate,
        payment_method: "EFT",
        status: "pending",
        donation_kind: "money",
        payment_reference: reference.trim(),
      });
    },
    onSuccess: async (donation) => {
      setFormError(null);
      setDonationId(donation.id);
      await queryClient.invalidateQueries({ queryKey: ["donor"] });
    },
    onError: (error) => setFormError(error instanceof Error ? error.message : "Could not record the donation."),
  });

  const proofMutation = useMutation({
    mutationFn: async () => {
      const userId = session?.user.id;
      if (!userId) throw new Error("You are not signed in.");
      if (!donationId) throw new Error("Record the donation before uploading proof.");
      if (!proof) throw new Error("Attach a photo of your payment confirmation.");

      const uploaded = await uploadUserFile({ bucket: "donation-proofs", userId, file: proof });

      return createDonationProof({
        donation_id: donationId,
        file_path: uploaded.path,
        file_name: uploaded.fileName,
        payment_reference: reference.trim() || null,
        payment_date: paymentDate || null,
        verification_status: "pending",
      });
    },
    onSuccess: async () => {
      setFormError(null);
      setProof(null);
      setProofSubmitted(true);
      await queryClient.invalidateQueries({ queryKey: ["donor"] });
    },
    onError: (error) => setFormError(error instanceof Error ? error.message : "Could not upload the proof."),
  });

  const pickProof = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setFormError("Photo access is needed to attach your proof of payment.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    setFormError(null);
    setProof({
      uri: asset.uri,
      name: asset.fileName ?? `proof-${Date.now()}.jpg`,
      mimeType: asset.mimeType ?? "image/jpeg",
    });
  };

  const copy = async (label: string, value: string) => {
    await Clipboard.setStringAsync(value);
    setCopied(label);
  };

  const startAnother = () => {
    setDonationId(null);
    setProof(null);
    setProofSubmitted(false);
    setAmount("");
    setReference("");
    setPaymentDate(today());
  };

  if (profileLoading) return <LoadingState label="Loading the donation form…" />;

  if (!roleProfileId) {
    return <EmptyState label="Your donor profile is not set up yet. Please complete it on the web dashboard." />;
  }

  const bankRows: Array<[string, string]> = [
    ["Bank", bankingDetails.bankName],
    ["Account holder", bankingDetails.accountHolder],
    ["Account number", bankingDetails.accountNumber],
    ["Account type", bankingDetails.accountType],
    ["Branch code", bankingDetails.branchCode],
    ["Reference", reference.trim() || "Your payment reference"],
  ];

  return (
    <Screen>
      <PageHeading
        eyebrow="Your support"
        title="Make a donation"
        subtitle="Pay by EFT using the details below, then record it here and attach your proof."
      />

      {formError ? <ErrorState label={formError} /> : null}

      <SectionCard title="TMF banking details">
        {bankRows.map(([label, value]) => (
          <Pressable
            key={label}
            accessibilityRole="button"
            accessibilityLabel={`Copy ${label}`}
            onPress={() => copy(label, value)}
            style={({ pressed }) => [styles.bankRow, pressed && styles.bankRowPressed]}
          >
            <Text style={styles.bankLabel}>{label}</Text>
            <View style={styles.bankValueWrap}>
              <Text style={styles.bankValue} numberOfLines={2}>
                {value}
              </Text>
              {copied === label ? (
                <Check size={14} color={colors.success} />
              ) : (
                <Copy size={14} color={colors.mutedForeground} />
              )}
            </View>
          </Pressable>
        ))}
        <Text style={styles.hint}>Tap any line to copy it.</Text>
      </SectionCard>

      {donationId ? (
        <SectionCard title="Attach proof of payment">
          <SuccessBanner
            label={`Donation of ${formatCurrency(Number(amount.replace(/[^0-9.]/g, "")) || 0)} recorded and awaiting verification.`}
          />

          {proofSubmitted ? (
            <>
              <SuccessBanner label="Proof submitted. An administrator will verify it shortly." />
              <AppButton label="Record another donation" variant="outline" onPress={startAnother} />
            </>
          ) : (
            <>
              <AppButton
                label={proof ? `Attached: ${proof.name}` : "Choose a photo or screenshot"}
                variant="outline"
                onPress={pickProof}
                icon={<Paperclip size={18} color={colors.foreground} />}
              />
              <AppButton
                label="Submit proof"
                onPress={() => proofMutation.mutate()}
                loading={proofMutation.isPending}
                disabled={!proof}
              />
              <AppButton label="Skip for now" variant="ghost" onPress={startAnother} />
            </>
          )}
        </SectionCard>
      ) : (
        <SectionCard title="Donation details">
          <ChipSelect<Allocation>
            label="Where should it go?"
            options={[
              { label: "A campaign", value: "campaign" },
              { label: "General fund", value: "general" },
            ]}
            value={allocation}
            onChange={setAllocation}
          />

          {allocation === "campaign" ? (
            campaignsQuery.isLoading ? (
              <LoadingState label="Loading campaigns…" />
            ) : campaigns.length ? (
              <ChipSelect
                label="Campaign"
                options={campaigns.map((campaign) => ({ label: campaign.title, value: campaign.id }))}
                value={campaignId}
                onChange={setCampaignId}
              />
            ) : (
              <Card>
                <Text style={styles.hint}>No active campaigns right now. Choose the general fund instead.</Text>
              </Card>
            )
          ) : null}

          <TextField
            label="Amount (ZAR)"
            value={amount}
            onChangeText={setAmount}
            placeholder="500"
            keyboardType="decimal-pad"
          />
          <TextField
            label="Payment reference"
            value={reference}
            onChangeText={setReference}
            placeholder="e.g. TMF-JANE-01"
            hint="Use the same reference on your EFT so we can match it."
            autoCapitalize="characters"
          />
          <TextField
            label="Payment date"
            value={paymentDate}
            onChangeText={setPaymentDate}
            placeholder="YYYY-MM-DD"
            autoCapitalize="none"
          />

          <AppButton
            label="Record donation"
            onPress={() => createMutation.mutate()}
            loading={createMutation.isPending}
          />
        </SectionCard>
      )}
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    bankRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.md,
      paddingVertical: spacing.md,
      borderBottomColor: colors.borderSubtle,
      borderBottomWidth: 1,
    },
    bankRowPressed: {
      opacity: 0.6,
    },
    bankLabel: {
      ...typography.caption,
      color: colors.mutedForeground,
    },
    bankValueWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      flexShrink: 1,
    },
    bankValue: {
      ...typography.label,
      color: colors.foreground,
      textAlign: "right",
      flexShrink: 1,
    },
    hint: {
      ...typography.caption,
      color: colors.mutedForeground,
      paddingTop: spacing.sm,
    },
  });
