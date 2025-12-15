{
  "name": "TripSegment",
  "type": "object",
  "properties": {
    "trip_id": {
      "type": "string",
      "description": "ID \u03b5\u03ba\u03b4\u03c1\u03bf\u03bc\u03ae\u03c2"
    },
    "name": {
      "type": "string",
      "description": "\u038c\u03bd\u03bf\u03bc\u03b1 \u03c4\u03bc\u03ae\u03bc\u03b1\u03c4\u03bf\u03c2"
    },
    "type": {
      "type": "string",
      "enum": [
        "boarding",
        "arrival",
        "checkpoint",
        "return"
      ],
      "description": "\u03a4\u03cd\u03c0\u03bf\u03c2 \u03c4\u03bc\u03ae\u03bc\u03b1\u03c4\u03bf\u03c2"
    },
    "scheduled_time": {
      "type": "string",
      "format": "date-time",
      "description": "\u03a0\u03c1\u03bf\u03b3\u03c1\u03b1\u03bc\u03bc\u03b1\u03c4\u03b9\u03c3\u03bc\u03ad\u03bd\u03b7 \u03ce\u03c1\u03b1"
    },
    "window_start": {
      "type": "string",
      "format": "date-time",
      "description": "\u0388\u03bd\u03b1\u03c1\u03be\u03b7 \u03c7\u03c1\u03bf\u03bd\u03b9\u03ba\u03bf\u03cd \u03c0\u03b1\u03c1\u03b1\u03b8\u03cd\u03c1\u03bf\u03c5"
    },
    "window_end": {
      "type": "string",
      "format": "date-time",
      "description": "\u039b\u03ae\u03be\u03b7 \u03c7\u03c1\u03bf\u03bd\u03b9\u03ba\u03bf\u03cd \u03c0\u03b1\u03c1\u03b1\u03b8\u03cd\u03c1\u03bf\u03c5"
    },
    "grace_minutes": {
      "type": "number",
      "default": 15,
      "description": "\u039b\u03b5\u03c0\u03c4\u03ac \u03c7\u03ac\u03c1\u03b9\u03c4\u03bf\u03c2"
    },
    "location": {
      "type": "string",
      "description": "\u03a4\u03bf\u03c0\u03bf\u03b8\u03b5\u03c3\u03af\u03b1"
    },
    "order": {
      "type": "number",
      "description": "\u03a3\u03b5\u03b9\u03c1\u03ac \u03b5\u03bc\u03c6\u03ac\u03bd\u03b9\u03c3\u03b7\u03c2"
    },
    "is_active": {
      "type": "boolean",
      "default": false,
      "description": "\u0395\u03bd\u03b5\u03c1\u03b3\u03cc \u03c4\u03bc\u03ae\u03bc\u03b1 \u03b3\u03b9\u03b1 scan"
    }
  },
  "required": [
    "trip_id",
    "name",
    "type",
    "scheduled_time"
  ]
}