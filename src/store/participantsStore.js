// src/store/participantsStore.js
import { create } from "zustand";
import { persist } from "zustand/middleware";

const INITIAL_TRIPS = [
  {
    id: "parnassos-2025",
    name: "PARNASSOS 2025",
    dateLabel: "15 ΦΕΒ 2025",
    participants: [
      {
        id: "maria-pap",
        fullName: "Μαρία Παπαδοπούλου",
        email: "maria.pap@example.com",
        phone: "6941234567",
        status: "confirmed",
        paymentStatus: "paid",
        amountOwed: 0,
        bus: "B1",
        group: "GROUP A",
        boardingPoint: "ΑΘΗΝΑ",
        arrivalMode: "BUS",
        notes: "Χρειάζεται vegetarian γεύματα.",
      },
      {
        id: "nikos-io",
        fullName: "Νίκος Ιωάννου",
        email: "nikos.ioannou@example.com",
        phone: "6977777777",
        status: "pending",
        paymentStatus: "due",
        amountOwed: 80,
        bus: "B1",
        group: "GROUP A",
        boardingPoint: "ΛΑΜΙΑ",
        arrivalMode: "BUS",
        notes: "",
      },
    ],
  },
  {
    id: "olympos-winter",
    name: "OLYMPOS WINTER",
    dateLabel: "12 ΙΑΝ 2026",
    participants: [
      {
        id: "vosis-markos",
        fullName: "Βόσης Μάρκος",
        email: "bossmedia720@gmail.com",
        phone: "6930000000",
        status: "confirmed",
        paymentStatus: "partial",
        amountOwed: 65,
        bus: "B2",
        group: "GROUP B",
        boardingPoint: "ΑΘΗΝΑ",
        arrivalMode: "BUS",
        notes: "Υπόλοιπο για λεωφορείο και διαμονή.",
      },
      {
        id: "anna-k",
        fullName: "Άννα Καραγιάννη",
        email: "anna.k@example.com",
        phone: "6981111111",
        status: "cancelled",
        paymentStatus: "due",
        amountOwed: 0,
        bus: "",
        group: "",
        boardingPoint: "ΘΕΣΣΑΛΟΝΙΚΗ",
        arrivalMode: "OTHER",
        notes: "Ακύρωση λόγω τραυματισμού.",
      },
    ],
  },

  // 🔥 DUMMY TRIP 3
  {
    id: "valia-kalda-2025",
    name: "VALIA KALDA TREK",
    dateLabel: "28 ΜΑΡ 2025",
    participants: [
      {
        id: "giannis-k",
        fullName: "Γιάννης Κωνσταντίνου",
        email: "giannis.k@example.com",
        phone: "6942222222",
        status: "confirmed",
        paymentStatus: "paid",
        amountOwed: 0,
        bus: "VK1",
        group: "GROUP A",
        boardingPoint: "ΤΡΙΚΑΛΑ",
        arrivalMode: "BUS",
        notes: "",
      },
      {
        id: "sofia-m",
        fullName: "Σοφία Μάνου",
        email: "sofia.m@example.com",
        phone: "6973333333",
        status: "confirmed",
        paymentStatus: "paid",
        amountOwed: 0,
        bus: "VK1",
        group: "GROUP A",
        boardingPoint: "ΑΘΗΝΑ",
        arrivalMode: "BUS",
        notes: "",
      },
      {
        id: "petros-l",
        fullName: "Πέτρος Λαμπρόπουλος",
        email: "petros.l@example.com",
        phone: "6984444444",
        status: "pending",
        paymentStatus: "due",
        amountOwed: 50,
        bus: "",
        group: "GROUP B",
        boardingPoint: "ΙΩΑΝΝΙΝΑ",
        arrivalMode: "OTHER",
        notes: "Αναμένει επιβεβαίωση άδειας.",
      },
    ],
  },

  // 🔥 DUMMY TRIP 4
  {
    id: "olympos-trilogy-2025",
    name: "OLYMPOS TRILOGY",
    dateLabel: "20 ΙΟΥΝ 2025",
    participants: [
      {
        id: "katerina-p",
        fullName: "Κατερίνα Παππά",
        email: "katerina.p@example.com",
        phone: "6945555555",
        status: "confirmed",
        paymentStatus: "paid",
        amountOwed: 0,
        bus: "OT1",
        group: "GROUP A",
        boardingPoint: "ΛΑΡΙΣΑ",
        arrivalMode: "BUS",
        notes: "",
      },
      {
        id: "mixalis-d",
        fullName: "Μιχάλης Δημητρίου",
        email: "mixalis.d@example.com",
        phone: "6976666666",
        status: "confirmed",
        paymentStatus: "partial",
        amountOwed: 40,
        bus: "OT1",
        group: "GROUP B",
        boardingPoint: "ΑΘΗΝΑ",
        arrivalMode: "BUS",
        notes: "Υπόλοιπο για καταφύγιο.",
      },
      {
        id: "dimitra-s",
        fullName: "Δήμητρα Σωτηρίου",
        email: "dimitra.s@example.com",
        phone: "6987777777",
        status: "cancelled",
        paymentStatus: "due",
        amountOwed: 0,
        bus: "",
        group: "",
        boardingPoint: "ΘΕΣΣΑΛΟΝΙΚΗ",
        arrivalMode: "OTHER",
        notes: "Ακύρωση λόγω καιρού.",
      },
      {
        id: "andreas-k",
        fullName: "Ανδρέας Καλογερόπουλος",
        email: "andreas.k@example.com",
        phone: "6938888888",
        status: "confirmed",
        paymentStatus: "paid",
        amountOwed: 0,
        bus: "OT2",
        group: "GROUP C",
        boardingPoint: "ΑΘΗΝΑ",
        arrivalMode: "BUS",
        notes: "",
      },
    ],
  },

  // 🔥 DUMMY TRIP 5
  {
    id: "gran-paradiso-2025",
    name: "GRAN PARADISO 2025",
    dateLabel: "05 ΙΟΥΛ 2025",
    participants: [
      {
        id: "nikos-p",
        fullName: "Νίκος Παπαγεωργίου",
        email: "nikos.papageo@example.com",
        phone: "6949999999",
        status: "confirmed",
        paymentStatus: "paid",
        amountOwed: 0,
        bus: "",
        group: "TEAM A",
        boardingPoint: "ΑΕΡΟΔΡΟΜΙΟ",
        arrivalMode: "OTHER",
        notes: "Πτήση με ίδια μέσα.",
      },
      {
        id: "maria-t",
        fullName: "Μαρία Τσακπίρα",
        email: "maria.t@example.com",
        phone: "6970000001",
        status: "pending",
        paymentStatus: "partial",
        amountOwed: 120,
        bus: "",
        group: "TEAM A",
        boardingPoint: "ΑΘΗΝΑ",
        arrivalMode: "OTHER",
        notes: "Σε αναμονή για εξοπλισμό.",
      },
    ],
  },

  // 🔥 DUMMY TRIP 6
  {
    id: "denali-prep-2025",
    name: "DENALI TRAINING CAMP",
    dateLabel: "10 ΝΟΕ 2025",
    participants: [
      {
        id: "panos-r",
        fullName: "Πάνος Ράπτης",
        email: "panos.r@example.com",
        phone: "6931231231",
        status: "confirmed",
        paymentStatus: "paid",
        amountOwed: 0,
        bus: "",
        group: "TEAM 1",
        boardingPoint: "ΑΘΗΝΑ",
        arrivalMode: "OTHER",
        notes: "Full training package.",
      },
      {
        id: "georgia-l",
        fullName: "Γεωργία Λεοντίου",
        email: "georgia.l@example.com",
        phone: "6972342342",
        status: "confirmed",
        paymentStatus: "paid",
        amountOwed: 0,
        bus: "",
        group: "TEAM 1",
        boardingPoint: "ΑΘΗΝΑ",
        arrivalMode: "OTHER",
        notes: "",
      },
      {
        id: "stefanos-b",
        fullName: "Στέφανος Μπ.",
        email: "stefanos.b@example.com",
        phone: "6983453453",
        status: "pending",
        paymentStatus: "due",
        amountOwed: 200,
        bus: "",
        group: "TEAM 2",
        boardingPoint: "ΘΕΣΣΑΛΟΝΙΚΗ",
        arrivalMode: "OTHER",
        notes: "Σε εκκρεμότητα προκαταβολή.",
      },
    ],
  },

  // 🔥 DUMMY TRIP 7
  {
    id: "basecamp-intro-2025",
    name: "BASECAMP INTRO COURSE",
    dateLabel: "01 ΜΑΙ 2025",
    participants: [
      {
        id: "eleni-p",
        fullName: "Ελένη Πανού",
        email: "eleni.p@example.com",
        phone: "6934564564",
        status: "confirmed",
        paymentStatus: "paid",
        amountOwed: 0,
        bus: "",
        group: "GROUP 1",
        boardingPoint: "ΑΘΗΝΑ",
        arrivalMode: "OTHER",
        notes: "",
      },
      {
        id: "markos-s",
        fullName: "Μάρκος Σπ.",
        email: "markos.s@example.com",
        phone: "6975675675",
        status: "confirmed",
        paymentStatus: "partial",
        amountOwed: 30,
        bus: "",
        group: "GROUP 1",
        boardingPoint: "ΑΘΗΝΑ",
        arrivalMode: "OTHER",
        notes: "Υπόλοιπο συμμετοχής.",
      },
      {
        id: "irene-k",
        fullName: "Ειρήνη Κ.",
        email: "irene.k@example.com",
        phone: "6986786786",
        status: "cancelled",
        paymentStatus: "due",
        amountOwed: 0,
        bus: "",
        group: "",
        boardingPoint: "ΑΘΗΝΑ",
        arrivalMode: "OTHER",
        notes: "Ακύρωση τελευταία στιγμή.",
      },
    ],
  },
];

