{
  "name": "NotificationAuditLog",
  "type": "object",
  "properties": {
    "notification_id": {
      "type": "string",
      "description": "ID \u03b5\u03b9\u03b4\u03bf\u03c0\u03bf\u03af\u03b7\u03c3\u03b7\u03c2"
    },
    "action": {
      "type": "string",
      "enum": [
        "created",
        "updated",
        "deleted",
        "sent",
        "read"
      ],
      "description": "\u0395\u03bd\u03ad\u03c1\u03b3\u03b5\u03b9\u03b1 \u03c0\u03bf\u03c5 \u03ad\u03b3\u03b9\u03bd\u03b5"
    },
    "performed_by": {
      "type": "string",
      "format": "email",
      "description": "Email \u03c7\u03c1\u03ae\u03c3\u03c4\u03b7 \u03c0\u03bf\u03c5 \u03ad\u03ba\u03b1\u03bd\u03b5 \u03c4\u03b7\u03bd \u03b5\u03bd\u03ad\u03c1\u03b3\u03b5\u03b9\u03b1"
    },
    "performed_at": {
      "type": "string",
      "format": "date-time",
      "description": "\u03a7\u03c1\u03cc\u03bd\u03bf\u03c2 \u03b5\u03bd\u03ad\u03c1\u03b3\u03b5\u03b9\u03b1\u03c2"
    },
    "details": {
      "type": "object",
      "additionalProperties": true,
      "description": "\u039b\u03b5\u03c0\u03c4\u03bf\u03bc\u03ad\u03c1\u03b5\u03b9\u03b5\u03c2 \u03b1\u03bb\u03bb\u03b1\u03b3\u03ae\u03c2"
    },
    "ip_address": {
      "type": "string",
      "description": "IP address"
    }
  },
  "required": [
    "action",
    "performed_by",
    "performed_at"
  ]
}