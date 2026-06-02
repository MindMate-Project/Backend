import { IMongooseBaseUser } from "../../models/User";

declare global {
  namespace Express {
    interface Request {
      user?: IMongooseBaseUser;
    }
  }
}

export {};