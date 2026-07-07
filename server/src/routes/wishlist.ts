import { Router } from "express";
import { z } from "zod";
import { getWishlist, addToWishlist, removeFromWishlist } from "../services/wishlistService.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { requireAuth, attachRefreshedCookie, type AuthRequest } from "../middleware/auth.js";
import { validateParams } from "../middleware/validate.js";
import { paramId } from "../utils/params.js";

const router = Router();

router.use(requireAuth, attachRefreshedCookie);

router.get("/", async (req: AuthRequest, res, next) => {
  try {
    const items = await getWishlist(req.userId!);
    sendSuccess(res, items);
  } catch (e) {
    next(e);
  }
});

router.post(
  "/:productId",
  validateParams(z.object({ productId: z.string() })),
  async (req: AuthRequest, res, next) => {
    try {
      const items = await addToWishlist(req.userId!, paramId(req.params.productId));
      sendSuccess(res, items, 201);
    } catch (e) {
      next(e);
    }
  },
);

router.delete(
  "/:productId",
  validateParams(z.object({ productId: z.string() })),
  async (req: AuthRequest, res, next) => {
    try {
      const items = await removeFromWishlist(req.userId!, paramId(req.params.productId));
      sendSuccess(res, items);
    } catch (e) {
      next(e);
    }
  },
);

export default router;
