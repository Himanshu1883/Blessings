import { Router } from "express";
import { z } from "zod";
import {
  createOrder,
  createRazorpayOrder,
  verifyRazorpayPayment,
  listOrders,
  getOrder,
} from "../services/orderService.js";
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

export default router;
