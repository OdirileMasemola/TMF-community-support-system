import { getSupabaseClientOrNull } from "@/lib/supabaseClient";
import { logSupabaseError } from "@/lib/errors";

export type StorageBucket = "donation-proofs" | "supporting-documents";

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function uploadUserFile(options: {
  bucket: StorageBucket;
  userId: string;
  file: File;
  folder?: string;
}): Promise<{ path: string; fileName: string }> {
  const client = getSupabaseClientOrNull();
  if (!client) throw new Error("Supabase is not configured.");

  const safeName = sanitizeFileName(options.file.name);
  const folder = options.folder ? `${options.folder}/` : "";
  const path = `${options.userId}/${folder}${Date.now()}-${safeName}`;

  const { error } = await client.storage.from(options.bucket).upload(path, options.file, {
    cacheControl: "3600",
    upsert: false,
    contentType: options.file.type || undefined,
  });

  if (error) {
    logSupabaseError(`uploadUserFile.${options.bucket}`, error);
    throw error;
  }

  return { path, fileName: options.file.name };
}

export async function getSignedFileUrl(bucket: StorageBucket, path: string, expiresIn = 60 * 60): Promise<string | null> {
  const client = getSupabaseClientOrNull();
  if (!client) return null;

  const { data, error } = await client.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error) {
    logSupabaseError(`getSignedFileUrl.${bucket}`, error);
    throw error;
  }
  return data.signedUrl;
}
