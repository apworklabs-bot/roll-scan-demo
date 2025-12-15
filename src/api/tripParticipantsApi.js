// src/api/tripParticipantsApi.js
import { supabase } from "../lib/supabaseClient";

/** Όλοι οι συμμετέχοντες ενός trip */
export async function fetchParticipantsByTripId(tripId) {
  const { data, error } = await supabase
    .from("trip_participants")
    .select("*")
    .eq("trip_id", tripId)
    .order("full_name", { ascending: true });

  if (error) {
    console.error("fetchParticipantsByTripId error", error);
    throw error;
  }

  return data || [];
}

/** Αλλαγή segment σε participant */
export async function updateParticipantSegment(participantId, segmentId) {
  const { data, error } = await supabase
    .from("trip_participants")
    .update({ segment_id: segmentId })
    .eq("id", participantId)
    .select()
    .single();

  if (error) {
    console.error("updateParticipantSegment error", error);
    throw error;
  }

  return data;
}
