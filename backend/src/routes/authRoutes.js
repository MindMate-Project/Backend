import express from "express";
import { registerUser, loginUser,verifyUserAccount,forgotPassword,resetPassword} from "../controllers/authController.js";
const router = express.Router();

router.post("/register",registerUser );
router.get('/verify/:verificationToken', verifyUserAccount);
router.post("/login", loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
export default router;