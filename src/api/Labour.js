const express = require("express");
const multer = require("multer");

const Labour = require("../Services/Labour/Labour");
const LabourPost = require("../Services/LabourPost/LabourPost");

const storage = multer.memoryStorage({
  destination: function (req, file, callback) {
    callback(null, "");
  },
});

const upload = multer({ storage }).single("labourIdProof");

const router = express.Router();

router.post("/add", upload, Labour.addLabour);
router.get("/", Labour.getLabourList);
router.post("/markAttendence", Labour.markAttendence);
router.delete("/:labourDeleteId/:imgId", Labour.deleteLabour);
router.post("/addLabourPost", LabourPost.addLabourPost);
router.get("/labourPost", LabourPost.getLabourPost);
router.delete("/deletePost/:deleteId", LabourPost.deletePost);
router.put("/update", upload, Labour.updateLabour);

module.exports = router;
