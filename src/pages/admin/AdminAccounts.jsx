// src/Pages/admin/AdminAccounts.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Users,
  Shield,
  Mail,
  Search,
  Plus,
  Edit2,
  Power,
  Calendar,
  Trash2,
} from "lucide-react";

import { useAccountsStore } from "../../store/accountsStore";
import {
  ROLES,
  FAKE_CURRENT_USER,
  canEditAccount,
  canChangeRole,
  canToggleActive,
  canSeeAccountsPage,
} from "../../utils/permissions";

const ROLE_TABS = [
  { id: "ALL", label: "ΟΛΟΙ" },
  { id: ROLES.ADMIN, label: "ADMIN" },
  { id: ROLES.GUIDE, label: "ΣΥΝΟΔΟΙ" },
  { id: ROLES.STAFF, label: "ΓΡΑΜΜΑΤΕΙΑ / STAFF" },
  { id: ROLES.PARTICIPANT, label: "ΣΥΜΜΕΤΕΧΟΝΤΕΣ" },
];

function RoleBadge({ role }) {
  const base =
    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border";

  switch (role) {
    case ROLES.ADMIN:
      return (
        <span className={`${base} border-amber-300 text-amber-700 bg-amber-50`}>
          <Shield className="w-3 h-3" />
          ADMIN
        </span>
      );
    case ROLES.GUIDE:
      return (
        <span
          className={`${base} border-emerald-300 text-emerald-700 bg-emerald-50`}
        >
          ΣΥΝΟΔΟΣ
        </span>
      );
    case ROLES.STAFF:
      return (
        <span className={`${base} border-sky-300 text-sky-700 bg-sky-50`}>
          STAFF
        </span>
      );
    case ROLES.PARTICIPANT:
      return (
        <span
          className={`${base} border-slate-300 text-slate-700 bg-slate-50`}
        >
          ΣΥΜΜΕΤΕΧΩΝ
        </span>
      );
    default:
      return <span className={base}>{role}</span>;
  }
}

function StatusDot({ isActive }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium">
      <span
        className={`w-2 h-2 rounded-full ${
          isActive ? "bg-emerald-500" : "bg-slate-400"
        }`}
      />
      {isActive ? "ΕΝΕΡΓΟΣ" : "ΑΝΕΝΕΡΓΟΣ"}
    </span>
  );
}

