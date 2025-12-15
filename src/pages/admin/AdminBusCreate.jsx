// src/Pages/admin/AdminBusCreate.jsx
import React, { useState } from "react";
import { X } from "lucide-react";

export default function AdminBusCreate({ tripId, onClose, onSave }) {
  const [busName, setBusName] = useState("");
  const [seats, setSeats] = useState("");

  const handleSave = () => {
    if (!busName || !seats) {
      alert("Συμπλήρωσε όνομα λεωφορείου και θέσεις");
      return;
    }

    // Στέλνουμε τα δεδομένα πίσω στον γονιό αν μας έδωσε callback
    if (typeof onSave === "function") {
      onSave({
        tripId,
        name: busName,
        seats: Number(seats),
      });
    }

    // Κλείνουμε το modal
    if (typeof onClose === "function") {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Νέο Λεωφορείο
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-slate-100"
          >
            <X className="w-4 h-4 text-slate-600" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Όνομα Λεωφορείου
            </label>
            <input
              type="text"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
              placeholder="π.χ. Bus A1"
              value={busName}
              onChange={(e) => setBusName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Θέσεις
            </label>
            <input
              type="number"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
              placeholder="π.χ. 30"
              value={seats}
              onChange={(e) => setSeats(e.target.value)}
              min={1}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="mt-5 w-full bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold py-2.5 rounded-lg transition"
        >
          ΑΠΟΘΗΚΕΥΣΗ
        </button>
      </div>
    </div>
  );
}
