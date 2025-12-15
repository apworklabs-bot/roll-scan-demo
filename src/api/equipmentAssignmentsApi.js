// src/api/equipmentAssignmentsApi.js
import { supaFetch } from "./supabaseClient";

const TABLE = "equipment_loans"; // πραγματικό όνομα πίνακα στο Supabase

/**
 * Φέρνει όλα τα loans/assignments για συγκεκριμένο participant + trip
 */
export async function fetchAssignmentsForParticipant(tripId, participantId) {
  if (!tripId || !participantId) return [];

  const rows = await supaFetch(
    `/${TABLE}?trip_id=eq.${tripId}&participant_id=eq.${participantId}&select=*`,
    { method: "GET" }
  );

  return Array.isArray(rows) ? rows : [];
}

/**
 * Σώζει τις εκκρεμότητες εξοπλισμού για έναν συμμετέχοντα.
 *
 * Strategy:
 * 1) Σβήνουμε ΟΛΑ τα παλιά rows για (trip, participant)
 * 2) Ξαναγράφουμε μόνο όσα μας έρχονται από το UI
 *
 * items = array από:
 * { itemId, qty?, status?, conditionOnReturn?, notes? }
 */
export async function saveAssignmentsForParticipant({
  tripId,
  participantId,
  items,
}) {
  if (!tripId || !participantId) {
    throw new Error("Λείπει tripId ή participantId");
  }

  // 1) Σβήνουμε ό,τι υπάρχει για αυτόν τον συμμετέχοντα σε αυτή την εκδρομή
  await supaFetch(
    `/${TABLE}?trip_id=eq.${tripId}&participant_id=eq.${participantId}`,
    {
      method: "DELETE",
      headers: {
        // Ζητάμε να μας επιστρέψει JSON, για να μην σκάει το supaFetch στο res.json()
        Prefer: "return=representation",
      },
    }
  );

  // 2) Αν δεν έχει items, τελειώσαμε (δεν έχει εκκρεμότητες)
  if (!items || items.length === 0) {
    return;
  }

  // 3) Ετοιμάζουμε array για insert
  const payload = items.map((it) => ({
    trip_id: tripId,
    participant_id: participantId,
    item_id: it.itemId, // π.χ. "arva-x1"
    qty: it.qty ?? 1,
    status: it.status ?? "PENDING",
    condition_on_return: it.conditionOnReturn ?? null,
    notes: it.notes ?? null,
  }));

  await supaFetch(`/${TABLE}`, {
    method: "POST",
    headers: {
      // ΕΠΙΣΗΣ: ζήτα JSON ώστε supaFetch να έχει κάτι να κάνει parse
      Prefer: "return=representation",
    },
    body: payload,
  });
}
