// src/Pages/admin/ParticipantEquipmentManager.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Calendar,
  MapPin,
  Search,
  Filter,
} from "lucide-react";
import { useParticipantsStore } from "../../store/participantsStore";
import {
  fetchAssignmentsForParticipant,
  saveAssignmentsForParticipant,
} from "../../api/equipmentAssignmentsApi";

// ΠΛΗΡΗΣ ΛΙΣΤΑ ΕΞΟΠΛΙΣΜΟΥ
const EQUIPMENT_ITEMS = [
  { id: "arva-x1", name: "ARVA", qtyLabel: "x 1" },
  {
    id: "asap-oval-x1",
    name: "ASAP & Καραμπίνερ Ασφαλείας Oval",
    qtyLabel: "x 1",
  },
  { id: "avalanche-probe-x1", name: "Avalanche Probe", qtyLabel: "x 1" },
  { id: "crol-x1", name: "Crol", qtyLabel: "x 1" },
  { id: "deadman-x1", name: "Deadman", qtyLabel: "x 1" },
  { id: "deadman-x2", name: "Deadman", qtyLabel: "x 2" },
  {
    id: "ergo-hms-x1",
    name: "Ergo & Καραμπίνερ Ασφαλείας HMS",
    qtyLabel: "x 1",
  },
  {
    id: "ferry-hms-x1",
    name: "Ferry & Καραμπίνερ Ασφαλείας HMS",
    qtyLabel: "x 1",
  },
  { id: "friends-x2", name: "Friends", qtyLabel: "x 2" },
  { id: "friends-x4", name: "Friends", qtyLabel: "x 4" },
  {
    id: "gigi-oval-x1",
    name: "GiGi & Καραμπίνερ Ασφαλείας Oval",
    qtyLabel: "x 1",
  },
  { id: "gps-x1", name: "GPS", qtyLabel: "x 1" },
  {
    id: "grigri-oval-x1",
    name: "GriGri  & Καραμπίνερ Ασφαλείας Oval",
    qtyLabel: "x 1",
  },
  {
    id: "id-oval-x1",
    name: "Id & Καραμπίνερ Ασφαλείας Oval",
    qtyLabel: "x 1",
  },
  {
    id: "piu-hms-x1",
    name: "Piu & Καραμπίνερ Ασφαλείας HMS",
    qtyLabel: "x 1",
  },
  {
    id: "reverso-hms-x1",
    name: "Reverso & Καραμπίνερ Ασφαλείας HMS",
    qtyLabel: "x 1",
  },
  {
    id: "rig-oval-x1",
    name: "Rig & Καραμπίνερ Ασφαλείας Oval",
    qtyLabel: "x 1",
  },
  { id: "via-ferrata-kit-x1", name: "Via Ferrata κιτ", qtyLabel: "x 1" },
  { id: "alum-angle-x1", name: "Αλουμινογωνίες", qtyLabel: "x 1" },
  { id: "alum-angle-x2", name: "Αλουμινογωνίες", qtyLabel: "x 2" },
  { id: "tent-x1", name: "Αντίσκηνο", qtyLabel: "x 1" },
  {
    id: "dyn-rope-60-x1",
    name: "Δυναμικό Σχοινί 60m (8,5mm)",
    qtyLabel: "x 1",
  },
  {
    id: "dyn-rope-70-x1",
    name: "Δυναμικό Σχοινί 70m (10.5mm)",
    qtyLabel: "x 1",
  },
  { id: "hexes-x2", name: "Εξάεδρα", qtyLabel: "x 2" },
  { id: "hexes-x4", name: "Εξάεδρα", qtyLabel: "x 4" },
  {
    id: "nut-tool-x1",
    name: "Εξολκέας Ασφαλειών",
    qtyLabel: "x 1",
  },
  { id: "jumar-x1", name: "Ζουμάρ", qtyLabel: "x 1" },
  {
    id: "crampon-bag-x1",
    name: "Θήκη Μεταφοράς Κραμπόν",
    qtyLabel: "x 1",
  },
  { id: "sling-120-x1", name: "Ιμάντες 120cm", qtyLabel: "x 1" },
  { id: "sling-60-x2", name: "Ιμάντες 60cm", qtyLabel: "x 2" },
  { id: "sling-60-x4", name: "Ιμάντες 60cm", qtyLabel: "x 4" },
  { id: "sling-60-x6", name: "Ιμάντες 60cm", qtyLabel: "x 6" },
  { id: "carab-simple-x2", name: "Καραμπίνερ Απλά", qtyLabel: "x 2" },
  { id: "carab-simple-x4", name: "Καραμπίνερ Απλά", qtyLabel: "x 4" },
  { id: "carab-simple-x6", name: "Καραμπίνερ Απλά", qtyLabel: "x 6" },
  {
    id: "carab-d-x1",
    name: "Καραμπίνερ Ασφαλείας D",
    qtyLabel: "x 1",
  },
  {
    id: "carab-d-x2",
    name: "Καραμπίνερ Ασφαλείας D",
    qtyLabel: "x 2",
  },
  {
    id: "carab-hms-x1",
    name: "Καραμπίνερ Ασφαλείας HMS",
    qtyLabel: "x 1",
  },
  {
    id: "carab-hms-x2",
    name: "Καραμπίνερ Ασφαλείας HMS",
    qtyLabel: "x 2",
  },
  {
    id: "carab-oval-x1",
    name: "Καραμπίνερ Ασφαλείας OVAL",
    qtyLabel: "x 1",
  },
  {
    id: "carab-oval-x2",
    name: "Καραμπίνερ Ασφαλείας OVAL",
    qtyLabel: "x 2",
  },
  { id: "karrimat-x1", name: "Κάριματ", qtyLabel: "x 1" },
  { id: "nuts-x6", name: "Καρυδάκια", qtyLabel: "x 6" },
  { id: "nuts-x8", name: "Καρυδάκια", qtyLabel: "x 8" },
  { id: "pitons-x2", name: "Καρφιά", qtyLabel: "x 2" },
  { id: "pitons-x4", name: "Καρφιά", qtyLabel: "x 4" },
  {
    id: "kevlar-8m-x1",
    name: "Κορδονέτο Kevlar 8m (5.5 mm)",
    qtyLabel: "x 1",
  },
  {
    id: "dyn-170-5-x1a",
    name: "Κορδονέτο Δυναμικό 170cm (5mm)",
    qtyLabel: "x 1",
  },
  {
    id: "dyn-170-5-x1b",
    name: "Κορδονέτο Δυναμικό 170cm (5mm)",
    qtyLabel: "x 1",
  },
  {
    id: "dyn-170-6-x1a",
    name: "Κορδονέτο Δυναμικό 170cm (6mm)",
    qtyLabel: "x 1",
  },
  {
    id: "dyn-170-6-x1b",
    name: "Κορδονέτο Δυναμικό 170cm (6mm)",
    qtyLabel: "x 1",
  },
  {
    id: "dyn-170-7-x1",
    name: "Κορδονέτο Δυναμικό 170cm (7mm)",
    qtyLabel: "x 1",
  },
  {
    id: "dyn-5m-7-x1",
    name: "Κορδονέτο Δυναμικό 5m (7mm)",
    qtyLabel: "x 1",
  },
  { id: "crampon-fast-x1", name: "Κραμπόν Fast", qtyLabel: "x 1" },
  {
    id: "crampon-semi-x1",
    name: "Κραμπόν Semi Fast",
    qtyLabel: "x 1",
  },
  { id: "crampon-strap-x1", name: "Κραμπόν Δετά", qtyLabel: "x 1" },
  { id: "helmet-x1", name: "Κράνος", qtyLabel: "x 1" },
  {
    id: "maillon-x1",
    name: "Κρίκος Ασφαλείας Mallon Rapide",
    qtyLabel: "x 1",
  },
  { id: "poles-x1", name: "Μπατόν", qtyLabel: "x 1" },
  { id: "poles-x2", name: "Μπατόν", qtyLabel: "x 2" },
  {
    id: "harness-canyoning-x1",
    name: "Μπωντριέ Canyoning",
    qtyLabel: "x 1",
  },
  {
    id: "harness-climb-x1",
    name: "Μπωντριέ Αναρριχητικό",
    qtyLabel: "x 1",
  },
  {
    id: "harness-work-x1",
    name: "Μπωντριέ Ολόσωμο Εργασίας",
    qtyLabel: "x 1",
  },
  { id: "figure8-x1", name: "Οχτάρι", qtyLabel: "x 1" },
  { id: "ice-screws-x1", name: "Παγόβιδες", qtyLabel: "x 1" },
  { id: "ice-screws-x2", name: "Παγόβιδες", qtyLabel: "x 2" },
  { id: "piolet-x1", name: "Πιολέ", qtyLabel: "x 1" },
  { id: "compass-x1", name: "Πυξίδα", qtyLabel: "x 1" },
  { id: "backpack-x1", name: "Σακίδιο", qtyLabel: "x 1" },
  {
    id: "gear-bag-x1",
    name: "Σάκος Μεταφοράς Εξοπλισμού",
    qtyLabel: "x 1",
  },
  {
    id: "rope-bag-x1",
    name: "Σάκος Μεταφοράς Σχοινιού",
    qtyLabel: "x 1",
  },
  { id: "quickdraws-x6", name: "Σετάκια", qtyLabel: "x 6" },
  { id: "pulley-simple-x1", name: "Τροχαλία Απλή", qtyLabel: "x 1" },
  { id: "pulley-brake-x1", name: "Τροχαλία με Φρένο", qtyLabel: "x 1" },
  { id: "sleeping-bag-x1", name: "Υπνόσακος", qtyLabel: "x 1" },
  { id: "rescue-stretcher-x1", name: "Φορείο Διασωστικό", qtyLabel: "x 1" },
  { id: "snow-shovel-x1", name: "Φτυάρι Χιονιού", qtyLabel: "x 1" },
];

