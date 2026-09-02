import { Router } from "express";
import { z } from "zod";
import {
  createOrder,
  createRazorpayOrder,
  verifyRazorpayPayment,
  listOrders,
  getOrder,
  cancelOrder,
} from "../services/orderService.js";
import { requestReturn } from "../services/returnService.js";
import { getInvoicePdf } from "../services/invoiceService.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { validateBody, validateParams } from "../middleware/validate.js";
import { requireAuth, attachRefreshedCookie, type AuthRequest } from "../middleware/auth.js";
import { paramId } from "../utils/params.js";

const router = Router();

router.use(requireAuth, attachRefreshedCookie);

const addressSchema = z.object({
  name: z.string().min(2),
  line1: z.string().min(3),
  city: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().min(4),
  phone: z.string().min(10),
  isDefault: z.boolean().optional(),
});

const createOrderSchema = z.object({
  shippingAddress: addressSchema,
  paymentMethod: z.enum(["razorpay", "cod"]),
  couponCode: z.string().nullable().optional(),
  skipCoupon: z.boolean().optional(),
});

router.get("/", async (req: AuthRequest, res, next) => {
  try {
    const orders = await listOrders(req.userId!);
    sendSuccess(res, orders);
  } catch (e) {
    next(e);
  }
});

router.get(
  "/:id/invoice.pdf",
  validateParams(z.object({ id: z.string() })),
  async (req: AuthRequest, res, next) => {
    try {
      const invoice = await getInvoicePdf(paramId(req.params.id), req.userId!, req.userRole === "admin");
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Length", invoice.pdf.length.toString());
      res.setHeader("Content-Disposition", `attachment; filename="${invoice.filename}"`);
      res.setHeader("Cache-Control", "private, no-store");
      res.send(invoice.pdf);
    } catch (e) {
      next(e);
    }
  },
);

router.get(
  "/:id",
  validateParams(z.object({ id: z.string() })),
  async (req: AuthRequest, res, next) => {
    try {
      const order = await getOrder(paramId(req.params.id), req.userId!);
      sendSuccess(res, order);
    } catch (e) {
      next(e);
    }
  },
);

router.post("/", validateBody(createOrderSchema), async (req: AuthRequest, res, next) => {
  try {
    const order = await createOrder(req.userId!, req.body);
    sendSuccess(res, order, 201);
  } catch (e) {
    next(e);
  }
});

router.post(
  "/:id/razorpay",
  validateParams(z.object({ id: z.string() })),
  async (req: AuthRequest, res, next) => {
    try {
      const result = await createRazorpayOrder(paramId(req.params.id), req.userId!);
      sendSuccess(res, result);
    } catch (e) {
      next(e);
    }
  },
);

router.post(
  "/:id/verify",
  validateParams(z.object({ id: z.string() })),
  validateBody(
    z.object({
      razorpayOrderId: z.string(),
      razorpayPaymentId: z.string(),
      razorpaySignature: z.string(),
    }),
  ),
  async (req: AuthRequest, res, next) => {
    try {
      const order = await verifyRazorpayPayment(paramId(req.params.id), req.userId!, req.body);
      sendSuccess(res, order);
    } catch (e) {
      next(e);
  }
  },
);

router.post(
  "/:id/cancel",
  validateParams(z.object({ id: z.string() })),
  validateBody(
    z.object({
      reason: z.enum([
        "changed_mind",
        "ordered_by_mistake",
        "delivery_too_slow",
        "found_better_price",
        "other",
      ]),
      note: z.string().max(400).optional(),
    }),
  ),
  async (req: AuthRequest, res, next) => {
    try {
      const order = await cancelOrder(paramId(req.params.id), req.userId!, req.body);
      sendSuccess(res, order);
    } catch (e) {
      next(e);
    }
  },
);

router.post(
  "/:id/return",
  validateParams(z.object({ id: z.string() })),
  validateBody(
    z.object({
      reason: z.enum([
        "size_fit",
        "damaged",
        "wrong_item",
        "quality",
        "changed_mind",
        "other",
      ]),
      note: z.string().max(400).optional(),
    }),
  ),
  async (req: AuthRequest, res, next) => {
    try {
      const ret = await requestReturn(paramId(req.params.id), req.userId!, req.body);
      sendSuccess(res, ret, 201);
    } catch (e) {
      next(e);
    }
  },
);

export default router;
