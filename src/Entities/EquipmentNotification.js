{
  "name": "EquipmentNotification",
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
    "equipment_loan_id": {
      "type": "string",
      "description": "ID \u03b4\u03b1\u03bd\u03b5\u03b9\u03c3\u03bc\u03bf\u03cd \u03b5\u03be\u03bf\u03c0\u03bb\u03b9\u03c3\u03bc\u03bf\u03cd"
    },
    "type": {
      "type": "string",
      "enum": [
        "issued",
        "returned",
        "overdue"
      ],
      "description": "\u03a4\u03cd\u03c0\u03bf\u03c2 \u03b5\u03b9\u03b4\u03bf\u03c0\u03bf\u03af\u03b7\u03c3\u03b7\u03c2"
    },
    "message": {
      "type": "string",
      "description": "\u039c\u03ae\u03bd\u03c5\u03bc\u03b1 \u03b5\u03b9\u03b4\u03bf\u03c0\u03bf\u03af\u03b7\u03c3\u03b7\u03c2"
    },
    "target_role": {
      "type": "string",
      "enum": [
        "admin",
        "participant"
      ],
      "description": "\u03a3\u03b5 \u03c0\u03bf\u03b9\u03bf\u03bd \u03b1\u03c0\u03b5\u03c5\u03b8\u03cd\u03bd\u03b5\u03c4\u03b1\u03b9"
    },
    "is_read": {
      "type": "boolean",
      "default": false,
      "description": "\u0391\u03bd \u03ad\u03c7\u03b5\u03b9 \u03b4\u03b9\u03b1\u03b2\u03b1\u03c3\u03c4\u03b5\u03af"
    },
    "participant_name": {
      "type": "string",
      "description": "\u038c\u03bd\u03bf\u03bc\u03b1 \u03c3\u03c5\u03bc\u03bc\u03b5\u03c4\u03ad\u03c7\u03bf\u03bd\u03c4\u03b1"
    },
    "equipment_name": {
      "type": "string",
      "description": "\u038c\u03bd\u03bf\u03bc\u03b1 \u03b5\u03be\u03bf\u03c0\u03bb\u03b9\u03c3\u03bc\u03bf\u03cd"
    }
  },
  "required": [
    "participant_id",
    "trip_id",
    "type",
    "message",
    "target_role"
  ]
}