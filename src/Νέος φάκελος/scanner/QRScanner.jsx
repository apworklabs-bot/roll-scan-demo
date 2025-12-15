import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScanLine, Hash, Camera, X, Loader2, AlertCircle, WifiOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { OfflineStorage, NetworkStatus } from "./OfflineStorage";

export default function QRScanner({ trip, segment, onScanResult }) {
  const [manualCode, setManualCode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [debugInfo, setDebugInfo] = useState("");
  const [isOnline, setIsOnline] = useState(NetworkStatus.isOnline());
  const [offlineMode, setOfflineMode] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);
  
  const queryClient = useQueryClient();

  // Check network status and offline data availability
  useEffect(() => {
    const checkOfflineMode = () => {
      const online = NetworkStatus.isOnline();
      setIsOnline(online);
      
      if (!online) {
        const offlineData = OfflineStorage.getTripData(trip.id);
        setOfflineMode(!!offlineData);
      } else {
        setOfflineMode(false);
      }
    };

    checkOfflineMode();
    const removeOnlineListener = NetworkStatus.addOnlineListener(checkOfflineMode);
    const removeOfflineListener = NetworkStatus.addOfflineListener(checkOfflineMode);

    return () => {
      removeOnlineListener();
      removeOfflineListener();
    };
  }, [trip.id]);

  const addDebug = (msg) => {
    console.log("DEBUG:", msg);
    setDebugInfo(prev => prev + "\n" + msg);
  };

  // Offline scan processing
  const processOfflineScan = async (qrData) => {
    const data = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;
    
    if (data.trip_id !== trip.id) {
      return {
        success: false,
        message: 'Αυτό το QR ανήκει σε διαφορετική εκδρομή',
      };
    }

    const offlineData = OfflineStorage.getTripData(trip.id);
    if (!offlineData) {
      return {
        success: false,
        message: 'Δεν υπάρχουν offline δεδομένα για αυτή την εκδρομή',
      };
    }

    const participant = offlineData.participants.find(p => p.id === data.participant_id);
    if (!participant) {
      return {
        success: false,
        message: 'Δεν βρέθηκε ο συμμετέχων στα offline δεδομένα',
      };
    }

    // Check if already scanned offline
    if (OfflineStorage.isParticipantScannedOffline(trip.id, segment.id, data.participant_id)) {
      return {
        success: false,
        message: 'Ο συμμετέχων έχει ήδη καταγραφεί σε αυτό το τμήμα (offline)',
        participant
      };
    }

    // Check if already in downloaded attendance logs
    const existingLog = offlineData.attendanceLogs?.find(
      log => log.participant_id === data.participant_id && log.segment_id === segment.id
    );
    if (existingLog) {
      return {
        success: false,
        message: 'Ο συμμετέχων έχει ήδη καταγραφεί σε αυτό το τμήμα',
        participant
      };
    }

    // Save offline attendance
    const userEmail = localStorage.getItem('rollscan_user_email') || 'offline_user';
    OfflineStorage.saveOfflineAttendance({
      participant_id: data.participant_id,
      trip_id: trip.id,
      segment_id: segment.id,
      check_in_time: new Date().toISOString(),
      method: 'qr_scan',
      checked_by: userEmail,
      notes: 'Καταγράφηκε offline'
    });

    return {
      success: true,
      message: 'Παρουσία καταγράφηκε offline (θα συγχρονιστεί αργότερα)',
      participant,
      offline: true
    };
  };

  const processScanMutation = useMutation({
    mutationFn: async (qrData) => {
      // Check if offline - use offline processing
      if (!NetworkStatus.isOnline()) {
        return await processOfflineScan(qrData);
      }

      const data = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;
      
      if (data.trip_id !== trip.id) {
        return {
          success: false,
          message: 'Αυτό το QR ανήκει σε διαφορετική εκδρομή',
        };
      }
      
      const participant = await base44.entities.Participant.get(data.participant_id);
      
      const existingLog = await base44.entities.AttendanceLog.filter({
        participant_id: data.participant_id,
        segment_id: segment.id
      });
      
      if (existingLog.length > 0) {
        return {
          success: false,
          message: 'Ο συμμετέχων έχει ήδη καταγραφεί σε αυτό το τμήμα',
          participant
        };
      }
      
      const user = await base44.auth.me();
      
      // Store user email for offline use
      localStorage.setItem('rollscan_user_email', user.email);
      
      await base44.entities.AttendanceLog.create({
        participant_id: data.participant_id,
        trip_id: trip.id,
        segment_id: segment.id,
        check_in_time: new Date().toISOString(),
        method: 'qr_scan',
        checked_by: user.email,
        synced: true
      });
      
      return {
        success: true,
        message: 'Παρουσία καταγράφηκε επιτυχώς',
        participant
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['attendanceLogs'] });
      queryClient.invalidateQueries({ queryKey: ['attendanceLogs', trip.id, segment.id] });
      queryClient.invalidateQueries({ queryKey: ['recentLogs'] });
      onScanResult(result);
      setManualCode("");
      setIsProcessing(false);
    },
    onError: (error) => {
      onScanResult({
        success: false,
        message: 'Σφάλμα κατά την καταγραφή: ' + error.message
      });
      setIsProcessing(false);
    }
  });

  const startCamera = async () => {
    addDebug("1. startCamera called");
    setCameraError(null);
    setDebugInfo("");
    
    // Check if browser supports getUserMedia
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const errMsg = "Browser δεν υποστηρίζει getUserMedia";
      addDebug("ERROR: " + errMsg);
      setCameraError("Ο browser σας δεν υποστηρίζει πρόσβαση στην κάμερα. Χρησιμοποιήστε Chrome, Safari ή Firefox.");
      return;
    }
    
    addDebug("2. getUserMedia is supported");
    
    try {
      addDebug("3. Requesting camera access...");
      
      // Try with back camera first
      let stream = null;
      
      try {
        addDebug("4. Trying environment (back) camera");
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false 
        });
        addDebug("5. Got back camera stream");
      } catch (err) {
        addDebug("6. Back camera failed, trying any camera: " + err.message);
        // If back camera fails, try with any available camera
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false 
        });
        addDebug("7. Got any camera stream");
      }
      
      if (!stream) {
        addDebug("ERROR: Stream is null");
        setCameraError("Δεν ήταν δυνατή η λήψη stream από την κάμερα");
        return;
      }
      
      addDebug("8. Stream obtained successfully");
      streamRef.current = stream;
      
      // Set camera active FIRST so video element renders
      addDebug("9. Setting isCameraActive to true");
      setIsCameraActive(true);
      
      // Wait a bit for React to render the video element
      addDebug("10. Waiting for video element to render...");
      setTimeout(() => {
        addDebug("11. Checking videoRef.current...");
        
        if (!videoRef.current) {
          addDebug("ERROR: videoRef.current is STILL null after timeout");
          setCameraError("Το video element δεν είναι διαθέσιμο");
          stopCamera();
          return;
        }
        
        addDebug("12. videoRef.current exists! Setting srcObject");
        videoRef.current.srcObject = stream;
        
        addDebug("13. Attempting to play video");
        
        // Try to play immediately
        videoRef.current.play()
          .then(() => {
            addDebug("14. Video playing!");
            
            // Start scanning after a short delay
            setTimeout(() => {
              addDebug("15. Starting scanner");
              startScanning();
            }, 500);
          })
          .catch(playErr => {
            addDebug("ERROR playing video: " + playErr.message);
            
            // Fallback: try with loadedmetadata event
            videoRef.current.onloadedmetadata = () => {
              addDebug("16. loadedmetadata event fired");
              videoRef.current.play()
                .then(() => {
                  addDebug("17. Video playing after metadata loaded");
                  setTimeout(() => {
                    addDebug("18. Starting scanner");
                    startScanning();
                  }, 500);
                })
                .catch(err2 => {
                  addDebug("ERROR: Final play attempt failed: " + err2.message);
                  setCameraError("Δεν ήταν δυνατή η εκκίνηση του video: " + err2.message);
                  stopCamera();
                });
            };
          });
      }, 100); // Wait 100ms for React to render
      
    } catch (err) {
      addDebug("ERROR in startCamera: " + err.message);
      console.error("Error accessing camera:", err);
      
      let errorMessage = "Δεν ήταν δυνατή η πρόσβαση στην κάμερα. ";
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage += "Παρακαλώ δώστε άδεια πρόσβασης στην κάμερα από τις ρυθμίσεις του browser.";
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage += "Δεν βρέθηκε κάμερα στη συσκευή σας.";
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMessage += "Η κάμερα χρησιμοποιείται από άλλη εφαρμογή.";
      } else if (err.name === 'OverconstrainedError') {
        errorMessage += "Οι απαιτήσεις της κάμερας δεν μπορούν να ικανοποιηθούν.";
      } else if (err.name === 'TypeError') {
        errorMessage += "Μη έγκυρες ρυθμίσεις κάμερας.";
      } else {
        errorMessage += err.message || "Άγνωστο σφάλμα.";
      }
      
      setCameraError(errorMessage);
      stopCamera();
    }
  };

  const stopCamera = () => {
    addDebug("Stopping camera");
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsScanning(false);
  };

  const startScanning = () => {
    addDebug("startScanning called");
    setIsScanning(true);
    
    // Load jsQR library dynamically
    if (!window.jsQR) {
      addDebug("Loading jsQR library...");
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js';
      script.onload = () => {
        addDebug("jsQR loaded successfully");
        scanQRCode();
      };
      script.onerror = () => {
        addDebug("ERROR: Failed to load jsQR");
        setCameraError("Δεν ήταν δυνατή η φόρτωση της βιβλιοθήκης QR. Ελέγξτε τη σύνδεσή σας.");
        stopCamera();
      };
      document.head.appendChild(script);
    } else {
      addDebug("jsQR already loaded");
      scanQRCode();
    }
  };

  const scanQRCode = () => {
    addDebug("scanQRCode started");
    
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
    
    let scanCount = 0;
    
    scanIntervalRef.current = setInterval(() => {
      scanCount++;
      
      if (scanCount % 10 === 0) {
        addDebug(`Scan attempt ${scanCount}`);
      }
      
      if (videoRef.current && canvasRef.current && window.jsQR && !isProcessing) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          const ctx = canvas.getContext('2d');
          
          canvas.height = video.videoHeight;
          canvas.width = video.videoWidth;
          
          if (canvas.height > 0 && canvas.width > 0) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = window.jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: "dontInvert",
            });
            
            if (code) {
              addDebug("QR Code detected: " + code.data);
              console.log("QR Code detected:", code.data);
              
              // Stop scanning temporarily
              if (scanIntervalRef.current) {
                clearInterval(scanIntervalRef.current);
                scanIntervalRef.current = null;
              }
              
              setIsProcessing(true);
              
              try {
                const qrData = JSON.parse(code.data);
                processScanMutation.mutateAsync(qrData).then(() => {
                  // Resume scanning after 2 seconds
                  setTimeout(() => {
                    if (isCameraActive) {
                      setIsProcessing(false);
                      scanQRCode();
                    }
                  }, 2000);
                }).catch(() => {
                  setIsProcessing(false);
                  setTimeout(() => {
                    if (isCameraActive) {
                      scanQRCode();
                    }
                  }, 2000);
                });
              } catch (error) {
                console.error("QR parse error:", error);
                addDebug("ERROR parsing QR: " + error.message);
                onScanResult({
                  success: false,
                  message: 'Μη έγκυρος κωδικός QR'
                });
                setIsProcessing(false);
                // Resume scanning
                setTimeout(() => {
                  if (isCameraActive) {
                    scanQRCode();
                  }
                }, 2000);
              }
            }
          }
        }
      }
    }, 300); // Scan every 300ms
  };

  const handleManualScan = async () => {
    if (!manualCode.trim()) return;
    
    setIsProcessing(true);
    try {
      const allPasses = await base44.entities.Pass.list();
      const matchingPass = allPasses.find(p => p.pass_code === manualCode.trim());
      
      if (!matchingPass) {
        onScanResult({
          success: false,
          message: 'Δεν βρέθηκε έγκυρο πάσο με αυτόν τον κωδικό'
        });
        setIsProcessing(false);
        return;
      }
      
      const qrData = {
        pass_id: matchingPass.id,
        pass_code: matchingPass.pass_code,
        trip_id: matchingPass.trip_id,
        participant_id: matchingPass.participant_id
      };
      
      await processScanMutation.mutateAsync(qrData);
    } catch (error) {
      console.error("Manual scan error:", error);
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <Card className="border-none shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ScanLine className="w-5 h-5 text-orange-500" />
          Σάρωση QR
          {!isOnline && (
            <span className="ml-2 flex items-center gap-1 text-sm font-normal text-yellow-700 bg-yellow-100 px-2 py-1 rounded-full">
              <WifiOff className="w-3 h-3" />
              Offline
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {cameraError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{cameraError}</AlertDescription>
          </Alert>
        )}

        {debugInfo && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <pre className="text-xs whitespace-pre-wrap max-h-40 overflow-auto">{debugInfo}</pre>
            </AlertDescription>
          </Alert>
        )}

        <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-6 rounded-xl border-2 border-orange-100">
          {!isCameraActive ? (
            <div className="text-center">
              <div className="w-24 h-24 bg-white rounded-2xl shadow-inner flex items-center justify-center mx-auto mb-4">
                <Camera className="w-12 h-12 text-orange-500" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                {segment.name || segment.type || 'Segment'}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Ενεργοποιήστε την κάμερα για αυτόματη σάρωση QR
              </p>
              
              <Button
                onClick={startCamera}
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 mb-4"
              >
                <Camera className="w-4 h-4 mr-2" />
                Ενεργοποίηση Κάμερας
              </Button>

              <div className="border-t border-orange-200 pt-4 mt-4">
                <p className="text-sm text-gray-600 mb-3">Ή εισάγετε τον κωδικό χειροκίνητα:</p>
                <div className="flex gap-2">
                  <Input
                    placeholder="Κωδικός πάσου..."
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleManualScan()}
                    disabled={isProcessing}
                  />
                  <Button 
                    onClick={handleManualScan}
                    disabled={isProcessing || !manualCode.trim()}
                    className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Hash className="w-4 h-4 mr-2" />
                    )}
                    Scan
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative bg-black rounded-xl overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-auto"
                  playsInline
                  muted
                  autoPlay
                  style={{ maxHeight: '500px' }}
                />
                <canvas
                  ref={canvasRef}
                  className="hidden"
                />
                
                {isScanning && !isProcessing && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-64 h-64 border-4 border-green-500 rounded-xl animate-pulse">
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-500"></div>
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-500"></div>
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-500"></div>
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-500"></div>
                    </div>
                  </div>
                )}
                
                {isProcessing && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="bg-white rounded-xl p-4 flex items-center gap-3">
                      <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
                      <span className="text-gray-900 font-medium">Επεξεργασία...</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={stopCamera}
                  variant="outline"
                  className="flex-1"
                >
                  <X className="w-4 h-4 mr-2" />
                  Κλείσιμο Κάμερας
                </Button>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  {isScanning ? '📷 Σάρωση για QR κωδικούς...' : 'Κάμερα ενεργή'}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}