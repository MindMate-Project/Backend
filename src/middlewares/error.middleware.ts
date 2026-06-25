import { Request, Response, NextFunction } from "express";

export const notFound = (req: Request, res: Response, next: NextFunction) => {
    const err: any = new Error(`Route not found: ${req.originalUrl}`);
    err.statusCode = 404;
    err.status = "fail";
    next(err);
};

export const errorHandler = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    // res.statusCode defaults to 200 until something explicitly sets it, so an
    // error that reaches here without a prior res.status(...) call (e.g. a
    // Mongoose CastError/ValidationError) must not fall back to that default —
    // otherwise the response is sent as "200 OK" with a success:false body.
    let statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : undefined);
    let message = err.message || "Internal Server Error";

    if (err.name === "CastError") {
        statusCode = 400;
        message = `Invalid ${err.path}: ${err.value}`;
    } else if (err.name === "ValidationError") {
        statusCode = 400;
        message = Object.values(err.errors || {})
            .map((e: any) => e.message)
            .join(", ") || message;
    } else if (err.code === 11000) {
        statusCode = 409;
        message = "Duplicate value for a unique field";
    }

    statusCode = statusCode || 500;

    res.status(statusCode).json({
        success: false,
        status: err.status || (statusCode === 500 ? "error" : "fail"),
        message,
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
};

export default errorHandler;
