const mongoose = require("mongoose");

const labourPostModal = mongoose.Schema({
  labourPost: {
    type: String,
    required: true,
  },
});

const LabourPostModal = mongoose.model("LabourPost", labourPostModal);
module.exports = LabourPostModal;
