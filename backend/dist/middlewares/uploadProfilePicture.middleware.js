"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleProfilePictureUpload = handleProfilePictureUpload;
const multer_1 = __importDefault(require("multer"));
const multer_storage_cloudinary_1 = require("multer-storage-cloudinary");
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const storage = new multer_storage_cloudinary_1.CloudinaryStorage({
    cloudinary: cloudinary_1.default,
    params: (req, file) => {
        return {
            folder: "zhimar/profile-pictures",
            resource_type: "image",
            allowed_formats: ["jpg", "jpeg", "png", "webp"],
            transformation: [{ width: 400, height: 400, crop: "fill" }], // auto resize to square
        };
    },
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max for profile pics
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        }
        else {
            cb(new Error("Only images are allowed for profile pictures"));
        }
    },
});
function handleProfilePictureUpload(req, res, next) {
    upload.single("profilePicture")(req, res, (err) => {
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
