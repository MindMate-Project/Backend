"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = void 0;
const authorize = (...allowedRoles) => (req, res, next) => {
    if (!req.user) {
        res.status(401);
        throw new Error("Not authenticated");
    }
    if (!allowedRoles.includes(req.user.role)) {
        res.status(403);
        throw new Error("Access denied");
    }
    next();
};
exports.authorize = authorize;
