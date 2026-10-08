import { useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/auth/AuthProvider";
import { fetchUserSettings, updateUserSettings, type SettingsPatch, type UserSettings } from "@/services/settings";
import { useTheme } from "@/theme/ThemeProvider";

const settingsKey = (userId: string | undefined) => ["user-settings", userId] as const;

/** The signed-in user's saved settings, with an optimistic save. */
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
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey: settingsKey(userId) });
      const previous = queryClient.getQueryData<UserSettings | null>(settingsKey(userId));
      if (previous) {
        queryClient.setQueryData<UserSettings>(settingsKey(userId), { ...previous, ...patch });
      }
      return { previous };
    },
    onError: (_error, _patch, context) => {
      if (context?.previous) queryClient.setQueryData(settingsKey(userId), context.previous);
    },
    onSuccess: (saved) => {
      queryClient.setQueryData(settingsKey(userId), saved);
    },
  });

  return { settings: query.data ?? null, query, save: mutation.mutateAsync, isSaving: mutation.isPending };
}

/**
 * Applies the theme saved on the account once per signed-in user, so a new
 * phone picks it up. The device copy in AsyncStorage stays as the fallback
 * when the account cannot be read.
 */
export function useAccountThemeSync() {
  const { session } = useAuth();
  const { settings } = useUserSettings();
  const { mode, setMode } = useTheme();
  const appliedFor = useRef<string | null>(null);
  const userId = session?.user.id ?? null;

  useEffect(() => {
    if (!userId) {
      appliedFor.current = null;
      return;
    }
    if (!settings || settings.user_id !== userId || appliedFor.current === userId) return;

    appliedFor.current = userId;
    if (settings.theme_preference !== mode) setMode(settings.theme_preference);
  }, [userId, settings, mode, setMode]);
}
