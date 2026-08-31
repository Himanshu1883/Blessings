import { Router } from "express";
import { sendSuccess } from "../utils/apiResponse.js";
import { requireAuth, attachRefreshedCookie, type AuthRequest } from "../middleware/auth.js";
import {
  listUserNotifications,
  markAllNotificationsRead,
} from "../services/userNotificationService.js";

const router = Router();
router.use(requireAuth, attachRefreshedCookie);

router.get("/notifications", async (req: AuthRequest, res, next) => {
  try {
    sendSuccess(res, await listUserNotifications(req.userId!));
  } catch (e) {
    next(e);
  }
});

router.patch("/notifications/read-all", async (req: AuthRequest, res, next) => {
  try {
    sendSuccess(res, await markAllNotificationsRead(req.userId!));
  } catch (e) {
    next(e);
  }
});

export default router;
