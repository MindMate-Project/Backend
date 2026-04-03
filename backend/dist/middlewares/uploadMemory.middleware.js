"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleMemoryUpload = handleMemoryUpload;
const multer_1 = __importDefault(require("multer"));
const multer_storage_cloudinary_1 = require("multer-storage-cloudinary");
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const storage = new multer_storage_cloudinary_1.CloudinaryStorage({
    cloudinary: cloudinary_1.default,
    params: (req, file) => {
        const isVideo = file.mimetype.startsWith("video/");
        return {
            folder: "zhimar/memories",
            resource_type: isVideo ? "video" : "image",
            allowed_formats: ["jpg", "jpeg", "png", "webp", "mp4", "mov", "avi"],
        };
    },
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
    fileFilter: (req, file, cb) => {
        const isImage = file.mimetype.startsWith("image/");
        const isVideo = file.mimetype.startsWith("video/");
        if (isImage || isVideo) {
            cb(null, true);
        }
        else {
            cb(new Error("Only images and videos are allowed"));
        }
    },
});
function handleMemoryUpload(req, res, next) {
    upload.single("file")(req, res, (err) => {
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
