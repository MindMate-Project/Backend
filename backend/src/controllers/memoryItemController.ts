import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import MemoryItem from "../models/MemoryItem";

// ----------------------------------------------------------------------

/**
 * @desc Create new memory item
 * @route POST /api/memories
 * @access Private (Patient / Caregiver)
 */
export const createMemory = asyncHandler(async (req: Request, res: Response) => {
  const { patient_id, type, content_ref, tags } = req.body;

  if (!patient_id || !type || !content_ref) {
    res.status(400);
    throw new Error("Missing required fields");
  }

  const memory = await MemoryItem.create({
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
export const getPatientMemories = asyncHandler(async (req: Request, res: Response) => {
  const { patientId } = req.params;

  const memories = await MemoryItem.find({ patient_id: patientId });

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
export const getMemoryById = asyncHandler(async (req: Request, res: Response) => {
  const memory = await MemoryItem.findById(req.params.id);

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
    data: updatedMemory
  });
});

// ----------------------------------------------------------------------

/**
 * @desc Delete memory
 * @route DELETE /api/memory/:id
 * @access Private
 */
export const deleteMemory = asyncHandler(async (req: Request, res: Response) => {
  const memory = await MemoryItem.findById(req.params.id);

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
export const searchMemoryByTags = asyncHandler(async (req: Request, res: Response) => {
  const { tags } = req.query;

  if (!tags) {
    res.status(400);
    throw new Error("Tags query is required");
  }

  const memories = await MemoryItem.find({
    tags: { $in: (tags as string).split(",") }
  });

  res.status(200).json({
    results: memories.length,
    data: memories
  });
});
