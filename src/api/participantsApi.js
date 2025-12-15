// src/api/participantsApi.js
import { supaFetch } from "./supabaseClient";

/**
 * Φέρνει participants από Supabase.
 *
 * Μπορεί να κληθεί με δύο τρόπους:
 *  1) fetchParticipants("trip-uuid")
 *  2) fetchParticipants(queryContext)  // React Query queryFn
 *
 * - Αν ΔΕΝ βρούμε tripId  → επιστρέφουμε ΟΛΟΥΣ τους participants
 * - Αν βρούμε tripId      → φιλτράρουμε trip_id = eq.tripId
 */
export async function fetchParticipants(arg) {
  let tripId = null;

  // 1) Αν είναι string, το παίρνουμε ως tripId
  if (typeof arg === "string") {
    tripId = arg;
  }
  // 2) Αν είναι queryContext από React Query (queryFn: fetchParticipants)
  else if (arg && typeof arg === "object" && Array.isArray(arg.queryKey)) {
    const maybeId = arg.queryKey[1]; // ["participants", tripId]
    if (typeof maybeId === "string" && maybeId !== "ALL") {
      tripId = maybeId;
    }
  }

  // Φτιάχνουμε URL
  let url = "/participants?select=*";
  if (tripId) {
    url += `&trip_id=eq.${tripId}`;
  }

  const data = await supaFetch(url);
  return data || [];
}

/**
 * Επιστρέφει map με counts συμμετεχόντων ανά segment_id
 * π.χ. { "seg-uuid-1": 2, "seg-uuid-2": 1 }
 */
export async function fetchParticipantCountsBySegment(tripId) {
  if (!tripId) return {};

  const data = await supaFetch(
    `/participants?trip_id=eq.${tripId}&select=id,segment_id`
  );

  const counts = {};
  for (const row of data || []) {
    if (!row.segment_id) continue;
    counts[row.segment_id] = (counts[row.segment_id] || 0) + 1;
  }

  return counts;
}
