import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import MemoryItem from "../models/MemoryItem";
import cloudinary from "../config/cloudinary";

// ----------------------------------------------------------------------

/**
 * @desc Create new memory item
 * @route POST /api/memories
 * @access Private (Caregiver / Admin)
 */
export const createMemory = asyncHandler(async (req: Request, res: Response) => {
  const { patient_id, tags } = req.body;
  const file = req.file as any; // multer-storage-cloudinary attaches cloudinary info here

  if (!patient_id) {
    res.status(400);
    throw new Error("patient_id is required");
  }

  // If type is "text", no file is needed — content_ref is just the text itself
  const type = req.body.type as "photo" | "video" | "text";

  if (!type) {
    res.status(400);
    throw new Error("type is required (photo, video, or text)");
  }

  let content_ref: string;

  if (type === "text") {
    // For text memories, content_ref comes directly from body
    if (!req.body.content_ref) {
      res.status(400);
      throw new Error("content_ref is required for text memories");
    }
    content_ref = req.body.content_ref;
  } else {
    // For photo/video, a file must be uploaded
    if (!file) {
      res.status(400);
      throw new Error(`A file is required for ${type} memories`);
    }
    // Cloudinary storage puts the secure URL here
    content_ref = file.path;
  }

  const memory = await MemoryItem.create({
    patient_id,
    type,
    content_ref,
    tags: tags ? (Array.isArray(tags) ? tags : tags.split(",").map((t: string) => t.trim())) : [],
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
export const getPatientMemories = asyncHandler(async (req: Request, res: Response) => {
  const { patientId } = req.params;

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

  res.status(200).json({ data: memory });
});

// ----------------------------------------------------------------------

/**
 * @desc Update memory
 * @route PUT /api/memories/:id
 * @access Private
 */
export const updateMemory = asyncHandler(async (req: Request, res: Response) => {
  const memory = await MemoryItem.findById(req.params.id);

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
export const deleteMemory = asyncHandler(async (req: Request, res: Response) => {
  const memory = await MemoryItem.findById(req.params.id) as any;

  if (!memory) {
    res.status(404);
    throw new Error("Memory not found");
  }

  // Delete from Cloudinary if a public_id was stored
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

  const memories = await MemoryItem.find({
    tags: {
      $in: (tags as string).split(",").map((tag) => tag.trim()),
    },
  });

  res.status(200).json({
    results: memories.length,
    data: memories,
  });
});