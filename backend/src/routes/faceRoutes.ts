import express from "express";
import multer from "multer";
import {
  registerPatientFace,
  identifyPatientByFace
} from "../controllers/faceController";
import { protect } from "../middlewares/authMiddleware";
import { authorize } from "../middlewares/authorize";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.post(
  "/register-face",
  protect,
  authorize("caregiver" , "patient"),
  upload.single("image"),
  registerPatientFace
);

router.post(
  "/identify-face",
  protect,
  authorize("patient" , "caregiver"),
  upload.single("image"),
  identifyPatientByFace
);

export default router;