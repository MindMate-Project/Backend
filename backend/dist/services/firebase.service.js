"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPush = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
firebase_admin_1.default.initializeApp({
    credential: firebase_admin_1.default.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
});
const sendPush = async (tokens, title, body) => {
    if (!tokens || tokens.length === 0)
        return;
    const message = {
        notification: { title, body },
        tokens,
    };
    try {
        await firebase_admin_1.default.messaging().sendEachForMulticast(message);
    }
    catch (error) {
        console.error("Push error:", error);
    }
};
exports.sendPush = sendPush;
