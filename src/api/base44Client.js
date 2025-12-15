// src/api/base44Client.js

const APP_ID =
  import.meta.env.VITE_BASE44_APP_ID || "68ee1e069e8f7072479f0362";

const APP_BASE_URL = `https://base44.app/api/apps/${APP_ID}`;
const API_ROOT = "https://base44.app/api";

let apiKey = import.meta.env.VITE_BASE44_API_KEY || null;

// ✅ Αν δεν έχεις API KEY ή έχεις απενεργοποιήσει Base44, ΜΗΝ ΚΑΝΕΙΣ ΚΑΝ CALLS
const BASE44_ENABLED =
  import.meta.env.VITE_ENABLE_BASE44 === "true" && Boolean(apiKey);

async function request(path, { method = "GET", body, signal } = {}) {
  if (!BASE44_ENABLED) return null;

  const headers = { "Content-Type": "application/json" };
  if (apiKey) headers["api_key"] = apiKey;

  const res = await fetch(
    path.startsWith("http") ? path : `${APP_BASE_URL}${path}`,
    { method, headers, body: body ? JSON.stringify(body) : undefined, signal }
  );

  if (!res.ok) {
    // κρατάμε ένα log αλλά ΟΧΙ spam σε private app
    const text = await res.text().catch(() => "");
    console.error("Base44 API error:", res.status, text);
    throw new Error(`Base44 request failed: ${res.status}`);
  }

  return res.json().catch(() => null);
}

function createEntityClient(entityName) {
  return {
    async list(orderBy) {
      if (!BASE44_ENABLED) return [];
      const params = new URLSearchParams();
      if (orderBy) params.set("order", orderBy);

      const data = await request(
        `/entities/${entityName}${params.toString() ? `?${params}` : ""}`
      );

      if (Array.isArray(data)) return data;
      if (data?.results) return data.results;
      if (data?.items) return data.items;
      return [];
    },

    async filter(filters = {}, orderBy, limit) {
      if (!BASE44_ENABLED) return [];
      const all = await this.list(orderBy);
      return all
        .filter((item) =>
          Object.entries(filters).every(([k, v]) => item?.[k] === v)
        )
        .slice(0, limit || all.length);
    },

    async get(id) {
      if (!BASE44_ENABLED) return null;
      return request(`/entities/${entityName}/${id}`);
    },

    async create(data) {
      if (!BASE44_ENABLED) throw new Error("Base44 disabled");
      return request(`/entities/${entityName}`, { method: "POST", body: data });
    },

    async update(id, data) {
      if (!BASE44_ENABLED) throw new Error("Base44 disabled");
      return request(`/entities/${entityName}/${id}`, {
        method: "PUT",
        body: data,
      });
    },

    async delete(id) {
      if (!BASE44_ENABLED) throw new Error("Base44 disabled");
      return request(`/entities/${entityName}/${id}`, { method: "DELETE" });
    },
  };
}

export const base44 = {
  enabled: BASE44_ENABLED,

  auth: {
    async me() {
      // ✅ STOP SPAM: Αν δεν είναι enabled, μην κάνεις τίποτα
      if (!BASE44_ENABLED) return null;

      const res = await fetch(`${API_ROOT}/user/me`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { api_key: apiKey } : {}),
        },
      });

      // ✅ STOP SPAM: σε private app χωρίς auth, γύρνα null αντί για throw
      if (!res.ok) return null;

      const user = await res.json().catch(() => null);
      if (user?.api_key && !apiKey) apiKey = user.api_key;
      return user;
    },
  },

  entities: {
    Trip: createEntityClient("Trip"),
    TripSegment: createEntityClient("TripSegment"),
    Participant: createEntityClient("Participant"),
    Pass: createEntityClient("Pass"),
    AttendanceLog: createEntityClient("AttendanceLog"),
    Notification: createEntityClient("Notification"),
    NotificationRule: createEntityClient("NotificationRule"),
    NotificationPreferences: createEntityClient("NotificationPreferences"),
    NotificationAuditLog: createEntityClient("NotificationAuditLog"),
    EquipmentItem: createEntityClient("EquipmentItem"),
    EquipmentLoan: createEntityClient("EquipmentLoan"),
    EquipmentNotification: createEntityClient("EquipmentNotification"),
  },
};

export default base44;
