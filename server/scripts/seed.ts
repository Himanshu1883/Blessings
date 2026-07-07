import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import { connectDb, disconnectDb } from "../src/db/connect.js";
import { uploadToGridFs } from "../src/db/gridfs.js";
import { User } from "../src/models/User.js";
import { Category } from "../src/models/Category.js";
import { Product } from "../src/models/Product.js";
import { Media } from "../src/models/Media.js";
import { SEED_CATEGORIES, SEED_PRODUCTS } from "./seed-data.js";
import { env } from "../src/config/env.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = path.resolve(__dirname, "../src/assets");

async function uploadAsset(filename: string) {
  const filePath = path.join(ASSETS_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`Asset not found: ${filename}`);
    return null;
  }
  const buffer = fs.readFileSync(filePath);
  const mimeType = filename.endsWith(".png") ? "image/png" : "image/jpeg";
  const gridFsId = await uploadToGridFs(buffer, filename, mimeType, { seed: true });
  const media = await Media.create({
    gridFsId,
    filename,
    mimeType,
    size: buffer.length,
    alt: filename,
  });
  return gridFsId;
}

async function seed() {
  await connectDb();
  console.log("Connected to MongoDB");

  if (env.ADMIN_SEED_EMAIL && env.ADMIN_SEED_PASSWORD) {
    const existing = await User.findOne({ email: env.ADMIN_SEED_EMAIL });
    if (!existing) {
      const passwordHash = await bcrypt.hash(env.ADMIN_SEED_PASSWORD, 12);
      await User.create({
        name: env.ADMIN_SEED_NAME ?? "Admin",
        email: env.ADMIN_SEED_EMAIL,
        passwordHash,
        role: "admin",
        emailVerified: true,
      });
      console.log(`Admin user created: ${env.ADMIN_SEED_EMAIL}`);
    } else {
      console.log("Admin user already exists");
    }
  }

  const categoryMap = new Map<string, string>();

  for (const cat of SEED_CATEGORIES) {
    let imageId = undefined;
    if (cat.imageFile) {
      const id = await uploadAsset(cat.imageFile);
      if (id) imageId = id;
    }
    const existing = await Category.findOne({ slug: cat.slug });
    if (existing) {
      categoryMap.set(cat.slug, existing._id.toString());
      continue;
    }
    const created = await Category.create({
      slug: cat.slug,
      name: cat.name,
      tagline: cat.tagline,
      imageId,
      subCategories: cat.subCategories,
      sortOrder: cat.sortOrder,
      isActive: true,
    });
    categoryMap.set(cat.slug, created._id.toString());
    console.log(`Category: ${cat.name}`);
  }

  for (const p of SEED_PRODUCTS) {
    const existing = await Product.findOne({ slug: p.slug });
    if (existing) continue;

    const categoryId = categoryMap.get(p.categorySlug);
    if (!categoryId) {
      console.warn(`Category not found for ${p.slug}`);
      continue;
    }

    const imageIds = [];
    if (p.imageFile) {
      const id = await uploadAsset(p.imageFile);
      if (id) imageIds.push(id);
    }

    const stock = new Map<string, number>();
    for (const size of ["S", "M", "L", "XL"]) {
      stock.set(size, 10);
    }

    await Product.create({
      slug: p.slug,
      name: p.name,
      categoryId,
      fabric: p.fabric,
      price: p.price,
      description: p.description,
      sizes: ["S", "M", "L", "XL"],
      stock,
      imageIds,
      isNewProduct: p.isNew ?? false,
      bestSeller: p.bestSeller ?? false,
      isActive: true,
    });
    console.log(`Product: ${p.name}`);
  }

  console.log("Seed complete");
  await disconnectDb();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
