import { getSupabaseClientOrNull } from "@/lib/supabaseClient";
import { logSupabaseError } from "@/lib/errors";

export type StorageBucket = "donation-proofs" | "supporting-documents" | "profile-images" | "campaign-images";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_EXTENSIONS = new Set(["pdf", "jpg", "jpeg", "png", "webp"]);
const ALLOWED_IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);

function sanitizeFileName(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? "upload";
  const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/^\.+/, "").slice(0, 80);
  return cleaned || "upload";
}

function extensionOf(name: string): string {
  const parts = name.toLowerCase().split(".");
  return parts.length > 1 ? parts.at(-1) ?? "" : "";
}

function assertSafeUpload(file: File) {
  if (file.size <= 0) {
    throw new Error("The selected file is empty.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("Files must be 5 MB or smaller.");
  }

  const extension = extensionOf(file.name);
  const typeOk = ALLOWED_TYPES.has(file.type);
  const extensionOk = ALLOWED_EXTENSIONS.has(extension);

  if (!typeOk || !extensionOk) {
    throw new Error("Only PDF, JPG, PNG, and WebP files are allowed.");
  }
}

function assertSafeFolder(folder?: string): string {
  if (!folder) return "";
  if (folder.includes("..") || folder.includes("\\") || folder.startsWith("/")) {
    throw new Error("Invalid upload folder.");
  }
  return `${folder.replace(/[^a-zA-Z0-9/_-]/g, "_")}/`;
}

export async function uploadUserFile(options: {
  bucket: StorageBucket;
  userId: string;
  file: File;
  folder?: string;
}): Promise<{ path: string; fileName: string }> {
  const client = getSupabaseClientOrNull();
  if (!client) throw new Error("Uploads are temporarily unavailable. Please try again later.");

  if (!options.userId) {
    throw new Error("You must be signed in to upload a file.");
  }

  assertSafeUpload(options.file);

  const safeName = sanitizeFileName(options.file.name);
  const folder = assertSafeFolder(options.folder);
  const path = `${options.userId}/${folder}${Date.now()}-${safeName}`;

  const { error } = await client.storage.from(options.bucket).upload(path, options.file, {
    cacheControl: "3600",
    upsert: false,
    contentType: options.file.type || undefined,
  });

  if (error) {
    logSupabaseError(`uploadUserFile.${options.bucket}`, error);
    throw new Error("The file could not be uploaded. Please try again.");
  }

  return { path, fileName: options.file.name };
}

function assertSafeImage(file: File, maxBytes = MAX_IMAGE_BYTES) {
  if (file.size <= 0) {
    throw new Error("The selected file is empty.");
  }
  if (file.size > maxBytes) {
    throw new Error(maxBytes <= MAX_IMAGE_BYTES ? "Images must be 2 MB or smaller." : "Images must be 5 MB or smaller.");
  }

  const extension = extensionOf(file.name);
  if (!ALLOWED_IMAGE_TYPES.has(file.type) || !ALLOWED_IMAGE_EXTENSIONS.has(extension)) {
    throw new Error("Only JPG, PNG, and WebP images are allowed.");
  }
}

export async function uploadPublicImage(options: {
  bucket: "profile-images" | "campaign-images";
  userId: string;
  file: File;
  folder?: string;
  maxBytes?: number;
}): Promise<{ path: string; publicUrl: string }> {
  const client = getSupabaseClientOrNull();
  if (!client) throw new Error("Uploads are temporarily unavailable. Please try again later.");
  if (!options.userId) throw new Error("You must be signed in to upload a file.");

  assertSafeImage(options.file, options.maxBytes ?? MAX_IMAGE_BYTES);

  const safeName = sanitizeFileName(options.file.name);
  const folder = assertSafeFolder(options.folder);
  const path = `${options.userId}/${folder}${Date.now()}-${safeName}`;

  const { error } = await client.storage.from(options.bucket).upload(path, options.file, {
    cacheControl: "3600",
    upsert: false,
    contentType: options.file.type || undefined,
  });

  if (error) {
    logSupabaseError(`uploadPublicImage.${options.bucket}`, error);
    throw new Error("The image could not be uploaded. Please try again.");
  }

  const { data } = client.storage.from(options.bucket).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}

export async function getSignedFileUrl(bucket: StorageBucket, path: string, expiresIn = 60 * 60): Promise<string | null> {
  const client = getSupabaseClientOrNull();
  if (!client) return null;

  if (!path || path.includes("..")) {
    throw new Error("Invalid file path.");
  }

  const { data, error } = await client.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error) {
    logSupabaseError(`getSignedFileUrl.${bucket}`, error);
    throw new Error("The file could not be opened.");
  }
  return data.signedUrl;
}
