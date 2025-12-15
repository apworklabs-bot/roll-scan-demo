// src/store/inventoryStore.js
import { create } from "zustand";
import { persist } from "zustand/middleware";

// Βοηθητικό για ID
function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

const INITIAL_ITEMS = [
  {
    id: "arva",
    name: "ARVA",
    category: "Χιονοδρομικός εξοπλισμός",
    code: "ARVA",
    inGood: 10,
    inWorn: 2,
    inDamaged: 0,
    inUnsuitable: 0,
    inLost: 0,
    allocated: 0,
    notes: "Beacon avalanche",
  },
  {
    id: "crampons",
    name: "Κραμπόν",
    category: "Τεχνικός εξοπλισμός",
    code: "CRAMPON",
    inGood: 15,
    inWorn: 3,
    inDamaged: 1,
    inUnsuitable: 0,
    inLost: 0,
    allocated: 0,
    notes: "",
  },
];

function computeTotals(item) {
  const total =
    item.inGood +
    item.inWorn +
    item.inDamaged +
    item.inUnsuitable +
    item.inLost +
    item.allocated;
  const available = item.inGood + item.inWorn;
  return { total, available };
}

export const useInventoryStore = create(
  persist(
    (set, get) => ({
      items: INITIAL_ITEMS,

      addItem: (data) => {
        const newItem = {
          id: createId("inv"),
          name: data.name,
          category: data.category || "",
          code: data.code || "",
          inGood: Number(data.inGood || 0),
          inWorn: Number(data.inWorn || 0),
          inDamaged: Number(data.inDamaged || 0),
          inUnsuitable: Number(data.inUnsuitable || 0),
          inLost: Number(data.inLost || 0),
          allocated: Number(data.allocated || 0),
          notes: data.notes || "",
        };
        set((state) => ({
          items: [...state.items, newItem],
        }));
      },

      updateItem: (id, updates) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        }));
      },

      deleteItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },

      // 🔥 Όταν δίνουμε εξοπλισμό σε συμμετέχοντα
      allocateItem: (id, quantity) => {
        const qty = Number(quantity || 0);
        if (!qty || qty <= 0) return;

        set((state) => {
          return {
            items: state.items.map((item) => {
              if (item.id !== id) return item;

              let remaining = qty;
              let inGood = item.inGood;
              let inWorn = item.inWorn;

              // πρώτα αφαιρούμε από καλό
              const takeFromGood = Math.min(inGood, remaining);
              inGood -= takeFromGood;
              remaining -= takeFromGood;

              // μετά από φθαρμένο
              const takeFromWorn = Math.min(inWorn, remaining);
              inWorn -= takeFromWorn;
              remaining -= takeFromWorn;

              const actuallyAllocated = qty - remaining;

              return {
                ...item,
                inGood,
                inWorn,
                allocated: item.allocated + actuallyAllocated,
              };
            }),
          };
        });
      },

      // 🔥 Όταν επιστρέφεται εξοπλισμός από συμμετέχοντα
      returnItem: (id, quantity, condition = "good") => {
        const qty = Number(quantity || 0);
        if (!qty || qty <= 0) return;

        set((state) => {
          return {
            items: state.items.map((item) => {
              if (item.id !== id) return item;

              const takeBack = Math.min(item.allocated, qty);
              const updated = { ...item, allocated: item.allocated - takeBack };

              switch (condition) {
                case "good":
                  updated.inGood += takeBack;
                  break;
                case "worn":
                  updated.inWorn += takeBack;
                  break;
                case "damaged":
                  updated.inDamaged += takeBack;
                  break;
                case "unsuitable":
                  updated.inUnsuitable += takeBack;
                  break;
                case "lost":
                  updated.inLost += takeBack;
                  break;
                default:
                  updated.inGood += takeBack;
              }

              return updated;
            }),
          };
        });
      },

      // Helper για UI
      getItemWithTotals: (id) => {
        const item = get().items.find((i) => i.id === id);
        if (!item) return null;
        const { total, available } = computeTotals(item);
        return { ...item, total, available };
      },
    }),
    {
      name: "rollscan-inventory-store",
    }
  )
);
