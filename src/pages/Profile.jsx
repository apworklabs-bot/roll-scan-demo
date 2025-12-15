// src/Pages/Profile.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Mail, Shield, LogOut, LogIn } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

function safeUpper(v) {
  if (v === null || v === undefined) return "";
  return String(v).toUpperCase();
}

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authUser, setAuthUser] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        // ✅ SOURCE OF TRUTH: session
        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        const user = sessionData?.session?.user || null;

        // ✅ Αν δεν υπάρχει session, ΔΕΝ είναι error για το app σου αυτή τη στιγμή.
        // (Μπορεί να δουλεύεις χωρίς Supabase Auth)
        if (!cancelled) setAuthUser(user);
      } catch (err) {
        console.error(err);
        if (!cancelled) setError("ΑΔΥΝΑΤΗ Η ΦΟΡΤΩΣΗ ΠΡΟΦΙΛ.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    // ✅ keep in sync
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      setAuthUser(session?.user || null);
    });

    return () => {
      cancelled = true;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
      navigate("/login");
    } catch (err) {
      console.error(err);
      setError("ΑΠΟΤΥΧΙΑ ΑΠΟΣΥΝΔΕΣΗΣ.");
    }
  }

  const email = authUser?.email || "";
  const name =
    authUser?.user_metadata?.full_name ||
    authUser?.user_metadata?.name ||
    (email ? email.split("@")[0] : "USER");

  // ΠΡΟΣΩΡΙΝΟ: role placeholder
  const roleLabel = authUser ? "ΧΡΗΣΤΗΣ" : "GUEST";

  return (
    <div className="min-h-screen w-full bg-[#FFF7E6] px-4 py-6 md:px-8 md:py-8">
      <div className="max-w-3xl mx-auto">
        {/* TOP BAR */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-xs md:text-sm px-3 py-2 rounded-full bg-white border border-slate-200 shadow-sm hover:bg-slate-50"
          >
            <ArrowLeft className="w-4 h-4" />
            ΠΙΣΩ
          </button>

          <div className="text-xs text-slate-400">BASIC PROFILE</div>
        </div>

        {/* CARD */}
        <section className="bg-white rounded-3xl shadow-md border border-amber-100 px-4 py-5 md:px-6 md:py-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shadow-sm">
              <User className="w-5 h-5" />
            </div>

            <div className="min-w-0">
              <div className="text-lg md:text-xl font-semibold text-slate-900 truncate">
                {safeUpper(name)}
              </div>
              <div className="text-xs text-slate-500">ΠΡΟΦΙΛ</div>
            </div>
          </div>

          {loading ? (
            <div className="py-10 text-center text-xs text-slate-500">
              ΦΟΡΤΩΣΗ...
            </div>
          ) : error ? (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs px-3 py-2">
              {error}
            </div>
          ) : (
            <>
              {/* INFO ROWS */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="flex items-center gap-2 text-slate-700 text-xs font-semibold">
                    <Mail className="w-4 h-4 text-slate-500" />
                    EMAIL
                  </div>
                  <div className="mt-1 text-sm text-slate-900 break-all">
                    {email || "—"}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="flex items-center gap-2 text-slate-700 text-xs font-semibold">
                    <Shield className="w-4 h-4 text-slate-500" />
                    ΡΟΛΟΣ
                  </div>
                  <div className="mt-1 text-sm text-slate-900">
                    {safeUpper(roleLabel)}
                  </div>
                </div>
              </div>

              {/* ACTIONS */}
              <div className="mt-5 flex flex-col md:flex-row gap-2">
                {authUser ? (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-5 py-2.5 text-xs md:text-sm font-semibold text-white shadow-sm hover:from-amber-500 hover:to-amber-600"
                  >
                    <LogOut className="w-4 h-4" />
                    ΑΠΟΣΥΝΔΕΣΗ
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-5 py-2.5 text-xs md:text-sm font-semibold text-white shadow-sm hover:from-amber-500 hover:to-amber-600"
                  >
                    <LogIn className="w-4 h-4" />
                    ΣΥΝΔΕΣΗ
                  </button>
                )}
              </div>

              <div className="mt-3 text-[11px] text-slate-400">
                ΣΗΜΕΙΩΣΗ: Ο ΡΟΛΟΣ ΘΑ ΔΕΣΕΙ ΑΡΓΟΤΕΡΑ ΜΕ TABLE user_roles / RLS.
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
