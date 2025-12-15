// src/api/accountsApi.js

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://ofbztdecplmpluupdpew.supabase.co";

const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mYnp0ZGVjcGxtcGx1dXBkcGV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyNDY3ODUsImV4cCI6MjA4MDgyMjc4NX0.aqOC0eNFRYZv9azvfwdyAL3w1rP-M53BPjp7CNg9Vn4";

async function rest(path, { method = "GET", headers, body } = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    method,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Supabase REST error ${res.status}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

async function fn(path, { method = "POST", headers, body } = {}) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1${path}`, {
    method,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Supabase Function error ${res.status}`);
  }

  return res.json();
}

function mapRowToUi(row) {
  return {
    id: row.id,
    authUserId: row.auth_user_id ?? null,
    fullName: row.full_name ?? "",
    email: row.email ?? "",
    role: row.role ?? "",
    isActive: row.is_active ?? true,
    notes: row.notes ?? null,
    createdAt: row.created_at ?? null,
  };
}

export async function fetchAccounts() {
  // Order by created_at desc (αν υπάρχει)
  const rows = await rest(
    `/accounts?select=id,auth_user_id,full_name,email,role,is_active,notes,created_at&order=created_at.desc`
  );
  return (rows || []).map(mapRowToUi);
}

export async function createAccount({ fullName, email, role }) {
  // Edge Function: δημιουργεί auth user + row στο accounts
  const out = await fn(`/create-account`, {
    method: "POST",
    body: { fullName, email, role },
  });

  if (!out?.success || !out?.account) {
    throw new Error(out?.error || "create-account failed");
  }

  return {
    account: mapRowToUi(out.account),
    tempPassword: out.tempPassword || null,
  };
}

export async function updateAccount(accountId, patch) {
  // REST PATCH στο accounts
  // patch keys (UI -> DB):
  // fullName -> full_name, authUserId -> auth_user_id, isActive -> is_active, createdAt -> created_at
  const dbPatch = {};
  if (patch.fullName !== undefined) dbPatch.full_name = patch.fullName;
  if (patch.email !== undefined) dbPatch.email = patch.email;
  if (patch.role !== undefined) dbPatch.role = patch.role;
  if (patch.isActive !== undefined) dbPatch.is_active = patch.isActive;
  if (patch.notes !== undefined) dbPatch.notes = patch.notes;

  const rows = await rest(`/accounts?id=eq.${encodeURIComponent(accountId)}`, {
    method: "PATCH",
    headers: {
      Prefer: "return=representation",
    },
    body: dbPatch,
  });

  // Supabase REST PATCH με Prefer return=representation επιστρέφει array
  const row = Array.isArray(rows) ? rows[0] : rows;
  if (!row) throw new Error("updateAccount: empty response");
  return mapRowToUi(row);
}

export async function deleteAccount(accountId) {
  // Edge Function: σβήνει accounts row + auth user
  const out = await fn(`/delete-account`, {
    method: "POST",
    body: { accountId },
  });

  if (!out?.success) {
    throw new Error(out?.error || "delete-account failed");
  }

  return true;
}
