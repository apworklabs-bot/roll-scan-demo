{
  "name": "NotificationRule",
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "\u038c\u03bd\u03bf\u03bc\u03b1 \u03ba\u03b1\u03bd\u03cc\u03bd\u03b1"
    },
    "description": {
      "type": "string",
      "description": "\u03a0\u03b5\u03c1\u03b9\u03b3\u03c1\u03b1\u03c6\u03ae \u03ba\u03b1\u03bd\u03cc\u03bd\u03b1"
    },
    "trigger_type": {
      "type": "string",
      "enum": [
        "segment_delay",
        "trip_start_soon",
        "low_attendance",
        "segment_completed",
        "trip_cancelled"
      ],
      "description": "\u03a4\u03cd\u03c0\u03bf\u03c2 trigger"
    },
    "conditions": {
      "type": "object",
      "description": "\u03a3\u03c5\u03bd\u03b8\u03ae\u03ba\u03b5\u03c2 \u03b5\u03bd\u03b5\u03c1\u03b3\u03bf\u03c0\u03bf\u03af\u03b7\u03c3\u03b7\u03c2 (\u03c0.\u03c7. minutes_after_grace: 15)",
      "additionalProperties": true
    },
    "notification_type": {
      "type": "string",
      "enum": [
        "info",
        "warning",
        "urgent",
        "cancellation",
        "delay",
        "location_change"
      ],
      "description": "\u03a4\u03cd\u03c0\u03bf\u03c2 \u03b5\u03b9\u03b4\u03bf\u03c0\u03bf\u03af\u03b7\u03c3\u03b7\u03c2 \u03c0\u03bf\u03c5 \u03c3\u03c4\u03ad\u03bb\u03bd\u03b5\u03c4\u03b1\u03b9"
    },
    "title_template": {
      "type": "string",
      "description": "Template \u03c4\u03af\u03c4\u03bb\u03bf\u03c5 (\u03c0.\u03c7. '\u039a\u03b1\u03b8\u03c5\u03c3\u03c4\u03ad\u03c1\u03b7\u03c3\u03b7 \u03c3\u03c4\u03bf {segment_name}')"
    },
    "message_template": {
      "type": "string",
      "description": "Template \u03bc\u03b7\u03bd\u03cd\u03bc\u03b1\u03c4\u03bf\u03c2"
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
    "is_active": {
      "type": "boolean",
      "default": true,
      "description": "\u0395\u03bd\u03b5\u03c1\u03b3\u03cc\u03c2 \u03ba\u03b1\u03bd\u03cc\u03bd\u03b1\u03c2"
    },
    "is_urgent": {
      "type": "boolean",
      "default": false,
      "description": "\u0395\u03c0\u03b5\u03af\u03b3\u03bf\u03c5\u03c3\u03b1 \u03b5\u03b9\u03b4\u03bf\u03c0\u03bf\u03af\u03b7\u03c3\u03b7"
    },
    "last_triggered": {
      "type": "string",
      "format": "date-time",
      "description": "\u03a4\u03b5\u03bb\u03b5\u03c5\u03c4\u03b1\u03af\u03b1 \u03c6\u03bf\u03c1\u03ac \u03c0\u03bf\u03c5 \u03b5\u03bd\u03b5\u03c1\u03b3\u03bf\u03c0\u03bf\u03b9\u03ae\u03b8\u03b7\u03ba\u03b5"
    },
    "trigger_count": {
      "type": "number",
      "default": 0,
      "description": "\u03a0\u03cc\u03c3\u03b5\u03c2 \u03c6\u03bf\u03c1\u03ad\u03c2 \u03ad\u03c7\u03b5\u03b9 \u03b5\u03bd\u03b5\u03c1\u03b3\u03bf\u03c0\u03bf\u03b9\u03b7\u03b8\u03b5\u03af"
    }
  },
  "required": [
    "name",
    "trigger_type",
    "notification_type",
    "title_template",
    "message_template"
  ]
}