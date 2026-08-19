import { supabase } from "./client";

interface RemoveAllResult {
  error: Error | null;
}

/**
 * Recursively lists and removes every object under `prefix` in `bucket`.
 * Storage's list() only returns one folder level per call and marks
 * sub-folders with `id: null` (per @supabase/storage-js's FileObject type),
 * so nested folders are walked before their files are batched into one
 * remove() call. Used for the user-prefix (all sample folders) and
 * single-sample-folder (re-record) deletion cases alike.
 */
export async function removeAllUnderPrefix(bucket: string, prefix: string): Promise<RemoveAllResult> {
  const filePaths: string[] = [];
  const stack = [prefix];

  while (stack.length > 0) {
    const current = stack.pop()!;
    const { data, error } = await supabase.storage.from(bucket).list(current, { limit: 1000 });

    if (error) {
      return { error };
    }

    for (const entry of data ?? []) {
      const entryPath = `${current}/${entry.name}`;
      if (entry.id === null) {
        stack.push(entryPath);
      } else {
        filePaths.push(entryPath);
      }
    }
  }

  if (filePaths.length === 0) {
    return { error: null };
  }

  const { error } = await supabase.storage.from(bucket).remove(filePaths);
  return { error: error ?? null };
}
