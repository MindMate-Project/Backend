import { Router } from "express";
import { authorize } from "../middlewares/authorize.middleware";
import { protect } from "../middlewares/auth.middleware";
import { deviceLocation, assignDevice } from "../controllers/device.controller";

const router = Router();

router.get(
    '/location/:deviceId',
    protect,
    authorize('caregiver'),
    deviceLocation
);

router.post(
    '/assign-device',
    protect,
    authorize('caregiver'),
    assignDevice
);

export default router;