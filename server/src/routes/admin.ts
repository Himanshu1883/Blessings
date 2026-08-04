import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { uploadMedia } from "../services/mediaService.js";
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  patchProductStock,
  importProductsFromCsv,
} from "../services/catalogService.js";
import {
  listOrders,
  getOrder,
  updateOrderStatus,
  updateOrderAdmin,
  getDashboardMetrics,
} from "../services/orderService.js";
import { listCoupons, createCoupon, updateCoupon, deleteCoupon } from "../services/couponService.js";
import { listReturns, updateReturnStatus } from "../services/returnService.js";
import { listNotifications, createNotification } from "../services/notificationService.js";
import {
  getAllHomepageContent,
  getHomepageSection,
  setHomepageSection,
} from "../services/homepageService.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { requireAuth, requireAdmin, attachRefreshedCookie, type AuthRequest } from "../middleware/auth.js";
import { validateBody, validateParams } from "../middleware/validate.js";
import { paramId } from "../utils/params.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 30 * 1024 * 1024 } });

router.use(requireAuth, attachRefreshedCookie, requireAdmin);

const orderStatusEnum = z.enum([
  "placed",
  "confirmed",
  "processing",
  "shipped",
  "in_transit",
  "delivered",
  "cancel_requested",
  "cancelled",
  "returned",
]);

router.get("/stats", async (_req, res, next) => {
  try {
    const stats = await getDashboardMetrics();
    sendSuccess(res, stats);
  } catch (e) {
    next(e);
  }
});

router.get("/dashboard", async (_req, res, next) => {
  try {
    const stats = await getDashboardMetrics();
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
    sendSuccess(res, await listCategories(false));
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
      sendSuccess(res, await createCategory(req.body), 201);
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
      sendSuccess(res, await updateCategory(paramId(req.params.id), req.body));
    } catch (e) {
      next(e);
    }
  },
);

router.delete(
  "/categories/:id",
  validateParams(z.object({ id: z.string() })),
  async (req, res, next) => {
    try {
      await deleteCategory(paramId(req.params.id));
      sendSuccess(res, { deleted: true });
    } catch (e) {
      next(e);
    }
  },
);

router.get("/products", async (_req, res, next) => {
  try {
    sendSuccess(res, await listProducts({ activeOnly: false }));
  } catch (e) {
    next(e);
  }
});

router.post(
  "/products",
  validateBody(
    z.object({
      slug: z.string().min(2),
      sku: z.string().optional(),
      name: z.string().min(2),
      categoryId: z.string(),
      fabric: z.string().optional(),
      price: z.number().min(0),
      description: z.string().optional(),
      sizes: z.array(z.string()).optional(),
      colors: z.array(z.string()).optional(),
      showColorSelector: z.boolean().optional(),
      showSizeSelector: z.boolean().optional(),
      stock: z.record(z.number()).optional(),
      imageIds: z.array(z.string()).optional(),
      videoId: z.string().optional(),
      customFields: z.array(z.record(z.unknown())).optional(),
      isNew: z.boolean().optional(),
      bestSeller: z.boolean().optional(),
    }),
  ),
  async (req, res, next) => {
    try {
      sendSuccess(res, await createProduct(req.body), 201);
    } catch (e) {
      next(e);
    }
  },
);

router.post(
  "/products/import",
  validateBody(z.object({ rows: z.array(z.record(z.string())) })),
  async (req, res, next) => {
    try {
      sendSuccess(res, await importProductsFromCsv(req.body.rows));
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
      sku: z.string().optional(),
      categoryId: z.string().optional(),
      fabric: z.string().optional(),
      price: z.number().optional(),
      description: z.string().optional(),
      sizes: z.array(z.string()).optional(),
      colors: z.array(z.string()).optional(),
      showColorSelector: z.boolean().optional(),
      showSizeSelector: z.boolean().optional(),
      stock: z.record(z.number()).optional(),
      imageIds: z.array(z.string()).optional(),
      videoId: z.string().nullable().optional(),
      customFields: z.array(z.record(z.unknown())).optional(),
      isNew: z.boolean().optional(),
      bestSeller: z.boolean().optional(),
      isActive: z.boolean().optional(),
    }),
  ),
  async (req, res, next) => {
    try {
      sendSuccess(res, await updateProduct(paramId(req.params.id), req.body));
    } catch (e) {
      next(e);
    }
  },
);

router.patch(
  "/products/:id/stock",
  validateParams(z.object({ id: z.string() })),
  validateBody(z.object({ stock: z.record(z.number()) })),
  async (req, res, next) => {
    try {
      sendSuccess(res, await patchProductStock(paramId(req.params.id), req.body.stock));
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
    sendSuccess(res, await listOrders("", true));
  } catch (e) {
    next(e);
  }
});

