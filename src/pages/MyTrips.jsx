// src/Pages/MyTrips.jsx
import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from "lucide-react";

import { format } from "date-fns";
import { el } from "date-fns/locale";

import { supaFetch } from "../api/supabaseClient";

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------
function getSupabaseUserFromLocalStorage() {
  try {
    // Supabase stores session under a key like: sb-<projectRef>-auth-token
    const key = Object.keys(localStorage || {}).find(
      (k) => k.startsWith("sb-") && k.endsWith("-auth-token")
    );
    if (!key) return null;

    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    // supabase-js v2 shape: { access_token, refresh_token, user: {...} }
    return parsed?.user || parsed?.currentSession?.user || null;
  } catch {
    return null;
  }
}

function safeDate(d) {
  const x = d ? new Date(d) : null;
  return x && !Number.isNaN(x.getTime()) ? x : null;
}

function inferTripStatus(trip) {
  // Prefer explicit status if exists
  const s = String(trip?.status || "").toLowerCase();
  if (s === "cancelled") return "cancelled";
  if (s === "completed") return "completed";
  if (s === "active") return "active";
  if (s === "upcoming") return "upcoming";

  // Otherwise infer from dates
  const now = new Date();
  const start = safeDate(trip?.start_date || trip?.startDate);
  const end = safeDate(trip?.end_date || trip?.endDate) || start;

  if (!start) return "upcoming";
  if (now < start) return "upcoming";
  if (end && now > end) return "completed";
  return "active";
}

function getTripTitle(trip) {
  return trip?.title || trip?.name || trip?.trip_name || "ΕΚΔΡΟΜΗ";
}

function getTripDesc(trip) {
  return trip?.description || trip?.desc || "";
}

function getMeetingPoint(trip) {
  return trip?.meeting_point || trip?.meetingPoint || trip?.boarding_point || "";
}

function getMeetingTime(trip) {
  return trip?.meeting_time || trip?.meetingTime || "";
}

function fmtTripDate(trip) {
  const start = safeDate(trip?.start_date || trip?.startDate);
  const end = safeDate(trip?.end_date || trip?.endDate);

  if (!start) return "—";

  const startTxt = format(start, "d MMMM yyyy", { locale: el });
  if (end && end.getTime() !== start.getTime()) {
    const endTxt = format(end, "d MMMM yyyy", { locale: el });
    return `${startTxt} - ${endTxt}`;
  }
  return startTxt;
}

