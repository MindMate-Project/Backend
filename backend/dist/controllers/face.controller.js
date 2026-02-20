"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.identifyPatientByFace = exports.registerPatientFace = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const axios_1 = __importDefault(require("axios"));
const form_data_1 = __importDefault(require("form-data"));
const User_1 = require("../models/User");
/**
 * Helper: normalize identity fields
 */
const normalize = (v) => v.trim().toLowerCase();
const PYTHON_AI_URL = process.env.PYTHON_AI_URL;
exports.registerPatientFace = (0, express_async_handler_1.default)(async (req, res) => {
    const user = req.user;
    if (!user || user.role !== "patient") {
        res.status(403);
        throw new Error("Only patients can register faces");
    }
    const { name, relationship } = req.body;
    if (!name || !relationship) {
        res.status(400);
        throw new Error("Name and relationship are required");
    }
    if (!req.file) {
        res.status(400);
        throw new Error("Image is required");
    }
    const patient = await User_1.Patient.findById(user._id);
    if (!patient) {
        res.status(404);
        throw new Error("Patient not found");
    }
    const normName = normalize(name);
    const normRel = normalize(relationship);
    const knownPerson = patient.known_people?.find((p) => normalize(p.name) === normName &&
        normalize(p.relationship) === normRel);
    const formData = new form_data_1.default();
    formData.append("file", req.file.buffer, {
        filename: req.file.originalname,
        contentType: req.file.mimetype
    });
    let pythonResponse;
    // CASE A: Person already exists
    if (knownPerson) {
        formData.append("old_embedding", JSON.stringify(knownPerson.average_embedding));
        formData.append("count", String(knownPerson.embeddings_count));
        pythonResponse = await axios_1.default.post(`${PYTHON_AI_URL}/face/update-average`, formData, { headers: formData.getHeaders() });
        const { new_embedding, new_count, status } = pythonResponse.data;
        if (status !== "ok") {
            res.status(400);
            throw new Error("Face processing failed");
        }
        knownPerson.average_embedding = new_embedding;
        knownPerson.embeddings_count = new_count;
        knownPerson.updated_at = new Date();
    }
    else {
        // CASE B: New person
        pythonResponse = await axios_1.default.post(`${PYTHON_AI_URL}/face/extract`, formData, { headers: formData.getHeaders() });
        const { embedding, status } = pythonResponse.data;
        if (status !== "ok") {
            res.status(400);
            throw new Error("Face extraction failed");
        }
        patient.known_people.push({
            name,
            relationship,
            average_embedding: embedding,
            embeddings_count: 1,
            created_at: new Date(),
            updated_at: new Date()
        });
    }
    await patient.save();
    res.status(200).json({
        success: true,
        message: "Face registered successfully"
    });
});
//  * IDENTIFY FACE
exports.identifyPatientByFace = (0, express_async_handler_1.default)(async (req, res) => {
    const normalize = (v) => v.trim().toLowerCase();
    const user = req.user;
    if (!user || user.role !== "patient") {
        res.status(403);
        throw new Error("Only patients can identify faces");
    }
    if (!req.file) {
        res.status(400);
        throw new Error("Image is required");
    }
    const patient = await User_1.Patient.findById(user._id);
    if (!patient) {
        res.status(404);
        throw new Error("Patient not found");
    }
    if (!patient.known_people || patient.known_people.length === 0) {
        res.status(400);
        throw new Error("No known people registered");
    }
    // Build candidates array
    const candidates = patient.known_people.map((p) => ({
        user_id: `${normalize(p.name)}::${normalize(p.relationship)}`,
        embedding: p.average_embedding
    }));
    const formData = new form_data_1.default();
    formData.append("file", req.file.buffer, {
        filename: req.file.originalname,
        contentType: req.file.mimetype
    });
    formData.append("candidates", JSON.stringify(candidates));
    // Call Python service
    const pythonResponse = await axios_1.default.post(`${PYTHON_AI_URL}/face/identify`, formData, { headers: formData.getHeaders() });
    const { user_id, score } = pythonResponse.data;
    const bestScore = score ?? 0;
    // Match result back to Mongo
    let matchedPerson = null;
    if (user_id) {
        const [nameKey, relKey] = user_id.split("::").map(normalize);
        matchedPerson = patient.known_people.find((p) => normalize(p.name) === nameKey &&
            normalize(p.relationship) === relKey);
    }
    // Response
    res.status(200).json({
        success: true,
        identified: bestScore >= 0.72 && !!matchedPerson,
        name: matchedPerson?.name ?? null,
        relationship: matchedPerson?.relationship ?? null,
        confidence: bestScore
    });
});
