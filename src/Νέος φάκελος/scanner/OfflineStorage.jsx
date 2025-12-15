// Offline Storage Utility for Roll Scan

const OFFLINE_TRIP_DATA_KEY = 'rollscan_offline_trips';
const OFFLINE_ATTENDANCE_KEY = 'rollscan_offline_attendance';

export const OfflineStorage = {
  // Save trip data for offline use
  saveTripData: (tripId, data) => {
    try {
      const existingData = OfflineStorage.getAllTripData();
      existingData[tripId] = {
        ...data,
        downloadedAt: new Date().toISOString()
      };
      localStorage.setItem(OFFLINE_TRIP_DATA_KEY, JSON.stringify(existingData));
      return true;
    } catch (error) {
      console.error('Error saving offline trip data:', error);
      return false;
    }
  },

  // Get all saved trip data
  getAllTripData: () => {
    try {
      const data = localStorage.getItem(OFFLINE_TRIP_DATA_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Error reading offline trip data:', error);
      return {};
    }
  },

  // Get specific trip data
  getTripData: (tripId) => {
    const allData = OfflineStorage.getAllTripData();
    return allData[tripId] || null;
  },

  // Delete trip data
  deleteTripData: (tripId) => {
    try {
      const existingData = OfflineStorage.getAllTripData();
      delete existingData[tripId];
      localStorage.setItem(OFFLINE_TRIP_DATA_KEY, JSON.stringify(existingData));
      return true;
    } catch (error) {
      console.error('Error deleting offline trip data:', error);
      return false;
    }
  },

  // Save offline attendance log
  saveOfflineAttendance: (log) => {
    try {
      const logs = OfflineStorage.getOfflineAttendance();
      logs.push({
        ...log,
        id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        synced: false,
        recordedAt: new Date().toISOString()
      });
      localStorage.setItem(OFFLINE_ATTENDANCE_KEY, JSON.stringify(logs));
      return true;
    } catch (error) {
      console.error('Error saving offline attendance:', error);
      return false;
    }
  },

  // Get all offline attendance logs
  getOfflineAttendance: () => {
    try {
      const data = localStorage.getItem(OFFLINE_ATTENDANCE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading offline attendance:', error);
      return [];
    }
  },

  // Get unsynced attendance logs
  getUnsyncedAttendance: () => {
    return OfflineStorage.getOfflineAttendance().filter(log => !log.synced);
  },

  // Mark attendance as synced
  markAttendanceSynced: (logId) => {
    try {
      const logs = OfflineStorage.getOfflineAttendance();
      const updatedLogs = logs.map(log => 
        log.id === logId ? { ...log, synced: true } : log
      );
      localStorage.setItem(OFFLINE_ATTENDANCE_KEY, JSON.stringify(updatedLogs));
      return true;
    } catch (error) {
      console.error('Error marking attendance synced:', error);
      return false;
    }
  },

  // Remove synced attendance logs (cleanup)
  clearSyncedAttendance: () => {
    try {
      const logs = OfflineStorage.getOfflineAttendance().filter(log => !log.synced);
      localStorage.setItem(OFFLINE_ATTENDANCE_KEY, JSON.stringify(logs));
      return true;
    } catch (error) {
      console.error('Error clearing synced attendance:', error);
      return false;
    }
  },

  // Check if participant already scanned offline
  isParticipantScannedOffline: (tripId, segmentId, participantId) => {
    const logs = OfflineStorage.getOfflineAttendance();
    return logs.some(log => 
      log.trip_id === tripId && 
      log.segment_id === segmentId && 
      log.participant_id === participantId
    );
  }
};

// Online/Offline detection
export const NetworkStatus = {
  isOnline: () => navigator.onLine,
  
  addOnlineListener: (callback) => {
    window.addEventListener('online', callback);
    return () => window.removeEventListener('online', callback);
  },
  
  addOfflineListener: (callback) => {
    window.addEventListener('offline', callback);
    return () => window.removeEventListener('offline', callback);
  }
};