// src/store/tripSegmentsStore.js
import { create } from "zustand";
import { persist } from "zustand/middleware";

function makeId(prefix = "seg") {
  return prefix + "-" + Math.random().toString(36).slice(2, 8);
}

const INITIAL_TRIPS = {
  "parnassos-2025": {
    segments: [
      {
        id: "seg-1",
        name: "ΑΘΗΝΑ → ΚΑΛΑΜΠΑΚΑ",
        type: "boarding",
        scheduled_time: "2026-01-12T07:00",
        window_start: "",
        window_end: "",
        grace_minutes: 15,
        location: "Αθήνα – Σημείο αναχώρησης",
        order: 1,
        is_active: true,
        participants: [],
      },
    ],
  },
};

export const useTripSegmentsStore = create(
  persist(
    (set, get) => ({
      trips: INITIAL_TRIPS,

      // ΔΕΝ υπάρχει πια getSegments εδώ – θα το διαβάζουμε απευθείας στο component

      addSegment: (tripId, segmentInput) => {
        if (!tripId) return;
        const trips = { ...get().trips };
        const trip = trips[tripId] || { segments: [] };
        const currentSegments = trip.segments || [];

        const newSegment = {
          id: makeId("seg"),
          name: segmentInput?.name || "",
          type: segmentInput?.type || "",
          scheduled_time: segmentInput?.scheduled_time || "",
          location: segmentInput?.location || "",
          grace_minutes:
            typeof segmentInput?.grace_minutes === "number"
              ? segmentInput.grace_minutes
              : 15,
          order: currentSegments.length + 1,
          is_active: true,
          participants: [],
        };

        trips[tripId] = {
          segments: currentSegments.concat(newSegment),
        };

        set({ trips });
      },

      updateSegment: (tripId, segmentId, updates) => {
        if (!tripId || !segmentId) return;
        const trips = { ...get().trips };
        const trip = trips[tripId];
        if (!trip || !trip.segments) return;

        trips[tripId] = {
          segments: trip.segments.map((s) =>
            s.id === segmentId ? { ...s, ...(updates || {}) } : s
          ),
        };

        set({ trips });
      },

      deleteSegment: (tripId, segmentId) => {
        if (!tripId || !segmentId) return;
        const trips = { ...get().trips };
        const trip = trips[tripId];
        if (!trip || !trip.segments) return;

        trips[tripId] = {
          segments: trip.segments.filter((s) => s.id !== segmentId),
        };

        set({ trips });
      },
    }),
    {
      name: "trip-segments-store",
    }
  )
);
