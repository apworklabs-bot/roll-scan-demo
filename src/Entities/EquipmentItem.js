{
  "name": "EquipmentItem",
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "\u038c\u03bd\u03bf\u03bc\u03b1 \u03b5\u03be\u03bf\u03c0\u03bb\u03b9\u03c3\u03bc\u03bf\u03cd"
    },
    "quantity_default": {
      "type": "number",
      "default": 1,
      "description": "\u03a0\u03c1\u03bf\u03b5\u03c0\u03b9\u03bb\u03b5\u03b3\u03bc\u03ad\u03bd\u03b7 \u03c0\u03bf\u03c3\u03cc\u03c4\u03b7\u03c4\u03b1 \u03b3\u03b9\u03b1 \u03b4\u03b1\u03bd\u03b5\u03b9\u03c3\u03bc\u03cc"
    },
    "active": {
      "type": "boolean",
      "default": true,
      "description": "\u0391\u03bd \u03b5\u03af\u03bd\u03b1\u03b9 \u03b4\u03b9\u03b1\u03b8\u03ad\u03c3\u03b9\u03bc\u03bf \u03c0\u03c1\u03bf\u03c2 \u03c7\u03c1\u03ae\u03c3\u03b7"
    }
  },
  "required": [
    "name"
  ]
}