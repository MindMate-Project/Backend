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

/**
 * @swagger
 * tags:
 *   name: Memories
 *   description: Memory Bank items (photo/video/text)
 *
 * /api/memories:
 *   post:
 *     summary: Create a memory (caregiver/admin). Multipart for photo/video.
 *     tags: [Memories]
 *     security: [ { bearerAuth: [] } ]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [patient_id, type, title, caption]
 *             properties:
 *               patient_id: { type: string }
 *               type: { type: string, enum: [photo, video, text] }
 *               title: { type: string }
 *               caption: { type: string }
 *               relation: { type: string }
 *               date: { type: string, format: date-time }
 *               tags: { type: string, description: Comma-separated or array }
 *               file: { type: string, format: binary, description: Required for photo/video }
 *     responses:
 *       201: { description: Memory created }
 *       400: { description: Validation error, or invalid patient_id }
 *       403: { description: Not allowed to add memories for this patient }
 */
router.post(
  "/",
  protect,
  authorize("caregiver", "admin"),
  handleMemoryUpload,       // <-- Cloudinary upload happens here
  createMemory
);

/**
 * @swagger
 * /api/memories/search:
 *   get:
 *     summary: Search memories by tags (scoped to the caller's patient)
 *     tags: [Memories]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: query
 *         name: tags
 *         schema: { type: string }
 *         description: Comma-separated tags
 *       - in: query
 *         name: patientId
 *         schema: { type: string }
 *         description: Optional - scope the search to one patient instead of all patients the caller can access
 *     responses:
 *       200: { description: "Matching memories ({ results, data })" }
 *       400: { description: Tags query is required }
 *       403: { description: Access denied (patientId is invalid or not accessible to the caller) }
 */
router.get(
  "/search",
  protect,
  authorize("patient", "caregiver", "admin"),
  searchMemoryByTags
);

/**
 * @swagger
 * /api/memories/patient/{patientId}:
 *   get:
 *     summary: List all memories for a patient
 *     tags: [Memories]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: "Memories ({ results, data })" }
 *       400: { description: Invalid patient ID }
 *       403: { description: Access denied }
 */
router.get(
  "/patient/:patientId",
  protect,
  authorize("patient", "caregiver", "admin"),
  getPatientMemories
);

/**
 * @swagger
 * /api/memories/{id}:
 *   get:
 *     summary: Get a memory by id
 *     tags: [Memories]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Memory found }
 *       400: { description: Invalid memory ID }
 *       403: { description: Access denied }
 *       404: { description: Memory not found }
 *   put:
 *     summary: Update a memory's text fields (caregiver/admin). Media cannot be changed.
 *     tags: [Memories]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               caption: { type: string }
 *               relation: { type: string }
 *               date: { type: string, format: date-time }
 *               tags: { type: array, items: { type: string } }
 *     responses:
 *       200: { description: Memory updated }
 *       400: { description: Invalid memory ID, or no fields provided to update }
 *       403: { description: Access denied }
 *       404: { description: Memory not found }
 *   delete:
 *     summary: Delete a memory and its Cloudinary asset (caregiver/admin)
 *     tags: [Memories]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Memory deleted }
 *       400: { description: Invalid memory ID }
 *       403: { description: Access denied }
 *       404: { description: Memory not found }
 */
router
  .route("/:id")
  .get(protect, authorize("patient", "caregiver", "admin"), getMemoryById)
  .put(protect, authorize("caregiver", "admin"), updateMemory)
  .delete(protect, authorize("caregiver", "admin"), deleteMemory);

export default router;