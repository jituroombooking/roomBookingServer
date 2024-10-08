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
router.put("/updateBooking", upload, Booking.updateBooking);
router.post("/autoAssign", Booking.autoAssignRoom);
router.get("/getRooms", Booking.getBookedRooms);
router.delete("/deleteBookedRoom/:deleteId", Booking.deleteBooking);
router.get(
  "/unAlottedMember/:currentPage/:pageSize",
  Booking.getUnAlottedMember
);
router.put("/editRoom", upload, Booking.editRoom);
router.put("/editRoomWithNewUser", upload, Booking.editRoomNewUser);
router.delete(
  "/deleteRoom/:userId/:roomId/:bhavanId",
  Booking.deleteBookedRoom
);
router.post("/bulkUpload", Booking.bulkUpload);

module.exports = router;
