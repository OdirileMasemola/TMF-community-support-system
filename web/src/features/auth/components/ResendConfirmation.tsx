import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { REGISTRATION_COPY, RESEND_COOLDOWN_SECONDS } from "@/features/auth/lib/registration";
import { toAuthUserMessage } from "@/lib/errors";

type ResendConfirmationProps = {
  /** Pre-filled address (e.g. right after registering). When missing, the user types it. */
  email?: string;
  /** Start with the cooldown running (an email was just sent). */
  startCoolingDown?: boolean;
};

/**
 * "Resend verification email" with a client-side cooldown. Supabase also limits resends per
 * address and per hour on the server, so the cooldown is only there to avoid useless requests.
 */
export function ResendConfirmation({ email: initialEmail, startCoolingDown = false }: ResendConfirmationProps) {
  const { resendConfirmation } = useAuth();
  const [email, setEmail] = useState(initialEmail ?? "");
  const [secondsLeft, setSecondsLeft] = useState(startCoolingDown ? RESEND_COOLDOWN_SECONDS : 0);
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  async function handleResend() {
    setMessage(null);
    if (!email.trim()) {
      setMessage({ tone: "error", text: REGISTRATION_COPY.invalidEmail });
      return;
    }
    setIsSending(true);
    try {
      await resendConfirmation(email);
      setMessage({ tone: "ok", text: REGISTRATION_COPY.resent });
      setSecondsLeft(RESEND_COOLDOWN_SECONDS);
    } catch (error) {
      setMessage({ tone: "error", text: toAuthUserMessage(error) });
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="grid gap-3">
      {initialEmail ? null : (
        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      )}
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={isSending || secondsLeft > 0}
        loading={isSending}
        onClick={() => void handleResend()}
      >
        {secondsLeft > 0 ? `Resend available in ${secondsLeft}s` : "Resend verification email"}
      </Button>
      {message ? (
        <p role={message.tone === "error" ? "alert" : "status"} className={message.tone === "error" ? "text-sm text-primary" : "text-sm text-muted-foreground"}>
          {message.text}
        </p>
      ) : null}
    </div>
  );
}
