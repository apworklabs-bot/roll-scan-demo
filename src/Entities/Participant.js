{
  "name": "Participant",
  "type": "object",
  "properties": {
    "trip_id": {
      "type": "string",
      "description": "ID \u03b5\u03ba\u03b4\u03c1\u03bf\u03bc\u03ae\u03c2"
    },
    "full_name": {
      "type": "string",
      "description": "\u039f\u03bd\u03bf\u03bc\u03b1\u03c4\u03b5\u03c0\u03ce\u03bd\u03c5\u03bc\u03bf"
    },
    "email": {
      "type": "string",
      "format": "email"
    },
    "phone": {
      "type": "string"
    },
    "bus_number": {
      "type": "string",
      "description": "\u0391\u03c1\u03b9\u03b8\u03bc\u03cc\u03c2 \u03bb\u03b5\u03c9\u03c6\u03bf\u03c1\u03b5\u03af\u03bf\u03c5"
    },
    "group_name": {
      "type": "string",
      "description": "\u038c\u03bd\u03bf\u03bc\u03b1 \u03bf\u03bc\u03ac\u03b4\u03b1\u03c2"
    },
    "status": {
      "type": "string",
      "enum": [
        "confirmed",
        "waitlist",
        "cancelled"
      ],
      "default": "confirmed"
    },
    "payment_status": {
      "type": "string",
      "enum": [
        "pending",
        "partial",
        "paid"
      ],
      "default": "pending"
    },
    "amount_owed": {
      "type": "number",
      "description": "\u03a0\u03bf\u03c3\u03cc \u03c0\u03bf\u03c5 \u03bf\u03c6\u03b5\u03af\u03bb\u03b5\u03b9 \u03bf \u03c3\u03c5\u03bc\u03bc\u03b5\u03c4\u03ad\u03c7\u03c9\u03bd (\u03c3\u03b5 \u03b5\u03c5\u03c1\u03ce)",
      "default": 0
    },
    "payment_breakdown": {
      "type": "string",
      "description": "\u039b\u03b5\u03c0\u03c4\u03bf\u03bc\u03ad\u03c1\u03b5\u03b9\u03b5\u03c2 \u03bf\u03c6\u03b5\u03b9\u03bb\u03ae\u03c2 (\u03c0.\u03c7., '\u03a6\u03b1\u03b3\u03b7\u03c4\u03cc: 15\u20ac, \u0394\u03b9\u03b1\u03bc\u03bf\u03bd\u03ae: 30\u20ac, \u039b\u03b5\u03c9\u03c6\u03bf\u03c1\u03b5\u03af\u03bf: 20\u20ac')"
    },
    "transportation_method": {
      "type": "string",
      "enum": [
        "bus",
        "private_car"
      ],
      "default": "bus",
      "description": "\u03a4\u03c1\u03cc\u03c0\u03bf\u03c2 \u03bc\u03b5\u03c4\u03b1\u03ba\u03af\u03bd\u03b7\u03c3\u03b7\u03c2"
    },
    "boarding_point": {
      "type": "string",
      "description": "\u03a3\u03b7\u03bc\u03b5\u03af\u03bf \u03b5\u03c0\u03b9\u03b2\u03af\u03b2\u03b1\u03c3\u03b7\u03c2 (\u03c0.\u03c7., '\u0391\u03b8\u03ae\u03bd\u03b1', '\u039b\u03b1\u03bc\u03af\u03b1')"
    },
    "medical_notes": {
      "type": "string",
      "description": "\u0399\u03b1\u03c4\u03c1\u03b9\u03ba\u03ad\u03c2 \u03c3\u03b7\u03bc\u03b5\u03b9\u03ce\u03c3\u03b5\u03b9\u03c2"
    },
    "emergency_contact_name": {
      "type": "string",
      "description": "\u0395\u03c0\u03b1\u03c6\u03ae \u03ad\u03ba\u03c4\u03b1\u03ba\u03c4\u03b7\u03c2 \u03b1\u03bd\u03ac\u03b3\u03ba\u03b7\u03c2"
    },
    "emergency_contact_phone": {
      "type": "string",
      "description": "\u03a4\u03b7\u03bb\u03ad\u03c6\u03c9\u03bd\u03bf \u03ad\u03ba\u03c4\u03b1\u03ba\u03c4\u03b7\u03c2 \u03b1\u03bd\u03ac\u03b3\u03ba\u03b7\u03c2"
    },
    "gdpr_consent": {
      "type": "boolean",
      "default": false
    }
  },
  "required": [
    "trip_id",
    "full_name",
    "email"
  ]
}