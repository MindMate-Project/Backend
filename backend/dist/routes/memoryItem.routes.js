"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const memoryItem_controller_1 = require("../controllers/memoryItem.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const authorize_middleware_1 = require("../middlewares/authorize.middleware");
const uploadMemory_middleware_1 = require("../middlewares/uploadMemory.middleware");
const router = express_1.default.Router();
router.post("/", auth_middleware_1.protect, (0, authorize_middleware_1.authorize)("caregiver", "admin"), uploadMemory_middleware_1.handleMemoryUpload, // <-- Cloudinary upload happens here
memoryItem_controller_1.createMemory);
router.get("/search", auth_middleware_1.protect, (0, authorize_middleware_1.authorize)("patient", "caregiver", "admin"), memoryItem_controller_1.searchMemoryByTags);
router.get("/patient/:patientId", auth_middleware_1.protect, (0, authorize_middleware_1.authorize)("patient", "caregiver", "admin"), memoryItem_controller_1.getPatientMemories);
router
    .route("/:id")
    .get(auth_middleware_1.protect, (0, authorize_middleware_1.authorize)("patient", "caregiver", "admin"), memoryItem_controller_1.getMemoryById)
    .put(auth_middleware_1.protect, (0, authorize_middleware_1.authorize)("caregiver", "admin"), memoryItem_controller_1.updateMemory)
    .delete(auth_middleware_1.protect, (0, authorize_middleware_1.authorize)("caregiver", "admin"), memoryItem_controller_1.deleteMemory);
exports.default = router;
