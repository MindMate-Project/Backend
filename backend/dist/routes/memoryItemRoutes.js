"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const memoryItemController_1 = require("../controllers/memoryItemController");
const router = express_1.default.Router();
router.post("/", memoryItemController_1.createMemory);
router.get("/search", memoryItemController_1.searchMemoryByTags);
router.get("/patient/:patientId", memoryItemController_1.getPatientMemories);
router
    .route("/:id")
    .get(memoryItemController_1.getMemoryById)
    .put(memoryItemController_1.updateMemory)
    .delete(memoryItemController_1.deleteMemory);
exports.default = router;
