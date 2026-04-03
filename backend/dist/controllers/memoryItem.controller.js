"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchMemoryByTags = exports.deleteMemory = exports.updateMemory = exports.getMemoryById = exports.getPatientMemories = exports.createMemory = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const MemoryItem_1 = __importDefault(require("../models/MemoryItem"));
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
// ----------------------------------------------------------------------
/**
 * @desc Create new memory item
 * @route POST /api/memories
 * @access Private (Caregiver / Admin)
 */
exports.createMemory = (0, express_async_handler_1.default)(async (req, res) => {
    const { patient_id, tags } = req.body;
    const file = req.file; // multer-storage-cloudinary attaches cloudinary info here
    if (!patient_id) {
        res.status(400);
        throw new Error("patient_id is required");
    }
    // If type is "text", no file is needed — content_ref is just the text itself
    const type = req.body.type;
    if (!type) {
        res.status(400);
        throw new Error("type is required (photo, video, or text)");
    }
    let content_ref;
    if (type === "text") {
        // For text memories, content_ref comes directly from body
        if (!req.body.content_ref) {
            res.status(400);
            throw new Error("content_ref is required for text memories");
        }
        content_ref = req.body.content_ref;
    }
    else {
        // For photo/video, a file must be uploaded
        if (!file) {
            res.status(400);
            throw new Error(`A file is required for ${type} memories`);
        }
        // Cloudinary storage puts the secure URL here
        content_ref = file.path;
    }
    const memory = await MemoryItem_1.default.create({
        patient_id,
        type,
        content_ref,
        tags: tags ? (Array.isArray(tags) ? tags : tags.split(",").map((t) => t.trim())) : [],
        // Store cloudinary public_id so we can delete it later
        cloudinary_public_id: file?.filename ?? null,
    });
    res.status(201).json({
        message: "Memory created successfully",
        data: memory,
    });
});
// ----------------------------------------------------------------------
/**
 * @desc Get all memories for a patient
 * @route GET /api/memories/patient/:patientId
 * @access Private
 */
exports.getPatientMemories = (0, express_async_handler_1.default)(async (req, res) => {
    const { patientId } = req.params;
    const memories = await MemoryItem_1.default.find({ patient_id: patientId });
    res.status(200).json({
        results: memories.length,
        data: memories,
    });
});
// ----------------------------------------------------------------------
/**
 * @desc Get single memory by ID
 * @route GET /api/memories/:id
 * @access Private
 */
exports.getMemoryById = (0, express_async_handler_1.default)(async (req, res) => {
    const memory = await MemoryItem_1.default.findById(req.params.id);
    if (!memory) {
        res.status(404);
        throw new Error("Memory not found");
    }
    res.status(200).json({ data: memory });
});
// ----------------------------------------------------------------------
/**
 * @desc Update memory
 * @route PUT /api/memories/:id
 * @access Private
 */
exports.updateMemory = (0, express_async_handler_1.default)(async (req, res) => {
    const memory = await MemoryItem_1.default.findById(req.params.id);
    if (!memory) {
        res.status(404);
        throw new Error("Memory not found");
    }
    memory.type = req.body.type || memory.type;
    memory.content_ref = req.body.content_ref || memory.content_ref;
    memory.tags = req.body.tags || memory.tags;
    const updatedMemory = await memory.save();
    res.status(200).json({
        message: "Memory updated successfully",
        data: updatedMemory,
    });
});
// ----------------------------------------------------------------------
/**
 * @desc Delete memory — also removes file from Cloudinary
 * @route DELETE /api/memories/:id
 * @access Private
 */
exports.deleteMemory = (0, express_async_handler_1.default)(async (req, res) => {
    const memory = await MemoryItem_1.default.findById(req.params.id);
    if (!memory) {
        res.status(404);
        throw new Error("Memory not found");
    }
    // Delete from Cloudinary if a public_id was stored
    if (memory.cloudinary_public_id) {
        const resourceType = memory.type === "video" ? "video" : "image";
        await cloudinary_1.default.uploader.destroy(memory.cloudinary_public_id, {
            resource_type: resourceType,
        });
    }
    await memory.deleteOne();
    res.status(200).json({ message: "Memory deleted successfully" });
});
// ----------------------------------------------------------------------
/**
 * @desc Search memories by tags
 * @route GET /api/memories/search?tags=family,mother
 * @access Private
 */
exports.searchMemoryByTags = (0, express_async_handler_1.default)(async (req, res) => {
    const { tags } = req.query;
    if (!tags) {
        res.status(400);
        throw new Error("Tags query is required");
    }
    const memories = await MemoryItem_1.default.find({
        tags: {
            $in: tags.split(",").map((tag) => tag.trim()),
        },
    });
    res.status(200).json({
        results: memories.length,
        data: memories,
    });
});
