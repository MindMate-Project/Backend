import { Request, Response, NextFunction } from "express";

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  res.status(404);
  next(new Error(`Route not found: ${req.originalUrl}`));
};

/**
 * Central error handler.
 *
 * Controllers in this codebase set the intended status via `res.status(4xx)`
 * *before* throwing (e.g. `res.status(400); throw new Error(...)`). The previous
 * handler read `err.statusCode` (which was never set), so every error collapsed
 * to HTTP 500. This honors the status already on the response, falling back to
 * an explicit `err.statusCode`, then 500.
 */
export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  let statusCode =
    res.statusCode && res.statusCode !== 200
      ? res.statusCode
      : err.statusCode || 500;

  if (statusCode < 400) statusCode = 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Server error",
    ...(process.env.NODE_ENV === "production" ? {} : { stack: err.stack }),
  });
};
