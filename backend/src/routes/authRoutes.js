import express from "express";
import { registerUser, loginUser,verifyUserAccount} from "../controllers/authController.js";
const router = express.Router();

router.post("/register",registerUser );
router.get('/verify/:verificationToken', verifyUserAccount);
router.post("/login", loginUser);
export default router;