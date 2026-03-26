import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary";
import { Request, Response, NextFunction } from "express";

const storage = new CloudinaryStorage({
  cloudinary,
  params: (req: Request, file: Express.Multer.File) => {
    const isVideo = file.mimetype.startsWith("video/");
    return {
      folder: "zhimar/memories",
      resource_type: isVideo ? "video" : "image",
      allowed_formats: ["jpg", "jpeg", "png", "webp", "mp4", "mov", "avi"],
    };
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  fileFilter: (req, file, cb) => {
    const isImage = file.mimetype.startsWith("image/");
    const isVideo = file.mimetype.startsWith("video/");
    if (isImage || isVideo) {
      cb(null, true);
    } else {
      cb(new Error("Only images and videos are allowed"));
    }
  },
});

export function handleMemoryUpload(
  req: Request,
  res: Response,
  next: NextFunction
) {
  upload.single("file")(req, res, (err: any) => {
    if (err?.code === "LIMIT_FILE_SIZE") {
      res.status(400).json({ message: "File must be under 50MB" });
      return;
    }
    if (err) {
      res.status(400).json({ message: err.message });
      return;
    }
    next();
  });
}