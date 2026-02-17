import { Router } from "express";
import { protect } from "../middlewares/authMiddleware";
import { authorize } from "../middlewares/authorize";
import {
    getAllPatients,
    assignPatientToCaregiver,
    removePatientFromCaregiver
} from "../controllers/caregiverController";

const router = Router();

router.get(
    '/',
    protect,
    authorize('caregiver'),
    getAllPatients
);

router.post(
    '/assign-patient',
    protect,
    authorize('caregiver'),
    assignPatientToCaregiver
);

router.delete(
    '/remove-patient',
    protect,
    authorize('caregiver'),
    removePatientFromCaregiver
);

export default router;