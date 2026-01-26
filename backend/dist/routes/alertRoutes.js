"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const alertController_1 = require("../controllers/alertController");
const router = express_1.default.Router();
// Create alert
router.post("/", alertController_1.createAlert);
// Get all alerts for a patient
router.get("/patient/:patientId", alertController_1.getPatientAlerts);
// Get / Update / Delete alert by id
router
    .route("/:id")
    .get(alertController_1.getAlertById)
    .put(alertController_1.acknowledgeAlert)
    .delete(alertController_1.deleteAlert);
exports.default = router;
