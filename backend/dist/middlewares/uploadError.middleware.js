"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleUploadSingle = handleUploadSingle;
exports.handleUploadArray = handleUploadArray;
function handleUploadSingle(upload, fieldName) {
    return (req, res, next) => {
        upload.single(fieldName)(req, res, (err) => {
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
function handleUploadArray(upload, fieldName, maxCount) {
    return (req, res, next) => {
        upload.array(fieldName, maxCount)(req, res, (err) => {
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
