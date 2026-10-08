import { validationError } from '../supabase/errors.js';
import type { UserId } from '../types/auth.types.js';

/**
 * Storage object path `<auth user id>/<path>`: no leading slash, no backslashes and no "..".
 * The private buckets (donation-proofs, supporting-documents) only accept uploads whose first folder
 * is the uploader's auth user id, so a path outside that folder cannot be the caller's own file.
 */
export const OWN_FILE_PATH_PATTERN = '^(?!.*\\.\\.)[0-9A-Fa-f-]{36}/[A-Za-z0-9._/-]+$';
export const FILE_PATH_MAX_LENGTH = 500;

/** Throws 400 unless `filePath` is a file inside the caller's own storage folder. */
export function assertOwnFolder(filePath: string, userId: UserId): void {
  const [folder, ...rest] = filePath.split('/');
  if (folder?.toLowerCase() !== userId.toLowerCase() || rest.join('/') === '') {
    throw validationError('file_path must be inside your own folder: <your user id>/<file name>');
  }
}
