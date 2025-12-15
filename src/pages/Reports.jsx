// src/Pages/Reports.jsx
import React, { useState } from "react";
import {
  BarChart3,
  Users,
  CheckCircle2,
  AlertTriangle,
  Percent,
  ArrowLeft,
  Calendar,
  MapPin,
} from "lucide-react";

const REPORT_TRIPS = [
  {
    id: "olympos-winter",
    name: "OLYMPOS WINTER",
    date: "12 Ιανουαρίου 2026",
    statusLabel: "Ενεργή",

    totalParticipants: 8,
    paidCount: 6,
    pendingCount: 2,
    paidPercent: 75,

    pendingList: [
      {
        id: "pending-1",
        name: "Βόσης Μάρκος",
        email: "bossmedia720@gmail.com",
        phone: "34652345234534",
        boardingPoint: "Αθήνα",
        notes: "Φαγητό: 15€, Διαμονή: 30€, Λεωφορείο: 20€",
        amountDue: 65,
      },
      {
        id: "pending-2",
        name: "Hilario User",
        email: "hilariool434@gmail.com",
        phone: "",
        boardingPoint: "Αθήνα",
        notes: "",
        amountDue: 0,
      },
    ],
    summaryRows: [
      {
        id: "r1",
        name: "Μαρία Παπαδοπούλου",
        boardingPoint: "Αθήνα",
        status: "paid",
        amount: 0,
      },
      {
        id: "r2",
        name: "Ελένη Μακρή",
        boardingPoint: "Αθήνα",
        status: "paid",
        amount: 0,
      },
      {
        id: "r3",
        name: "Κώστας Αντωνίου",
        boardingPoint: "Λαμία",
        status: "paid",
        amount: 0,
      },
      {
        id: "r4",
        name: "Σοφία Παππά",
        boardingPoint: "Αθήνα",
        status: "paid",
        amount: 0,
      },
      {
        id: "r5",
        name: "Δημήτρης Νικολάου",
        boardingPoint: "Αθήνα",
        status: "paid",
        amount: 0,
      },
      {
        id: "r6",
        name: "Βόσης Μάρκος",
        boardingPoint: "Αθήνα",
        status: "pending",
        amount: 65,
      },
      {
        id: "r7",
        name: "Hilario User",
        boardingPoint: "-",
        status: "pending",
        amount: 0,
      },
      {
        id: "r8",
        name: "Hilario User",
        boardingPoint: "-",
        status: "paid",
        amount: 0,
      },
    ],
  },
  {
    id: "parnassos",
    name: "Ορειβατική Εκδρομή Παρνασσού",
    date: "26 Νοεμβρίου 2025",
    statusLabel: "Ενεργή",

    totalParticipants: 4,
    paidCount: 2,
    pendingCount: 2,
    paidPercent: 50,

    pendingList: [
      {
        id: "p1",
        name: "Κώστας Αντωνίου",
        email: "kostas@example.com",
        phone: "6940000000",
        boardingPoint: "Λαμία",
        notes: "Διαμονή σε σκηνή",
        amountDue: 0,
      },
      {
        id: "p2",
        name: "Άγνωστος Συμμετέχων",
        email: "demo@example.com",
        phone: "",
        boardingPoint: "Αθήνα",
        notes: "",
        amountDue: 0,
      },
    ],
    summaryRows: [
      {
        id: "pr1",
        name: "Γιάννης Καραλής",
        boardingPoint: "Αθήνα",
        status: "paid",
        amount: 0,
      },
      {
        id: "pr2",
        name: "Νίκος Δ.",
        boardingPoint: "Αθήνα",
        status: "paid",
        amount: 0,
      },
      {
        id: "pr3",
        name: "Κώστας Αντωνίου",
        boardingPoint: "Λαμία",
        status: "pending",
        amount: 0,
      },
      {
        id: "pr4",
        name: "Demo User",
        boardingPoint: "Αθήνα",
        status: "pending",
        amount: 0,
      },
    ],
  },
];

