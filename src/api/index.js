const express = require("express");

const Login = require("./Login");
const Room = require("./Room");
const Booking = require("./UserBooking");
const Labour = require("./Labour");
const Attendence = require("./Attendence");
const Event = require("./Event");
const EventMemory = require("./EventMemory");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    message: "API - 👋🌎🌍🌏",
  });
});

router.use("/login", Login);
router.use("/room", Room);
router.use("/booking", Booking);
router.use("/labour", Labour);
router.use("/attendence", Attendence);
router.use("/event", Event);
router.use("/eventMemory", EventMemory);

module.exports = router;
