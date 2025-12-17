// src/components/admin/ParticipantModal.jsx
import React, { useEffect, useState } from "react";
import { X, Users, Mail, Phone, MapPin, CreditCard } from "lucide-react";

export default function ParticipantModal({
  participant,
  trip,
  onClose,
  onUpdate,
  onDelete,
}) {
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState(null);

  const [form, setForm] = useState({
    status: participant?.status || "pending",
    paymentStatus: participant?.paymentStatus || "DUE",
    amountOwed: participant?.amountOwed ?? 0,
    bus: participant?.bus || "",
    group: participant?.group || "",
    boardingPoint: participant?.boardingPoint || "",
    arrivalMode: participant?.arrivalMode || "BUS",
    notes: participant?.notes || "",
  });

  useEffect(() => {
    setLocalError(null);
    setSaving(false);
    setForm({
      status: participant?.status || "pending",
      paymentStatus: participant?.paymentStatus || "DUE",
      amountOwed: participant?.amountOwed ?? 0,
      bus: participant?.bus || "",
      group: participant?.group || "",
      boardingPoint: participant?.boardingPoint || "",
      arrivalMode: participant?.arrivalMode || "BUS",
      notes: participant?.notes || "",
    });
  }, [participant]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setLocalError(null);

    // ✅ αν δεν έχει περαστεί σωστά onUpdate, να το δεις ΑΜΕΣΩΣ
    if (typeof onUpdate !== "function") {
      console.error("ParticipantModal: onUpdate is not a function", onUpdate);
      setLocalError("ΣΦΑΛΜΑ: ΔΕΝ ΥΠΑΡΧΕΙ HANDLER ΑΠΟΘΗΚΕΥΣΗΣ (onUpdate).");
      return;
    }

    try {
      setSaving(true);

      // βοηθητικό log (θα το δεις στην κονσόλα)
      console.log("ParticipantModal SAVE", {
        id: participant?.id,
        form,
      });

      await onUpdate({
        ...participant,
        ...form,
        // κάνε normalize σε uppercase για να ταιριάζει με DB
        paymentStatus: String(form.paymentStatus || "DUE").toUpperCase(),
        arrivalMode: String(form.arrivalMode || "BUS").toUpperCase(),
      });
    } catch (e) {
      console.error("ParticipantModal: save error", e);
      setLocalError(e?.message || "ΣΦΑΛΜΑ ΑΠΟΘΗΚΕΥΣΗΣ.");
    } finally {
      setSaving(false);
    }
  };

  const displayName =
    participant?.fullName ||
    participant?.full_name ||
    participant?.name ||
    "—";

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-[95%] max-w-xl p-5 space-y-4">
        {/* HEADER */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-slate-500 mb-1">
              ΚΑΡΤΕΛΑ ΣΥΜΜΕΤΕΧΟΝΤΑ
            </div>
            <div className="text-sm font-bold text-slate-900">
              {displayName}
            </div>

            {trip && (
              <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
                <Users className="w-3 h-3" />
                <span>{trip.name}</span>
                <span>•</span>
                <span>
                  {trip.startDateLabel} – {trip.endDateLabel}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
            disabled={saving}
            title={saving ? "ΓΙΝΕΤΑΙ ΑΠΟΘΗΚΕΥΣΗ..." : "ΚΛΕΙΣΙΜΟ"}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* LOCAL ERROR */}
        {localError && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-3 py-2 text-xs">
            {localError}
          </div>
        )}

        {/* CONTACT */}
        <section className="rounded-xl border border-slate-200 p-3 space-y-2 text-[11px]">
          <div className="font-semibold text-slate-600 mb-1">ΕΠΙΚΟΙΝΩΝΙΑ</div>
          <div className="flex flex-wrap gap-2">
            {participant?.email && (
              <a
                href={`mailto:${participant.email}`}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 hover:bg-slate-50"
              >
                <Mail className="w-3 h-3" />
                <span>{participant.email}</span>
              </a>
            )}
            {participant?.phone && (
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
          <div className="rounded-xl border border-slate-200 p-3 space-y-2">
            <div className="font-semibold text-slate-600">ΚΑΤΑΣΤΑΣΗ ΣΥΜΜΕΤΟΧΗΣ</div>
            <select
              className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-[11px]"
              value={form.status}
              onChange={(e) => handleChange("status", e.target.value)}
              disabled={saving}
            >
              <option value="confirmed">CONFIRMED</option>
              <option value="pending">PENDING</option>
              <option value="cancelled">CANCELLED</option>
            </select>
          </div>

          <div className="rounded-xl border border-slate-200 p-3 space-y-2">
            <div className="font-semibold text-slate-600">ΠΛΗΡΩΜΗ</div>
            <div className="flex flex-col gap-2">
              <select
                className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-[11px]"
                value={String(form.paymentStatus || "DUE").toUpperCase()}
                onChange={(e) => handleChange("paymentStatus", e.target.value)}
                disabled={saving}
              >
                <option value="PAID">PAID</option>
                <option value="PARTIAL">PARTIAL</option>
                <option value="DUE">DUE</option>
              </select>

              <div className="flex items-center gap-2">
                <CreditCard className="w-3 h-3 text-slate-500" />
                <input
                  type="number"
                  className="flex-1 border border-slate-300 rounded-lg px-3 py-1.5 text-[11px]"
                  value={form.amountOwed}
                  onChange={(e) =>
                    handleChange("amountOwed", Number(e.target.value || 0))
                  }
                  placeholder="ΥΠΟΛΟΙΠΟ €"
                  disabled={saving}
                />
              </div>
            </div>
          </div>
        </section>

        {/* TRANSPORT */}
        <section className="rounded-xl border border-slate-200 p-3 space-y-2 text-[11px]">
          <div className="font-semibold text-slate-600">ΜΕΤΑΦΟΡΑ</div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-slate-500">ΛΕΩΦΟΡΕΙΟ / GROUP</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 border border-slate-300 rounded-lg px-2 py-1.5"
                  placeholder="BUS"
                  value={form.bus}
                  onChange={(e) => handleChange("bus", e.target.value)}
                  disabled={saving}
                />
                <input
                  type="text"
                  className="flex-1 border border-slate-300 rounded-lg px-2 py-1.5"
                  placeholder="GROUP"
                  value={form.group}
                  onChange={(e) => handleChange("group", e.target.value)}
                  disabled={saving}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-slate-500">ΣΗΜΕΙΟ ΕΠΙΒΙΒΑΣΗΣ</span>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-slate-500" />
                <input
                  type="text"
                  className="flex-1 border border-slate-300 rounded-lg px-2 py-1.5"
                  placeholder="Π.χ. ΑΘΗΝΑ"
                  value={form.boardingPoint}
                  onChange={(e) => handleChange("boardingPoint", e.target.value)}
                  disabled={saving}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-slate-500">ΤΡΟΠΟΣ ΑΦΙΞΗΣ</span>
              <select
                className="w-full border border-slate-300 rounded-lg px-2 py-1.5"
                value={String(form.arrivalMode || "BUS").toUpperCase()}
                onChange={(e) => handleChange("arrivalMode", e.target.value)}
                disabled={saving}
              >
                <option value="BUS">BUS</option>
                <option value="CAR">CAR</option>
                <option value="OTHER">OTHER</option>
              </select>
            </div>
          </div>
        </section>

        {/* NOTES */}
        <section className="rounded-xl border border-slate-200 p-3 space-y-2 text-[11px]">
          <div className="font-semibold text-slate-600">ΣΗΜΕΙΩΣΕΙΣ</div>
          <textarea
            rows={3}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-[11px]"
            value={form.notes}
            onChange={(e) => handleChange("notes", e.target.value)}
            placeholder="ΕΙΔΙΚΕΣ ΠΑΡΑΤΗΡΗΣΕΙΣ, ΑΛΛΕΡΓΙΕΣ, LOGISTICAL INFO..."
            disabled={saving}
          />
        </section>

        {/* ACTIONS */}
        <div className="flex justify-between items-center pt-1">
          <button
            type="button"
            onClick={() => {
              if (typeof onDelete !== "function") {
                console.error("ParticipantModal: onDelete is not a function", onDelete);
                setLocalError("ΣΦΑΛΜΑ: ΔΕΝ ΥΠΑΡΧΕΙ HANDLER ΔΙΑΓΡΑΦΗΣ (onDelete).");
                return;
              }
              onDelete(participant?.id);
            }}
            className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-[11px] font-semibold text-rose-600 hover:bg-rose-100"
            disabled={saving}
          >
            ΔΙΑΓΡΑΦΗ
          </button>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-[11px] hover:bg-slate-50"
              disabled={saving}
            >
              ΑΚΥΡΩΣΗ
            </button>

            <button
              onClick={handleSave}
              className="rounded-full bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
              disabled={saving}
            >
              {saving ? "ΑΠΟΘΗΚΕΥΕΙ..." : "ΑΠΟΘΗΚΕΥΣΗ"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