export default function Reports() {
  const [screen, setScreen] = useState("list"); // "list" | "detail"
  const [selectedTrip, setSelectedTrip] = useState(REPORT_TRIPS[0]);

  const openTrip = (trip) => {
    setSelectedTrip(trip);
    setScreen("detail");
  };

  const backToList = () => setScreen("list");

  // ===== CSV EXPORT =====
  const handleExportCSV = () => {
    if (!selectedTrip) return;

    const headers = [
      "Όνομα",
      "Σημείο Επιβίβασης",
      "Κατάσταση",
      "Ποσό (€)",
    ];

    const rows = selectedTrip.summaryRows.map((row) => [
      row.name,
      row.boardingPoint,
      row.status === "paid" ? "Πληρωμένο" : "Εκκρεμής",
      row.amount ?? 0,
    ]);

    const csvContent =
      [headers, ...rows]
        .map((cols) =>
          cols
            .map((c) => `"${String(c).replace(/"/g, '""')}"`)
            .join(";")
        )
        .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedTrip.name.replace(/\s+/g, "_")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ================= LIST SCREEN =================
  if (screen === "list") {
    return (
      <div className="min-h-screen bg-[#FFF7E6] px-4 py-6 md:px-8 md:py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-100 flex items-center justify-center shadow-md">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Αναφορές Πληρωμών
              </h1>
              <p className="text-sm text-slate-600">
                Στατιστικά και αναφορές πληρωμών λεωφορείου
              </p>
            </div>
          </div>

          {/* Trip cards */}
          <div className="space-y-4">
            {REPORT_TRIPS.map((trip) => (
              <article
                key={trip.id}
                onClick={() => openTrip(trip)}
                className="bg-white rounded-2xl shadow-sm border border-amber-100 cursor-pointer hover:shadow-lg transition-all"
              >
                <div className="flex items-center justify-between px-5 pt-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      {trip.name}
                    </h2>
                    <p className="mt-1 text-xs text-slate-600 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {trip.date}
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs bg-orange-50 text-orange-700 border border-orange-200">
                    {trip.statusLabel}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-3 px-5 pb-4">
                  {/* Συμμετέχοντες */}
                  <div className="bg-sky-50 rounded-2xl px-4 py-3 flex flex-col justify-between">
                    <div className="flex items-center gap-2 text-sky-700 text-xs">
                      <Users className="w-4 h-4" />
                      <span>Συνολικοί Συμμετέχοντες</span>
                    </div>
                    <div className="mt-2 text-2xl font-bold text-slate-900">
                      {trip.totalParticipants}
                    </div>
                  </div>

                  {/* Πληρωμένοι */}
                  <div className="bg-emerald-50 rounded-2xl px-4 py-3 flex flex-col justify-between">
                    <div className="flex items-center gap-2 text-emerald-700 text-xs">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Πληρωμένοι</span>
                    </div>
                    <div className="mt-2 text-2xl font-bold text-slate-900">
                      {trip.paidCount}
                    </div>
                  </div>

                  {/* Εκκρεμείς */}
                  <div className="bg-rose-50 rounded-2xl px-4 py-3 flex flex-col justify-between">
                    <div className="flex items-center gap-2 text-rose-700 text-xs">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Εκκρεμείς Πληρωμές</span>
                    </div>
                    <div className="mt-2 text-2xl font-bold text-slate-900">
                      {trip.pendingCount}
                    </div>
                  </div>

                  {/* Ποσοστό */}
                  <div className="bg-purple-50 rounded-2xl px-4 py-3 flex flex-col justify-between">
                    <div className="flex items-center gap-2 text-purple-700 text-xs">
                      <Percent className="w-4 h-4" />
                      <span>Ποσοστό Εξόφλησης</span>
                    </div>
                    <div className="mt-2 text-2xl font-bold text-slate-900">
                      {Number(trip.paidPercent).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ================= DETAIL SCREEN =================
  const totalAmount = selectedTrip.summaryRows.reduce(
    (sum, row) => sum + (row.amount || 0),
    0
  );

  return (
    <div className="min-h-screen bg-[#FFF7E6] px-4 py-6 md:px-8 md:py-8">
      <div className="max-w-6xl mx-auto space-y-5">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={backToList}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-white border border-amber-100 text-sm text-slate-700 shadow-sm hover:bg-amber-50 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Πίσω
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                {selectedTrip.name}
              </h1>
              <p className="text-xs text-slate-600 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {selectedTrip.date}
              </p>
            </div>
          </div>

          {/* Πράσινο pill + λειτουργικό CSV */}
          <button
            onClick={handleExportCSV}
            className="px-5 py-2 rounded-full bg-emerald-500 text-white text-xs font-semibold shadow-sm hover:bg-emerald-600 transition"
          >
            Εξαγωγή CSV
          </button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-2xl shadow-sm border border-amber-100 px-4 py-3">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Users className="w-4 h-4 text-sky-600" />
              <span>Συνολικοί Συμμετέχοντες</span>
            </div>
            <div className="mt-3 text-3xl font-bold text-slate-900">
              {selectedTrip.totalParticipants}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-amber-100 px-4 py-3">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Πληρωμένοι</span>
            </div>
            <div className="mt-3 text-3xl font-bold text-slate-900">
              {selectedTrip.paidCount}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-amber-100 px-4 py-3">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Εκκρεμείς Πληρωμές</span>
            </div>
            <div className="mt-3 text-3xl font-bold text-rose-600">
              {selectedTrip.pendingCount}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-amber-100 px-4 py-3">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Percent className="w-4 h-4 text-purple-600" />
              <span>Ποσοστό Εξόφλησης</span>
            </div>
            <div className="mt-1 text-sm text-slate-500">
              <span className="font-semibold text-2xl text-purple-700">
                {Number(selectedTrip.paidPercent).toFixed(1)}%
              </span>
              <span className="ml-1 text-xs text-slate-500">
                πληρωμένες θέσεις
              </span>
            </div>
          </div>
        </div>

        {/* Pending list */}
        <section className="bg-white rounded-2xl shadow-sm border border-rose-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-rose-50 flex items-center gap-2 text-sm text-rose-700">
            <AlertTriangle className="w-4 h-4" />
            <span>
              Λίστα Εκκρεμοτήτων ({selectedTrip.pendingList.length})
            </span>
          </div>

          <div className="divide-y divide-rose-50">
            {selectedTrip.pendingList.map((p) => (
              <div
                key={p.id}
                className="px-5 py-3 bg-rose-50/60 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
              >
                <div>
                  <p className="font-semibold text-sm text-slate-900">
                    {p.name}
                  </p>
                  {p.email && (
                    <p className="text-xs text-slate-700">{p.email}</p>
                  )}
                  {p.phone && (
                    <p className="text-xs text-slate-500">{p.phone}</p>
                  )}
                  <p className="mt-1 text-[11px] text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    Σημείο: {p.boardingPoint}
                  </p>
                  {p.notes && (
                    <p className="mt-1 text-[11px] text-slate-500">
                      {p.notes}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <span className="inline-block mb-1 px-3 py-1 rounded-full text-[11px] bg-rose-100 text-rose-700 border border-rose-200">
                    Εκκρεμής
                  </span>
                  <div className="text-base font-semibold text-rose-700">
                    €{p.amountDue}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Summary table */}
        <section className="bg-white rounded-2xl shadow-sm border border-amber-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-amber-50 flex items-center gap-2 text-sm text-slate-800">
            <BarChart3 className="w-4 h-4 text-amber-600" />
            <span>Συνολική Αναφορά Πληρωμών</span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-xs md:text-sm">
              <thead className="bg-amber-50/60">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-slate-700">
                    Όνομα
                  </th>
                  <th className="text-left px-4 py-2 font-medium text-slate-700">
                    Σημείο Επιβίβασης
                  </th>
                  <th className="text-left px-4 py-2 font-medium text-slate-700">
                    Κατάσταση
                  </th>
                  <th className="text-right px-4 py-2 font-medium text-slate-700">
                    Ποσό
                  </th>
                </tr>
              </thead>
              <tbody>
                {selectedTrip.summaryRows.map((row) => (
                  <tr key={row.id} className="border-t border-amber-50">
                    <td className="px-4 py-2">{row.name}</td>
                    <td className="px-4 py-2">{row.boardingPoint}</td>
                    <td className="px-4 py-2">
                      {row.status === "paid" ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-100">
                          Πληρωμένο
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] bg-rose-50 text-rose-700 border border-rose-100">
                          Εκκρεμής
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">
                      €{row.amount}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-amber-100 bg-amber-50/40">
                  <td className="px-4 py-2 font-semibold" colSpan={3}>
                    ΣΥΝΟΛΟ
                  </td>
                  <td className="px-4 py-2 text-right font-semibold">
                    €{totalAmount}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
