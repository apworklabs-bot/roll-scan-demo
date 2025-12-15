import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Hash } from "lucide-react";

export default function PassCard({ pass, trip, participant }) {
  const qrData = JSON.stringify({
    pass_id: pass.id,
    pass_code: pass.pass_code,
    trip_id: trip.id,
    participant_id: participant.id,
    user_email: participant.email,
    issued: pass.issued_date || pass.created_date,
  });

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;

  return (
    <Card className="border-none shadow-xl overflow-hidden">
      <div className="bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 p-6 text-white">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-1">{trip.title}</h2>
            <p className="text-orange-100 text-sm">Ψηφιακό Πάσο Εκδρομής</p>
          </div>
          <Badge className="bg-white/20 text-white border-white/30">
            Ενεργό
          </Badge>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-orange-100">
          <User className="w-4 h-4" />
          <span>{participant.full_name}</span>
        </div>
      </div>

      <CardContent className="p-8">
        <div className="bg-white p-6 rounded-2xl shadow-inner flex flex-col items-center mb-6">
          <img 
            src={qrCodeUrl}
            alt="QR Code"
            className="w-64 h-64 max-w-full"
          />
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
            <Hash className="w-4 h-4" />
            <code className="font-mono">{pass.pass_code}</code>
          </div>
        </div>

        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600">
            Δείξτε αυτό το QR στον συνοδό για καταγραφή παρουσίας
          </p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {participant.bus_number && (
              <Badge variant="outline" className="text-xs">
                Λεωφορείο {participant.bus_number}
              </Badge>
            )}
            {participant.group_name && (
              <Badge variant="outline" className="text-xs">
                {participant.group_name}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}