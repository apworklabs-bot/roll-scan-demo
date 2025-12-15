{
  "name": "Trip",
  "type": "object",
  "properties": {
    "title": {
      "type": "string",
      "description": "\u03a4\u03af\u03c4\u03bb\u03bf\u03c2 \u03b5\u03ba\u03b4\u03c1\u03bf\u03bc\u03ae\u03c2"
    },
    "description": {
      "type": "string",
      "description": "\u03a0\u03b5\u03c1\u03b9\u03b3\u03c1\u03b1\u03c6\u03ae \u03b5\u03ba\u03b4\u03c1\u03bf\u03bc\u03ae\u03c2"
    },
    "start_date": {
      "type": "string",
      "format": "date",
      "description": "\u0397\u03bc\u03b5\u03c1\u03bf\u03bc\u03b7\u03bd\u03af\u03b1 \u03ad\u03bd\u03b1\u03c1\u03be\u03b7\u03c2"
    },
    "end_date": {
      "type": "string",
      "format": "date",
      "description": "\u0397\u03bc\u03b5\u03c1\u03bf\u03bc\u03b7\u03bd\u03af\u03b1 \u03bb\u03ae\u03be\u03b7\u03c2"
    },
    "leader_name": {
      "type": "string",
      "description": "\u03a5\u03c0\u03b5\u03cd\u03b8\u03c5\u03bd\u03bf\u03c2 \u03b5\u03ba\u03b4\u03c1\u03bf\u03bc\u03ae\u03c2"
    },
    "leader_phone": {
      "type": "string",
      "description": "\u03a4\u03b7\u03bb\u03ad\u03c6\u03c9\u03bd\u03bf \u03c5\u03c0\u03b5\u03cd\u03b8\u03c5\u03bd\u03bf\u03c5"
    },
    "meeting_point": {
      "type": "string",
      "description": "\u03a3\u03b7\u03bc\u03b5\u03af\u03bf \u03c3\u03c5\u03bd\u03ac\u03bd\u03c4\u03b7\u03c3\u03b7\u03c2"
    },
    "meeting_time": {
      "type": "string",
      "description": "\u038f\u03c1\u03b1 \u03c3\u03c5\u03bd\u03ac\u03bd\u03c4\u03b7\u03c3\u03b7\u03c2"
    },
    "what_to_bring": {
      "type": "string",
      "description": "\u03a4\u03b9 \u03bd\u03b1 \u03c6\u03ad\u03c1\u03b5\u03c4\u03b5"
    },
    "instructions": {
      "type": "string",
      "description": "\u0392\u03b1\u03c3\u03b9\u03ba\u03ad\u03c2 \u03bf\u03b4\u03b7\u03b3\u03af\u03b5\u03c2"
    },
    "status": {
      "type": "string",
      "enum": [
        "upcoming",
        "active",
        "completed",
        "cancelled"
      ],
      "default": "upcoming"
    }
  },
  "required": [
    "title",
    "start_date"
  ]
}