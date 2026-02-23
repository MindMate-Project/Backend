import { Router } from "express";
import { protect } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/authorize.middleware";
import {
    getAllPatients,
    getPatientInfo,
    assignPatientToCaregiver,
    removePatientFromCaregiver,
    updatePatientInfo
} from "../controllers/caregiver.controller";
import {
    getUserInfo,
    updateUserInfo
} from "../controllers/user.controller";

const router = Router();

router.get(
    '/',
    protect,
    authorize('caregiver'),
    getUserInfo
);

router.patch(
    '/update',
    protect,
    authorize('caregiver'),
    updateUserInfo
)

router.get(
    '/patients',
    protect,
    authorize('caregiver'),
    getAllPatients
);

router.get(
    '/patients/:patientId',
    protect,
    authorize('caregiver'),
    getPatientInfo
);

router.post(
    '/patients/assignment-request',
    protect,
    authorize('caregiver'),
    assignPatientToCaregiver
);


router.delete(
    '/patients/remove/:patientId',
    protect,
    authorize('caregiver'),
    removePatientFromCaregiver
);

router.patch(
    '/patients/update/:patientId',
    protect,
    authorize('caregiver'),
    updatePatientInfo
);

export default router;