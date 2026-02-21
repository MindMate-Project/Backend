import express from "express";
import multer from "multer";
import {
  registerPatientFace,
  identifyPatientByFace
} from "../controllers/face.controller";
import { protect } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/authorize.middleware";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.post(
  "/register-face",
  protect,
  authorize("caregiver" , "patient"),
  upload.single("file"),
  registerPatientFace
);

router.post(
  "/identify-face",
  protect,
  authorize("patient" , "caregiver"),
  upload.single("file"),
  identifyPatientByFace
);

export default router;