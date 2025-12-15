import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin } from "lucide-react";

export default function TripManagement() {
  return (
    <Card className="border-none shadow-lg">
      <CardContent className="py-12 text-center">
        <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <MapPin className="w-10 h-10 text-orange-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Διαχείριση Εκδρομών
        </h3>
        <p className="text-gray-600">
          Χρησιμοποιήστε το Dashboard → Data → Trip για διαχείριση εκδρομών
        </p>
      </CardContent>
    </Card>
  );
}