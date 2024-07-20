const mongoose = require("mongoose");

const eventMemoryModal = mongoose.Schema({
  eventTitle: {
    type: String,
    required: true,
  },
  eventImg: {
    type: String,
    required: true,
  },
});

const EventMemoryModal = mongoose.model("eventMemories", eventMemoryModal);
module.exports = EventMemoryModal;
