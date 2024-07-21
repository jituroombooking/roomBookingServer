const express = require("express");

const EventMemory = require("../Services/EventMemory/EventMemory");
const multer = require("multer");

const router = express.Router();

const storage = multer.memoryStorage({
  destination: function (req, file, callback) {
    callback(null, "");
  },
});

const upload = multer({ storage }).single("eventImage");

router.post("/add", upload, EventMemory.addEventMemory);
router.get("/", EventMemory.getEventMemory);
router.put("/edit", upload, EventMemory.editEventMemory);
router.delete("/delete/:objId/:imgId", EventMemory.deleteEventMemory);

module.exports = router;
