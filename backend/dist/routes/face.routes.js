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
const uploadError_middleware_1 = require("../middlewares/uploadError.middleware");
const router = express_1.default.Router();
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith("image/")) {
            cb(new Error("Only images are allowed"));
            return;
        }
        cb(null, true);
    }
});
const faceJsonParser = express_1.default.json({ limit: "100mb" });
const faceUrlencodedParser = express_1.default.urlencoded({ extended: true, limit: "100mb" });
router.post("/register-face", faceJsonParser, faceUrlencodedParser, auth_middleware_1.protect, (0, authorize_middleware_1.authorize)("caregiver", "patient"), (0, uploadError_middleware_1.handleUploadArray)(upload, "files", 8), face_controller_1.registerPatientFace);
router.post("/add-photos", faceJsonParser, faceUrlencodedParser, auth_middleware_1.protect, (0, authorize_middleware_1.authorize)("caregiver", "patient"), (0, uploadError_middleware_1.handleUploadArray)(upload, "files", 8), face_controller_1.addPhotosToKnownPerson);
router.post("/identify-face", faceJsonParser, faceUrlencodedParser, auth_middleware_1.protect, (0, authorize_middleware_1.authorize)("patient", "caregiver"), (0, uploadError_middleware_1.handleUploadSingle)(upload, "file"), face_controller_1.identifyPatientByFace);
exports.default = router;
