import express from "express";
import {
  createMemory,
  getPatientMemories,
  getMemoryById,
  updateMemory,
  deleteMemory,
  searchMemoryByTags,
} from "../controllers/memoryItem.controller";
import { protect } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/authorize.middleware";
import { handleMemoryUpload } from "../middlewares/uploadMemory.middleware";

const router = express.Router();

router.post(
  "/",
  protect,
  authorize("caregiver", "admin"),
  handleMemoryUpload,       // <-- Cloudinary upload happens here
  createMemory
);

router.get(
  "/search",
  protect,
  authorize("patient", "caregiver", "admin"),
  searchMemoryByTags
);

router.get(
  "/patient/:patientId",
  protect,
  authorize("patient", "caregiver", "admin"),
  getPatientMemories
);

router
  .route("/:id")
  .get(protect, authorize("patient", "caregiver", "admin"), getMemoryById)
  .put(protect, authorize("caregiver", "admin"), updateMemory)
  .delete(protect, authorize("caregiver", "admin"), deleteMemory);

export default router;