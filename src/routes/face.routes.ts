import express from "express";
import multer from "multer";
import {
  registerPatientFace,
  identifyPatientByFace,
  addPhotosToKnownPerson
} from "../controllers/face.controller";
import { protect } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/authorize.middleware";
import { handleUploadSingle, handleUploadArray } from "../middlewares/uploadError.middleware";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Only images are allowed"));
      return;
    }
    cb(null, true);
  }
});

const faceJsonParser = express.json({ limit: "100mb" });
const faceUrlencodedParser = express.urlencoded({ extended: true, limit: "100mb" });

/**
 * @swagger
 * /api/face/patient/register-face:
 *   post:
 *     summary: Register a known person face profile for a patient
 *     tags: [Face]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [firstName, lastName, relationship, files]
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               relationship:
 *                 type: string
 *               files:
 *                 type: array
 *                 minItems: 3
 *                 maxItems: 8
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Person registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 embeddings_count:
 *                   type: number
 *             example:
 *               success: true
 *               message: Person registered successfully
 *               embeddings_count: 5
 *       400:
 *         description: Validation or face processing failed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Patient not found
 *       409:
 *         description: Person already registered
 *       503:
 *         description: AI service unavailable
 */
router.post(
  "/register-face",
  faceJsonParser,
  faceUrlencodedParser,
  protect,
  authorize("caregiver", "patient"),
  handleUploadArray(upload, "files", 8),
  registerPatientFace
);

/**
 * @swagger
 * /api/face/patient/add-photos:
 *   post:
 *     summary: Add additional photos to an existing known person
 *     tags: [Face]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [firstName, lastName, files]
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Photos added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 embeddings_count:
 *                   type: number
 *             example:
 *               success: true
 *               message: Photos added successfully
 *               embeddings_count: 8
 *       400:
 *         description: Validation failed or max photos exceeded
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Patient or person not found
 *       503:
 *         description: AI service unavailable
 */
router.post(
  "/add-photos",
  faceJsonParser,
  faceUrlencodedParser,
  protect,
  authorize("caregiver", "patient"),
  handleUploadArray(upload, "files", 8),
  addPhotosToKnownPerson
);

/**
 * @swagger
 * /api/face/patient/identify-face:
 *   post:
 *     summary: Identify person by a single face image
 *     tags: [Face]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Face identification completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 identified:
 *                   type: boolean
 *                 firstName:
 *                   type: string
 *                   nullable: true
 *                 lastName:
 *                   type: string
 *                   nullable: true
 *                 relationship:
 *                   type: string
 *                   nullable: true
 *                 confidence:
 *                   type: number
 *             examples:
 *               identified:
 *                 summary: Match found with high confidence
 *                 value:
 *                   success: true
 *                   identified: true
 *                   firstName: "Ahmed"
 *                   lastName: "Ali"
 *                   relationship: "son"
 *                   confidence: 0.91
 *               not_identified:
 *                 summary: No trusted match found
 *                 value:
 *                   success: true
 *                   identified: false
 *                   firstName: null
 *                   lastName: null
 *                   relationship: null
 *                   confidence: 0.42
 *       400:
 *         description: Missing image or no known people
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Patient not found
 *       503:
 *         description: AI service unavailable
 */
router.post(
  "/identify-face",
  faceJsonParser,
  faceUrlencodedParser,
  protect,
  authorize("patient", "caregiver"),
  handleUploadSingle(upload, "file"),
  identifyPatientByFace
);

export default router;