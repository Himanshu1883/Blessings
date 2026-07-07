import { Router } from "express";
import { handleRazorpayWebhook } from "../services/orderService.js";
import { sendSuccess } from "../utils/apiResponse.js";

const router = Router();

router.post("/razorpay", async (req, res, next) => {
  try {
    const signature = req.headers["x-razorpay-signature"] as string;
    const rawBody = (req as unknown as { rawBody?: Buffer }).rawBody;
    if (!rawBody || !signature) {
      return res.status(400).json({ success: false, message: "Invalid webhook" });
    }
    await handleRazorpayWebhook(rawBody, signature);
    sendSuccess(res, { received: true });
  } catch (e) {
    next(e);
  }
});

export default router;
