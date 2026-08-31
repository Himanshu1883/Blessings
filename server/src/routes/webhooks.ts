import type { Request, Response, NextFunction } from "express";
import { handleRazorpayWebhook } from "../services/orderService.js";
import { sendSuccess } from "../utils/apiResponse.js";

export async function razorpayWebhookHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
    if (!Buffer.isBuffer(rawBody) || typeof signature !== "string" || !signature) {
      res.status(400).json({ success: false, message: "Invalid webhook" });
      return;
    }
    await handleRazorpayWebhook(rawBody, signature);
    sendSuccess(res, { received: true });
  } catch (e) {
    next(e);
  }
}
