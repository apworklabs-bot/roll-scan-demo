// src/api/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // eslint-disable-next-line no-console
  console.error("Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in .env");
}

// ✅ SINGLETON client (ΜΟΝΟ ΕΔΩ createClient)
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: "rollscan-auth",
  },
});

// ---- Token cache (για να μην κάνουμε getSession συνέχεια) ----
let accessToken = null;

async function refreshTokenCache() {
  try {
    const { data } = await supabase.auth.getSession();
    accessToken = data?.session?.access_token || null;
  } catch {
    accessToken = null;
  }
}
refreshTokenCache();

// ενημέρωση token on login/logout/refresh
supabase.auth.onAuthStateChange((_event, session) => {
  accessToken = session?.access_token || null;
});

// ------------------------------------------------------------
// ✅ supaFetch: REST call με user token (για RLS)
// ------------------------------------------------------------
export async function supaFetch(path, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const headers = options.headers || {};
  const prefer = headers.Prefer || headers.prefer;

  // ΦΡΕΣΚΑΡΕ token αν δεν έχουμε (π.χ. πρώτο load)
  if (!accessToken) {
    await refreshTokenCache();
  }

  const url =
    path.startsWith("http") ? path : `${SUPABASE_URL}/rest/v1${path}`;

  const finalHeaders = {
    apikey: SUPABASE_ANON_KEY,
    "Content-Type": "application/json",
    ...headers,
    // ✅ ΑΥΤΟ ΕΙΝΑΙ ΤΟ ΚΡΙΣΙΜΟ: user access token (όχι anon)
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...(prefer ? { Prefer: prefer } : {}),
  };

  const fetchOptions = {
    method,
    headers: finalHeaders,
  };

  if (options.body !== undefined) {
    fetchOptions.body =
      typeof options.body === "string" ? options.body : JSON.stringify(options.body);
  }

  const res = await fetch(url, fetchOptions);

  // 204 No Content
  if (res.status === 204) return null;

  const text = await res.text();
  const isJson = text && (text.startsWith("{") || text.startsWith("["));

  if (!res.ok) {
    let errPayload = text;
    if (isJson) {
      try {
        errPayload = JSON.parse(text);
      } catch {
        // keep raw text
      }
    }
    const e = new Error(
      typeof errPayload === "string"
        ? errPayload
        : errPayload?.message || `Supabase error ${res.status}`
    );
    e.status = res.status;
    e.payload = errPayload;
    throw e;
  }

  if (!text) return null;
  return isJson ? JSON.parse(text) : text;
}
