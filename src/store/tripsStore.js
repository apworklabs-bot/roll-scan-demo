// src/store/tripsStore.js
import { v4 as uuid } from "uuid";

// ------------------------------
// MOCK "DB"
// ------------------------------
let trips = [
  {
    id: "parnassos-2025",
    code: "TRIP-2025-001",
    name: "ΟΡΕΙΒΑΤΙΚΗ ΕΚΔΡΟΜΗ ΠΑΡΝΑΣΣΟΥ",
    startDateLabel: "26 Νοεμβριου 2025",
    endDateLabel: "29 Νοεμβριου 2025",
    status: "upcoming",

    leaderName: "Γιαννης Παπαδοπουλος",
    leaderPhone: "6912345678",

    meetingPoint: "Πλατεια Συνταγματος, Αθηνα",
    meetingTime: "06:30",

    whatToBring:
      "Ορειβατικα παπουτσια, αντιανεμικο, φακος κεφαλης, μπουφαν, γαντια.",
    instructions:
      "Παρακαλουμε να ειστε στο σημειο συναντησης 15' νωριτερα για ελεγχο εξοπλισμου.",

    participantsTotal: 18,
    participantsPending: 3,
    buses: 1,
  },
  {
    id: "olympos-winter",
    code: "TRIP-2026-001",
    name: "OLYMPOS WINTER",
    startDateLabel: "12 Ιανουαριου 2026",
    endDateLabel: "15 Ιανουαριου 2026",
    status: "upcoming",

    leaderName: "Νικος Δημου",
    leaderPhone: "6999999999",

    meetingPoint: "Σταθμος Λαρισης, Αθηνα",
    meetingTime: "05:45",

    whatToBring:
      "Κρανος, μποτες χειμερινες, κραμπον, πιολε, μπατον, θερμο.",
    instructions:
      "Υποχρεωτικη παρουσια στο briefing ασφαλειας το προηγουμενο βραδυ.",

    participantsTotal: 24,
    participantsPending: 2,
    buses: 2,
  },
];

let segments = [
  {
    id: uuid(),
    trip_id: "parnassos-2025",
    name: "ΕΠΙΒΙΒΑΣΗ ΑΘΗΝΑ",
    type: "boarding",
    dateLabel: "26 Νοεμβριου 2025",
    timeWindow: "06:15 – 06:45",
    location: "Πλατεια Συνταγματος",
    graceMinutes: 15,
  },
  {
    id: uuid(),
    trip_id: "parnassos-2025",
    name: "CHECKPOINT ΚΑΤΑΦΥΓΙΟ",
    type: "checkpoint",
    dateLabel: "26 Νοεμβριου 2025",
    timeWindow: "10:00 – 10:30",
    location: "Καταφυγιο Παρνασσου",
    graceMinutes: 10,
  },
  {
    id: uuid(),
    trip_id: "olympos-winter",
    name: "ΕΠΙΒΙΒΑΣΗ ΑΘΗΝΑ",
    type: "boarding",
    dateLabel: "12 Ιανουαριου 2026",
    timeWindow: "05:15 – 05:45",
    location: "Σταθμος Λαρισης",
    graceMinutes: 15,
  },
];

// ------------------------------
// TRIPS CRUD
// ------------------------------
export function getAllTrips() {
  return [...trips];
}

export function getTripById(id) {
  return trips.find((t) => t.id === id) || null;
}

export function createTrip(data) {
  const id = uuid();
  const code = `TRIP-${new Date().getFullYear()}-${String(
    Math.floor(Math.random() * 999)
  ).padStart(3, "0")}`;

  const newTrip = {
    id,
    code,
    name: data.name || "",
    startDateLabel: data.startDateLabel || "",
    endDateLabel: data.endDateLabel || "",
    status: data.status || "upcoming",

    leaderName: data.leaderName || "",
    leaderPhone: data.leaderPhone || "",
    meetingPoint: data.meetingPoint || "",
    meetingTime: data.meetingTime || "",

    whatToBring: data.whatToBring || "",
    instructions: data.instructions || "",

    participantsTotal: 0,
    participantsPending: 0,
    buses: data.buses || 0,
  };

  trips.push(newTrip);
  return newTrip;
}

export function updateTrip(id, updates) {
  trips = trips.map((t) => (t.id === id ? { ...t, ...updates } : t));
}

export function deleteTrip(id) {
  trips = trips.filter((t) => t.id !== id);
  segments = segments.filter((s) => s.trip_id !== id);
}

// ------------------------------
// SEGMENTS CRUD
// ------------------------------
export function getSegmentsByTrip(trip_id) {
  return segments.filter((s) => s.trip_id === trip_id);
}

export function createSegment(trip_id, data) {
  const newSeg = {
    id: uuid(),
    trip_id,
    name: data.name || "",
    type: data.type || "boarding",
    dateLabel: data.dateLabel || "",
    timeWindow: data.timeWindow || "",
    location: data.location || "",
    graceMinutes: data.graceMinutes ?? 10,
  };
  segments.push(newSeg);
  return newSeg;
}

export function updateSegment(id, updates) {
  segments = segments.map((s) => (s.id === id ? { ...s, ...updates } : s));
}

export function deleteSegment(id) {
  segments = segments.filter((s) => s.id !== id);
}
