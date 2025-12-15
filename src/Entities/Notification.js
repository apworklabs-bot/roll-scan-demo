{
  "name": "Notification",
  "type": "object",
  "properties": {
    "trip_id": {
      "type": "string",
      "description": "ID \u03b5\u03ba\u03b4\u03c1\u03bf\u03bc\u03ae\u03c2"
    },
    "title": {
      "type": "string",
      "description": "\u03a4\u03af\u03c4\u03bb\u03bf\u03c2 \u03b5\u03b9\u03b4\u03bf\u03c0\u03bf\u03af\u03b7\u03c3\u03b7\u03c2"
    },
    "message": {
      "type": "string",
      "description": "\u039c\u03ae\u03bd\u03c5\u03bc\u03b1 \u03b5\u03b9\u03b4\u03bf\u03c0\u03bf\u03af\u03b7\u03c3\u03b7\u03c2"
    },
    "type": {
      "type": "string",
      "enum": [
        "info",
        "warning",
        "urgent",
        "cancellation",
        "delay",
        "location_change"
      ],
      "default": "info",
      "description": "\u03a4\u03cd\u03c0\u03bf\u03c2 \u03b5\u03b9\u03b4\u03bf\u03c0\u03bf\u03af\u03b7\u03c3\u03b7\u03c2"
    },
    "target_audience": {
      "type": "string",
      "enum": [
        "all",
        "participants",
        "companions"
      ],
      "default": "all",
      "description": "\u03a3\u03b5 \u03c0\u03bf\u03b9\u03bf\u03c5\u03c2 \u03b1\u03c0\u03b5\u03c5\u03b8\u03cd\u03bd\u03b5\u03c4\u03b1\u03b9"
    },
    "is_urgent": {
      "type": "boolean",
      "default": false,
      "description": "\u0395\u03c0\u03b5\u03af\u03b3\u03bf\u03c5\u03c3\u03b1 \u03b5\u03b9\u03b4\u03bf\u03c0\u03bf\u03af\u03b7\u03c3\u03b7"
    },
    "read_by": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Emails \u03c7\u03c1\u03b7\u03c3\u03c4\u03ce\u03bd \u03c0\u03bf\u03c5 \u03b4\u03b9\u03ac\u03b2\u03b1\u03c3\u03b1\u03bd"
    },
    "sent_at": {
      "type": "string",
      "format": "date-time",
      "description": "\u03a7\u03c1\u03cc\u03bd\u03bf\u03c2 \u03b1\u03c0\u03bf\u03c3\u03c4\u03bf\u03bb\u03ae\u03c2"
    }
  },
  "required": [
    "trip_id",
    "title",
    "message",
    "type"
  ]
}