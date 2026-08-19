import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import {
  fetchAdministratorProfile,
  fetchBeneficiaryProfile,
  fetchDonorProfile,
  fetchSponsorProfile,
  fetchVolunteerProfile,
} from "@/services/profiles";

export function useRoleProfile() {
  const { profile, session, isLoading: authLoading } = useAuth();
  const userId = session?.user.id;
  const role = profile?.role;
  const enabled = Boolean(isSupabaseConfigured() && userId && role);

  const query = useQuery({
    queryKey: ["role-profile", role, userId],
    enabled,
    queryFn: async () => {
      if (!userId || !role) return null;
      switch (role) {
        case "administrator":
          return { role, data: await fetchAdministratorProfile(userId) } as const;
        case "volunteer":
          return { role, data: await fetchVolunteerProfile(userId) } as const;
        case "beneficiary":
          return { role, data: await fetchBeneficiaryProfile(userId) } as const;
        case "donor":
          return { role, data: await fetchDonorProfile(userId) } as const;
        case "sponsor":
          return { role, data: await fetchSponsorProfile(userId) } as const;
        default:
          return null;
      }
    },
  });

  return {
    authLoading,
    profile,
    session,
    roleProfile: query.data?.data ?? null,
    roleProfileId: query.data?.data?.id ?? null,
    isLoading: authLoading || (enabled && query.isLoading),
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
