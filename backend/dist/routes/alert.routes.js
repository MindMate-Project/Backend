"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const alert_controller_1 = require("../controllers/alert.controller");
const router = express_1.default.Router();
// Create alert
router.post("/", alert_controller_1.createAlert);
// Get all alerts for a patient
router.get("/patient/:patientId", alert_controller_1.getPatientAlerts);
// Get / Update / Delete alert by id
router
    .route("/:id")
    .get(alert_controller_1.getAlertById)
    .put(alert_controller_1.acknowledgeAlert)
    .delete(alert_controller_1.deleteAlert);
exports.default = router;
