"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const faceController_1 = require("../controllers/faceController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = express_1.default.Router();
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }
});
router.post("/register-face", authMiddleware_1.protect, upload.single("image"), faceController_1.registerPatientFace);
router.post("/identify-face", authMiddleware_1.protect, upload.single("image"), faceController_1.identifyPatientByFace);
exports.default = router;
