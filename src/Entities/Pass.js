{
  "name": "Pass",
  "type": "object",
  "properties": {
    "participant_id": {
      "type": "string",
      "description": "ID \u03c3\u03c5\u03bc\u03bc\u03b5\u03c4\u03ad\u03c7\u03bf\u03bd\u03c4\u03b1"
    },
    "trip_id": {
      "type": "string",
      "description": "ID \u03b5\u03ba\u03b4\u03c1\u03bf\u03bc\u03ae\u03c2"
    },
    "pass_code": {
      "type": "string",
      "description": "\u039c\u03bf\u03bd\u03b1\u03b4\u03b9\u03ba\u03cc\u03c2 \u03ba\u03c9\u03b4\u03b9\u03ba\u03cc\u03c2 pass"
    },
    "qr_data": {
      "type": "string",
      "description": "\u0394\u03b5\u03b4\u03bf\u03bc\u03ad\u03bd\u03b1 QR"
    },
    "issued_date": {
      "type": "string",
      "format": "date-time"
    },
    "is_valid": {
      "type": "boolean",
      "default": true
    }
  },
  "required": [
    "participant_id",
    "trip_id",
    "pass_code"
  ]
}