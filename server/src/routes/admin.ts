import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { uploadMedia } from "../services/mediaService.js";
import {
  listCategories,
  createCategory,
  updateCategory,
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../services/catalogService.js";
import {
  listOrders,
  getOrder,
  updateOrderStatus,
  getAdminStats,
} from "../services/orderService.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { requireAuth, requireAdmin, attachRefreshedCookie, type AuthRequest } from "../middleware/auth.js";
import { validateBody, validateParams } from "../middleware/validate.js";
import { paramId } from "../utils/params.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.use(requireAuth, attachRefreshedCookie, requireAdmin);

router.get("/stats", async (_req, res, next) => {
  try {
    const stats = await getAdminStats();
    sendSuccess(res, stats);
  } catch (e) {
    next(e);
  }
});

router.post("/media", upload.single("file"), async (req: AuthRequest, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });
    const media = await uploadMedia(req.file, req.userId, req.body.alt);
    sendSuccess(res, media, 201);
  } catch (e) {
    next(e);
  }
});

router.get("/categories", async (_req, res, next) => {
  try {
    const cats = await listCategories(false);
    sendSuccess(res, cats);
  } catch (e) {
    next(e);
  }
});

router.post(
  "/categories",
  validateBody(
    z.object({
      slug: z.string().min(2),
      name: z.string().min(2),
      tagline: z.string().optional(),
      imageId: z.string().optional(),
      subCategories: z.array(z.string()).optional(),
      sortOrder: z.number().optional(),
    }),
  ),
  async (req, res, next) => {
    try {
      const cat = await createCategory(req.body);
      sendSuccess(res, cat, 201);
    } catch (e) {
      next(e);
    }
  },
);

router.patch(
  "/categories/:id",
  validateParams(z.object({ id: z.string() })),
  validateBody(
    z.object({
      name: z.string().optional(),
      tagline: z.string().optional(),
      imageId: z.string().optional(),
      subCategories: z.array(z.string()).optional(),
      sortOrder: z.number().optional(),
      isActive: z.boolean().optional(),
    }),
  ),
  async (req, res, next) => {
    try {
      const cat = await updateCategory(paramId(req.params.id), req.body);
      sendSuccess(res, cat);
    } catch (e) {
      next(e);
    }
  },
);

router.get("/products", async (_req, res, next) => {
  try {
    const products = await listProducts({ activeOnly: false });
    sendSuccess(res, products);
  } catch (e) {
    next(e);
  }
});

router.post(
  "/products",
  validateBody(
    z.object({
      slug: z.string().min(2),
      name: z.string().min(2),
      categoryId: z.string(),
      fabric: z.string().optional(),
      price: z.number().min(0),
      description: z.string().optional(),
      sizes: z.array(z.string()).optional(),
      stock: z.record(z.number()).optional(),
      imageIds: z.array(z.string()).optional(),
      isNew: z.boolean().optional(),
      bestSeller: z.boolean().optional(),
    }),
  ),
  async (req, res, next) => {
    try {
      const product = await createProduct(req.body);
      sendSuccess(res, product, 201);
    } catch (e) {
      next(e);
    }
  },
);

router.patch(
  "/products/:id",
  validateParams(z.object({ id: z.string() })),
  validateBody(
    z.object({
      name: z.string().optional(),
      categoryId: z.string().optional(),
      fabric: z.string().optional(),
      price: z.number().optional(),
      description: z.string().optional(),
      sizes: z.array(z.string()).optional(),
      stock: z.record(z.number()).optional(),
      imageIds: z.array(z.string()).optional(),
      isNew: z.boolean().optional(),
      bestSeller: z.boolean().optional(),
      isActive: z.boolean().optional(),
    }),
  ),
  async (req, res, next) => {
    try {
      const product = await updateProduct(paramId(req.params.id), req.body);
      sendSuccess(res, product);
    } catch (e) {
      next(e);
    }
  },
);

router.delete(
  "/products/:id",
  validateParams(z.object({ id: z.string() })),
  async (req, res, next) => {
    try {
      await deleteProduct(paramId(req.params.id));
      sendSuccess(res, { deleted: true });
    } catch (e) {
      next(e);
    }
  },
);

router.get("/orders", async (_req, res, next) => {
  try {
    const orders = await listOrders("", true);
    sendSuccess(res, orders);
  } catch (e) {
    next(e);
  }
});

router.get(
  "/orders/:id",
  validateParams(z.object({ id: z.string() })),
  async (req: AuthRequest, res, next) => {
    try {
      const order = await getOrder(paramId(req.params.id), req.userId!, true);
      sendSuccess(res, order);
    } catch (e) {
      next(e);
    }
  },
);

router.patch(
  "/orders/:id/status",
  validateParams(z.object({ id: z.string() })),
  validateBody(
    z.object({
      status: z.enum(["placed", "confirmed", "processing", "shipped", "delivered", "cancelled"]),
      note: z.string().optional(),
    }),
  ),
  async (req, res, next) => {
    try {
      const order = await updateOrderStatus(paramId(req.params.id), req.body.status, req.body.note);
      sendSuccess(res, order);
    } catch (e) {
      next(e);
    }
  },
);

export default router;
