// src/Pages/UserManagement.jsx
import React, { useEffect, useMemo, useState } from "react";

import { useAccountsStore } from "../store/accountsStore";
import { ROLES } from "../utils/permissions";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import {
  Users,
  UserCog,
  UserCircle2,
  Shield,
  Search,
} from "lucide-react";

// ---------------------------------------------------------
// MAIN COMPONENT – ΔΟΥΛΕΥΕΙ ΠΛΕΟΝ ΜΕ Supabase accounts
// ---------------------------------------------------------

export default function UserManagement() {
  const [roleFilter, setRoleFilter] = useState("all");
  const [search, setSearch] = useState("");

  const accounts = useAccountsStore((s) => s.accounts);
  const loadAccounts = useAccountsStore((s) => s.loadAccounts);
  const loading = useAccountsStore((s) => s.loading);
  const error = useAccountsStore((s) => s.error);

  // Φόρτωμα λογαριασμών από Supabase όταν ανοίγει η σελίδα
  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  // Θα φτιάξουμε ένα "users" array με full_name / email / role (admin/leader/participant)
  const users = useMemo(() => {
    return accounts.map((acc) => {
      let mappedRole = "participant";

      if (acc.role === ROLES.ADMIN) mappedRole = "admin";
      else if (acc.role === ROLES.GUIDE || acc.role === ROLES.STAFF)
        mappedRole = "leader";
      else if (acc.role === ROLES.PARTICIPANT) mappedRole = "participant";

      return {
        id: acc.id,
        full_name: acc.fullName,
        email: acc.email,
        role: mappedRole,
        rawRole: acc.role,
      };
    });
  }, [accounts]);

  // ---------------- Στατιστικά ----------------

  const stats = useMemo(() => {
    const admins = users.filter((u) => u.role === "admin").length;
    const leaders = users.filter((u) => u.role === "leader").length;
    const participants = users.filter((u) => u.role === "participant").length;
    return { admins, leaders, participants };
  }, [users]);

  // ---------------- Φίλτρο + αναζήτηση ----------------

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchRole =
        roleFilter === "all" ? true : u.role === roleFilter;

      const q = search.trim().toLowerCase();
      const matchSearch =
        q.length === 0 ||
        u.full_name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q);

      return matchRole && matchSearch;
    });
  }, [users, roleFilter, search]);

  // ---------------- Render ----------------

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center">
          <UserCog className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Διαχείριση Χρηστών
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Διαχείριση ρόλων και δικαιωμάτων χρηστών
          </p>
          {loading && (
            <p className="text-xs text-gray-400 mt-1">
              Φόρτωση λογαριασμών από Supabase...
            </p>
          )}
          {error && (
            <p className="text-xs text-red-500 mt-1">
              {error}
            </p>
          )}
        </div>
      </div>

      {/* Stats blocks */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Διαχειριστές"
          value={stats.admins}
          icon={<Shield className="w-4 h-4" />}
          color="text-purple-700"
          bg="bg-purple-50"
        />
        <StatCard
          title="Συνοδοί"
          value={stats.leaders}
          icon={<Users className="w-4 h-4" />}
          color="text-blue-700"
          bg="bg-blue-50"
        />
        <StatCard
          title="Συμμετέχοντες"
          value={stats.participants}
          icon={<UserCircle2 className="w-4 h-4" />}
          color="text-emerald-700"
          bg="bg-emerald-50"
        />
      </div>

      {/* Toolbar: search + role filter */}
      <div className="flex flex-col md:flex-row items-stretch gap-3">
        <div className="flex-1">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Αναζήτηση χρήστη..."
              className="pl-9 h-9 rounded-xl border-gray-200 text-sm"
            />
          </div>
        </div>

        <div className="flex items-center justify-end">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Φίλτρο ρόλου:</span>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-44 h-9 rounded-xl border-gray-200 text-xs justify-between">
                <SelectValue placeholder="Όλοι" />
              </SelectTrigger>
              <SelectContent className="w-44 text-xs">
                <SelectItem value="all">Όλοι</SelectItem>
                <SelectItem value="admin">Διαχειριστές</SelectItem>
                <SelectItem value="leader">Συνοδοί</SelectItem>
                <SelectItem value="participant">Συμμετέχοντες</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Users list */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-sm text-gray-500">
              Φόρτωση χρηστών...
            </div>
          ) : error ? (
            <div className="py-12 text-center text-sm text-red-500">
              Προέκυψε σφάλμα κατά τη φόρτωση χρηστών.
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-500">
              <div className="flex justify-center mb-3">
                <UserCircle2 className="w-10 h-10 text-gray-300" />
              </div>
              Δεν βρέθηκαν χρήστες
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {filteredUsers.map((user) => (
                <li
                  key={user.id}
                  className="px-4 md:px-6 py-3 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-sm font-semibold">
                      {user.full_name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {user.full_name || "Χωρίς όνομα"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {user.email || "—"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={roleBadgeClass(user.role)}
                    >
                      {roleLabel(user.role)}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------
// Helper components
// ---------------------------------------------------------

function StatCard({ title, value, icon, color, bg }) {
  return (
    <Card className="border-none shadow-sm">
      <CardContent className="p-4 flex items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="text-xs text-gray-500">{title}</div>
          <div className="text-2xl font-bold text-gray-900">{value}</div>
        </div>
        <div
          className={`w-10 h-10 rounded-2xl flex items-center justify-center ${bg} ${color}`}
        >
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

function roleLabel(role) {
  switch (role) {
    case "admin":
      return "Διαχειριστής";
    case "leader":
      return "Συνοδός";
    case "participant":
      return "Συμμετέχων";
    default:
      return "Άγνωστος ρόλος";
  }
}

function roleBadgeClass(role) {
  switch (role) {
    case "admin":
      return "border-purple-200 bg-purple-50 text-purple-700";
    case "leader":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "participant":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    default:
      return "border-gray-200 bg-gray-50 text-gray-600";
  }
}
