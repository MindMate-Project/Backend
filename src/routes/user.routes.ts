import express from "express";
import { protect } from "../middlewares/auth.middleware";
import { handleProfilePictureUpload } from "../middlewares/uploadProfilePicture.middleware";
import { uploadProfilePicture, deleteProfilePicture } from "../controllers/user.controller";

const router = express.Router();

/**
 * @swagger
 * /api/users/profile-picture:
 *   post:
 *     summary: Upload or update profile picture
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [profilePicture]
 *             properties:
 *               profilePicture:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile picture updated successfully
 *         content:
 *           application/json:
 *             example:
 *               message: Profile picture updated successfully
 *               data:
 *                 profilePicture: "https://res.cloudinary.com/..."
 *       400:
 *         description: No file provided or invalid format
 *       401:
 *         description: Unauthorized
 *
 *   delete:
 *     summary: Delete profile picture
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile picture deleted successfully
 *       400:
 *         description: No profile picture to delete
 *       401:
 *         description: Unauthorized
 */

router.post(
    "/profile-picture",
    protect,
    handleProfilePictureUpload,
    uploadProfilePicture
);

router.delete(
    "/profile-picture",
    protect,
    deleteProfilePicture
);

export default router;