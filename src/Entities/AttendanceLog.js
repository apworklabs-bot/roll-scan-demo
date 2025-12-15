{
  "name": "AttendanceLog",
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
    "segment_id": {
      "type": "string",
      "description": "ID \u03c4\u03bc\u03ae\u03bc\u03b1\u03c4\u03bf\u03c2"
    },
    "check_in_time": {
      "type": "string",
      "format": "date-time",
      "description": "\u038f\u03c1\u03b1 \u03ba\u03b1\u03c4\u03b1\u03b3\u03c1\u03b1\u03c6\u03ae\u03c2"
    },
    "method": {
      "type": "string",
      "enum": [
        "qr_scan",
        "manual"
      ],
      "description": "\u039c\u03ad\u03b8\u03bf\u03b4\u03bf\u03c2 \u03ba\u03b1\u03c4\u03b1\u03b3\u03c1\u03b1\u03c6\u03ae\u03c2"
    },
    "checked_by": {
      "type": "string",
      "description": "Email \u03c3\u03c5\u03bd\u03bf\u03b4\u03bf\u03cd"
    },
    "notes": {
      "type": "string",
      "description": "\u03a3\u03b7\u03bc\u03b5\u03b9\u03ce\u03c3\u03b5\u03b9\u03c2"
    },
    "synced": {
      "type": "boolean",
      "default": true,
      "description": "\u03a3\u03c5\u03b3\u03c7\u03c1\u03bf\u03bd\u03b9\u03c3\u03bc\u03ad\u03bd\u03bf \u03bc\u03b5 server"
    }
  },
  "required": [
    "participant_id",
    "trip_id",
    "segment_id",
    "check_in_time",
    "method"
  ]
}