router.get(
  "/orders/:id",
  validateParams(z.object({ id: z.string() })),
  async (req: AuthRequest, res, next) => {
    try {
      sendSuccess(res, await getOrder(paramId(req.params.id), req.userId!, true));
    } catch (e) {
      next(e);
    }
  },
);

router.patch(
  "/orders/:id/status",
  validateParams(z.object({ id: z.string() })),
  validateBody(z.object({ status: orderStatusEnum, note: z.string().optional() })),
  async (req, res, next) => {
    try {
      sendSuccess(res, await updateOrderStatus(paramId(req.params.id), req.body.status, req.body.note));
    } catch (e) {
      next(e);
    }
  },
);

router.patch(
  "/orders/:id",
  validateParams(z.object({ id: z.string() })),
  validateBody(
    z.object({
      orderStatus: orderStatusEnum.optional(),
      trackingNumber: z.string().optional(),
      note: z.string().optional(),
      cancelAction: z.enum(["approve", "reject"]).optional(),
    }),
  ),
  async (req, res, next) => {
    try {
      sendSuccess(res, await updateOrderAdmin(paramId(req.params.id), req.body));
    } catch (e) {
      next(e);
    }
  },
);

router.get("/coupons", async (_req, res, next) => {
  try {
    sendSuccess(res, await listCoupons());
  } catch (e) {
    next(e);
  }
});

router.post(
  "/coupons",
  validateBody(
    z.object({
      code: z.string().min(2),
      type: z.enum(["percent", "flat"]),
      value: z.number().min(0),
      minOrder: z.number().optional(),
      maxUses: z.number().optional(),
      expiresAt: z.string().nullable().optional(),
    }),
  ),
  async (req, res, next) => {
    try {
      sendSuccess(res, await createCoupon(req.body), 201);
    } catch (e) {
      next(e);
    }
  },
);

router.patch(
  "/coupons/:id",
  validateParams(z.object({ id: z.string() })),
  validateBody(
    z.object({
      type: z.enum(["percent", "flat"]).optional(),
      value: z.number().optional(),
      minOrder: z.number().optional(),
      maxUses: z.number().optional(),
      expiresAt: z.string().nullable().optional(),
      isActive: z.boolean().optional(),
    }),
  ),
  async (req, res, next) => {
    try {
      sendSuccess(res, await updateCoupon(paramId(req.params.id), req.body));
    } catch (e) {
      next(e);
    }
  },
);

router.delete(
  "/coupons/:id",
  validateParams(z.object({ id: z.string() })),
  async (req, res, next) => {
    try {
      await deleteCoupon(paramId(req.params.id));
      sendSuccess(res, { deleted: true });
    } catch (e) {
      next(e);
    }
  },
);

router.get("/returns", async (_req, res, next) => {
  try {
    sendSuccess(res, await listReturns());
  } catch (e) {
    next(e);
  }
});

router.patch(
  "/returns/:id",
  validateParams(z.object({ id: z.string() })),
  validateBody(
    z.object({
      status: z.enum([
        "pending",
        "approved",
        "pickup_scheduled",
        "picked_up",
        "received",
        "refund_initiated",
        "refunded",
        "rejected",
      ]),
      note: z.string().optional(),
    }),
  ),
  async (req, res, next) => {
    try {
      sendSuccess(res, await updateReturnStatus(paramId(req.params.id), req.body.status, req.body.note));
    } catch (e) {
      next(e);
    }
  },
);

router.get("/notifications", async (_req, res, next) => {
  try {
    sendSuccess(res, await listNotifications());
  } catch (e) {
    next(e);
  }
});

router.post(
  "/notifications",
  validateBody(
    z.object({
      title: z.string().min(1),
      message: z.string().min(1),
      channel: z.enum(["push", "email"]).optional(),
    }),
  ),
  async (req, res, next) => {
    try {
      sendSuccess(res, await createNotification(req.body), 201);
    } catch (e) {
      next(e);
    }
  },
);

router.get("/homepage", async (_req, res, next) => {
  try {
    sendSuccess(res, await getAllHomepageContent());
  } catch (e) {
    next(e);
  }
});

router.get(
  "/homepage/:section",
  validateParams(z.object({ section: z.string() })),
  async (req, res, next) => {
    try {
      sendSuccess(res, await getHomepageSection(String(req.params.section)));
    } catch (e) {
      next(e);
    }
  },
);

router.patch(
  "/homepage/:section",
  validateParams(z.object({ section: z.string() })),
  validateBody(z.object({ data: z.record(z.unknown()) })),
  async (req, res, next) => {
    try {
      sendSuccess(res, await setHomepageSection(String(req.params.section), req.body.data));
    } catch (e) {
      next(e);
    }
  },
);

export default router;
