import express, { Router } from "express";
import { registerUser, loginUser,verifyUserAccount,forgotPassword,resetPassword} from "../controllers/authController";
const router : Router = express.Router();

router.post("/register",registerUser );
// router.get('/verify/:verificationToken', verifyUserAccount);
router.post("/login", loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
export default router;