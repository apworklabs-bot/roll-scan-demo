// src/api/tripsApi.js
// API helpers για πίνακα trips + segments στο Supabase

import { supabase } from "../lib/supabaseClient";

/**
 * Φέρνει όλες τις εκδρομές (λίστα Admin)
 */
export async function fetchTrips() {
  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .order("start_date", { ascending: true });

  if (error) {
    console.error("fetchTrips error:", error);
    throw error;
  }

  return data || [];
}

/**
 * Φέρνει μία εκδρομή με βάση το id
 */
export async function fetchTripById(tripId) {
  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .eq("id", tripId)
    .single();

  if (error) {
    console.error("fetchTripById error:", error);
    throw error;
  }

  return data;
}

/**
 * Δημιουργία νέας εκδρομής + αρχικά segments
 * (ασφαλής με το νέο schema: χρησιμοποιεί ΠΙΝΑΚΑ segments, ΟΧΙ trip_segments,
 * και δεν στέλνει καθόλου πεδίο leader)
 */
export async function createTripWithSegments(trip, segments = []) {
  // 1) Insert στο trips
  const tripInsert = {
    name: trip.name?.trim() || null,
    code: trip.code?.trim() || null,
    area: trip.location?.trim() || null,
    start_date: trip.startDate || null,
    end_date: trip.endDate || null,
    difficulty: trip.difficulty || null,
    max_participants: trip.maxParticipants || null,
    meeting_point: trip.meetingPoint?.trim() || null,
    meeting_time: trip.meetingTime || null,
    internal_notes: trip.notes?.trim() || null,
  };

  const { data: newTrip, error: tripError } = await supabase
    .from("trips")
    .insert(tripInsert)
    .select()
    .single();

  if (tripError) {
    console.error("createTripWithSegments – trip insert error:", tripError);
    throw tripError;
  }

  // 2) Προετοιμασία segments για insert στον ΠΙΝΑΚΑ segments
  const segmentsToInsert = (segments || [])
    .filter((s) => s.name && s.name.trim() !== "")
    .map((s) => ({
      trip_id: newTrip.id,
      name: s.name.trim(),
      bus_capacity: s.capacity || null,
      type: null,
      leader_account_id: null,
      departure_point: null,
      departure_time: null,
      notes: s.leader ? `Υπεύθυνος: ${s.leader.trim()}` : null,
    }));

  if (segmentsToInsert.length > 0) {
    const { error: segError } = await supabase
      .from("segments") // ⚠️ ΟΧΙ trip_segments
      .insert(segmentsToInsert);

    if (segError) {
      console.error("createTripWithSegments – segments insert error:", segError);
      // δεν κάνουμε throw εδώ για να ΜΗΝ ακυρώσουμε την εκδρομή
    }
  }

  return newTrip;
}

/**
 * Ενημέρωση εκδρομής (χωρίς segments)
 */
export async function updateTrip(tripId, updates) {
  const payload = {
    name: updates.name?.trim() ?? undefined,
    code: updates.code?.trim() ?? undefined,
    area: updates.location?.trim() ?? undefined,
    start_date: updates.startDate ?? undefined,
    end_date: updates.endDate ?? undefined,
    difficulty: updates.difficulty ?? undefined,
    max_participants: updates.maxParticipants ?? undefined,
    meeting_point: updates.meetingPoint?.trim() ?? undefined,
    meeting_time: updates.meetingTime ?? undefined,
    internal_notes: updates.notes?.trim() ?? undefined,
  };

  const { data, error } = await supabase
    .from("trips")
    .update(payload)
    .eq("id", tripId)
    .select()
    .single();

  if (error) {
    console.error("updateTrip error:", error);
    throw error;
  }

  return data;
}

/**
 * Διαγραφή εκδρομής
 */
export async function deleteTrip(tripId) {
  const { error } = await supabase
    .from("trips")
    .delete()
    .eq("id", tripId);

  if (error) {
    console.error("deleteTrip error:", error);
    throw error;
  }
}
