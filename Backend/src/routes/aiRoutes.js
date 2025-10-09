const express = require("express");
const multer = require("multer");
const upload = multer();

const { chatText, chatVoice, chatPhoto } = require("../controllers/aiController");

const router = express.Router();

// text endpoint
router.post("/text", chatText);

// voice endpoint
router.post("/voice", upload.single("audio"), chatVoice);

// photo endpoint
router.post("/photo", upload.single("image"), chatPhoto);

module.exports = router;
