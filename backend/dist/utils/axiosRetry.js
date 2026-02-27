"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.axiosWithRetry = axiosWithRetry;
const axios_1 = __importDefault(require("axios"));
async function axiosWithRetry(config, retries = 3, delayMs = 2000) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await (0, axios_1.default)(config);
        }
        catch (err) {
            const status = err?.response?.status;
            const isLast = attempt === retries;
            if (status === 429 && !isLast) {
                const wait = delayMs * attempt;
                console.warn(`[Axios] 429 received. Retrying in ${wait}ms... (attempt ${attempt}/${retries})`);
                await new Promise(res => setTimeout(res, wait));
            }
            else {
                throw err;
            }
        }
    }
}
