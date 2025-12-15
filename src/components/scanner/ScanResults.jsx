// src/components/scanner/ScanResults.jsx
import React from "react";

export default function ScanResults({ result, error, isOffline }) {
  return (
    <div className="mt-4 p-4 border rounded-md bg-white">
      <h3 className="font-semibold mb-2">Αποτελέσματα σκαναρίσματος</h3>

      {error && (
        <p className="text-red-600 text-sm mb-2">
          Σφάλμα: {error}
        </p>
      )}

      {isOffline && (
        <p className="text-orange-600 text-sm mb-2">
          Είστε offline – τα αποτελέσματα θα συγχρονιστούν αργότερα.
        </p>
      )}

      {result ? (
        <pre className="text-xs whitespace-pre-wrap">
          {JSON.stringify(result, null, 2)}
        </pre>
      ) : (
        <p className="text-sm text-gray-500">
          Σκάναρε ένα QR για να δεις αποτελέσματα εδώ.
        </p>
      )}
    </div>
  );
}
