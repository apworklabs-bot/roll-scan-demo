import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  WifiOff, 
  Wifi, 
  CloudUpload, 
  Loader2, 
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { OfflineStorage, NetworkStatus } from "./OfflineStorage";

export default function OfflineSyncBanner() {
  const [isOnline, setIsOnline] = useState(NetworkStatus.isOnline());
  const [unsyncedCount, setUnsyncedCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  useEffect(() => {
    // Check unsynced count
    updateUnsyncedCount();

    // Listen for network changes
    const removeOnlineListener = NetworkStatus.addOnlineListener(() => {
      setIsOnline(true);
      // Auto-sync when coming online
      autoSync();
    });
    const removeOfflineListener = NetworkStatus.addOfflineListener(() => setIsOnline(false));

    // Periodic check for unsynced logs
    const interval = setInterval(updateUnsyncedCount, 5000);

    return () => {
      removeOnlineListener();
      removeOfflineListener();
      clearInterval(interval);
    };
  }, []);

  const updateUnsyncedCount = () => {
    const unsynced = OfflineStorage.getUnsyncedAttendance();
    setUnsyncedCount(unsynced.length);
  };

  const autoSync = async () => {
    const unsynced = OfflineStorage.getUnsyncedAttendance();
    if (unsynced.length > 0 && NetworkStatus.isOnline()) {
      await syncOfflineData();
    }
  };

  const syncOfflineData = async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    setSyncResult(null);
    
    const unsynced = OfflineStorage.getUnsyncedAttendance();
    let successCount = 0;
    let errorCount = 0;

    for (const log of unsynced) {
      try {
        // Check if already exists in server
        const existing = await base44.entities.AttendanceLog.filter({
          participant_id: log.participant_id,
          segment_id: log.segment_id
        });

        if (existing.length === 0) {
          // Create new attendance log
          await base44.entities.AttendanceLog.create({
            participant_id: log.participant_id,
            trip_id: log.trip_id,
            segment_id: log.segment_id,
            check_in_time: log.check_in_time,
            method: log.method,
            checked_by: log.checked_by,
            notes: log.notes || 'Καταγράφηκε offline',
            synced: true
          });
        }
        
        // Mark as synced locally
        OfflineStorage.markAttendanceSynced(log.id);
        successCount++;
      } catch (error) {
        console.error('Error syncing log:', error);
        errorCount++;
      }
    }

    // Cleanup synced logs
    OfflineStorage.clearSyncedAttendance();
    updateUnsyncedCount();

    setSyncResult({
      success: successCount,
      errors: errorCount
    });

    setTimeout(() => setSyncResult(null), 5000);
    setIsSyncing(false);
  };

  // Don't show if online and no unsynced data
  if (isOnline && unsyncedCount === 0 && !syncResult) {
    return null;
  }

  return (
    <div className={`p-3 rounded-xl mb-4 ${
      isOnline 
        ? unsyncedCount > 0 
          ? 'bg-yellow-50 border-2 border-yellow-200' 
          : 'bg-green-50 border-2 border-green-200'
        : 'bg-red-50 border-2 border-red-200'
    }`}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Wifi className="w-5 h-5 text-green-600" />
          ) : (
            <WifiOff className="w-5 h-5 text-red-600" />
          )}
          
          <span className={`text-sm font-medium ${
            isOnline ? 'text-green-800' : 'text-red-800'
          }`}>
            {isOnline ? 'Συνδεδεμένο' : 'Εκτός Σύνδεσης'}
          </span>

          {unsyncedCount > 0 && (
            <Badge className="bg-yellow-200 text-yellow-800">
              {unsyncedCount} εκκρεμείς
            </Badge>
          )}
        </div>

        {syncResult && (
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="text-green-800">
              Συγχρονίστηκαν {syncResult.success} παρουσίες
            </span>
            {syncResult.errors > 0 && (
              <span className="text-red-600">
                ({syncResult.errors} σφάλματα)
              </span>
            )}
          </div>
        )}

        {isOnline && unsyncedCount > 0 && (
          <Button
            onClick={syncOfflineData}
            disabled={isSyncing}
            size="sm"
            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
          >
            {isSyncing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Συγχρονισμός...
              </>
            ) : (
              <>
                <CloudUpload className="w-4 h-4 mr-2" />
                Συγχρονισμός
              </>
            )}
          </Button>
        )}
      </div>

      {!isOnline && (
        <p className="text-xs text-red-700 mt-2">
          Οι παρουσίες αποθηκεύονται τοπικά και θα συγχρονιστούν αυτόματα όταν επιστρέψει η σύνδεση.
        </p>
      )}
    </div>
  );
}