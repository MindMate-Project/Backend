import express from "express";
import multer from "multer";
import {
    registerPatientFace,
    identifyPatientByFace
} from "../controllers/faceController";
import { protect } from "../middlewares/authMiddleware";

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }
});

router.post(
    "/register-face",
    protect,
    upload.single("image"),
    registerPatientFace
);

router.post(
    "/identify-face",
    protect,
    upload.single("image"),
    identifyPatientByFace
);
export default router;
