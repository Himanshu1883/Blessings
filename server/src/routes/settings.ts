import { Router } from "express";
import { getStoreSettings } from "../services/settingsService.js";
import { sendSuccess } from "../utils/apiResponse.js";

const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    sendSuccess(res, await getStoreSettings());
  } catch (e) {
    next(e);
  }
});

export default router;
