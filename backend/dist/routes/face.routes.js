"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const face_controller_1 = require("../controllers/face.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const authorize_middleware_1 = require("../middlewares/authorize.middleware");
const router = express_1.default.Router();
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }
});
router.post("/register-face", auth_middleware_1.protect, (0, authorize_middleware_1.authorize)("caregiver", "patient"), upload.single("file"), face_controller_1.registerPatientFace);
router.post("/identify-face", auth_middleware_1.protect, (0, authorize_middleware_1.authorize)("patient", "caregiver"), upload.single("file"), face_controller_1.identifyPatientByFace);
exports.default = router;
