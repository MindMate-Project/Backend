# MindMate Backend - Alzheimer's Care API

![License](https://img.shields.io/badge/license-ISC-blue)
![Version](https://img.shields.io/badge/version-1.0.0-green)

**REST API for Alzheimer's patient care** with AI-powered face recognition, real-time location tracking, reminders, memory preservation, alerts, and IoT integration.

## 📋 Quick Links

[Overview](#-project-overview)  | [Features](#-features) | [Tech Stack](#-tech-stack) | [Setup](#-prerequisites--setup-locally) | [API](#-api-endpoints) | [Structure](#-project-structure) | [Models](#-database-models) | [Services](#-services) | [License](#-license)

---

## 🎯 Project Overview

MindMate Backend is a REST API for Alzheimer's care that connects patients, caregivers, and family members in one coordinated platform. It combines memory support, health reminders, safety monitoring, and real-time communication.

- Memory support: save photos, videos, and stories with tags and metadata.
- Health adherence: automate medication and appointment reminders.
- Patient safety: track real-time location and trigger alerts.
- Care coordination: enable role-based collaboration across users.
- Secure operations: protect data with authentication, validation, and controlled access.

---

## ✨ Features

| Area                            | Capabilities                                                                                                  |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **🔐 Auth**               | Registration, email verification, JWT login, password reset, role-based access (user/patient/caregiver/admin) |
| **👥 Users**              | Multi-role profiles, profile pictures (Cloudinary), FCM tokens, caregiver assignments                         |
| **💾 Memory**             | Photos, videos, text with metadata, tagging, date tracking, relations, Cloudinary storage                     |
| **⏰ Reminders**          | Appointment & medication reminders, automated cron jobs, push/email/SMS notifications                         |
| **🚨 Alerts**             | Real-time alerts, acknowledgment tracking, multi-channel notifications (push/email/SMS)                       |
| **📍 Location**           | Real-time tracking via Socket.io, MQTT integration, history tracking                                          |
| **🔧 IoT**                | MQTT device connection, location aggregation, device management                                               |
| **🎭 Face Recognition**   | Facial capture & recognition API integration for patient identification                                       |
| **📤 File Upload**        | Cloudinary integration with validation & error handling                                                       |
| **📧 Email**              | Nodemailer & Brevo integration, templates, verification & password reset emails                               |
| **📱 Push Notifications** | Firebase FCM, multi-device support, real-time notifications                                                   |
| **📊 API Docs**           | Swagger UI with interactive testing                                                                           |
| **🛡️ Security**         | bcryptjs hashing, input validation, CORS, request logging, error handling                                     |

---

## 🚀 Tech Stack

- **Backend:** Express.js (v5.1.0) | Node.js | TypeScript (v5.9.3)
- **Database:** MongoDB | Mongoose (v8.19.2)
- **Real-Time:** Socket.io (v4.8.3) | MQTT (v5.15.0)
- **Auth:** JWT | bcryptjs | validator.js
- **File Storage:** Cloudinary | Multer
- **Notifications:** Firebase Admin (v13.7.0) | Nodemailer | Brevo
- **Scheduling:** node-cron
- **Docs:** Swagger | Swagger UI
- **Dev Tools:** Nodemon | ts-node | Axios

---

## 📋 Prerequisites & Setup locally

**Requirements:** Node.js v18+ | npm v9+ | MongoDB | Git

### Installation

```bash
git clone https://github.com/yourusername/MindMate.git
cd MindMate/Backend
npm install
cp .env.example .env
```

### Run

```bash
npm run dev      # Development with hot-reload
npm run build    # Compile TypeScript
npm start        # Production
```

---

## 📚 API Endpoints

Access the full API documentation at: [https://alzaheimer-backend.onrender.com/api-docs/](https://alzaheimer-backend.onrender.com/api-docs/)

---

## 📂 Project Structure

```
src/
├── server.ts                 # Main Express server
├── config/
│   ├── cloudinary.ts        # Cloudinary setup
│   ├── db.ts                # MongoDB connection
│   └── swagger.ts           # Swagger config
├── controllers/             # Route handlers
├── routes/                  # API route definitions
├── models/                  # Mongoose schemas
│   ├── Alert.ts
│   ├── MemoryItem.ts
│   ├── Reminder.ts
│   └── User.ts
├── middlewares/             # Express middlewares
│   ├── auth.middleware.ts
│   ├── authorize.middleware.ts
│   ├── error.middleware.ts
│   └── upload*.middleware.ts
├── services/                # Business logic
│   ├── firebase.service.ts   # Push notifications
│   ├── IoT.service.ts        # MQTT & location
│   └── socket.service.ts     # WebSocket
├── jops/
│   └── reminderCron.ts       # Scheduled reminders
├── utils/
│   ├── axiosRetry.ts
│   ├── generateToken.ts
│   └── sendEmail.ts
└── types/
    └── express/index.d.ts
```

---

## 💾 Database Models

| Model                 | Purpose                                                           |
| --------------------- | ----------------------------------------------------------------- |
| **User**        | Base user (name, email, password, roles, FCM tokens, profile pic) |
| **Patient**     | Extends User - medical info, emergency contact, conditions        |
| **Caregiver**   | Extends User - assigned patients, credentials, availability       |
| **Memory Item** | Patient memories (type, title, caption, media, tags, metadata)    |
| **Reminder**    | Base reminder with types: appointment, medication                 |
| **Alert**       | Patient alerts with acknowledgment & timestamps                   |

---

## 🔧 Services

| Service                    | Purpose                                                             |
| -------------------------- | ------------------------------------------------------------------- |
| **Firebase Service** | Push notifications, FCM token management                            |
| **IoT Service**      | MQTT connection, device location processing, Socket.io broadcasting |
| **Socket Service**   | Real-time WebSocket communication                                   |
| **Email Service**    | Email sending via Nodemailer/Brevo                                  |
| **Token Generation** | JWT creation & management                                           |
| **Axios Retry**      | Auto-retry for API calls with backoff                               |

---

## 📄 License

ISC License - see LICENSE file

**Last Updated:** April 2026 | **Version:** 1.0.0 | **Status:** Active Development
