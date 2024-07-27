const express = require("express");
const multer = require("multer");

const storage = multer.memoryStorage({
  destination: function (req, file, callback) {
    callback(null, "");
  },
});

const upload = multer({ storage }).single("identityProof");

const Booking = require("../Services/Booking/UserBooking");

const router = express.Router();

router.post("/addBooking", upload, Booking.addBooking);
router.get("/getRooms", Booking.getBookedRooms);
router.delete("/deleteBookedRoom/:deleteId", Booking.deleteBooking);
router.get("/unAlottedMember", Booking.getUnAlottedMember);
router.put("/editRoom", Booking.editRoom);
router.put("/editRoomWithNewUser", upload, Booking.editRoomNewUser);

module.exports = router;
