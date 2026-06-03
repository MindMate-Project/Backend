import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import MemoryItem from "../models/MemoryItem";
import cloudinary from "../config/cloudinary";
import { canAccessPatient, patientIdsFor } from "../utils/ownership";

// ----------------------------------------------------------------------

/**
 * @desc Create new memory item
 * @route POST /api/memories
 * @access Private (Caregiver / Admin)
 */
export const createMemory = asyncHandler(async (req: Request, res: Response) => {
  const { patient_id, type, title, caption, relation, date, tags } = req.body;
  const file = req.file as any;

  if (!patient_id) {
    res.status(400);
    throw new Error("patient_id is required");
  }

  if (!type) {
    res.status(400);
    throw new Error("type is required (photo, video, or text)");
  }

  if (!title) {
    res.status(400);
    throw new Error("title is required");
  }

  if (!caption) {
    res.status(400);
    throw new Error("caption is required");
  }

  if ((type === "photo" || type === "video") && !file) {
    res.status(400);
    throw new Error(`A file is required for ${type} memories`);
  }

  if (!(await canAccessPatient(req.user, patient_id))) {
    res.status(403);
    throw new Error("You are not allowed to add memories for this patient");
  }

  const memory = await MemoryItem.create({
    patient_id,
    type,
    title,
    caption,
    relation: relation || null,
    date: date ? new Date(date) : null,
    file_url: file ? file.path : null,
    cloudinary_public_id: file ? file.filename : null,
    tags: tags
      ? Array.isArray(tags)
        ? tags
        : tags.split(",").map((t: string) => t.trim())
      : [],
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
export const getPatientMemories = asyncHandler(async (req: Request, res: Response) => {
  const { patientId } = req.params;

  if (!(await canAccessPatient(req.user, patientId))) {
    res.status(403);
    throw new Error("Access denied");
  }

  const memories = await MemoryItem.find({ patient_id: patientId });

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
export const getMemoryById = asyncHandler(async (req: Request, res: Response) => {
  const memory = await MemoryItem.findById(req.params.id);

  if (!memory) {
    res.status(404);
    throw new Error("Memory not found");
  }

  if (!(await canAccessPatient(req.user, memory.patient_id))) {
    res.status(403);
    throw new Error("Access denied");
  }

  res.status(200).json({ data: memory });
});

// ----------------------------------------------------------------------

/**
 * @desc Update memory — title, caption, relation, date, tags
 * @route PUT /api/memories/:id
 * @access Private (Caregiver / Admin)
 */
export const updateMemory = asyncHandler(async (req: Request, res: Response) => {
  const { title, caption, relation, date, tags } = req.body;

  const memory = await MemoryItem.findById(req.params.id);

  if (!memory) {
    res.status(404);
    throw new Error("Memory not found");
  }

  if (!(await canAccessPatient(req.user, memory.patient_id))) {
    res.status(403);
    throw new Error("Access denied");
  }

  if (!title && !caption && !relation && !date && !tags) {
    res.status(400);
    throw new Error("At least one field is required to update");
  }

  if (title !== undefined)    memory.title    = title;
  if (caption !== undefined)  memory.caption  = caption;
  if (relation !== undefined) memory.relation = relation;
  if (date !== undefined)     memory.date     = new Date(date);
  if (tags !== undefined) {
    memory.tags = Array.isArray(tags)
      ? tags
      : tags.split(",").map((t: string) => t.trim());
  }

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
 * @access Private (Caregiver / Admin)
 */
export const deleteMemory = asyncHandler(async (req: Request, res: Response) => {
  const memory = await MemoryItem.findById(req.params.id);

  if (!memory) {
    res.status(404);
    throw new Error("Memory not found");
  }

  if (!(await canAccessPatient(req.user, memory.patient_id))) {
    res.status(403);
    throw new Error("Access denied");
  }

  if (memory.cloudinary_public_id) {
    const resourceType = memory.type === "video" ? "video" : "image";
    await cloudinary.uploader.destroy(memory.cloudinary_public_id, {
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
export const searchMemoryByTags = asyncHandler(async (req: Request, res: Response) => {
  const { tags } = req.query;

  if (!tags) {
    res.status(400);
    throw new Error("Tags query is required");
  }

  const tagList = (tags as string).split(",").map((tag) => tag.trim());
  const query: Record<string, unknown> = { tags: { $in: tagList } };

  const user = req.user!;
  if (user.role !== "admin") {
    query.patient_id = { $in: await patientIdsFor(user) };
  }

  const memories = await MemoryItem.find(query);

  res.status(200).json({
    results: memories.length,
    data: memories,
  });
});