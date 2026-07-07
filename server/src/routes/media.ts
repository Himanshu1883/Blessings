import { Router } from "express";
import { streamMedia } from "../services/mediaService.js";
import { AppError } from "../utils/apiResponse.js";
import { paramId } from "../utils/params.js";

const router = Router();

router.get("/:fileId", async (req, res, next) => {
  try {
    const stream = streamMedia(paramId(req.params.fileId));
    stream.on("error", () => next(new AppError(404, "Media not found")));
    stream.on("file", (file: { metadata?: { contentType?: string }; contentType?: string }) => {
      const type = file.metadata?.contentType ?? file.contentType ?? "application/octet-stream";
      res.set("Content-Type", type);
      res.set("Cache-Control", "public, max-age=31536000, immutable");
    });
    stream.pipe(res);
  } catch (e) {
    next(e);
  }
});

export default router;