export const useParticipantsStore = create(
  persist(
    (set, get) => ({
      trips: INITIAL_TRIPS,
      selectedTripId: INITIAL_TRIPS[0].id,

      selectTrip: (tripId) => set({ selectedTripId: tripId }),

      addParticipant: (tripId, participant) => {
        set((state) => ({
          trips: state.trips.map((trip) =>
            trip.id === tripId
              ? {
                  ...trip,
                  participants: [...trip.participants, participant],
                }
              : trip
          ),
        }));
      },

      updateParticipant: (tripId, updated) => {
        set((state) => ({
          trips: state.trips.map((trip) =>
            trip.id === tripId
              ? {
                  ...trip,
                  participants: trip.participants.map((p) =>
                    p.id === updated.id ? { ...p, ...updated } : p
                  ),
                }
              : trip
          ),
        }));
      },

      deleteParticipant: (tripId, id) => {
        set((state) => ({
          trips: state.trips.map((trip) =>
            trip.id === tripId
              ? {
                  ...trip,
                  participants: trip.participants.filter(
                    (p) => p.id !== id
                  ),
                }
              : trip
          ),
        }));
      },

      // Αποθήκευση assignments εξοπλισμού στον συμμετέχοντα (Model A)
      updateParticipantEquipment: (tripId, participantId, equipmentIds) => {
        set((state) => ({
          trips: state.trips.map((trip) =>
            trip.id === tripId
              ? {
                  ...trip,
                  participants: trip.participants.map((p) =>
                    p.id === participantId
                      ? { ...p, equipment: equipmentIds }
                      : p
                  ),
                }
              : trip
          ),
        }));
      },
    }),
    {
      // 👇 ΑΛΛΑΞΑΜΕ ΜΟΝΟ ΑΥΤΟ ΓΙΑ ΝΑ ΞΑΝΑΦΟΡΤΩΣΕΙ ΤΑ ΝΕΑ DUMMY
      name: "basecamp-participants-store-v2",
    }
  )
);
