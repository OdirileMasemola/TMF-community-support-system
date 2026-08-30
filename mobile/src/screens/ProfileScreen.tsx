import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/auth/AuthProvider";
import {
  AppButton,
  Badge,
  Card,
  ChipSelect,
  ErrorState,
  LoadingState,
  PageHeading,
  Screen,
  SectionCard,
  SuccessBanner,
  TextField,
} from "@/components/ui";
import { useRoleProfile } from "@/hooks/useRoleProfile";
import { formatShortDate, formatStatusLabel } from "@/lib/display";
import { portalNameFor } from "@/navigation/portalTabs";
import {
  updateBeneficiaryProfile,
  updateDonorProfile,
  updateProfile,
  updateSponsorProfile,
  updateVolunteerProfile,
} from "@/services/profiles";

const AVAILABILITY_OPTIONS = [
  { label: "Available", value: "available" },
  { label: "Busy", value: "busy" },
  { label: "Unavailable", value: "unavailable" },
] as const;

/** Editable account details, shared by all five portals. */
export function ProfileScreen() {
  const { profile, session, refreshProfile } = useAuth();
  const { roleProfile, roleProfileId, isLoading, isError, refetch } = useRoleProfile();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [roleFields, setRoleFields] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  // Seed the form once the server rows arrive, and re-seed after a refetch.
  useEffect(() => {
    setFullName(profile?.full_name ?? "");
    setPhone(profile?.phone_number ?? "");
  }, [profile?.full_name, profile?.phone_number]);

  useEffect(() => {
    if (!roleProfile) return;
    const row = roleProfile as Record<string, unknown>;
    const seed: Record<string, string> = {};
    for (const key of [
      "residential_address",
      "availability_status",
      "preferred_area",
      "assistance_type",
      "donation_preference",
      "organisation_name",
      "representative_name",
      "business_address",
      "sponsorship_type",
    ]) {
      if (key in row) seed[key] = (row[key] as string | null) ?? "";
    }
    setRoleFields(seed);
  }, [roleProfile]);

  const setField = (key: string) => (value: string) => {
    setSaved(false);
    setRoleFields((current) => ({ ...current, [key]: value }));
  };

  const save = useMutation({
    mutationFn: async () => {
      const userId = session?.user.id;
      if (!userId) throw new Error("You are not signed in.");

      await updateProfile(userId, {
        full_name: fullName.trim(),
        phone_number: phone.trim() || null,
      });

      if (!roleProfileId) return;

      switch (profile?.role) {
        case "volunteer":
          await updateVolunteerProfile(roleProfileId, {
            residential_address: roleFields.residential_address?.trim() || null,
            availability_status: roleFields.availability_status || null,
            preferred_area: roleFields.preferred_area?.trim() || null,
          });
          break;
        case "beneficiary":
          await updateBeneficiaryProfile(roleProfileId, {
            residential_address: roleFields.residential_address?.trim() || null,
            assistance_type: roleFields.assistance_type?.trim() || null,
          });
          break;
        case "donor":
          await updateDonorProfile(roleProfileId, {
            donation_preference: roleFields.donation_preference?.trim() || null,
          });
          break;
        case "sponsor":
          await updateSponsorProfile(roleProfileId, {
            organisation_name: roleFields.organisation_name?.trim() || "Organisation",
            representative_name: roleFields.representative_name?.trim() || null,
            business_address: roleFields.business_address?.trim() || null,
            sponsorship_type: roleFields.sponsorship_type?.trim() || null,
          });
          break;
        default:
          break;
      }
    },
    onSuccess: async () => {
      setSaved(true);
      await refreshProfile();
      await refetch();
    },
  });

  if (isLoading) return <LoadingState label="Loading your profile…" />;

  return (
    <Screen onRefresh={() => refetch()} refreshing={false}>
      <PageHeading eyebrow="Account" title="Your profile" subtitle={portalNameFor(profile?.role)} />

      {isError ? <ErrorState label="Could not load your role profile. Pull down to retry." /> : null}
      {save.isError ? <ErrorState label="Could not save your profile. Please try again." /> : null}
      {saved ? <SuccessBanner label="Profile updated." /> : null}

      <Card>
        <Badge label={formatStatusLabel(profile?.account_status)} status={profile?.account_status} />
        <TextField label="Email" value={profile?.email ?? ""} editable={false} />
        {"member_since" in (roleProfile ?? {}) ? (
          <TextField
            label="Member since"
            value={formatShortDate((roleProfile as { member_since?: string | null }).member_since)}
            editable={false}
          />
        ) : null}
      </Card>

      <SectionCard title="Personal details">
        <TextField
          label="Full name"
          value={fullName}
          onChangeText={(text) => {
            setSaved(false);
            setFullName(text);
          }}
          placeholder="Your full name"
          autoCapitalize="words"
        />
        <TextField
          label="Phone number"
          value={phone}
          onChangeText={(text) => {
            setSaved(false);
            setPhone(text);
          }}
          placeholder="e.g. 082 000 0000"
          keyboardType="phone-pad"
        />
      </SectionCard>

      {profile?.role === "volunteer" ? (
        <SectionCard title="Volunteering details">
          <ChipSelect
            label="Availability"
            options={AVAILABILITY_OPTIONS}
            value={(roleFields.availability_status as (typeof AVAILABILITY_OPTIONS)[number]["value"]) || null}
            onChange={(value) => setField("availability_status")(value)}
          />
          <TextField
            label="Preferred area"
            value={roleFields.preferred_area ?? ""}
            onChangeText={setField("preferred_area")}
            placeholder="e.g. Soweto"
          />
          <TextField
            label="Residential address"
            value={roleFields.residential_address ?? ""}
            onChangeText={setField("residential_address")}
            placeholder="Street, suburb, city"
            multiline
          />
        </SectionCard>
      ) : null}

      {profile?.role === "beneficiary" ? (
        <SectionCard title="Assistance details">
          <TextField
            label="Assistance type"
            value={roleFields.assistance_type ?? ""}
            onChangeText={setField("assistance_type")}
            placeholder="e.g. Food parcels"
          />
          <TextField
            label="Residential address"
            value={roleFields.residential_address ?? ""}
            onChangeText={setField("residential_address")}
            placeholder="Street, suburb, city"
            multiline
          />
        </SectionCard>
      ) : null}

      {profile?.role === "donor" ? (
        <SectionCard title="Giving preferences">
          <TextField
            label="Donation preference"
            value={roleFields.donation_preference ?? ""}
            onChangeText={setField("donation_preference")}
            placeholder="e.g. Education campaigns"
            hint="Helps us tell you about causes you care about."
          />
        </SectionCard>
      ) : null}

      {profile?.role === "sponsor" ? (
        <SectionCard title="Organisation">
          <TextField
            label="Organisation name"
            value={roleFields.organisation_name ?? ""}
            onChangeText={setField("organisation_name")}
            placeholder="Registered name"
          />
          <TextField
            label="Representative"
            value={roleFields.representative_name ?? ""}
            onChangeText={setField("representative_name")}
            placeholder="Contact person"
          />
          <TextField
            label="Sponsorship type"
            value={roleFields.sponsorship_type ?? ""}
            onChangeText={setField("sponsorship_type")}
            placeholder="e.g. Cash, in-kind"
          />
          <TextField
            label="Business address"
            value={roleFields.business_address ?? ""}
            onChangeText={setField("business_address")}
            placeholder="Street, suburb, city"
            multiline
          />
        </SectionCard>
      ) : null}

      <AppButton
        label="Save changes"
        onPress={() => save.mutate()}
        loading={save.isPending}
        disabled={!fullName.trim()}
      />
    </Screen>
  );
}
