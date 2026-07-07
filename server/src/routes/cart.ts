import { Router } from "express";
import { z } from "zod";
import {
  getCart,
  addToCart,
  updateCartLine,
  removeFromCart,
  clearCart,
} from "../services/cartService.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { validateBody } from "../middleware/validate.js";
import { requireAuth, attachRefreshedCookie, type AuthRequest } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth, attachRefreshedCookie);

const addSchema = z.object({
  productId: z.string().min(1),
  size: z.string().min(1),
  quantity: z.number().int().min(1).optional(),
});

const updateSchema = z.object({
  productId: z.string().min(1),
  size: z.string().min(1),
  quantity: z.number().int().min(0),
});

router.get("/", async (req: AuthRequest, res, next) => {
  try {
    const cart = await getCart(req.userId!);
    sendSuccess(res, cart);
  } catch (e) {
    next(e);
  }
});

router.post("/items", validateBody(addSchema), async (req: AuthRequest, res, next) => {
  try {
    const { productId, size, quantity } = req.body;
    const cart = await addToCart(req.userId!, productId, size, quantity ?? 1);
    sendSuccess(res, cart, 201);
  } catch (e) {
    next(e);
  }
});

router.patch("/items", validateBody(updateSchema), async (req: AuthRequest, res, next) => {
  try {
    const { productId, size, quantity } = req.body;
    const cart = await updateCartLine(req.userId!, productId, size, quantity);
    sendSuccess(res, cart);
  } catch (e) {
    next(e);
  }
});

router.delete(
  "/items",
  validateBody(z.object({ productId: z.string(), size: z.string() })),
  async (req: AuthRequest, res, next) => {
    try {
      const cart = await removeFromCart(req.userId!, req.body.productId, req.body.size);
      sendSuccess(res, cart);
    } catch (e) {
      next(e);
    }
  },
);

router.delete("/", async (req: AuthRequest, res, next) => {
  try {
    const cart = await clearCart(req.userId!);
    sendSuccess(res, cart);
  } catch (e) {
    next(e);
  }
});

export default router;
