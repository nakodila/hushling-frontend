import { supabase } from "./client";

/** Short-lived signed URL for a private-bucket object. Callers should fetch
 *  this lazily (e.g. on play) and re-fetch rather than cache it indefinitely. */
export async function createSignedUrl(
  bucket: string,
  path: string,
  ttlSeconds: number
): Promise<string> {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, ttlSeconds);

  if (error || !data) {
    throw new Error(error?.message ?? "Could not create a signed URL");
  }

  return data.signedUrl;
}
