// src/api/paymentsApi.js
import { supaFetch } from "./supabaseClient";

/**
 * Φέρνει όλες τις πληρωμές/χρεώσεις ενός συμμετέχοντα,
 * προαιρετικά φιλτραρισμένες σε συγκεκριμένο trip.
 */
export async function fetchParticipantPayments(participantId, tripId = null) {
  if (!participantId) {
    throw new Error("participantId is required");
  }

  let path = `/payments?participant_id=eq.${encodeURIComponent(
    participantId
  )}&select=*`;

  if (tripId) {
    path += `&trip_id=eq.${encodeURIComponent(tripId)}`;
  }

  // ταξινόμηση: πιο πρόσφατες πρώτα
  path += `&order=created_at.desc`;

  const data = await supaFetch(path);
  return data || [];
}

/**
 * Δημιουργεί μία νέα κίνηση (χρέωση ή πληρωμή).
 *
 * Παράδειγμα payload:
 * {
 *   trip_id,
 *   participant_id,
 *   kind: "PAYMENT", // ή "CHARGE"
 *   category: "OTHER",
 *   description: "Εξόφληση υπολοίπου",
 *   amount: 65,
 *   currency: "EUR",
 *   method: "CASH",
 *   status: "COMPLETED",
 *   notes: "..."
 * }
 */
export async function createPayment(payload) {
  // Supabase REST περιμένει array για insert
  const body = Array.isArray(payload) ? payload : [payload];

  const data = await supaFetch("/payments", {
    method: "POST",
    headers: {
      Prefer: "return=representation",
    },
    body,
  });

  // supaFetch θα επιστρέψει array με το inserted row
  if (Array.isArray(data) && data.length > 0) {
    return data[0];
  }
  return null;
}

/**
 * Διαγραφή κίνησης – μόνο για admin / λάθος καταχώρηση κτλ
 */
export async function deletePayment(paymentId) {
  if (!paymentId) throw new Error("paymentId is required");

  await supaFetch(`/payments?id=eq.${encodeURIComponent(paymentId)}`, {
    method: "DELETE",
  });

  return true;
}
