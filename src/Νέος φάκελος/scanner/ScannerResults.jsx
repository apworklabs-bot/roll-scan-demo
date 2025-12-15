import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, XCircle } from "lucide-react";

export default function ScanResults({ result }) {
  return (
    <Card className={`border-2 ${
      result.success 
        ? 'border-green-200 bg-green-50' 
        : 'border-red-200 bg-red-50'
    }`}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
            result.success ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {result.success ? (
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            ) : (
              <XCircle className="w-6 h-6 text-red-600" />
            )}
          </div>
          
          <div className="flex-1">
            <h3 className={`font-semibold mb-1 ${
              result.success ? 'text-green-900' : 'text-red-900'
            }`}>
              {result.success ? 'Επιτυχής Καταγραφή' : 'Σφάλμα'}
            </h3>
            <p className={`text-sm ${
              result.success ? 'text-green-700' : 'text-red-700'
            }`}>
              {result.message}
            </p>
            
            {result.participant && (
              <div className="mt-3 p-3 bg-white rounded-lg">
                <p className="font-medium text-gray-900">
                  {result.participant.full_name}
                </p>
                <p className="text-sm text-gray-600">
                  {result.participant.email}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}