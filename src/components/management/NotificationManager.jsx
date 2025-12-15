import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Send,
  AlertCircle,
  Info,
  AlertTriangle,
  XCircle,
  Clock,
  MapPin,
  CheckCircle2,
  Zap,
  FileText
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

import NotificationRules from "./NotificationRules";
import NotificationAuditLog from "./NotificationAuditLog";

export default function NotificationManager() {
  const [user, setUser] = useState(null);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("info");
  const [targetAudience, setTargetAudience] = useState("all");
  const [isUrgent, setIsUrgent] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error("Error loading user:", error);
      }
    };
    loadUser();
  }, []);

  const { data: trips = [] } = useQuery({
    queryKey: ['trips'],
    queryFn: () => base44.entities.Trip.filter({ status: 'active' }),
  });

  const sendNotificationMutation = useMutation({
    mutationFn: async () => {
      const notification = await base44.entities.Notification.create({
        trip_id: selectedTrip,
        title,
        message,
        type,
        target_audience: targetAudience,
        is_urgent: isUrgent,
        read_by: [],
        sent_at: new Date().toISOString()
      });

      await base44.entities.NotificationAuditLog.create({
        notification_id: notification.id,
        action: 'created',
        performed_by: user?.email || 'unknown',
        performed_at: new Date().toISOString(),
        details: {
          title: title,
          type: type,
          target_audience: targetAudience,
          is_urgent: isUrgent
        }
      });

      return notification;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notificationAuditLogs'] });
      setSuccessMessage("Η ειδοποίηση στάλθηκε επιτυχώς!");
      setTitle("");
      setMessage("");
      setType("info");
      setIsUrgent(false);
      
      setTimeout(() => setSuccessMessage(""), 5000);
    },
  });

  const typeOptions = [
    { value: "info", label: "Πληροφορία", icon: Info, color: "text-blue-600" },
    { value: "warning", label: "Προσοχή", icon: AlertTriangle, color: "text-yellow-600" },
    { value: "urgent", label: "Επείγον", icon: AlertCircle, color: "text-red-600" },
    { value: "cancellation", label: "Ακύρωση", icon: XCircle, color: "text-red-600" },
    { value: "delay", label: "Καθυστέρηση", icon: Clock, color: "text-orange-600" },
    { value: "location_change", label: "Αλλαγή Τοποθεσίας", icon: MapPin, color: "text-purple-600" },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedTrip || !title.trim() || !message.trim()) return;
    sendNotificationMutation.mutate();
  };

  return (
    <Tabs defaultValue="manual" className="w-full">
      <TabsList className="w-full overflow-x-auto flex md:grid md:grid-cols-3 mb-6">
        <TabsTrigger value="manual" className="flex items-center gap-2 whitespace-nowrap">
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Χειροκίνητη Αποστολή</span>
          <span className="sm:hidden">Χειροκίνητη</span>
        </TabsTrigger>
        <TabsTrigger value="rules" className="flex items-center gap-2 whitespace-nowrap">
          <Zap className="w-4 h-4" />
          <span className="hidden sm:inline">Αυτόματοι Κανόνες</span>
          <span className="sm:hidden">Κανόνες</span>
        </TabsTrigger>
        <TabsTrigger value="audit" className="flex items-center gap-2 whitespace-nowrap">
          <FileText className="w-4 h-4" />
          Ημερολόγιο
        </TabsTrigger>
      </TabsList>

      <TabsContent value="manual">
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-orange-500" />
              Αποστολή Ειδοποίησης
            </CardTitle>
          </CardHeader>
          <CardContent>
            {successMessage && (
              <Alert className="mb-4 bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  {successMessage}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Εκδρομή
                </label>
                <Select value={selectedTrip || ""} onValueChange={setSelectedTrip}>
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

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Τίτλος
                </label>
                <Input
                  placeholder="π.χ. Καθυστέρηση αναχώρησης"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Μήνυμα
                </label>
                <Textarea
                  placeholder="Αναλυτική περιγραφή της ειδοποίησης..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="h-24"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Τύπος Ειδοποίησης
                  </label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {typeOptions.map((option) => {
                        const Icon = option.icon;
                        return (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <Icon className={`w-4 h-4 ${option.color}`} />
                              {option.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Αποδέκτες
                  </label>
                  <Select value={targetAudience} onValueChange={setTargetAudience}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Όλοι</SelectItem>
                      <SelectItem value="participants">Μόνο Συμμετέχοντες</SelectItem>
                      <SelectItem value="companions">Μόνο Συνοδοί</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="urgent"
                  checked={isUrgent}
                  onChange={(e) => setIsUrgent(e.target.checked)}
                  className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                />
                <label htmlFor="urgent" className="text-sm text-gray-700">
                  Επείγουσα ειδοποίηση
                </label>
              </div>

              <Button
                type="submit"
                disabled={!selectedTrip || !title.trim() || !message.trim() || sendNotificationMutation.isPending}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
              >
                <Send className="w-4 h-4 mr-2" />
                {sendNotificationMutation.isPending ? "Αποστολή..." : "Αποστολή Ειδοποίησης"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="rules">
        <NotificationRules />
      </TabsContent>

      <TabsContent value="audit">
        <NotificationAuditLog />
      </TabsContent>
    </Tabs>
  );
}