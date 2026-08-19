"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

/**
 * Tracks one row's live state, seeded from an initial fetch and kept in sync
 * via a Realtime UPDATE subscription on `table` filtered to this row's id.
 * Requires the table to be in the supabase_realtime publication — RLS scopes
 * which rows a subscriber can see, but publication membership is what makes
 * postgres_changes fire at all.
 */
export function useRealtimeRow<T extends { id: string }>(table: string, initialRow: T): T {
  const [row, setRow] = useState(initialRow);
  const [seededId, setSeededId] = useState(initialRow.id);

  // Reset during render (not an effect) when the row identity itself
  // changes — the React-recommended way to adjust state from a prop change
  // without an extra render. Once subscribed, a live update should stay
  // authoritative even if the parent re-fetches and passes the same id back
  // with stale data.
  if (initialRow.id !== seededId) {
    setSeededId(initialRow.id);
    setRow(initialRow);
  }

  useEffect(() => {
    const channel = supabase
      .channel(`${table}:${initialRow.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table, filter: `id=eq.${initialRow.id}` },
        (payload) => setRow(payload.new as T)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, initialRow.id]);

  return row;
}
