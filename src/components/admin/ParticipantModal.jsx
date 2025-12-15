// src/components/admin/ParticipantModal.jsx
import React, { useEffect, useState } from "react";
import {
  X,
  Users,
  Mail,
  Phone,
  MapPin,
  Bus,
  CreditCard,
} from "lucide-react";

export default function ParticipantModal({
  participant,
  trip,
  onClose,
  onUpdate,
  onDelete,
}) {
  const [form, setForm] = useState({
    status: participant.status || "pending",
    paymentStatus: participant.paymentStatus || "due",
    amountOwed: participant.amountOwed || 0,
    bus: participant.bus || "",
    group: participant.group || "",
    boardingPoint: participant.boardingPoint || "",
    arrivalMode: participant.arrivalMode || "BUS",
    notes: participant.notes || "",
  });

  useEffect(() => {
    setForm({
      status: participant.status || "pending",
      paymentStatus: participant.paymentStatus || "due",
      amountOwed: participant.amountOwed || 0,
      bus: participant.bus || "",
      group: participant.group || "",
      boardingPoint: participant.boardingPoint || "",
      arrivalMode: participant.arrivalMode || "BUS",
      notes: participant.notes || "",
    });
  }, [participant]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onUpdate({
      ...participant,
      ...form,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-[95%] max-w-xl p-5 space-y-4">
        {/* HEADER */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[10px] font-semibold text-slate-500 mb-1">
              ΚΑΡΤΕΛΑ ΣΥΜΜΕΤΕΧΟΝΤΑ
            </div>
            <div className="text-sm font-bold text-slate-900">
              {participant.fullName || participant.full_name || "ΧΩΡΙΣ ΟΝΟΜΑ"}
            </div>
            {trip && (
              <div className="mt-1 flex flex-wrap items-center gap-1 text-[11px] text-slate-500">
                <Users className="w-3 h-3" />
                <span>{trip.name}</span>
                {(trip.startDateLabel || trip.endDateLabel) && <span>•</span>}
                <span>
                  {trip.startDateLabel}
                  {trip.endDateLabel ? ` – ${trip.endDateLabel}` : ""}
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ΕΠΙΚΟΙΝΩΝΙΑ */}
        <section className="rounded-xl border border-slate-200 p-3 space-y-2 text-[11px]">
          <div className="font-semibold text-slate-600 mb-1">
            ΕΠΙΚΟΙΝΩΝΙΑ
          </div>
          <div className="flex flex-wrap gap-2">
            {participant.email && (
              <a
                href={`mailto:${participant.email}`}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 hover:bg-slate-50"
              >
                <Mail className="w-3 h-3" />
                <span>{participant.email}</span>
              </a>
            )}
            {participant.phone && (
              <a
                href={`tel:${participant.phone}`}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 hover:bg-slate-50"
              >
                <Phone className="w-3 h-3" />
                <span>{participant.phone}</span>
              </a>
            )}
          </div>
        </section>

        {/* STATUS + PAYMENT */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
          {/* ΚΑΤΑΣΤΑΣΗ ΣΥΜΜΕΤΟΧΗΣ */}
          <div className="rounded-xl border border-slate-200 p-3 space-y-2">
            <div className="font-semibold text-slate-600">
              ΚΑΤΑΣΤΑΣΗ ΣΥΜΜΕΤΟΧΗΣ
            </div>
            <select
              className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-[11px]"
              value={form.status}
              onChange={(e) => handleChange("status", e.target.value)}
            >
              <option value="confirmed">CONFIRMED</option>
              <option value="pending">PENDING</option>
              <option value="cancelled">CANCELLED</option>
            </select>
          </div>

          {/* ΠΛΗΡΩΜΗ */}
          <div className="rounded-xl border border-slate-200 p-3 space-y-2">
            <div className="font-semibold text-slate-600">ΠΛΗΡΩΜΗ</div>
            <div className="flex flex-col gap-2">
              <select
                className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-[11px]"
                value={form.paymentStatus}
                onChange={(e) =>
                  handleChange("paymentStatus", e.target.value)
                }
              >
                <option value="paid">PAID</option>
                <option value="partial">PARTIAL</option>
                <option value="due">DUE</option>
              </select>
              <div className="flex items-center gap-2">
                <CreditCard className="w-3 h-3 text-slate-500" />
                <input
                  type="number"
                  className="flex-1 border border-slate-300 rounded-lg px-3 py-1.5 text-[11px]"
                  value={form.amountOwed}
                  onChange={(e) =>
                    handleChange(
                      "amountOwed",
                      Number(e.target.value || 0)
                    )
                  }
                  placeholder="ΥΠΟΛΟΙΠΟ €"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ΜΕΤΑΦΟΡΑ */}
        <section className="rounded-xl border border-slate-200 p-3 space-y-2 text-[11px]">
          <div className="font-semibold text-slate-600">ΜΕΤΑΦΟΡΑ</div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* BUS / GROUP */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-slate-500">
                ΛΕΩΦΟΡΕΙΟ / GROUP
              </span>
              <div className="flex w-full">
                <input
                  type="text"
                  className="flex-1 border border-slate-300 rounded-l-lg px-2 py-1.5 text-[11px] focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="BUS"
                  value={form.bus}
                  onChange={(e) => handleChange("bus", e.target.value)}
                />
                <input
                  type="text"
                  className="flex-1 border border-slate-300 border-l-0 rounded-r-lg px-2 py-1.5 text-[11px] focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="GROUP"
                  value={form.group}
                  onChange={(e) => handleChange("group", e.target.value)}
                />
              </div>
            </div>

            {/* ΣΗΜΕΙΟ ΕΠΙΒΙΒΑΣΗΣ */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-slate-500">
                ΣΗΜΕΙΟ ΕΠΙΒΙΒΑΣΗΣ
              </span>
              <div className="flex w-full items-center border border-slate-300 rounded-lg overflow-hidden bg-white">
                <span className="inline-flex items-center px-2 bg-slate-50 border-r border-slate-300">
                  <MapPin className="w-3 h-3 text-slate-500" />
                </span>
                <input
                  type="text"
                  className="flex-1 px-2 py-1.5 text-[11px] focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="Π.Χ. ΑΘΗΝΑ"
                  value={form.boardingPoint}
                  onChange={(e) =>
                    handleChange("boardingPoint", e.target.value)
                  }
                />
              </div>
            </div>

            {/* ΤΡΟΠΟΣ ΑΦΙΞΗΣ */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-slate-500">
                ΤΡΟΠΟΣ ΑΦΙΞΗΣ
              </span>
              <select
                className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-[11px] focus:outline-none focus:ring-2 focus:ring-amber-400"
                value={form.arrivalMode}
                onChange={(e) =>
                  handleChange("arrivalMode", e.target.value)
                }
              >
                <option value="BUS">BUS</option>
                <option value="CAR">CAR</option>
                <option value="OTHER">OTHER</option>
              </select>
            </div>
          </div>
        </section>

        {/* ΣΗΜΕΙΩΣΕΙΣ */}
        <section className="rounded-xl border border-slate-200 p-3 space-y-2 text-[11px]">
          <div className="font-semibold text-slate-600">ΣΗΜΕΙΩΣΕΙΣ</div>
          <textarea
            rows={3}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-[11px] focus:outline-none focus:ring-2 focus:ring-amber-400"
            value={form.notes}
            onChange={(e) => handleChange("notes", e.target.value)}
            placeholder="ΕΙΔΙΚΕΣ ΠΑΡΑΤΗΡΗΣΕΙΣ, ΑΛΛΕΡΓΙΕΣ, LOGISTICAL INFO..."
          />
        </section>

        {/* ACTIONS */}
        <div className="flex justify-between items-center pt-1">
          <button
            type="button"
            onClick={() => onDelete(participant.id)}
            className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-[11px] font-semibold text-rose-600 hover:bg-rose-100"
          >
            ΔΙΑΓΡΑΦΗ
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-[11px] hover:bg-slate-50"
            >
              ΑΚΥΡΩΣΗ
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="rounded-full bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-slate-800"
            >
              ΑΠΟΘΗΚΕΥΣΗ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
