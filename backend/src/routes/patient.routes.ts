import { Router } from "express";
import { protect } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/authorize.middleware";
import {
    getAllCaregivers,
    getCaregiverInfo,
    getPendingCaregiverRequests,
    respondToCaregiverRequest,
    removeCaregiverFromPatient
} from "../controllers/patient.controller";
import {
    getUserInfo,
    updateUserInfo
} from "../controllers/user.controller";

const router = Router();

router.get(
    '/',
    protect,
    authorize('patient'),
    getUserInfo
);

router.patch(
    '/update',
    protect,
    authorize('patient'),
    updateUserInfo
)

router.get(
    '/caregivers',
    protect,
    authorize('patient'),
    getAllCaregivers
);

router.get(
    '/caregivers/:caregiverId',
    protect,
    authorize('patient'),
    getCaregiverInfo
);

router.get(
    '/assignment-requests',
    protect,
    authorize('patient'),
    getPendingCaregiverRequests
);

router.post(
    '/assignment-requests/respond/:caregiverId',
    protect,
    authorize('patient'),
    respondToCaregiverRequest
);

router.delete(
    '/caregivers/remove/:caregiverId',
    protect,
    authorize('patient'),
    removeCaregiverFromPatient
)

export default router;