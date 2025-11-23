import jwt, { JwtPayload } from "jsonwebtoken";
import { User, IMongooseBaseUser } from "../models/User"; 
import asyncHandler from "express-async-handler";
import { Request, Response, NextFunction } from 'express';

// 1. Extend the Express Request Interface
interface AuthenticatedRequest extends Request {
    user?: IMongooseBaseUser; // Use the base Mongoose Document type
}

// 2. Define the JWT Payload structure
interface DecodedToken extends JwtPayload {
    id: string; 
}

// --- PROTECT MIDDLEWARE (Authentication Check) ---

export const protect = asyncHandler(async (
    req: AuthenticatedRequest, 
    res: Response, 
    next: NextFunction
) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            
            if (!process.env.JWT_SECRET_KEY) {
                 throw new Error("JWT_SECRET_KEY is not defined in environment variables.");
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY) as DecodedToken;

            // Find the user by ID
            // Mongoose returns a document that implements the type IMongooseBaseUser
            const user = await User.findById(decoded.id).select('-password');
            
            if (!user) {
                res.status(401);
                throw new Error('Not authorized, user not found');
            }

            // The user object is correctly typed and attached
            req.user = user as IMongooseBaseUser; 
            
            next();

        } catch (error) {
            console.error(error);
            res.status(401);
            throw new Error('Not authorized, token failed');
        }
    }

    if (!token) {
        res.status(401);
        throw new Error('Not authorized, no token');
    }
});


export const adminOnly = (
    req: AuthenticatedRequest, 
    res: Response, 
    next: NextFunction
) => {
    if (req.user && req.user.role === "admin") {
        next();
    } else {
        res.status(403); 
        throw new Error("Access denied: Admins only");
    }
};