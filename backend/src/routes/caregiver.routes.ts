import { Router } from "express";
import { protect } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/authorize.middleware";
import {
    getAllPatients,
    assignPatientToCaregiver,
    removePatientFromCaregiver
} from "../controllers/caregiver.controller";

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