export default function ParticipantEquipmentManager() {
  const navigate = useNavigate();
  const location = useLocation();
  const { participantId: paramParticipantId } = useParams();

  const { trips, updateParticipantEquipment } = useParticipantsStore();

  // state από route (header only / fallback)
  const { participant: stateParticipant, trip: stateTrip } =
    location.state || {};

  // 🔎 Βρίσκουμε τον PARTICIPANT από το STORE (ώστε να βλέπουμε το ενημερωμένο equipment)
  const { participantFromStore, tripFromStore } = useMemo(() => {
    let foundParticipant = null;
    let foundTrip = null;

    for (const trip of trips) {
      const p = (trip.participants || []).find(
        (x) => x.id === paramParticipantId
      );
      if (p) {
        foundParticipant = p;
        foundTrip = trip;
        break;
      }
    }

    return {
      participantFromStore: foundParticipant,
      tripFromStore: foundTrip,
    };
  }, [trips, paramParticipantId]);

  // Τελικός participant & trip που χρησιμοποιούμε παντού
  const participant = participantFromStore || stateParticipant || null;
  const trip =
    tripFromStore ||
    stateTrip ||
    (participantFromStore && {
      id: tripFromStore?.id,
      name: tripFromStore?.name,
      date: tripFromStore?.dateLabel,
    }) ||
    null;

  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState("all"); // all | pending
  const [assignedIds, setAssignedIds] = useState(() => new Set());

  const handleBack = () => {
    navigate(-1);
  };

  // 🧠 Αρχικό γέμισμα assigned:
  // 1) Αν υπάρχουν rows στο Supabase (equipment_assignments) → αυτά είναι η αλήθεια
  // 2) Αλλιώς, fallback σε participant.equipment από το store (όπως πριν)
  useEffect(() => {
    let cancelled = false;

    const initAssigned = async () => {
      const setFromSupabase = new Set();

      try {
        if (participant?.id && trip?.id) {
          const rows = await fetchAssignmentsForParticipant(
            trip.id,
            participant.id
          );

          if (!cancelled && Array.isArray(rows) && rows.length > 0) {
            rows.forEach((row) => {
              if (row.item_id) {
                setFromSupabase.add(row.item_id);
              }
            });

            setAssignedIds(setFromSupabase);
            return; // χρησιμοποιούμε Supabase ως source of truth
          }
        }
      } catch (err) {
        console.error(
          "Error loading equipment assignments from Supabase:",
          err
        );
      }

      // Fallback: από participant.equipment στο store (όπως ήταν πριν)
      const fallbackSet = new Set();
      const eq = participant?.equipment || [];

      if (Array.isArray(eq)) {
        eq.forEach((entry) => {
          if (!entry) return;
          if (typeof entry === "string") {
            fallbackSet.add(entry);
          } else if (entry.itemId) {
            fallbackSet.add(entry.itemId);
          } else if (entry.name) {
            const item = EQUIPMENT_ITEMS.find((i) => i.name === entry.name);
            if (item) fallbackSet.add(item.id);
          }
        });
      }

      if (!cancelled) {
        setAssignedIds(fallbackSet);
      }
    };

    initAssigned();

    return () => {
      cancelled = true;
    };
  }, [participant, trip]);

  const toggleItem = (id) => {
    setAssignedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const itemsFiltered = useMemo(() => {
    const q = search.toLowerCase();
    return EQUIPMENT_ITEMS.filter((item) => {
      const isAssigned = assignedIds.has(item.id);
      if (filterMode === "pending" && !isAssigned) return false;

      if (!q) return true;
      return item.name.toLowerCase().includes(q);
    });
  }, [search, filterMode, assignedIds]);

  const pendingCount = assignedIds.size;

  const handleSave = async () => {
    const assignedArray = Array.from(assignedIds);

    if (!participant?.id || !trip?.id) {
      console.log(
        "EQUIPMENT (no ids):",
        trip?.id,
        participant?.id,
        assignedArray
      );
      alert(
        "Δεν βρέθηκαν trip/participant id για αποθήκευση εκκρεμοτήτων."
      );
      return;
    }

    try {
      // 1) Save σε Supabase (equipment_assignments)
      await saveAssignmentsForParticipant({
        tripId: trip.id,
        participantId: participant.id,
        items: assignedArray.map((code) => ({
          itemId: code, // κωδικός από EQUIPMENT_ITEMS
          qty: 1,
          status: "PENDING",
        })),
      });

      // 2) Sync και το τοπικό store (για να φαίνεται παντού)
      if (typeof updateParticipantEquipment === "function") {
        updateParticipantEquipment(trip.id, participant.id, assignedArray);
      }

      alert("Οι εκκρεμότητες εξοπλισμού ενημερώθηκαν.");
    } catch (err) {
      console.error("Error saving equipment assignments to Supabase:", err);
      alert(
        "Προέκυψε σφάλμα κατά την αποθήκευση εκκρεμοτήτων εξοπλισμού στο Supabase."
      );
    }
  };

  const displayName = participant?.fullName || participant?.name || "—";

  return (
    <div className="min-h-full bg-slate-50 pb-20">
      <div className="max-w-6xl mx-auto py-8 px-4 md:px-0">
        {/* Back */}
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Πίσω στην καρτέλα συμμετέχοντα
        </button>

        {/* HEADER */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                <User className="w-5 h-5 text-slate-500" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">
                  {displayName}
                </div>
                {trip && (
                  <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-slate-600">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {trip.name} • {trip.date || trip.dateLabel}
                    </span>
                    {trip.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {trip.location}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="text-right text-[11px] text-slate-500">
              <div>Εκκρεμότητες εξοπλισμού</div>
              <div className="text-xs font-semibold text-slate-900">
                {pendingCount} αντικείμενα
              </div>
            </div>
          </div>
        </div>

        {/* ΕΡΓΑΛΕΙΑ */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-2 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex-1 flex items-center border border-slate-300 rounded-full bg-slate-50 px-3">
            <Search className="w-3 h-3 text-slate-400" />
            <input
              type="text"
              className="flex-1 text-[11px] border-0 outline-none bg-transparent py-1.5 ml-2"
              placeholder="Αναζήτηση εξοπλισμού…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="inline-flex items-center gap-2 text-[11px] text-slate-600">
            <Filter className="w-3 h-3 text-slate-500" />
            <button
              type="button"
              onClick={() =>
                setFilterMode((m) => (m === "all" ? "pending" : "all"))
              }
              className={`inline-flex items-center rounded-full border px-3 py-1 transition text-xs ${
                filterMode === "pending"
                  ? "bg-amber-100 border-amber-300 text-amber-800"
                  : "bg-slate-50 border-slate-300 text-slate-600"
              }`}
            >
              Μόνο εκκρεμότητες ({pendingCount})
            </button>
          </div>
        </div>

        {/* ΛΙΣΤΑ ΕΞΟΠΛΙΣΜΟΥ */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
          <div className="border-b border-slate-100 px-4 py-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Εξοπλισμός</span>
            <span>{EQUIPMENT_ITEMS.length} εγγραφές</span>
          </div>

          <div className="max-h-[520px] overflow-y-auto">
            {itemsFiltered.map((item) => {
              const checked = assignedIds.has(item.id);
              return (
                <label
                  key={item.id}
                  className={`flex items-center justify-between px-4 py-1.5 text-xs border-b border-slate-100 cursor-pointer ${
                    checked ? "bg-orange-50" : "bg-white hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-3 w-3 rounded border-slate-300 text-orange-500 focus:ring-0"
                      checked={checked}
                      onChange={() => toggleItem(item.id)}
                    />
                    <span className="text-slate-800">{item.name}</span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {item.qtyLabel}
                  </span>
                </label>
              );
            })}

            {itemsFiltered.length === 0 && (
              <div className="px-4 py-6 text-center text-[11px] text-slate-500">
                Δεν βρέθηκαν αντικείμενα με τα τρέχοντα φίλτρα.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ΚΑΤΩ BAR */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-orange-400 bg-orange-500 text-center py-2">
        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center justify-center text-xs font-semibold text-white tracking-wide"
        >
          Αποθήκευση &amp; Ενημέρωση
        </button>
      </div>
    </div>
  );
}
