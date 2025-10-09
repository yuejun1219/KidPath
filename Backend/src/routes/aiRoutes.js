const express = require("express");
const multer = require("multer");
const upload = multer();

const { chatText, chatVoice, chatPhoto } = require("../controllers/aiController");

const router = express.Router();

// 文本接口
router.post("/text", chatText);

// 语音接口
router.post("/voice", upload.single("audio"), chatVoice);

// 图片接口
router.post("/photo", upload.single("image"), chatPhoto);

module.exports = router;
