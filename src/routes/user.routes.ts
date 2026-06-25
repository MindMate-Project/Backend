import express from "express";
import { protect } from "../middlewares/auth.middleware";
import { handleProfilePictureUpload } from "../middlewares/uploadProfilePicture.middleware";
import { uploadProfilePicture, deleteProfilePicture, registerFcmToken, removeFcmToken } from "../controllers/user.controller";

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

/**
 * @swagger
 * /api/users/fcm-token:
 *   post:
 *     summary: Register a device's FCM token for push notifications
 *     description: Call this on login/app start so push notifications (assignment requests, alerts, reminders) can reach this device.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token:
 *                 type: string
 *                 description: The FCM registration token for this device
 *     responses:
 *       200:
 *         description: Token registered successfully
 *       400:
 *         description: token is required
 *       401:
 *         description: Unauthorized
 *
 *   delete:
 *     summary: Remove a device's FCM token (e.g. on logout)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token removed successfully
 *       400:
 *         description: token is required
 *       401:
 *         description: Unauthorized
 */
router
    .route("/fcm-token")
    .post(protect, registerFcmToken)
    .delete(protect, removeFcmToken);

export default router;