import { useState } from "react";
import { toast } from "sonner";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { DashboardCard } from "@/components/efferd/dashboard-card";
import { LoadingState } from "@/components/ui/Spinner";
import { useUserSettings } from "@/hooks/useUserSettings";
import { NOTIFICATION_PREFERENCE_OPTIONS, type NotificationPreferenceField } from "@/services/settings";
import { toUserMessage } from "@/lib/errors";

/**
 * The three in-app notification toggles from user_settings. Saving is per
 * toggle so users get immediate feedback without a separate form submit.
 */
export function NotificationPreferencesPanel() {
  const { settings, query, save, isSaving } = useUserSettings();
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [pendingField, setPendingField] = useState<NotificationPreferenceField | null>(null);

  async function toggle(field: NotificationPreferenceField, next: boolean) {
    if (isSaving) return;
    setFieldError(null);
    setPendingField(field);
    try {
      await save({ [field]: next });
      toast.success("Notification preference saved.");
    } catch {
      setFieldError("Your notification choice could not be saved. Please try again.");
      toast.error(toUserMessage("Could not save notification preference."));
    } finally {
      setPendingField(null);
    }
  }

  return (
    <DashboardCard>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>Choose which in-app updates you want to see. Saved to your account.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {query.isLoading ? <LoadingState message="Loading your notification preferences…" /> : null}

        {NOTIFICATION_PREFERENCE_OPTIONS.map((option) => {
          const checked = settings?.[option.field] ?? true;
          const busy = pendingField === option.field && isSaving;
          const disabled = !settings || isSaving;

          return (
            <div key={option.field} className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{option.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{option.hint}</p>
              </div>
              <label className="flex shrink-0 items-center gap-2">
                <input
                  type="checkbox"
                  className="size-4 accent-primary"
                  checked={checked}
                  disabled={disabled}
                  aria-busy={busy || undefined}
                  onChange={(event) => void toggle(option.field, event.target.checked)}
                />
                {busy ? <span className="sr-only">Saving…</span> : null}
              </label>
            </div>
          );
        })}

        {query.isError ? (
          <p className="text-sm text-primary" role="alert">
            Your saved preferences could not be loaded. Check your connection and open Settings again.
          </p>
        ) : null}
        {fieldError ? (
          <p className="text-sm text-primary" role="alert">
            {fieldError}
          </p>
        ) : null}
      </CardContent>
    </DashboardCard>
  );
}
