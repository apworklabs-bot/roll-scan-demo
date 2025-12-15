{
  "name": "EquipmentLoan",
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
    "equipment_item_id": {
      "type": "string",
      "description": "ID \u03b5\u03be\u03bf\u03c0\u03bb\u03b9\u03c3\u03bc\u03bf\u03cd"
    },
    "quantity": {
      "type": "number",
      "default": 1,
      "description": "\u03a0\u03bf\u03c3\u03cc\u03c4\u03b7\u03c4\u03b1 \u03c0\u03bf\u03c5 \u03b4\u03cc\u03b8\u03b7\u03ba\u03b5"
    },
    "status": {
      "type": "string",
      "enum": [
        "issued",
        "returned",
        "lost",
        "damaged"
      ],
      "default": "issued",
      "description": "\u039a\u03b1\u03c4\u03ac\u03c3\u03c4\u03b1\u03c3\u03b7 \u03b4\u03b1\u03bd\u03b5\u03b9\u03c3\u03bc\u03bf\u03cd"
    },
    "issued_at": {
      "type": "string",
      "format": "date-time",
      "description": "\u0397\u03bc\u03b5\u03c1\u03bf\u03bc\u03b7\u03bd\u03af\u03b1/\u03ce\u03c1\u03b1 \u03c0\u03bf\u03c5 \u03b4\u03cc\u03b8\u03b7\u03ba\u03b5"
    },
    "returned_at": {
      "type": "string",
      "format": "date-time",
      "description": "\u0397\u03bc\u03b5\u03c1\u03bf\u03bc\u03b7\u03bd\u03af\u03b1 \u03b5\u03c0\u03b9\u03c3\u03c4\u03c1\u03bf\u03c6\u03ae\u03c2"
    },
    "notes": {
      "type": "string",
      "description": "\u03a3\u03c7\u03cc\u03bb\u03b9\u03b1"
    }
  },
  "required": [
    "participant_id",
    "trip_id",
    "equipment_item_id"
  ]
}