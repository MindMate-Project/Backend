import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary";
import { Request, Response, NextFunction } from "express";

const storage = new CloudinaryStorage({
  cloudinary,
  params: (req: Request, file: Express.Multer.File) => {
    return {
      folder: "zhimar/profile-pictures",
      resource_type: "image",
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      transformation: [{ width: 400, height: 400, crop: "fill" }], // auto resize to square
    };
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max for profile pics
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only images are allowed for profile pictures"));
    }
  },
});

export function handleProfilePictureUpload(
  req: Request,
  res: Response,
  next: NextFunction
) {
  upload.single("profilePicture")(req, res, (err: any) => {
    if (err?.code === "LIMIT_FILE_SIZE") {
      res.status(400).json({ message: "Profile picture must be under 5MB" });
      return;
    }
    if (err) {
      res.status(400).json({ message: err.message });
      return;
    }
    next();
  });
}