function AccountModal({
  open,
  mode,
  account,
  onClose,
  onSave,
  currentUser,
  saving,
  error,
}) {
  const [form, setForm] = useState(() => {
    if (account) {
      return {
        fullName: account.fullName || "",
        email: account.email || "",
        role: account.role || ROLES.GUIDE,
        isActive: account.isActive ?? true,
        notes: account.notes || "",
      };
    }
    return {
      fullName: "",
      email: "",
      role: ROLES.GUIDE,
      isActive: true,
      notes: "",
    };
  });

  useEffect(() => {
    if (!open) return;
    if (account) {
      setForm({
        fullName: account.fullName || "",
        email: account.email || "",
        role: account.role || ROLES.GUIDE,
        isActive: account.isActive ?? true,
        notes: account.notes || "",
      });
    } else {
      setForm({
        fullName: "",
        email: "",
        role: ROLES.GUIDE,
        isActive: true,
        notes: "",
      });
    }
  }, [open, account]);

  if (!open) return null;

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  const editingTarget = account || null;
  const allowRoleChange = canChangeRole(currentUser, editingTarget);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
      <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-xl">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-500" />
            <h2 className="text-sm font-semibold tracking-wide text-slate-800">
              {mode === "edit" ? "Επεξεργασία λογαριασμού" : "Νέος λογαριασμός"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-xs"
          >
            Κλείσιμο
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                Ονοματεπώνυμο
              </label>
              <input
                type="text"
                required
                value={form.fullName}
                onChange={(e) => handleChange("fullName", e.target.value)}
                className="w-full rounded-lg bg-white border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Ρόλος</label>
              <select
                value={form.role}
                onChange={(e) => handleChange("role", e.target.value)}
                disabled={!allowRoleChange}
                className={`w-full rounded-lg bg-white border px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 ${
                  !allowRoleChange
                    ? "border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed"
                    : "border-slate-300"
                }`}
              >
                <option value={ROLES.ADMIN}>ADMIN</option>
                <option value={ROLES.GUIDE}>ΣΥΝΟΔΟΣ (GUIDE)</option>
                <option value={ROLES.STAFF}>ΓΡΑΜΜΑΤΕΙΑ / STAFF</option>
                <option value={ROLES.PARTICIPANT}>ΣΥΜΜΕΤΕΧΩΝ</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className="w-full rounded-lg bg-white border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                Κατάσταση
              </label>
              <select
                value={form.isActive ? "active" : "inactive"}
                onChange={(e) =>
                  handleChange("isActive", e.target.value === "active")
                }
                className="w-full rounded-lg bg-white border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
              >
                <option value="active">Ενεργός</option>
                <option value="inactive">Ανενεργός</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">
              Σημειώσεις
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              className="w-full rounded-lg bg-white border border-slate-300 px-3 py-2 text-xs outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 min-h-[60px]"
            />
          </div>

          {error && (
            <div className="text-[11px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100"
              disabled={saving}
            >
              Άκυρο
            </button>
            <button
              type="submit"
              disabled={saving}
              className={`px-3 py-1.5 text-xs rounded-lg text-white font-semibold ${
                saving
                  ? "bg-emerald-300 cursor-wait"
                  : "bg-emerald-500 hover:bg-emerald-600"
              }`}
            >
              {saving ? "Αποθήκευση..." : "Αποθήκευση"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminAccounts() {
  const accounts = useAccountsStore((s) => s.accounts);
  const loading = useAccountsStore((s) => s.loading);
  const storeError = useAccountsStore((s) => s.error);

  const loadAccounts = useAccountsStore((s) => s.loadAccounts);
  const createAccount = useAccountsStore((s) => s.createAccount);
  const updateAccount = useAccountsStore((s) => s.updateAccount);
  const deleteAccount = useAccountsStore((s) => s.deleteAccount);

  const currentUser = FAKE_CURRENT_USER;

  const [activeRole, setActiveRole] = useState("ALL");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    loadAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!canSeeAccountsPage(currentUser)) {
    return (
      <div className="text-sm text-slate-500">
        Δεν έχετε δικαίωμα πρόσβασης στη διαχείριση λογαριασμών.
      </div>
    );
  }

  const filteredAccounts = useMemo(() => {
    return (accounts || []).filter((acc) => {
      const matchesRole = activeRole === "ALL" || acc.role === activeRole;
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        (acc.fullName || "").toLowerCase().includes(q) ||
        (acc.email || "").toLowerCase().includes(q);
      return matchesRole && matchesSearch;
    });
  }, [accounts, activeRole, search]);

  const handleNew = () => {
    setEditingAccount(null);
    setSaveError("");
    setModalOpen(true);
  };

  const handleEdit = (acc) => {
    setEditingAccount(acc);
    setSaveError("");
    setModalOpen(true);
  };

  const handleSave = async (data) => {
    try {
      setSaveError("");

      // EDIT
      if (editingAccount) {
        await updateAccount(editingAccount.id, {
          fullName: data.fullName,
          email: data.email,
          role: data.role,
          isActive: data.isActive,
          notes: data.notes,
        });

        setModalOpen(false);
        setEditingAccount(null);
        return;
      }

      // CREATE
      const out = await createAccount({
        fullName: data.fullName,
        email: data.email,
        role: data.role,
      });

      if (out?.tempPassword) {
        window.alert(
          `Ο ΛΟΓΑΡΙΑΣΜΟΣ ΔΗΜΙΟΥΡΓΗΘΗΚΕ\n\nEMAIL: ${data.email}\nΡΟΛΟΣ: ${data.role}\n\nΠΡΟΣΩΡΙΝΟΣ ΚΩΔΙΚΟΣ:\n${out.tempPassword}`
        );
      }

      setModalOpen(false);
      setEditingAccount(null);
    } catch (e) {
      setSaveError(e?.message || "Σφάλμα αποθήκευσης.");
    }
  };

  const handleToggleActiveClick = async (acc) => {
    if (!canToggleActive(currentUser, acc)) return;
    try {
      setSaveError("");
      await updateAccount(acc.id, { isActive: !acc.isActive });
    } catch (e) {
      setSaveError(e?.message || "Σφάλμα αλλαγής κατάστασης.");
    }
  };

  const handleDelete = async (acc) => {
    const ok = window.confirm(
      `ΣΙΓΟΥΡΑ ΔΙΑΓΡΑΦΗ;\n\n${acc.fullName}\n${acc.email}\n\nΘα διαγραφεί ΚΑΙ ο Auth user (αν υπάρχει).`
    );
    if (!ok) return;

    try {
      setSaveError("");
      await deleteAccount(acc.id);
    } catch (e) {
      setSaveError(e?.message || "Σφάλμα διαγραφής.");
    }
  };

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
            <Users className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-wide text-slate-900">
              Λογαριασμοί χρηστών
            </h1>
            <p className="text-[11px] text-slate-500">
              Διαχείριση λογαριασμών ADMIN, Συνοδών, Staff και Συμμετεχόντων.
            </p>
          </div>
        </div>

        <button
          onClick={handleNew}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600"
          disabled={loading}
        >
          <Plus className="w-4 h-4" />
          Νέος λογαριασμός
        </button>
      </div>

      {/* TABS + SEARCH */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="inline-flex flex-wrap gap-2 bg-white border border-slate-200 rounded-full p-1">
          {ROLE_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveRole(tab.id)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-semibold tracking-wide transition ${
                activeRole === tab.id
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Αναζήτηση ονόματος ή email..."
              className="w-72 rounded-full bg-white border border-slate-200 pl-7 pr-3 py-1.5 text-xs outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
            />
          </div>

          <button
            onClick={loadAccounts}
            className="px-3 py-1.5 rounded-full border border-slate-200 text-xs text-slate-700 hover:bg-slate-50"
            disabled={loading}
          >
            {loading ? "Φόρτωση..." : "Refresh"}
          </button>
        </div>
      </div>

      {(saveError || storeError) && (
        <div className="text-[11px] text-red-700 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
          {saveError || storeError}
        </div>
      )}

      {/* LIST */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-4 py-2 border-b border-slate-100 text-[11px] text-slate-500 flex justify-between">
          <span>
            Σύνολο:{" "}
            <span className="text-slate-900 font-semibold">
              {filteredAccounts.length}
            </span>
          </span>
          <span>Ρόλοι: ADMIN / GUIDE / STAFF / PARTICIPANT</span>
        </div>

        {loading ? (
          <div className="px-4 py-6 text-center text-xs text-slate-500">
            Φόρτωση...
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="px-4 py-6 text-center text-xs text-slate-500">
            Δεν βρέθηκαν λογαριασμοί με αυτά τα φίλτρα.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filteredAccounts.map((acc) => {
              const canEdit = canEditAccount(currentUser, acc);
              const canToggle = canToggleActive(currentUser, acc);

              return (
                <li
                  key={acc.id}
                  className="px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[11px] font-semibold text-slate-600">
                      {acc.fullName?.[0] || "U"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-900">
                          {acc.fullName}
                        </span>
                        <RoleBadge role={acc.role} />
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {acc.email}
                        </span>
                        {acc.createdAt && (
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Από {acc.createdAt}
                          </span>
                        )}
                        {acc.notes && <span>{acc.notes}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <StatusDot isActive={acc.isActive} />
                    <div className="flex items-center gap-1">
                      {canEdit && (
                        <button
                          onClick={() => handleEdit(acc)}
                          className="px-2 py-1 rounded-lg border border-slate-200 text-[11px] text-slate-700 inline-flex items-center gap-1 hover:bg-slate-50"
                          disabled={loading}
                        >
                          <Edit2 className="w-3 h-3" />
                          Edit
                        </button>
                      )}

                      {canToggle && (
                        <button
                          onClick={() => handleToggleActiveClick(acc)}
                          className={`px-2 py-1 rounded-lg text-[11px] inline-flex items-center gap-1 border ${
                            acc.isActive
                              ? "border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100"
                              : "border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                          }`}
                          disabled={loading}
                        >
                          <Power className="w-3 h-3" />
                          {acc.isActive ? "Disable" : "Enable"}
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(acc)}
                        className="px-2 py-1 rounded-lg border border-red-200 text-[11px] text-red-700 bg-red-50 hover:bg-red-100 inline-flex items-center gap-1"
                        disabled={loading}
                        title="Διαγραφή"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <AccountModal
        open={modalOpen}
        mode={editingAccount ? "edit" : "create"}
        account={editingAccount}
        currentUser={currentUser}
        saving={loading}
        error={saveError}
        onClose={() => {
          setModalOpen(false);
          setEditingAccount(null);
          setSaveError("");
        }}
        onSave={handleSave}
      />
    </div>
  );
}
