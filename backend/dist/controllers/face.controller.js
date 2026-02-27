"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.identifyPatientByFace = exports.addPhotosToKnownPerson = exports.registerPatientFace = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const form_data_1 = __importDefault(require("form-data"));
const User_1 = require("../models/User");
const axiosRetry_1 = require("../utils/axiosRetry");
const normalize = (v) => v.trim().toLowerCase();
const PYTHON_AI_URL = process.env.PYTHON_AI_URL;
// ---- REGISTER FACE ----
exports.registerPatientFace = (0, express_async_handler_1.default)(async (req, res) => {
    const user = req.user;
    if (!user || user.role !== "patient") {
        res.status(403);
        throw new Error("Only patients can register faces");
    }
    const { firstName, lastName, relationship } = req.body;
    if (!firstName || !lastName || !relationship) {
        res.status(400);
        throw new Error("First name, last name and relationship are required");
    }
    const files = req.files;
    if (!files || files.length < 3) {
        res.status(400);
        throw new Error("Minimum 3 images are required");
    }
    if (files.length > 8) {
        res.status(400);
        throw new Error("Maximum 8 images allowed");
    }
    const patient = await User_1.Patient.findById(user._id);
    if (!patient) {
        res.status(404);
        throw new Error("Patient not found");
    }
    const normFirst = normalize(firstName);
    const normLast = normalize(lastName);
    const exists = patient.known_people?.find((p) => p.firstName && p.lastName &&
        normalize(p.firstName) === normFirst &&
        normalize(p.lastName) === normLast);
    if (exists) {
        res.status(409);
        throw new Error("This person is already registered, use add-photos to add more photos");
    }
    const formData = new form_data_1.default();
    for (const file of files) {
        formData.append("files", file.buffer, {
            filename: file.originalname,
            contentType: file.mimetype
        });
    }
    let pythonResponse;
    try {
        pythonResponse = await (0, axiosRetry_1.axiosWithRetry)({
            method: "POST",
            url: `${PYTHON_AI_URL}/face/register-batch`,
            data: formData,
            headers: formData.getHeaders()
        });
    }
    catch (err) {
        if (err?.response?.status === 429) {
            res.status(503);
            throw new Error("AI service is busy, please try again in a moment");
        }
        throw err;
    }
    const { average_embedding, count, status } = pythonResponse.data;
    if (status !== "ok") {
        res.status(400);
        throw new Error("Face processing failed");
    }
    patient.known_people.push({
        firstName,
        lastName,
        relationship,
        average_embedding,
        embeddings_count: count,
        created_at: new Date(),
        updated_at: new Date()
    });
    await patient.save();
    res.status(200).json({
        success: true,
        message: "Person registered successfully",
        embeddings_count: count
    });
});
// ---- ADD PHOTOS TO EXISTING PERSON ----
exports.addPhotosToKnownPerson = (0, express_async_handler_1.default)(async (req, res) => {
    const user = req.user;
    if (!user || user.role !== "patient") {
        res.status(403);
        throw new Error("Only patients can add photos");
    }
    const { firstName, lastName } = req.body;
    if (!firstName || !lastName) {
        res.status(400);
        throw new Error("First name and last name are required");
    }
    const files = req.files;
    if (!files || files.length < 1) {
        res.status(400);
        throw new Error("At least 1 image is required");
    }
    const patient = await User_1.Patient.findById(user._id);
    if (!patient) {
        res.status(404);
        throw new Error("Patient not found");
    }
    const normFirst = normalize(firstName);
    const normLast = normalize(lastName);
    const knownPerson = patient.known_people?.find((p) => p.firstName && p.lastName &&
        normalize(p.firstName) === normFirst &&
        normalize(p.lastName) === normLast);
    if (!knownPerson) {
        res.status(404);
        throw new Error("Person not found, register them first");
    }
    const totalAfterAdd = knownPerson.embeddings_count + files.length;
    if (totalAfterAdd > 8) {
        res.status(400);
        throw new Error(`Cannot add ${files.length} photos. Current count is ${knownPerson.embeddings_count}, maximum is 8. You can add up to ${8 - knownPerson.embeddings_count} more photos`);
    }
    const formData = new form_data_1.default();
    for (const file of files) {
        formData.append("files", file.buffer, {
            filename: file.originalname,
            contentType: file.mimetype
        });
    }
    formData.append("old_embedding", JSON.stringify(knownPerson.average_embedding));
    formData.append("count", String(knownPerson.embeddings_count));
    let pythonResponse;
    try {
        pythonResponse = await (0, axiosRetry_1.axiosWithRetry)({
            method: "POST",
            url: `${PYTHON_AI_URL}/face/add-photos`,
            data: formData,
            headers: formData.getHeaders()
        });
    }
    catch (err) {
        if (err?.response?.status === 429) {
            res.status(503);
            throw new Error("AI service is busy, please try again in a moment");
        }
        throw err;
    }
    const { new_embedding, new_count, status } = pythonResponse.data;
    if (status !== "ok") {
        res.status(400);
        throw new Error("Face processing failed");
    }
    knownPerson.average_embedding = new_embedding;
    knownPerson.embeddings_count = new_count;
    knownPerson.updated_at = new Date();
    await patient.save();
    res.status(200).json({
        success: true,
        message: "Photos added successfully",
        embeddings_count: new_count
    });
});
// ---- IDENTIFY FACE ----
exports.identifyPatientByFace = (0, express_async_handler_1.default)(async (req, res) => {
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
    const candidates = patient.known_people
        .filter((p) => p.firstName && p.lastName)
        .map((p) => ({
        user_id: `${normalize(p.firstName)}::${normalize(p.lastName)}`,
        embedding: p.average_embedding
    }));
    if (candidates.length === 0) {
        res.status(400);
        throw new Error("No valid known people registered");
    }
    const formData = new form_data_1.default();
    formData.append("file", req.file.buffer, {
        filename: req.file.originalname,
        contentType: req.file.mimetype
    });
    formData.append("candidates", JSON.stringify(candidates));
    let pythonResponse;
    try {
        pythonResponse = await (0, axiosRetry_1.axiosWithRetry)({
            method: "POST",
            url: `${PYTHON_AI_URL}/face/identify`,
            data: formData,
            headers: formData.getHeaders()
        });
    }
    catch (err) {
        if (err?.response?.status === 429) {
            res.status(503);
            throw new Error("AI service is busy, please try again in a moment");
        }
        throw err;
    }
    const { user_id, score } = pythonResponse.data;
    const bestScore = score ?? 0;
    let matchedPerson = null;
    if (user_id) {
        const [firstKey, lastKey] = user_id.split("::").map(normalize);
        matchedPerson = patient.known_people.find((p) => p.firstName && p.lastName &&
            normalize(p.firstName) === firstKey &&
            normalize(p.lastName) === lastKey);
    }
    res.status(200).json({
        success: true,
        identified: bestScore >= 0.72 && !!matchedPerson,
        firstName: matchedPerson?.firstName ?? null,
        lastName: matchedPerson?.lastName ?? null,
        relationship: matchedPerson?.relationship ?? null,
        confidence: bestScore
    });
});
