import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";
import path from "path";
const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "MindMate API",
      version: "1.0.0",
      description:
        "REST API for MindMate — Alzheimer's patient care. Auth, profiles, " +
        "reminders, memories, alerts, device location, and face recognition.",
    },
    servers: [
      {
        url: "https://alzaheimer-backend.onrender.com",
        description: "Production",
      },
      {
        url: "http://localhost:4000",
        description: "Local development",
      },
    ],
    tags: [
      { name: "Auth", description: "Registration, login, email verification, password reset" },
      { name: "Users", description: "Shared account actions (profile picture)" },
      { name: "Patient", description: "Patient profile and caregiver links" },
      { name: "Caregiver", description: "Caregiver profile and patient assignments" },
      { name: "Reminders", description: "Appointment & medication reminders" },
      { name: "Memories", description: "Memory Bank items (photo/video/text)" },
      { name: "Alerts", description: "Patient alerts and acknowledgement" },
      { name: "Device", description: "IoT device location, assignment & safe-zone geofencing" },
      { name: "Face", description: "Face registration and identification" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            status: { type: "string", example: "fail" },
            message: { type: "string", example: "Something went wrong" },
          },
        },
        AuthResponse: {
          type: "object",
          properties: {
            message: { type: "string", example: "Login successful" },
            token: { type: "string", description: "JWT bearer token" },
            data: {
              type: "object",
              properties: {
                _id: { type: "string" },
                name: { type: "string" },
                email: { type: "string" },
                role: {
                  type: "string",
                  enum: ["user", "patient", "caregiver", "admin"],
                },
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
apis: [
    path.resolve(__dirname, "../routes/*.ts"),
    path.resolve(__dirname, "../routes/*.js"),
  ],};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Express) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  
  app.get("/swagger.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });
};