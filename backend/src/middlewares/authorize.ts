import { Request, Response, NextFunction } from "express";
import { IMongooseBaseUser } from "../models/User";

interface AuthRequest extends Request {
  user?: IMongooseBaseUser;
}

export const authorize =
  (...allowedRoles: Array<IMongooseBaseUser["role"]>) =>
  (req: AuthRequest, res: Response, next: NextFunction) => {
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