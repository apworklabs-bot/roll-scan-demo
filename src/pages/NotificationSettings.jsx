import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Settings, 
  Bell,
  Mail,
  Smartphone,
  CheckCircle2,
  Info,
  AlertTriangle,
  AlertCircle,
  XCircle,
  Clock,
  MapPin
} from "lucide-react";

export default function NotificationSettings() {
  const [user, setUser] = useState(null);
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

  const { data: preferences, isLoading } = useQuery({
    queryKey: ['notificationPreferences', user?.email],
    queryFn: async () => {
      if (!user) return null;
      const prefs = await base44.entities.NotificationPreferences.filter({ 
        user_email: user.email 
      });
      return prefs[0] || null;
    },
    enabled: !!user,
  });

  const [localPrefs, setLocalPrefs] = useState({
    enabled_types: ["info", "warning", "urgent", "cancellation", "delay", "location_change"],
    push_enabled: true,
    in_app_enabled: true,
    email_enabled: false
  });

  useEffect(() => {
    if (preferences) {
      setLocalPrefs({
        enabled_types: preferences.enabled_types || [],
        push_enabled: preferences.push_enabled ?? true,
        in_app_enabled: preferences.in_app_enabled ?? true,
        email_enabled: preferences.email_enabled ?? false
      });
    }
  }, [preferences]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (preferences) {
        await base44.entities.NotificationPreferences.update(preferences.id, localPrefs);
      } else {
        await base44.entities.NotificationPreferences.create({
          user_email: user.email,
          ...localPrefs
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationPreferences'] });
      setSuccessMessage("Οι προτιμήσεις σας αποθηκεύτηκαν επιτυχώς!");
      setTimeout(() => setSuccessMessage(""), 3000);
    },
  });

  const notificationTypes = [
    { 
      value: "info", 
      label: "Πληροφορίες", 
      icon: Info, 
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      description: "Γενικές πληροφορίες για την εκδρομή"
    },
    { 
      value: "warning", 
      label: "Προσοχή", 
      icon: AlertTriangle, 
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      description: "Προειδοποιήσεις που χρειάζονται την προσοχή σας"
    },
    { 
      value: "urgent", 
      label: "Επείγον", 
      icon: AlertCircle, 
      color: "text-red-600",
      bgColor: "bg-red-100",
      description: "Επείγουσες ειδοποιήσεις που απαιτούν άμεση ενέργεια"
    },
    { 
      value: "cancellation", 
      label: "Ακυρώσεις", 
      icon: XCircle, 
      color: "text-red-600",
      bgColor: "bg-red-100",
      description: "Ακυρώσεις εκδρομών ή τμημάτων"
    },
    { 
      value: "delay", 
      label: "Καθυστερήσεις", 
      icon: Clock, 
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      description: "Ενημερώσεις για καθυστερήσεις"
    },
    { 
      value: "location_change", 
      label: "Αλλαγές Τοποθεσίας", 
      icon: MapPin, 
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      description: "Αλλαγές σημείων συνάντησης ή προορισμών"
    }
  ];

  const toggleNotificationType = (type) => {
    const newTypes = localPrefs.enabled_types.includes(type)
      ? localPrefs.enabled_types.filter(t => t !== type)
      : [...localPrefs.enabled_types, type];
    setLocalPrefs({ ...localPrefs, enabled_types: newTypes });
  };

  if (!user || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Φόρτωση...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="w-8 h-8 text-orange-500" />
            Ρυθμίσεις Ειδοποιήσεων
          </h1>
          <p className="text-gray-600 mt-1">
            Προσαρμόστε τις προτιμήσεις σας για τις ειδοποιήσεις
          </p>
        </div>

        {successMessage && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Delivery Methods */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle>Μέθοδοι Παράδοσης</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Bell className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">In-App Notifications</h3>
                  <p className="text-sm text-gray-600">Ειδοποιήσεις μέσα στην εφαρμογή</p>
                </div>
              </div>
              <Switch
                checked={localPrefs.in_app_enabled}
                onCheckedChange={(checked) => setLocalPrefs({ ...localPrefs, in_app_enabled: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Push Notifications</h3>
                  <p className="text-sm text-gray-600">Ειδοποιήσεις εκτός εφαρμογής</p>
                  {!localPrefs.push_enabled && (
                    <Badge variant="secondary" className="mt-1">
                      Απαιτεί backend functions
                    </Badge>
                  )}
                </div>
              </div>
              <Switch
                checked={localPrefs.push_enabled}
                onCheckedChange={(checked) => setLocalPrefs({ ...localPrefs, push_enabled: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Mail className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Email Notifications</h3>
                  <p className="text-sm text-gray-600">Ειδοποιήσεις μέσω email</p>
                </div>
              </div>
              <Switch
                checked={localPrefs.email_enabled}
                onCheckedChange={(checked) => setLocalPrefs({ ...localPrefs, email_enabled: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Types */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle>Τύποι Ειδοποιήσεων</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {notificationTypes.map((type) => {
              const Icon = type.icon;
              const isEnabled = localPrefs.enabled_types.includes(type.value);
              
              return (
                <div 
                  key={type.value}
                  className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    isEnabled 
                      ? 'border-orange-200 bg-orange-50' 
                      : 'border-gray-200 bg-gray-50'
                  }`}
                  onClick={() => toggleNotificationType(type.value)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 ${type.bgColor} rounded-xl flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${type.color}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{type.label}</h3>
                      <p className="text-sm text-gray-600">{type.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={() => toggleNotificationType(type.value)}
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Σημείωση:</strong> Οι αλλαγές θα εφαρμοστούν αμέσως μετά την αποθήκευση. 
            Τα push notifications απαιτούν την ενεργοποίηση backend functions από το dashboard.
          </AlertDescription>
        </Alert>

        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
        >
          {saveMutation.isPending ? "Αποθήκευση..." : "Αποθήκευση Αλλαγών"}
        </Button>
      </div>
    </div>
  );
}