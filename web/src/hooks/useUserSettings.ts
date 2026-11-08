import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { fetchUserSettings, updateUserSettings, type SettingsPatch, type UserSettings } from "@/services/settings";

const settingsKey = (userId: string | undefined) => ["user-settings", userId] as const;

/**
 * The signed-in user's saved settings. Saves wait for Supabase before updating
 * the cache so a failed request never leaves the UI on the wrong value.
 */
export function useUserSettings() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: settingsKey(userId),
    queryFn: () => fetchUserSettings(userId!),
    enabled: Boolean(userId),
  });

  const mutation = useMutation({
    mutationFn: (patch: SettingsPatch) => updateUserSettings(userId!, patch),
    onSuccess: (saved) => {
      queryClient.setQueryData<UserSettings | null>(settingsKey(userId), saved);
    },
  });

  return {
    settings: query.data ?? null,
    query,
    save: mutation.mutateAsync,
    isSaving: mutation.isPending,
  };
}
