import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Paperclip } from "lucide-react-native";
import { useAuth } from "@/auth/AuthProvider";
import {
  AppButton,
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
import { useRoleProfile } from "@/hooks/useRoleProfile";
import { createAssistanceRequest, createSupportingDocument } from "@/services/assistance";
import { uploadUserFile } from "@/services/storage";
import { useTheme } from "@/theme/ThemeProvider";

const REQUEST_TYPES = [
  { label: "Food", value: "Food parcel" },
  { label: "Clothing", value: "Clothing" },
  { label: "School supplies", value: "School supplies" },
  { label: "Medical", value: "Medical support" },
  { label: "Other", value: "Other" },
] as const;

const PRIORITIES = [
  { label: "Normal", value: "normal" },
  { label: "High", value: "high" },
  { label: "Urgent", value: "urgent" },
] as const;

type PickedFile = { uri: string; name: string; mimeType?: string };

export default function BeneficiaryRequestScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { roleProfileId, isLoading: profileLoading } = useRoleProfile();
  const queryClient = useQueryClient();
  const { colors } = useTheme();

  const [requestType, setRequestType] = useState<string | null>(REQUEST_TYPES[0].value);
  const [priority, setPriority] = useState<string>("normal");
  const [description, setDescription] = useState("");
  const [collectionArea, setCollectionArea] = useState("");
  const [document, setDocument] = useState<PickedFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const submit = useMutation({
    mutationFn: async () => {
      if (!roleProfileId) throw new Error("Beneficiary profile was not found.");
      if (!requestType) throw new Error("Choose the kind of help you need.");
      if (description.trim().length < 10) throw new Error("Please describe your situation in a little more detail.");

      const request = await createAssistanceRequest({
        beneficiary_id: roleProfileId,
        request_type: requestType,
        description: description.trim(),
        status: "pending",
        priority,
        preferred_collection_area: collectionArea.trim() || null,
      });

      const userId = session?.user.id;
      if (document && userId) {
        const uploaded = await uploadUserFile({ bucket: "supporting-documents", userId, file: document });
        await createSupportingDocument({
          request_id: request.id,
          document_name: uploaded.fileName,
          document_type: document.mimeType ?? "image",
          file_path: uploaded.path,
          verification_status: "pending",
        });
      }

      return request;
    },
    onSuccess: async () => {
      setError(null);
      setSubmitted(true);
      setDescription("");
      setCollectionArea("");
      setDocument(null);
      await queryClient.invalidateQueries({ queryKey: ["beneficiary"] });
    },
    onError: (mutationError) =>
      setError(mutationError instanceof Error ? mutationError.message : "Could not submit your request."),
  });

  const pickDocument = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Photo access is needed to attach a supporting document.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.7 });
    if (result.canceled) return;

    const asset = result.assets[0];
    setError(null);
    setDocument({
      uri: asset.uri,
      name: asset.fileName ?? `document-${Date.now()}.jpg`,
      mimeType: asset.mimeType ?? "image/jpeg",
    });
  };

  if (profileLoading) return <LoadingState label="Loading the request form…" />;

  if (!roleProfileId) {
    return <EmptyState label="Your beneficiary profile is not set up yet. Please complete it on the web dashboard." />;
  }

  return (
    <Screen>
      <PageHeading
        eyebrow="Assistance"
        title="Ask for help"
        subtitle="Tell us what you need. A coordinator reviews every request."
      />

      {error ? <ErrorState label={error} /> : null}
      {submitted ? <SuccessBanner label="Request submitted. We will let you know as soon as it is reviewed." /> : null}

      <SectionCard title="What do you need?">
        <ChipSelect
          label="Type of assistance"
          options={REQUEST_TYPES.map((option) => ({ label: option.label, value: option.value }))}
          value={requestType}
          onChange={(value) => {
            setSubmitted(false);
            setRequestType(value);
          }}
        />

        <ChipSelect
          label="How urgent is it?"
          options={PRIORITIES.map((option) => ({ label: option.label, value: option.value }))}
          value={priority}
          onChange={setPriority}
        />

        <TextField
          label="Describe your situation"
          value={description}
          onChangeText={(text) => {
            setSubmitted(false);
            setDescription(text);
          }}
          placeholder="Tell us who needs help and why."
          multiline
          numberOfLines={5}
        />

        <TextField
          label="Preferred collection area"
          value={collectionArea}
          onChangeText={setCollectionArea}
          placeholder="e.g. Diepsloot community hall"
          hint="Where it would be easiest for you to collect."
        />

        <AppButton
          label={document ? `Attached: ${document.name}` : "Attach a supporting document (optional)"}
          variant="outline"
          onPress={pickDocument}
          icon={<Paperclip size={18} color={colors.foreground} />}
        />

        <AppButton label="Submit request" onPress={() => submit.mutate()} loading={submit.isPending} />
      </SectionCard>

      {submitted ? (
        <AppButton label="View my requests" variant="outline" onPress={() => router.replace("/beneficiary/requests")} />
      ) : null}
    </Screen>
  );
}
