import express from "express";
import {
  createMemory,
  getPatientMemories,
  getMemoryById,
  updateMemory,
  deleteMemory,
  searchMemoryByTags
} from "../controllers/memoryItemController";

const router = express.Router();
router.post("/", createMemory);
router.get("/search", searchMemoryByTags);
router.get("/patient/:patientId", getPatientMemories);

router
  .route("/:id")
  .get(getMemoryById)
  .put(updateMemory)
  .delete(deleteMemory);
export default router;
