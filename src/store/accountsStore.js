// src/store/accountsStore.js
import { create } from "zustand";

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://ofbztdecplmpluupdpew.supabase.co";

const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "YOUR_ANON_KEY_HERE";

function mapRowToUi(row) {
  return {
    id: row.id,
    authUserId: row.auth_user_id ?? null,
    fullName: row.full_name ?? "",
    email: row.email ?? "",
    role: row.role ?? "",
    isActive: row.is_active ?? true,
    notes: row.notes ?? "",
    createdAt: row.created_at ?? null,
  };
}

async function apiFetch(path, { method = "GET", body } = {}) {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Prefer: "return=representation",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();

  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const msg =
      (data && data.message) ||
      (data && data.error && data.error.message) ||
      (typeof data === "string" ? data : null) ||
      `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return data;
}

export const useAccountsStore = create((set) => ({
  accounts: [],
  loading: false,
  error: "",

  loadAccounts: async () => {
    try {
      set({ loading: true, error: "" });

      const rows = await apiFetch(
        `/rest/v1/accounts?select=*&order=created_at.desc`,
        { method: "GET" }
      );

      const mapped = Array.isArray(rows) ? rows.map(mapRowToUi) : [];
      set({ accounts: mapped });
    } catch (e) {
      set({ error: e?.message || "Σφάλμα φόρτωσης accounts." });
    } finally {
      set({ loading: false });
    }
  },

  createAccount: async ({ fullName, email, role }) => {
    try {
      set({ loading: true, error: "" });

      const out = await apiFetch(`/functions/v1/create-account`, {
        method: "POST",
        body: { fullName, email, role },
      });

      if (!out?.success || !out?.account) {
        throw new Error(out?.error || "Μη έγκυρη απάντηση από create-account.");
      }

      const newAcc = mapRowToUi(out.account);
      set((state) => ({ accounts: [newAcc, ...state.accounts] }));

      return out; // includes tempPassword
    } catch (e) {
      const msg = e?.message || "Σφάλμα δημιουργίας account.";
      set({ error: msg });
      throw new Error(msg);
    } finally {
      set({ loading: false });
    }
  },

  updateAccount: async (id, patch) => {
    try {
      set({ loading: true, error: "" });

      const dbPatch = {};
      if (patch.fullName !== undefined) dbPatch.full_name = patch.fullName;
      if (patch.email !== undefined) dbPatch.email = patch.email;
      if (patch.role !== undefined) dbPatch.role = patch.role;
      if (patch.isActive !== undefined) dbPatch.is_active = patch.isActive;
      if (patch.notes !== undefined) dbPatch.notes = patch.notes;

      const rows = await apiFetch(`/rest/v1/accounts?id=eq.${id}`, {
        method: "PATCH",
        body: dbPatch,
      });

      const updatedRow = Array.isArray(rows) ? rows[0] : null;
      const updatedUi = updatedRow ? mapRowToUi(updatedRow) : patch;

      set((state) => ({
        accounts: state.accounts.map((a) =>
          a.id === id ? { ...a, ...updatedUi } : a
        ),
      }));
    } catch (e) {
      const msg = e?.message || "Σφάλμα ενημέρωσης account.";
      set({ error: msg });
      throw new Error(msg);
    } finally {
      set({ loading: false });
    }
  },

  deleteAccount: async (accountId) => {
    try {
      set({ loading: true, error: "" });

      const out = await apiFetch(`/functions/v1/delete-account`, {
        method: "POST",
        body: { accountId },
      });

      if (!out?.success) {
        throw new Error(out?.error || "Αποτυχία διαγραφής.");
      }

      set((state) => ({
        accounts: state.accounts.filter((a) => a.id !== accountId),
      }));

      return out;
    } catch (e) {
      const msg = e?.message || "Σφάλμα διαγραφής.";
      set({ error: msg });
      throw new Error(msg);
    } finally {
      set({ loading: false });
    }
  },
}));
