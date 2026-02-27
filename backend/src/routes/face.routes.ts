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

router.post(
  "/register-face",
  faceJsonParser,
  faceUrlencodedParser,
  protect,
  authorize("caregiver", "patient"),
  handleUploadArray(upload, "files", 8),
  registerPatientFace
);

router.post(
  "/add-photos",
  faceJsonParser,
  faceUrlencodedParser,
  protect,
  authorize("caregiver", "patient"),
  handleUploadArray(upload, "files", 8),
  addPhotosToKnownPerson
);

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