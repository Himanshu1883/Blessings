/**
 * Seed catalog products from public/new_data image looks.
 * Groups files by collection + look number; extra (n) shots become gallery images.
 * Keeps existing categories/products; upserts these looks only.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { Types } from "mongoose";
import sharp from "sharp";
import { connectDb, disconnectDb } from "../src/db/connect.js";
import { uploadToGridFs } from "../src/db/gridfs.js";
import { Category } from "../src/models/Category.js";
import { Product } from "../src/models/Product.js";
import { Media } from "../src/models/Media.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const NEW_DATA_DIR = path.resolve(__dirname, "../../public/new_data");

const FILE_RE =
  /^(Bandhgala|Indo-western|Sherwani|Shirts)(?:-(\d*))?(?: \((\d+)\))?\.(jpe?g|heic|heif)$/i;

type CollectionKey = "bandhgala" | "indo-western" | "sherwani" | "shirts";

const COLLECTION_META: Record<
  CollectionKey,
  {
    slug: string;
    name: string;
    tagline: string;
    subCategories: string[];
    sortOrder: number;
  }
> = {
  bandhgala: {
    slug: "bandhgalas",
    name: "Bandhgala",
    tagline: "Structured tailoring, mandarin collars, evening sovereignty.",
    subCategories: ["Classic Black", "Ivory Formal", "Prince Coats", "Nehru Jackets"],
    sortOrder: 2,
  },
  "indo-western": {
    slug: "indo-western",
    name: "Indo Western",
    tagline: "Draped kurtas, layered jackets, contemporary silhouettes.",
    subCategories: ["Draped Kurtas", "Asymmetric Sets", "Jacket Kurtas", "Statement Prints"],
    sortOrder: 3,
  },
  sherwani: {
    slug: "sherwanis",
    name: "Sherwani",
    tagline: "Handcrafted heirloom silhouettes for the modern groom.",
    subCategories: ["Silk & Zardosi", "Velvet Heritage", "Pastel Groom", "Ivory Classic"],
    sortOrder: 1,
  },
  shirts: {
    slug: "shirts",
    name: "Shirts",
    tagline: "Statement shirts — print, embroidery, and atelier cotton.",
    subCategories: ["Printed", "Embroidered", "Resort", "Formal"],
    sortOrder: 4,
  },
};

type LookInfo = {
  slug: string;
  name: string;
  fabric: string;
  price: number;
  description: string;
  isNew?: boolean;
  bestSeller?: boolean;
};

const LOOKS: Record<CollectionKey, Record<string, LookInfo>> = {
  bandhgala: {
    "1": {
      slug: "bandhgala-edit-1",
      name: "The Midnight Bandhgala",
      fabric: "Black silk blend",
      price: 98000,
      description:
        "A sculpted black bandhgala with a clean mandarin collar and a slim Delhi cut. Evening-ready, unapologetic.",
      bestSeller: true,
      isNew: true,
    },
    "2": {
      slug: "bandhgala-edit-2",
      name: "The Ivory Crest Bandhgala",
      fabric: "Ivory raw silk",
      price: 108000,
      description:
        "Ivory bandhgala with a structured shoulder and refined collar embroidery. Reception and cocktail.",
      isNew: true,
    },
    "3": {
      slug: "bandhgala-edit-3",
      name: "The Heritage Gold Bandhgala",
      fabric: "Silk with gold thread",
      price: 128000,
      description:
        "Heritage bandhgala in a rich ground with gold-thread detail at the collar and placket.",
      bestSeller: true,
    },
    "4": {
      slug: "bandhgala-edit-4",
      name: "The Onyx Bandhgala",
      fabric: "Onyx wool-silk",
      price: 96000,
      description: "Jet-black bandhgala, antique buttons, a quiet statement for black-tie evenings.",
    },
    "5": {
      slug: "bandhgala-edit-5",
      name: "The Ruby Bandhgala",
      fabric: "Maroon silk velvet",
      price: 118000,
      description: "Deep ruby/maroon bandhgala with a princely collar and a tailored waist.",
    },
    "6": {
      slug: "bandhgala-edit-6",
      name: "The Emerald Bandhgala",
      fabric: "Emerald silk",
      price: 122000,
      description: "Jewel-tone bandhgala cut for presence — dinner, sangeet, after-party.",
    },
    "7": {
      slug: "bandhgala-edit-7",
      name: "The Sandstone Bandhgala",
      fabric: "Warm beige silk",
      price: 92000,
      description: "A lighter bandhgala in sandstone tones for daytime ceremonies and mehendi.",
    },
    "8": {
      slug: "bandhgala-edit-8",
      name: "The Imperial Bandhgala",
      fabric: "Brocade silk",
      price: 145000,
      description: "Imperial bandhgala with a fuller gallery of looks — the collection’s statement coat.",
      bestSeller: true,
      isNew: true,
    },
  },
  "indo-western": {
    "0": {
      slug: "indo-western-edit-atelier",
      name: "The Atelier Indo-Western",
      fabric: "Cotton silk",
      price: 62000,
      description: "The opening Indo-Western look — layered, contemporary, cut for movement.",
      isNew: true,
      bestSeller: true,
    },
    "1": {
      slug: "indo-western-edit-1",
      name: "Indo-Western Edit I",
      fabric: "Printed silk",
      price: 58000,
      description: "A statement Indo-Western set with Blessings print language and a modern drape.",
      isNew: true,
    },
    "2": {
      slug: "indo-western-edit-2",
      name: "Indo-Western Edit II",
      fabric: "Silk blend",
      price: 64000,
      description: "Bold Indo-Western tailoring — jacket over kurta, built for the man who dresses like he means it.",
    },
    "3": {
      slug: "indo-western-edit-3",
      name: "Indo-Western Edit III",
      fabric: "Hand-painted silk",
      price: 72000,
      description: "Hand-painted Indo-Western silhouette. Nature-inspired artistry, contemporary cut.",
      bestSeller: true,
    },
    "4": {
      slug: "indo-western-edit-4",
      name: "Indo-Western Edit IV",
      fabric: "Silk crepe",
      price: 56000,
      description: "Clean Indo-Western layers with a sharp jacket line and easy trousers.",
    },
    "5": {
      slug: "indo-western-edit-5",
      name: "Indo-Western Edit V",
      fabric: "Printed cotton silk",
      price: 54000,
      description: "A wild-motif Indo-Western edit — less noise, more presence.",
    },
    "6": {
      slug: "indo-western-edit-6",
      name: "Indo-Western Edit VI",
      fabric: "Linen silk",
      price: 52000,
      description: "Resort-weight Indo-Western set for travel, cocktail, and warm-weather ceremonies.",
    },
    "7": {
      slug: "indo-western-edit-7",
      name: "Indo-Western Edit VII",
      fabric: "Silk twill",
      price: 68000,
      description: "Structured Indo-Western with a stronger shoulder and a graphic Blessings print.",
    },
    "8": {
      slug: "indo-western-edit-8",
      name: "Indo-Western Edit VIII",
      fabric: "Velvet and silk",
      price: 78000,
      description: "Evening Indo-Western — richer cloth, deeper colour, more gallery angles.",
      bestSeller: true,
    },
    "9": {
      slug: "indo-western-edit-9",
      name: "Indo-Western Edit IX",
      fabric: "Embroidered silk",
      price: 74000,
      description: "Embroidered Indo-Western kurta set with a contemporary jacket overlay.",
    },
    "11": {
      slug: "indo-western-edit-11",
      name: "Indo-Western Edit XI",
      fabric: "Statement silk",
      price: 82000,
      description: "Extended lookbook Indo-Western — nine studio frames of a single statement set.",
      isNew: true,
      bestSeller: true,
    },
    "13": {
      slug: "indo-western-edit-13",
      name: "Indo-Western Edit XIII",
      fabric: "Printed silk",
      price: 76000,
      description: "A full lookbook Indo-Western edit with eight angles of the same silhouette.",
    },
    "15": {
      slug: "indo-western-edit-15",
      name: "Indo-Western Edit XV",
      fabric: "Premium silk",
      price: 88000,
      description: "The deepest Indo-Western gallery — nine frames, one complete Blessings look.",
      isNew: true,
    },
  },
  sherwani: {
    "1": {
      slug: "sherwani-edit-1",
      name: "The Heirloom Sherwani",
      fabric: "Silk and zardosi",
      price: 165000,
      description:
        "A groom’s sherwani in the Blessings atelier cut — heirloom embroidery, slim silhouette, ceremony-ready.",
      bestSeller: true,
      isNew: true,
    },
    "2": {
      slug: "sherwani-edit-2",
      name: "The Groom’s Sherwani",
      fabric: "Raw silk",
      price: 185000,
      description:
        "Five-angle groom sherwani — the complete Blessings wedding silhouette, from front to detail.",
      bestSeller: true,
      isNew: true,
    },
  },
  shirts: {
    "1": {
      slug: "shirt-edit-1",
      name: "The Statement Shirt I",
      fabric: "Egyptian cotton",
      price: 18500,
      description: "A Blessings statement shirt — two studio frames of the same cut and print.",
      isNew: true,
      bestSeller: true,
    },
    "2": {
      slug: "shirt-edit-2",
      name: "The Statement Shirt II",
      fabric: "Printed cotton silk",
      price: 19500,
      description: "Second shirt look — motif and drape for cocktail and travel.",
      isNew: true,
    },
    "3": {
      slug: "shirt-edit-3",
      name: "The Statement Shirt III",
      fabric: "Hand-finished cotton",
      price: 21000,
      description: "Third shirt look from the atelier — clean collar, statement ground.",
    },
    "4": {
      slug: "shirt-edit-4",
      name: "The Statement Shirt IV",
      fabric: "Cotton silk",
      price: 20500,
      description: "Its own shirt look — Shirts-5 frames (2) and (3), a separate set from Shirt V.",
      isNew: true,
    },
    "5": {
      slug: "shirt-edit-5",
      name: "The Statement Shirt V",
      fabric: "Premium cotton",
      price: 24500,
      description: "Two studio frames of this shirt — Shirts-5 (1) and (4).",
      bestSeller: true,
      isNew: true,
    },
    "6": {
      slug: "shirt-edit-6",
      name: "The Statement Shirt VI",
      fabric: "Silk blend",
      price: 22000,
      description: "A single-frame shirt portrait from the Blessings studio.",
      isNew: true,
    },
    "7": {
      slug: "shirt-edit-7",
      name: "The Statement Shirt VII",
      fabric: "Printed cotton",
      price: 19800,
      description: "Seventh shirt look — two frames of the same silhouette.",
      isNew: true,
    },
  },
};

function collectionFromPrefix(prefix: string): CollectionKey | null {
  const p = prefix.toLowerCase();
  if (p === "bandhgala") return "bandhgala";
  if (p === "indo-western") return "indo-western";
  if (p === "sherwani") return "sherwani";
  if (p === "shirts") return "shirts";
  return null;
}

function lookKey(collection: CollectionKey, rawLook: string | undefined): string {
  if (collection === "indo-western") {
    if (rawLook === undefined || rawLook === "") return "0";
    return rawLook;
  }
  if (!rawLook) return "1";
  return rawLook;
}

type Group = {
  collection: CollectionKey;
  look: string;
  files: { shot: number; filename: string }[];
};

function groupFiles(filenames: string[]): Group[] {
  const map = new Map<string, Group>();
  for (const filename of filenames) {
    const m = filename.match(FILE_RE);
    if (!m) {
      console.warn(`Unrecognised filename, skipped: ${filename}`);
      continue;
    }
    const collection = collectionFromPrefix(m[1]);
    if (!collection) continue;
    let look = lookKey(collection, m[2]);
    const shot = m[3] ? Number(m[3]) : 1;
    // Shirts-5 (2)+(3) are a different product from (1)+(4)
    if (collection === "shirts" && look === "5" && (shot === 2 || shot === 3)) {
      look = "4";
    }
    const key = `${collection}::${look}`;
    let g = map.get(key);
    if (!g) {
      g = { collection, look, files: [] };
      map.set(key, g);
    }
    g.files.push({ shot, filename });
  }
  for (const g of map.values()) {
    g.files.sort((a, b) => a.shot - b.shot);
  }
  return [...map.values()].sort((a, b) => {
    if (a.collection !== b.collection) {
      return COLLECTION_META[a.collection].sortOrder - COLLECTION_META[b.collection].sortOrder;
    }
    return Number(a.look) - Number(b.look);
  });
}

const HEIC_CACHE = path.resolve(__dirname, ".seed-cache");

function jpegSourcePath(sourceName: string): string {
  const ext = path.extname(sourceName).toLowerCase();
  const original = path.join(NEW_DATA_DIR, sourceName);
  if (ext === ".heic" || ext === ".heif") {
    const cached = path.join(HEIC_CACHE, `${path.parse(sourceName).name}.jpg`);
    if (fs.existsSync(cached)) return cached;
  }
  return original;
}

async function uploadResized(sourceName: string, destName: string, alt: string): Promise<Types.ObjectId | null> {
  const existing = await Media.findOne({ filename: destName });
  if (existing) return existing.gridFsId;

  const filePath = jpegSourcePath(sourceName);
  if (!fs.existsSync(filePath)) {
    console.warn(`Missing file: ${sourceName} (looked at ${filePath})`);
    return null;
  }

  const buffer = await sharp(filePath)
    .rotate()
    .resize({ width: 1600, height: 2200, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();

  const gridFsId = await uploadToGridFs(buffer, destName, "image/jpeg", { seed: true, source: "new_data" });
  await Media.create({
    gridFsId,
    filename: destName,
    mimeType: "image/jpeg",
    size: buffer.length,
    alt,
  });
  return gridFsId as unknown as Types.ObjectId;
}

async function ensureCategory(collection: CollectionKey, imageId?: Types.ObjectId) {
  const meta = COLLECTION_META[collection];
  const existing = await Category.findOne({ slug: meta.slug });
  if (existing) {
    existing.name = meta.name;
    existing.tagline = meta.tagline;
    existing.subCategories = meta.subCategories;
    existing.sortOrder = meta.sortOrder;
    existing.isActive = true;
    existing.showOnNavbar = true;
    if (imageId && !existing.imageId) existing.imageId = imageId;
    await existing.save();
    console.log(`Category updated: ${meta.name}`);
    return existing;
  }
  const created = await Category.create({
    slug: meta.slug,
    name: meta.name,
    tagline: meta.tagline,
    imageId,
    subCategories: meta.subCategories,
    sortOrder: meta.sortOrder,
    isActive: true,
    showOnNavbar: true,
  });
  console.log(`Category created: ${meta.name}`);
  return created;
}

async function seed() {
  if (!fs.existsSync(NEW_DATA_DIR)) {
    throw new Error(`new_data folder not found: ${NEW_DATA_DIR}`);
  }

  await connectDb();
  console.log("Connected to MongoDB");
  console.log(`Reading looks from ${NEW_DATA_DIR}`);

  const filenames = fs.readdirSync(NEW_DATA_DIR).filter((f) =>
    /\.(jpe?g|heic|heif)$/i.test(f),
  );
  const groups = groupFiles(filenames);
  console.log(`${filenames.length} files → ${groups.length} products`);

  const firstImageByCollection = new Map<CollectionKey, Types.ObjectId>();
  const categoryIds = new Map<CollectionKey, string>();

  for (const key of Object.keys(COLLECTION_META) as CollectionKey[]) {
    const cat = await ensureCategory(key);
    categoryIds.set(key, cat._id.toString());
  }

  const sizes = ["S", "M", "L", "XL", "XXL"];

  for (const group of groups) {
    const info = LOOKS[group.collection][group.look];
    if (!info) {
      console.warn(`No mock copy for ${group.collection} look ${group.look} — skipping`);
      continue;
    }

    const imageIds: Types.ObjectId[] = [];
    for (const file of group.files) {
      const destName = `${info.slug}-${file.shot}.jpg`;
      const id = await uploadResized(file.filename, destName, `${info.name} — ${file.shot}`);
      if (id) imageIds.push(id);
      process.stdout.write(".");
    }

    if (imageIds[0] && !firstImageByCollection.has(group.collection)) {
      firstImageByCollection.set(group.collection, imageIds[0]);
    }

    const categoryId = categoryIds.get(group.collection);
    if (!categoryId) continue;

    const stock = new Map<string, number>();
    for (const size of sizes) stock.set(size, 8);

    const existing = await Product.findOne({ slug: info.slug });
    if (existing) {
      existing.name = info.name;
      existing.fabric = info.fabric;
      existing.price = info.price;
      existing.description = info.description;
      existing.categoryId = categoryId as unknown as Types.ObjectId;
      existing.imageIds = imageIds;
      existing.sizes = sizes;
      existing.isNewProduct = info.isNew ?? false;
      existing.bestSeller = info.bestSeller ?? false;
      existing.isActive = true;
      if (!existing.stock || existing.stock.size === 0) existing.stock = stock;
      await existing.save();
      console.log(`\nUpdated ${info.name} (${imageIds.length} images)`);
      continue;
    }

    await Product.create({
      slug: info.slug,
      sku: info.slug.toUpperCase().replace(/-/g, ""),
      name: info.name,
      categoryId,
      fabric: info.fabric,
      price: info.price,
      description: info.description,
      sizes,
      stock,
      imageIds,
      isNewProduct: info.isNew ?? false,
      bestSeller: info.bestSeller ?? false,
      isActive: true,
    });
    console.log(`\nCreated ${info.name} (${imageIds.length} images)`);
  }

  for (const [collection, imageId] of firstImageByCollection) {
    const meta = COLLECTION_META[collection];
    await Category.updateOne({ slug: meta.slug }, { $set: { imageId } });
  }

  console.log("\nnew_data seed complete");
  await disconnectDb();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
