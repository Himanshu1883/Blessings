import { Router } from "express";
import { z } from "zod";
import { hydrateCartLines, listActivePublicCoupons, quoteCoupon } from "../services/couponService.js";
import { getCart } from "../services/cartService.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { validateBody } from "../middleware/validate.js";
import { optionalAuth, type AuthRequest } from "../middleware/auth.js";

const router = Router();

router.get("/coupons/active", async (_req, res, next) => {
  try {
    sendSuccess(res, await listActivePublicCoupons());
  } catch (e) {
    next(e);
  }
});

router.post(
  "/coupons/quote",
  optionalAuth,
  validateBody(
    z.object({
      code: z.string().optional(),
      skipAuto: z.boolean().optional(),
      items: z
        .array(
          z.object({
            productId: z.string(),
            quantity: z.number().int().min(1),
          }),
        )
        .optional(),
    }),
  ),
  async (req: AuthRequest, res, next) => {
    try {
      let lines = req.body.items?.length ? await hydrateCartLines(req.body.items) : [];
      if (!lines.length && req.userId) {
        const cart = await getCart(req.userId);
        lines = cart.lines.flatMap((row) =>
          row
            ? [
                {
                  productId: row.line.productId,
                  categoryId: row.product.categoryId,
                  categorySlug: row.product.categorySlug ?? undefined,
                  price: row.product.price,
                  quantity: row.line.quantity,
                },
              ]
            : [],
        );
      }
      sendSuccess(
        res,
        await quoteCoupon(lines, {
          code: req.body.code,
          userId: req.userId,
          skipAuto: req.body.skipAuto,
        }),
      );
    } catch (e) {
      next(e);
    }
  },
);

export default router;
