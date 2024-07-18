const mongoose = require("mongoose");

const bookModel = mongoose.Schema({
  fullName: {
    type: String,
    required: true,
  },
  familyMember: {
    type: Number,
    required: true,
  },
  identityProof: {
    type: String,
  },
  bookingFrom: {
    type: Date,
    required: true,
  },
  bookingTill: {
    type: Date,
    required: true,
  },
  memberAllotted: {
    type: Number,
    required: true,
    default: 0,
  },
  mobileNumber: {
    type: String,
    required: true,
  },
});
const bookingModal = mongoose.model("userBooking", bookModel);
module.exports = bookingModal;
