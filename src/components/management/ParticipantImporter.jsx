import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Upload, XCircle, CheckCircle2, Loader2, Info, FileText, Download } from "lucide-react";

export default function ParticipantImporter() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedTripId, setSelectedTripId] = useState("");
  const [parsedData, setParsedData] = useState([]);
  const [parseErrors, setParseErrors] = useState([]);
  const [importStatus, setImportStatus] = useState(null);
  const [importMessage, setImportMessage] = useState("");
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: trips = [], isLoading: isLoadingTrips } = useQuery({
    queryKey: ['tripsForImport'],
    queryFn: () => base44.entities.Trip.filter({ status: { $ne: 'completed' } }),
  });

  const { data: participants = [] } = useQuery({
    queryKey: ['participantsForExport', selectedTripId],
    queryFn: () => base44.entities.Participant.filter({ trip_id: selectedTripId }),
    enabled: !!selectedTripId,
  });

  const csvHeaders = [
    'full_name', 'email', 'phone', 'bus_number', 'group_name', 
    'status', 'payment_status', 'amount_owed', 'payment_breakdown',
    'transportation_method', 'boarding_point', 'medical_notes',
    'emergency_contact_name', 'emergency_contact_phone', 'gdpr_consent'
  ];

  const parseCSV = (text) => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    if (lines.length < 2) return { data: [], errors: ['Το αρχείο είναι κενό ή δεν περιέχει δεδομένα'] };

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const data = [];
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row = {};
      
      headers.forEach((header, index) => {
        let value = values[index] || '';
        
        // Type conversions
        if (header === 'amount_owed' && value) {
          value = parseFloat(value) || 0;
        } else if (header === 'gdpr_consent') {
          value = value.toLowerCase() === 'true' || value === '1';
        }
        
        if (value !== '') {
          row[header] = value;
        }
      });

      // Validate required fields
      if (!row.full_name || !row.email) {
        errors.push(`Γραμμή ${i + 1}: Λείπει το full_name ή email`);
        continue;
      }

      // Set defaults
      row.status = row.status || 'confirmed';
      row.payment_status = row.payment_status || 'pending';
      row.amount_owed = row.amount_owed || 0;
      row.transportation_method = row.transportation_method || 'bus';
      row.gdpr_consent = row.gdpr_consent || false;

      data.push(row);
    }

    return { data, errors };
  };

  const importMutation = useMutation({
    mutationFn: async (participantsToImport) => {
      const results = { success: 0, failed: 0, errors: [] };
      
      for (const participant of participantsToImport) {
        try {
          await base44.entities.Participant.create({
            ...participant,
            trip_id: selectedTripId
          });
          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push(`${participant.full_name}: ${error.message}`);
        }
      }
      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['participants'] });
      queryClient.invalidateQueries({ queryKey: ['participantsForExport'] });
      setImportStatus(results.failed > 0 ? 'warning' : 'success');
      setImportMessage(`Εισαγωγή: ${results.success} επιτυχίες, ${results.failed} αποτυχίες`);
      setSelectedFile(null);
      setParsedData([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    onError: (error) => {
      setImportStatus('error');
      setImportMessage(`Σφάλμα: ${error.message}`);
    }
  });

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setImportStatus(null);
    setImportMessage("");
    setParseErrors([]);

    const reader = new FileReader();
    reader.onload = (e) => {
      const { data, errors } = parseCSV(e.target.result);
      setParsedData(data);
      setParseErrors(errors);
      
      if (data.length > 0) {
        setImportStatus('info');
        setImportMessage(`Βρέθηκαν ${data.length} έγκυροι συμμετέχοντες`);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (!selectedTripId || parsedData.length === 0) return;
    importMutation.mutate(parsedData);
  };

  const exportToCSV = () => {
    if (participants.length === 0) return;

    const csvContent = [
      csvHeaders.join(','),
      ...participants.map(p => 
        csvHeaders.map(h => {
          const val = p[h];
          if (val === undefined || val === null) return '';
          if (typeof val === 'string' && val.includes(',')) return `"${val}"`;
          return val;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const tripTitle = trips.find(t => t.id === selectedTripId)?.title || 'participants';
    link.download = `${tripTitle}_participants.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadTemplate = () => {
    const templateContent = [
      csvHeaders.join(','),
      'Γιάννης Παπαδόπουλος,giannis@example.com,6912345678,B1,Ομάδα Α,confirmed,pending,50,Εισιτήριο: 30€ Φαγητό: 20€,bus,Αθήνα,Αλλεργία στα φιστίκια,Μαρία Παπαδοπούλου,6987654321,true'
    ].join('\n');

    const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'participant_template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-orange-500" />
            Εισαγωγή / Εξαγωγή Συμμετεχόντων
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Trip Selection */}
          <div>
            <Label className="mb-2 block">Επιλέξτε Εκδρομή</Label>
            <Select value={selectedTripId} onValueChange={setSelectedTripId} disabled={isLoadingTrips}>
              <SelectTrigger>
                <SelectValue placeholder="Επιλέξτε εκδρομή..." />
              </SelectTrigger>
              <SelectContent>
                {trips.map((trip) => (
                  <SelectItem key={trip.id} value={trip.id}>
                    {trip.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Import Section */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-900 mb-3">Εισαγωγή από CSV</h3>
            
            <div className="flex gap-2 mb-4">
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="w-4 h-4 mr-2" />
                Κατέβασμα Template
              </Button>
            </div>

            <Input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              ref={fileInputRef}
              disabled={!selectedTripId || importMutation.isPending}
            />

            {parseErrors.length > 0 && (
              <Alert variant="destructive" className="mt-3">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Σφάλματα Ανάλυσης</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside">
                    {parseErrors.map((err, i) => <li key={i}>{err}</li>)}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {importStatus && (
              <Alert 
                variant={importStatus === 'error' ? 'destructive' : 'default'} 
                className={`mt-3 ${importStatus === 'success' ? 'border-green-500 bg-green-50' : ''}`}
              >
                {importStatus === 'error' && <XCircle className="h-4 w-4" />}
                {importStatus === 'success' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                {importStatus === 'warning' && <Info className="h-4 w-4" />}
                {importStatus === 'info' && <FileText className="h-4 w-4" />}
                <AlertDescription>{importMessage}</AlertDescription>
              </Alert>
            )}

            {parsedData.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Προεπισκόπηση ({parsedData.length} συμμετέχοντες)
                </h4>
                <div className="max-h-48 overflow-auto border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ονοματεπώνυμο</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Τηλέφωνο</TableHead>
                        <TableHead>Οφειλή</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedData.slice(0, 5).map((row, i) => (
                        <TableRow key={i}>
                          <TableCell>{row.full_name}</TableCell>
                          <TableCell>{row.email}</TableCell>
                          <TableCell>{row.phone || '-'}</TableCell>
                          <TableCell>{row.amount_owed}€</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {parsedData.length > 5 && (
                  <p className="text-xs text-gray-500 mt-1">...και {parsedData.length - 5} ακόμη</p>
                )}
              </div>
            )}

            <Button
              onClick={handleImport}
              disabled={!selectedTripId || parsedData.length === 0 || importMutation.isPending}
              className="w-full mt-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
            >
              {importMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Εισαγωγή...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Εισαγωγή {parsedData.length > 0 ? `${parsedData.length} Συμμετεχόντων` : ''}
                </>
              )}
            </Button>
          </div>

          {/* Export Section */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-900 mb-3">Εξαγωγή σε CSV</h3>
            <p className="text-sm text-gray-600 mb-3">
              {selectedTripId 
                ? `${participants.length} συμμετέχοντες στην επιλεγμένη εκδρομή`
                : 'Επιλέξτε εκδρομή για εξαγωγή'}
            </p>
            <Button
              variant="outline"
              onClick={exportToCSV}
              disabled={!selectedTripId || participants.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Εξαγωγή Συμμετεχόντων
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}