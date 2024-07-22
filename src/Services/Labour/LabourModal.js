const mongoose = require("mongoose");

const labourModal = mongoose.Schema({
  labourName: { type: String, required: true },
  mobileNumber: { type: String, required: true },
  earningPerDay: { type: Number, required: true },
  labourPost: { type: String, required: true },
  labourIdProof: { type: String, default: "" },
  monthPaid: {
    type: [],
    default: [],
  },
});
const LabourModal = mongoose.model("Labour", labourModal);
module.exports = LabourModal;
