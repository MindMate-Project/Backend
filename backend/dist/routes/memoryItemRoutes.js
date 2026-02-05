"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const memoryItemController_1 = require("../controllers/memoryItemController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const authorize_1 = require("../middlewares/authorize");
const router = express_1.default.Router();
// Create memory (caregiver or admin)
router.post("/", authMiddleware_1.protect, (0, authorize_1.authorize)("caregiver", "admin"), memoryItemController_1.createMemory);
// Search memories
router.get("/search", authMiddleware_1.protect, (0, authorize_1.authorize)("patient", "caregiver", "admin"), memoryItemController_1.searchMemoryByTags);
// Get memories for a patient
router.get("/patient/:patientId", authMiddleware_1.protect, (0, authorize_1.authorize)("patient", "caregiver", "admin"), memoryItemController_1.getPatientMemories);
router
    .route("/:id")
    .get(authMiddleware_1.protect, (0, authorize_1.authorize)("patient", "caregiver", "admin"), memoryItemController_1.getMemoryById)
    .put(authMiddleware_1.protect, (0, authorize_1.authorize)("caregiver", "admin"), memoryItemController_1.updateMemory)
    .delete(authMiddleware_1.protect, (0, authorize_1.authorize)("caregiver", "admin"), memoryItemController_1.deleteMemory);
exports.default = router;
