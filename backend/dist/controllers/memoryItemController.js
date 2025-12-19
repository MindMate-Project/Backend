"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchMemoryByTags = exports.deleteMemory = exports.updateMemory = exports.getMemoryById = exports.getPatientMemories = exports.createMemory = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const MemoryItem_1 = __importDefault(require("../models/MemoryItem"));
// ----------------------------------------------------------------------
/**
 * @desc Create new memory item
 * @route POST /api/memories
 * @access Private (Patient / Caregiver)
 */
exports.createMemory = (0, express_async_handler_1.default)(async (req, res) => {
    const { patient_id, type, content_ref, tags } = req.body;
    if (!patient_id || !type || !content_ref) {
        res.status(400);
        throw new Error("Missing required fields");
    }
    const memory = await MemoryItem_1.default.create({
        patient_id,
        type,
        content_ref,
        tags
    });
    res.status(201).json({
        message: "Memory created successfully",
        data: memory
    });
});
// ----------------------------------------------------------------------
/**
 * @desc Get all memories for a patient
 * @route GET /api/memories/:patientId
 * @access Private
 */
exports.getPatientMemories = (0, express_async_handler_1.default)(async (req, res) => {
    const { patientId } = req.params;
    const memories = await MemoryItem_1.default.find({ patient_id: patientId });
    res.status(200).json({
        results: memories.length,
        data: memories
    });
});
// ----------------------------------------------------------------------
/**
 * @desc Get single memory by ID
 * @route GET /api/memory/:id
 * @access Private
 */
exports.getMemoryById = (0, express_async_handler_1.default)(async (req, res) => {
    const memory = await MemoryItem_1.default.findById(req.params.id);
    if (!memory) {
        res.status(404);
        throw new Error("Memory not found");
    }
    res.status(200).json({
        data: memory
    });
});
// ----------------------------------------------------------------------
/**
 * @desc Update memory
 * @route PUT /api/memory/:id
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
        data: updatedMemory
    });
});
// ----------------------------------------------------------------------
/**
 * @desc Delete memory
 * @route DELETE /api/memory/:id
 * @access Private
 */
exports.deleteMemory = (0, express_async_handler_1.default)(async (req, res) => {
    const memory = await MemoryItem_1.default.findById(req.params.id);
    if (!memory) {
        res.status(404);
        throw new Error("Memory not found");
    }
    await memory.deleteOne();
    res.status(200).json({
        message: "Memory deleted successfully"
    });
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
        tags: { $in: tags.split(",") }
    });
    res.status(200).json({
        results: memories.length,
        data: memories
    });
});
