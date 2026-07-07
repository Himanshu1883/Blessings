import { Router } from "express";
import { z } from "zod";
import {
  listCategories,
  getCategoryBySlug,
  listProducts,
  getProductBySlug,
  searchProducts,
} from "../services/catalogService.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { validateQuery, validateParams } from "../middleware/validate.js";
import { paramId } from "../utils/params.js";

const router = Router();

const productQuerySchema = z.object({
  category: z.string().optional(),
  sort: z.enum(["new", "price-asc", "price-desc"]).optional(),
  q: z.string().optional(),
});

router.get("/categories", async (_req, res, next) => {
  try {
    const cats = await listCategories(true);
    sendSuccess(res, cats);
  } catch (e) {
    next(e);
  }
});

router.get(
  "/categories/:slug",
  validateParams(z.object({ slug: z.string() })),
  async (req, res, next) => {
    try {
      const cat = await getCategoryBySlug(paramId(req.params.slug));
      sendSuccess(res, cat);
    } catch (e) {
      next(e);
    }
  },
);

router.get("/products", validateQuery(productQuerySchema), async (req, res, next) => {
  try {
    const products = await listProducts(req.query as z.infer<typeof productQuerySchema>);
    sendSuccess(res, products);
  } catch (e) {
    next(e);
  }
});

router.get(
  "/products/search",
  validateQuery(z.object({ q: z.string().min(1) })),
  async (req, res, next) => {
    try {
      const products = await searchProducts(req.query.q as string);
      sendSuccess(res, products);
    } catch (e) {
      next(e);
    }
  },
);

router.get(
  "/products/:slug",
  validateParams(z.object({ slug: z.string() })),
  async (req, res, next) => {
    try {
      const product = await getProductBySlug(paramId(req.params.slug));
      sendSuccess(res, product);
    } catch (e) {
      next(e);
    }
  },
);

export default router;
