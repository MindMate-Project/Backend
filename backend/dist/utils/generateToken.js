"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const generateToken = (id) => {
    if (!process.env.JWT_SECRET_KEY) {
        throw new Error("JWT_SECRET_KEY is not defined. Please set it in your environment variables.");
    }
    return jsonwebtoken_1.default.sign({ id }, process.env.JWT_SECRET_KEY, { expiresIn: '30d', });
};
exports.default = generateToken;
