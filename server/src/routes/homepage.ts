import { Router } from "express";
import { getAllHomepageContent } from "../services/homepageService.js";
import { sendSuccess } from "../utils/apiResponse.js";

const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    sendSuccess(res, await getAllHomepageContent());
  } catch (e) {
    next(e);
  }
});

export default router;
