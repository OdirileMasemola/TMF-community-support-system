import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { getInitials } from "@/lib/display";
import { toUserMessage } from "@/lib/errors";
import { updateProfile } from "@/services/profiles";
import { uploadPublicImage } from "@/services/storage";

const AVATAR_CHANGE_LIMIT = 3;
const LOCKED_MESSAGE = "You have used all 3 profile picture changes. Your current photo is now locked.";

export function ProfilePictureEditor() {
  const { profile, session, refreshProfile } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const name = profile?.full_name ?? "Member";
  const avatarUrl = profile?.avatar_url ?? null;
  const changeCount = profile?.avatar_change_count ?? 0;
  const remaining = Math.max(0, AVATAR_CHANGE_LIMIT - changeCount);
  const locked = remaining === 0;

  async function handleFile(file: File | undefined) {
    const userId = session?.user.id ?? profile?.id;
    if (!userId || !file) return;

    if (locked) {
      toast.error(LOCKED_MESSAGE);
      return;
    }

    setIsUploading(true);
    try {
      const uploaded = await uploadPublicImage({
        bucket: "profile-images",
        userId,
        file,
      });
      await updateProfile(userId, { avatar_url: uploaded.publicUrl });
      await refreshProfile();
      const nextRemaining = remaining - 1;
      toast.success(
        nextRemaining > 0
          ? `Profile picture updated. You can change it ${nextRemaining} more time${nextRemaining === 1 ? "" : "s"}.`
          : "Profile picture updated. This was your last change.",
      );
    } catch (error) {
      const raw = error instanceof Error ? error.message : "";
      if (raw.toLowerCase().includes("3 times")) {
        toast.error(LOCKED_MESSAGE);
      } else {
        toast.error(raw.includes("2 MB") || raw.includes("JPG") ? raw : toUserMessage("Could not update your profile picture."));
      }
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col items-center text-center">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={`${name} profile picture`}
          width={80}
          height={80}
          className="size-20 rounded-lg object-cover"
        />
      ) : (
        <span className="flex size-20 items-center justify-center rounded-lg bg-primary text-xl font-bold text-primary-foreground">
          {getInitials(name)}
        </span>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event) => void handleFile(event.target.files?.[0])}
      />

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-4"
        disabled={locked || isUploading}
        onClick={() => inputRef.current?.click()}
      >
        {isUploading ? "Uploading..." : avatarUrl ? "Change photo" : "Add photo"}
      </Button>

      <p className="mt-2 max-w-[16rem] text-xs text-muted-foreground" role="status">
        {locked
          ? LOCKED_MESSAGE
          : `You can change your profile picture ${remaining} more time${remaining === 1 ? "" : "s"}.`}
      </p>
    </div>
  );
}