// ---------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------
export default function MyTrips() {
  const navigate = useNavigate();

  // ✅ Read user locally (no Base44)
  const user = useMemo(() => getSupabaseUserFromLocalStorage(), []);
  const userEmail = user?.email ? String(user.email).toLowerCase() : null;

  // 1) My participations (participants rows) by email
  const { data: participants = [], isLoading: loadingParticipants } = useQuery({
    queryKey: ["myParticipations", userEmail],
    enabled: !!userEmail,
    queryFn: async () => {
      // NOTE: use ilike to be case-insensitive
      const select = "id,trip_id,status,payment_status,email";
      const url =
        `/participants?select=${encodeURIComponent(select)}` +
        `&email=ilike.${encodeURIComponent(userEmail)}`;

      const rows = await supaFetch(url, { method: "GET" });
      return Array.isArray(rows) ? rows : [];
    },
  });

  // 2) Trips for those participant rows
  const tripIds = useMemo(() => {
    const ids = participants
      .map((p) => p.trip_id)
      .filter(Boolean)
      .map(String);

    return Array.from(new Set(ids));
  }, [participants]);

  const { data: trips = [], isLoading: loadingTrips } = useQuery({
    queryKey: ["myTrips", tripIds.join(",")],
    enabled: tripIds.length > 0,
    queryFn: async () => {
      const select =
        "id,title,name,description,start_date,end_date,status,meeting_point,meeting_time";
      const inList = `(${tripIds.map((x) => `"${x}"`).join(",")})`;

      const url =
        `/trips?select=${encodeURIComponent(select)}` +
        `&id=in.${encodeURIComponent(inList)}` +
        `&order=start_date.desc`;

      const rows = await supaFetch(url, { method: "GET" });
      return Array.isArray(rows) ? rows : [];
    },
  });

  // 3) My trips (optionally require confirmed)
  const myTrips = useMemo(() => {
    // κρατάμε ΟΛΕΣ τις συμμετοχές του user — αν θες μόνο confirmed, άφησε το φίλτρο
    const confirmedOnly = true;

    const allowedTripIds = new Set(
      participants
        .filter((p) => (confirmedOnly ? p.status === "confirmed" : true))
        .map((p) => String(p.trip_id))
    );

    return trips.filter((t) => allowedTripIds.has(String(t.id)));
  }, [participants, trips]);

  // 4) Split by inferred status
  const withStatus = useMemo(
    () => myTrips.map((t) => ({ ...t, _status: inferTripStatus(t) })),
    [myTrips]
  );

  const upcomingTrips = withStatus.filter((t) => t._status === "upcoming");
  const activeTrips = withStatus.filter((t) => t._status === "active");
  const completedTrips = withStatus.filter((t) => t._status === "completed");

  const getStatusBadge = (status) => {
    const badges = {
      upcoming: { label: "ΕΠΙΚΕΙΜΕΝΗ", className: "bg-blue-100 text-blue-800" },
      active: { label: "ΣΕ ΕΞΕΛΙΞΗ", className: "bg-green-100 text-green-800" },
      completed: { label: "ΟΛΟΚΛΗΡΩΜΕΝΗ", className: "bg-gray-100 text-gray-800" },
      cancelled: { label: "ΑΚΥΡΩΜΕΝΗ", className: "bg-red-100 text-red-800" },
    };
    return badges[status] || badges.upcoming;
  };

  const getParticipantRowForTrip = (tripId) =>
    participants.find((p) => String(p.trip_id) === String(tripId)) || null;

  const getParticipantStatus = (tripId) => {
    const participant = getParticipantRowForTrip(tripId);
    if (!participant) return null;

    const statusConfig = {
      confirmed: {
        icon: CheckCircle2,
        label: "ΕΠΙΒΕΒΑΙΩΜΕΝΟΣ",
        className: "text-green-600",
      },
      waitlist: {
        icon: AlertCircle,
        label: "ΛΙΣΤΑ ΑΝΑΜΟΝΗΣ",
        className: "text-yellow-600",
      },
      cancelled: {
        icon: XCircle,
        label: "ΑΚΥΡΩΜΕΝΟΣ",
        className: "text-red-600",
      },
    };

    return statusConfig[String(participant.status || "").toLowerCase()] || statusConfig.confirmed;
  };

  const TripCard = ({ trip }) => {
    const statusBadge = getStatusBadge(trip._status);
    const participantStatus = getParticipantStatus(trip.id);
    const participant = getParticipantRowForTrip(trip.id);
    const StatusIcon = participantStatus?.icon;

    return (
      <Card
        className="hover:shadow-lg transition-shadow border-none shadow-md cursor-pointer"
        onClick={() => {
          // ✅ V1: Πήγαινε σε participants list (front) ή σε detail αν έχεις.
          // Αν έχεις front participant card route, το αλλάζουμε εδώ.
          navigate("/participants", { state: { tripId: trip.id } });
        }}
      >
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl mb-2">{getTripTitle(trip)}</CardTitle>

              <div className="flex flex-wrap gap-2">
                <Badge className={statusBadge.className}>{statusBadge.label}</Badge>

                {participantStatus && (
                  <Badge variant="outline" className={participantStatus.className}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {participantStatus.label}
                  </Badge>
                )}

                {participant?.payment_status && (
                  <Badge
                    variant="outline"
                    className={
                      String(participant.payment_status).toLowerCase() === "paid"
                        ? "border-green-500 text-green-700"
                        : "border-orange-500 text-orange-700"
                    }
                  >
                    {String(participant.payment_status).toLowerCase() === "paid"
                      ? "ΕΞΟΦΛΗΜΕΝΟ"
                      : "ΕΚΚΡΕΜΕΙ ΠΛΗΡΩΜΗ"}
                  </Badge>
                )}
              </div>
            </div>

            <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-amber-400 rounded-xl flex items-center justify-center shadow-md">
              <MapPin className="w-7 h-7 text-white" />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {getTripDesc(trip) ? (
            <p className="text-gray-600 text-sm">{getTripDesc(trip)}</p>
          ) : null}

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4 text-orange-500" />
              <span>{fmtTripDate(trip)}</span>
            </div>

            {getMeetingPoint(trip) ? (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4 text-orange-500" />
                <span>{getMeetingPoint(trip)}</span>
              </div>
            ) : null}

            {getMeetingTime(trip) ? (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4 text-orange-500" />
                <span>{getMeetingTime(trip)}</span>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    );
  };

  const loading = loadingParticipants || loadingTrips;

  // ✅ Not logged in / no email
  if (!userEmail) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <Card className="border-none shadow-md">
            <CardContent className="py-10 text-center">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-900 font-semibold">ΔΕΝ ΒΡΕΘΗΚΕ ΣΥΝΔΕΔΕΜΕΝΟΣ ΧΡΗΣΤΗΣ</p>
              <p className="text-gray-600 mt-1">ΚΑΝΕ LOGIN ΚΑΙ ΞΑΝΑΔΟΚΙΜΑΣΕ.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ✅ No participations
  if (!loading && participants.length === 0) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">ΟΙ ΕΚΔΡΟΜΕΣ ΜΟΥ</h1>
            <p className="text-gray-600 mt-1">ΠΡΟΒΟΛΗ ΟΛΩΝ ΤΩΝ ΕΚΔΡΟΜΩΝ ΣΑΣ</p>
          </div>

          <Card className="text-center py-12 border-none shadow-md">
            <CardContent>
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">ΔΕΝ ΥΠΑΡΧΟΥΝ ΕΝΕΡΓΕΣ ΕΚΔΡΟΜΕΣ</p>
              <p className="text-gray-500 text-sm mt-1">
                ΔΕΝ ΕΧΕΤΕ ΕΓΓΡΑΦΕΙ ΣΕ ΚΑΜΙΑ ΕΚΔΡΟΜΗ ΑΥΤΗ ΤΗ ΣΤΙΓΜΗ.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------
  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">ΟΙ ΕΚΔΡΟΜΕΣ ΜΟΥ</h1>
          <p className="text-gray-600 mt-1">ΠΡΟΒΟΛΗ ΟΛΩΝ ΤΩΝ ΕΚΔΡΟΜΩΝ ΣΑΣ</p>
        </div>

        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="upcoming">
              ΕΠΙΚΕΙΜΕΝΕΣ ({upcomingTrips.length})
            </TabsTrigger>
            <TabsTrigger value="active">
              ΣΕ ΕΞΕΛΙΞΗ ({activeTrips.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              ΟΛΟΚΛΗΡΩΜΕΝΕΣ ({completedTrips.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
            {loading ? (
              <Card className="border-none shadow-md">
                <CardContent className="py-10 text-center text-gray-600">
                  ΦΟΡΤΩΣΗ...
                </CardContent>
              </Card>
            ) : upcomingTrips.length === 0 ? (
              <Card className="text-center py-12 border-none shadow-md">
                <CardContent>
                  <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">ΔΕΝ ΥΠΑΡΧΟΥΝ ΕΠΙΚΕΙΜΕΝΕΣ ΕΚΔΡΟΜΕΣ</p>
                </CardContent>
              </Card>
            ) : (
              upcomingTrips.map((trip) => <TripCard key={trip.id} trip={trip} />)
            )}
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            {loading ? (
              <Card className="border-none shadow-md">
                <CardContent className="py-10 text-center text-gray-600">
                  ΦΟΡΤΩΣΗ...
                </CardContent>
              </Card>
            ) : activeTrips.length === 0 ? (
              <Card className="text-center py-12 border-none shadow-md">
                <CardContent>
                  <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">ΔΕΝ ΥΠΑΡΧΟΥΝ ΕΚΔΡΟΜΕΣ ΣΕ ΕΞΕΛΙΞΗ</p>
                </CardContent>
              </Card>
            ) : (
              activeTrips.map((trip) => <TripCard key={trip.id} trip={trip} />)
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {loading ? (
              <Card className="border-none shadow-md">
                <CardContent className="py-10 text-center text-gray-600">
                  ΦΟΡΤΩΣΗ...
                </CardContent>
              </Card>
            ) : completedTrips.length === 0 ? (
              <Card className="text-center py-12 border-none shadow-md">
                <CardContent>
                  <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">ΔΕΝ ΥΠΑΡΧΟΥΝ ΟΛΟΚΛΗΡΩΜΕΝΕΣ ΕΚΔΡΟΜΕΣ</p>
                </CardContent>
              </Card>
            ) : (
              completedTrips.map((trip) => <TripCard key={trip.id} trip={trip} />)
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
