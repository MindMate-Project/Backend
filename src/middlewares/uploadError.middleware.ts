import { Request, Response, NextFunction } from "express";
import { Multer } from "multer";

export function handleUploadSingle(upload: any, fieldName: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    upload.single(fieldName)(req, res, (err: any) => {
      if (err?.code === "LIMIT_FILE_SIZE") {
        res.status(400).json({ message: "File must be under 10MB" });
        return;
      }
      if (err) {
        res.status(400).json({ message: err.message });
        return;
      }
      next();
    });
  };
}

export function handleUploadArray(upload: any, fieldName: string, maxCount: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    upload.array(fieldName, maxCount)(req, res, (err: any) => {
      if (err?.code === "LIMIT_FILE_SIZE") {
        res.status(400).json({ message: "Each file must be under 10MB" });
        return;
      }
      if (err) {
        res.status(400).json({ message: err.message });
        return;
      }
      next();
    });
  };
}