const KEY = "ROLLSCAN_NOTIFICATIONS_V1";
const EVT = "rollscan:notifications";

function safeParse(v, fallback) {
  try {
    return JSON.parse(v);
  } catch {
    return fallback;
  }
}

export function getNotifications() {
  const raw = localStorage.getItem(KEY);
  const list = safeParse(raw, []);
  return Array.isArray(list) ? list : [];
}

export function setNotifications(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(EVT));
}

export function addNotification(notification) {
  const list = getNotifications();
  const next = [notification, ...list];
  setNotifications(next);
}

export function markAllRead() {
  const list = getNotifications().map((n) => ({ ...n, read: true }));
  setNotifications(list);
}

export function toggleRead(id) {
  const list = getNotifications().map((n) =>
    n.id === id ? { ...n, read: !n.read } : n
  );
  setNotifications(list);
}

export function subscribeNotifications(cb) {
  const handler = () => cb(getNotifications());
  window.addEventListener(EVT, handler);
  return () => window.removeEventListener(EVT, handler);
}
