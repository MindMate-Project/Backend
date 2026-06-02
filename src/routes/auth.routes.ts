import express, { Router } from "express";
import { registerUser, loginUser,verifyUserAccount,forgotPassword,verifyResetPassword,resetPassword} from "../controllers/auth.controller";
const router : Router = express.Router();

router.post("/register",registerUser );
router.get('/verify/:verificationToken', verifyUserAccount);
router.post("/login", loginUser);
router.post('/forgot-password', forgotPassword);
router.post("/verify-reset-password", verifyResetPassword);
router.post('/reset-password', resetPassword);
export default router;