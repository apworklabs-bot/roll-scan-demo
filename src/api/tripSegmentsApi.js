// src/api/tripSegmentsApi.js
import { supaFetch } from "./supabaseClient";

// Φερνει segments για συγκεκριμενο trip
export function fetchTripSegments(tripId) {
  return supaFetch(
    `/trip_segments?trip_id=eq.${tripId}&select=*&order=display_order.asc`
  );
}

// Δημιουργια νεου segment
export function createTripSegment(segment) {
  return supaFetch(`/trip_segments`, {
    method: "POST",
    headers: {
      Prefer: "return=representation",
    },
    body: segment,
  });
}

// Update υπαρχοντος segment
export function updateTripSegment(id, patch) {
  return supaFetch(`/trip_segments?id=eq.${id}`, {
    method: "PATCH",
    headers: {
      Prefer: "return=representation",
    },
    body: patch,
  });
}

// Διαγραφη segment
export function deleteTripSegment(id) {
  return supaFetch(`/trip_segments?id=eq.${id}`, {
    method: "DELETE",
  });
}
