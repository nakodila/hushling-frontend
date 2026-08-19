import { supabase } from "./client";
import { removeAllUnderPrefix } from "./storageCleanup";

interface VoiceSampleForDeletion {
  id: string;
  rvc_model_path: string | null;
}

interface DeleteVoiceDataResult {
  error: string | null;
}

/**
 * Deletes everything derived from a user's voice: their generated lullabies
 * (renditions, storage + db row), their trained voice model (storage), their
 * recorded audio (storage), and the voice_samples row itself. Shared between
 * the settings page's "delete my voice data" flow and the nav's "delete
 * account" flow — the set of things to remove is identical, only what
 * happens after (stay signed in vs. sign out) differs.
 */
export async function deleteAllVoiceData(
  userId: string,
  voiceSample: VoiceSampleForDeletion,
  onStep?: (step: string) => void
): Promise<DeleteVoiceDataResult> {
  onStep?.("Finding your generated lullabies…");
  const { data: renditions, error: renditionsFetchError } = await supabase
    .from("renditions")
    .select("id, output_path")
    .eq("voice_sample_id", voiceSample.id);

  if (renditionsFetchError) {
    return {
      error: `Couldn't look up your generated lullabies: ${renditionsFetchError.message}. Nothing was deleted — you can try again.`,
    };
  }

  const renditionPaths = (renditions ?? [])
    .map((r) => r.output_path)
    .filter((p): p is string => !!p);

  if (renditionPaths.length > 0) {
    onStep?.("Removing your generated lullabies…");
    const { error: renditionStorageError } = await supabase.storage
      .from("renditions")
      .remove(renditionPaths);

    if (renditionStorageError) {
      return {
        error: `Couldn't remove your generated lullaby files: ${renditionStorageError.message}. Nothing was deleted — you can try again.`,
      };
    }
  }

  onStep?.("Removing your recorded audio…");
  const { error: voiceStorageError } = await removeAllUnderPrefix("voice-samples", userId);
  if (voiceStorageError) {
    return {
      error: `Couldn't remove your recorded audio: ${voiceStorageError.message}. Your generated lullaby files were already removed — you can try again.`,
    };
  }

  if (voiceSample.rvc_model_path) {
    // voice-models has no SELECT/list policy for authenticated users (by
    // design — the raw model is never meant to be readable, only
    // erasable), so this deletes the exact known key from
    // rvc_model_path rather than discovering it via list().
    onStep?.("Removing your trained voice model…");
    const { error: modelStorageError } = await supabase.storage
      .from("voice-models")
      .remove([voiceSample.rvc_model_path]);

    if (modelStorageError) {
      return {
        error: `Couldn't remove your trained voice model: ${modelStorageError.message}. Your recorded audio was already removed — you can try again.`,
      };
    }
  }

  if (renditionPaths.length > 0) {
    onStep?.("Removing your generated lullaby records…");
    const { error: renditionsDeleteError } = await supabase
      .from("renditions")
      .delete()
      .eq("voice_sample_id", voiceSample.id);

    if (renditionsDeleteError) {
      return {
        error: `Couldn't remove your generated lullaby records: ${renditionsDeleteError.message}. Files were already removed — you can try again.`,
      };
    }
  }

  onStep?.("Removing your voice sample record…");
  const { error: voiceRowError } = await supabase.from("voice_samples").delete().eq("id", voiceSample.id);

  if (voiceRowError) {
    return {
      error: `Couldn't remove your voice sample record: ${voiceRowError.message}. Everything else was already deleted — you can try again.`,
    };
  }

  return { error: null };
}
