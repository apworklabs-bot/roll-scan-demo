import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Download, 
  Trash2, 
  CheckCircle2, 
  Loader2, 
  WifiOff,
  HardDrive,
  Users,
  QrCode,
  Calendar
} from "lucide-react";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import { OfflineStorage, NetworkStatus } from "./OfflineStorage";

export default function OfflineDownloader({ trip, onClose }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState("");
  const [offlineData, setOfflineData] = useState(null);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(NetworkStatus.isOnline());

  useEffect(() => {
    // Check if trip data already downloaded
    const existingData = OfflineStorage.getTripData(trip.id);
    if (existingData) {
      setOfflineData(existingData);
    }

    // Listen for network changes
    const removeOnlineListener = NetworkStatus.addOnlineListener(() => setIsOnline(true));
    const removeOfflineListener = NetworkStatus.addOfflineListener(() => setIsOnline(false));

    return () => {
      removeOnlineListener();
      removeOfflineListener();
    };
  }, [trip.id]);

  const downloadTripData = async () => {
    setIsDownloading(true);
    setError(null);
    
    try {
      setDownloadProgress("Λήψη συμμετεχόντων...");
      const participants = await base44.entities.Participant.filter({ trip_id: trip.id });
      
      setDownloadProgress("Λήψη QR κωδικών...");
      const passes = await base44.entities.Pass.filter({ trip_id: trip.id });
      
      setDownloadProgress("Λήψη τμημάτων...");
      const segments = await base44.entities.TripSegment.filter({ trip_id: trip.id });
      
      setDownloadProgress("Λήψη υπαρχουσών παρουσιών...");
      const attendanceLogs = await base44.entities.AttendanceLog.filter({ trip_id: trip.id });

      const data = {
        trip,
        participants,
        passes,
        segments,
        attendanceLogs,
        participantCount: participants.length,
        passCount: passes.length
      };

      setDownloadProgress("Αποθήκευση...");
      const success = OfflineStorage.saveTripData(trip.id, data);
      
      if (success) {
        setOfflineData(data);
        setDownloadProgress("");
      } else {
        setError("Αποτυχία αποθήκευσης δεδομένων");
      }
    } catch (err) {
      console.error("Download error:", err);
      setError("Σφάλμα κατά τη λήψη δεδομένων: " + err.message);
    } finally {
      setIsDownloading(false);
    }
  };

  const deleteOfflineData = () => {
    OfflineStorage.deleteTripData(trip.id);
    setOfflineData(null);
  };

  return (
    <Card className="border-none shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-orange-500" />
          Offline Λειτουργία
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Network Status */}
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Badge className="bg-green-100 text-green-800">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Συνδεδεμένο
            </Badge>
          ) : (
            <Badge className="bg-red-100 text-red-800">
              <WifiOff className="w-3 h-3 mr-1" />
              Εκτός Σύνδεσης
            </Badge>
          )}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {offlineData ? (
          // Data already downloaded
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-semibold">Δεδομένα Διαθέσιμα Offline</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-700">
                <Users className="w-4 h-4 text-gray-500" />
                <span>{offlineData.participantCount} Συμμετέχοντες</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <QrCode className="w-4 h-4 text-gray-500" />
                <span>{offlineData.passCount} QR Κωδικοί</span>
              </div>
            </div>

            {offlineData.downloadedAt && (
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Λήφθηκε: {format(new Date(offlineData.downloadedAt), 'd MMM yyyy, HH:mm', { locale: el })}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                onClick={downloadTripData}
                disabled={isDownloading || !isOnline}
                variant="outline"
                className="flex-1"
              >
                {isDownloading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Ενημέρωση
              </Button>
              <Button
                onClick={deleteOfflineData}
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Διαγραφή
              </Button>
            </div>
          </div>
        ) : (
          // No data downloaded yet
          <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4 space-y-3">
            <p className="text-sm text-gray-700">
              Κατεβάστε τα δεδομένα της εκδρομής για να μπορείτε να σαρώσετε 
              παρουσίες ακόμα και χωρίς σύνδεση στο internet.
            </p>
            
            <Button
              onClick={downloadTripData}
              disabled={isDownloading || !isOnline}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {downloadProgress || "Λήψη..."}
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Λήψη για Offline Χρήση
                </>
              )}
            </Button>

            {!isOnline && (
              <p className="text-xs text-red-600">
                Χρειάζεστε σύνδεση στο internet για να κατεβάσετε τα δεδομένα.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}