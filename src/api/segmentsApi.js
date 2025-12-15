// src/api/segmentsApi.js
import { supabase } from "../lib/supabaseClient";

/**
 * Φέρνει όλα τα τμήματα μιας εκδρομής
 */
export async function fetchSegmentsByTripId(tripId) {
  const { data, error } = await supabase
    .from("segments")
    .select("*")
    .eq("trip_id", tripId)
    .order("name", { ascending: true });

  if (error) {
    console.error("fetchSegmentsByTripId error", error);
    throw error;
  }

  return data || [];
}

/**
 * Δημιουργία νέου τμήματος
 */
export async function createSegment(segment) {
  const { data, error } = await supabase
    .from("segments")
    .insert(segment)
    .select()
    .single();

  if (error) {
    console.error("createSegment error", error);
    throw error;
  }

  return data;
}

/**
 * Ενημέρωση συγκεκριμένου τμήματος (by id)
 */
export async function updateSegment(segmentId, updates) {
  const { data, error } = await supabase
    .from("segments")
    .update(updates)
    .eq("id", segmentId)
    .select()
    .single();

  if (error) {
    console.error("updateSegment error", error);
    throw error;
  }

  return data;
}

/**
 * Διαγραφή συγκεκριμένου τμήματος
 */
export async function deleteSegment(segmentId) {
  const { error } = await supabase
    .from("segments")
    .delete()
    .eq("id", segmentId);

  if (error) {
    console.error("deleteSegment error", error);
    throw error;
  }
}

/**
 * Συμβατότητα με παλιό API: updateTripSegments(tripId, segments)
 * Αν κάπου στο project υπάρχει ακόμα κλήση updateTripSegments,
 * δεν θα σκάει πια.
 */
export async function updateTripSegments(tripId, segments) {
  if (!tripId) {
    throw new Error("updateTripSegments: tripId is required");
  }

  const safeSegments = (segments || []).map((s) => ({
    id: s.id || undefined, // αν έχει id -> update, αλλιώς insert
    trip_id: tripId,
    name: s.name,
    type: s.type || null,
    departure_point: s.departure_point || null,
    departure_time: s.departure_time || null,
    bus_capacity:
      s.bus_capacity !== undefined && s.bus_capacity !== null
        ? Number(s.bus_capacity)
        : null,
    notes: s.notes || null,
  }));

  if (!safeSegments.length) {
    return [];
  }

  const { data, error } = await supabase
    .from("segments")
    .upsert(safeSegments, { onConflict: "id" })
    .select();

  if (error) {
    console.error("updateTripSegments error", error);
    throw error;
  }

  return data || [];
}
