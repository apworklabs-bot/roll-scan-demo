{
  "name": "NotificationPreferences",
  "type": "object",
  "properties": {
    "user_email": {
      "type": "string",
      "format": "email",
      "description": "Email \u03c7\u03c1\u03ae\u03c3\u03c4\u03b7"
    },
    "enabled_types": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": [
          "info",
          "warning",
          "urgent",
          "cancellation",
          "delay",
          "location_change"
        ]
      },
      "default": [
        "info",
        "warning",
        "urgent",
        "cancellation",
        "delay",
        "location_change"
      ],
      "description": "\u03a4\u03cd\u03c0\u03bf\u03b9 \u03b5\u03b9\u03b4\u03bf\u03c0\u03bf\u03b9\u03ae\u03c3\u03b5\u03c9\u03bd \u03c0\u03bf\u03c5 \u03b8\u03ad\u03bb\u03b5\u03b9 \u03bd\u03b1 \u03bb\u03b1\u03bc\u03b2\u03ac\u03bd\u03b5\u03b9"
    },
    "push_enabled": {
      "type": "boolean",
      "default": true,
      "description": "Push notifications \u03b5\u03bd\u03b5\u03c1\u03b3\u03bf\u03c0\u03bf\u03b9\u03b7\u03bc\u03ad\u03bd\u03b1"
    },
    "in_app_enabled": {
      "type": "boolean",
      "default": true,
      "description": "In-app notifications \u03b5\u03bd\u03b5\u03c1\u03b3\u03bf\u03c0\u03bf\u03b9\u03b7\u03bc\u03ad\u03bd\u03b1"
    },
    "email_enabled": {
      "type": "boolean",
      "default": false,
      "description": "Email notifications \u03b5\u03bd\u03b5\u03c1\u03b3\u03bf\u03c0\u03bf\u03b9\u03b7\u03bc\u03ad\u03bd\u03b1"
    },
    "push_token": {
      "type": "string",
      "description": "Push notification token"
    }
  },
  "required": [
    "user_email"
  ]
}