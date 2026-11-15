// adminProductController.ts server/src/controllers/adminProductController.ts
// The admin's Products pages: the products table (tabs, search, filters), the Add / Edit Product form,
// photo uploads to Cloudinary, and deleting products.

// STEP 25 (part 2): Admin products
// POST   /api/admin/uploads          (form-data, field "photos") -> { urls: [...] } to put in images / gallery
// GET    /api/admin/products         ?tab=low-stock&search=...&category=electronics&sort=price-asc&page=1
// GET    /api/admin/products/:id     -> everything, including costPrice and drafts
// POST   /api/admin/products         -> create
// PATCH  /api/admin/products/:id     -> change only the fields sent
// DELETE /api/admin/products/:id

import crypto from "crypto";
import { Request, Response } from "express";
import { SortOrder } from "mongoose";
import {
  CLOUDINARY_MISSING,
  deletePhoto,
  isCloudinaryReady,
  isOurPhoto,
  photoUrl,
  UPLOAD_FOLDER,
  uploadedPhotoId,
  uploadPhoto,
} from "../config/cloudinary";
import { Category } from "../models/Category";
import { Order } from "../models/Order";
import { Product } from "../models/Products";
import { Review } from "../models/Review";
import { User } from "../models/User";
import { AppError } from "../utils/AppError";
import { escapeRegex } from "../utils/escapeRegex";
import { slugify } from "../utils/slugify";
import { OBJECT_ID, wholeNumber } from "./productController";

// ---- Photos -------------------------------------------------------------------

export const uploadProductPhotos = async (req: Request, res: Response) => {
  if (!isCloudinaryReady) {
    throw new AppError(503, `Photo uploads are not set up. ${CLOUDINARY_MISSING}`);
  }

  const files = (req.files ?? []) as Express.Multer.File[];
  if (files.length === 0) {
    throw new AppError(400, "Please choose at least one photo.");
  }

  const ids = await Promise.all(
    files.map((file) =>
      uploadPhoto(
        file.buffer,
        `${UPLOAD_FOLDER}/${crypto.randomBytes(12).toString("hex")}`,
      ),
    ),
  );

  res.status(201).json({ urls: ids.map(photoUrl) });
};

const deleteUnusedPhotos = async (urls: string[]) => {
  for (const url of new Set(urls)) {
    const publicId = uploadedPhotoId(url);
    if (!publicId) {
      continue;
    }

    const [usedByProduct, usedByOrder] = await Promise.all([
      Product.exists({ $or: [{ images: url }, { gallery: url }] }),
      Order.exists({ "items.image": url }),
    ]);

    if (!usedByProduct && !usedByOrder) {
      await deletePhoto(publicId);
    }
  }
};

// ---- The products table -------------------------------------------------------

const TABS: Record<string, Record<string, unknown>> = {
  all: {},
  "in-stock": {
    $or: [
      { trackStock: false },
      { $expr: { $gt: ["$stock", "$lowStockThreshold"] } },
    ],
  },
  "low-stock": {
    trackStock: true,
    stock: { $gt: 0 },
    $expr: { $lte: ["$stock", "$lowStockThreshold"] },
  },
  "out-of-stock": { trackStock: true, stock: 0 },
  drafts: { status: "draft" },
};

const SORTS: Record<string, Record<string, SortOrder>> = {
  updated: { updatedAt: -1, _id: -1 },
  name: { name: 1, _id: 1 },
  "price-asc": { price: 1, _id: 1 },
  "price-desc": { price: -1, _id: -1 },
  "stock-asc": { stock: 1, _id: 1 },
};

const TABLE_FIELDS =
  "name slug sku brand category price oldPrice costPrice images trackStock stock lowStockThreshold status publishedAt badge updatedAt";

const text = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

export const getAdminProducts = async (req: Request, res: Response) => {
  const tab = text(req.query.tab) || "all";
  if (!TABS[tab]) {
    throw new AppError(
      400,
      `Unknown tab: ${tab}. Use one of: ${Object.keys(TABS).join(", ")}.`,
    );
  }

  const conditions: Record<string, unknown>[] = [TABS[tab]];

  const search = text(req.query.search);
  if (search) {
    const pattern = new RegExp(escapeRegex(search), "i");
    conditions.push({ $or: [{ name: pattern }, { sku: pattern }] });
  }

  const categorySlug = text(req.query.category).toLowerCase();
  if (categorySlug) {
    const category = await Category.findOne({ slug: categorySlug });
    conditions.push({ category: category?._id ?? null });
  }

  const minPrice = Number(text(req.query.minPrice));
  const maxPrice = Number(text(req.query.maxPrice));
  if (text(req.query.minPrice) && Number.isFinite(minPrice)) {
    conditions.push({ price: { $gte: minPrice } });
  }
  if (text(req.query.maxPrice) && Number.isFinite(maxPrice)) {
    conditions.push({ price: { $lte: maxPrice } });
  }

  const sort = SORTS[text(req.query.sort)] ?? SORTS.updated;
  const limit = Math.min(wholeNumber(req.query.limit, 8), 100);
  const page = wholeNumber(req.query.page, 1);
  const filter = { $and: conditions };

  const [products, total, ...tabCounts] = await Promise.all([
    Product.find(filter)
      .select(TABLE_FIELDS)
      .populate("category", "name slug")
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
    ...Object.values(TABS).map((condition) =>
      Product.countDocuments(condition),
    ),
  ]);

  const counts = Object.fromEntries(
    Object.keys(TABS).map((name, index) => [name, tabCounts[index]]),
  );

  res.json({ products, total, page, pages: Math.ceil(total / limit), counts });
};

const findProduct = async (id: string) => {
  const product = OBJECT_ID.test(id) ? await Product.findById(id) : null;
  if (!product) {
    throw new AppError(404, "Product not found");
  }
  return product;
};

export const getAdminProduct = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  const product = await findProduct(req.params.id);
  res.json({ product });
};

// ---- Create and edit ----------------------------------------------------------

const EDITABLE_FIELDS = [
  "name",
  "description",
  "tagline",
  "priceNote",
  "features",
  "specs",
  "category",
  "brand",
  "sku",
  "price",
  "oldPrice",
  "costPrice",
  "trackStock",
  "stock",
  "lowStockThreshold",
  "images",
  "gallery",
  "colors",
  "tags",
  "badge",
  "highlights",
  "flashSaleStock",
  "bundleProducts",
  "relatedProducts",
  "status",
  "publishedAt",
] as const;

const pickEditableFields = (body: Record<string, unknown> = {}) =>
  Object.fromEntries(
    EDITABLE_FIELDS.filter((field) => body[field] !== undefined).map(
      (field) => [field, body[field]],
    ),
  );

const uniqueSlug = async (name: string) => {
  const base = slugify(name) || "product";
  let slug = base;
  for (let n = 2; await Product.exists({ slug }); n++) {
    slug = `${base}-${n}`;
  }
  return slug;
};

const newSku = async (categoryName: string) => {
  const letters =
    categoryName.replace(/[^a-z]/gi, "").slice(0, 2).toUpperCase() || "GN";
  let sku: string;
  do {
    sku = `QC-${letters}-${crypto.randomInt(1000, 10000)}`;
  } while (await Product.exists({ sku }));
  return sku;
};

type ProductDoc = Awaited<ReturnType<typeof findProduct>>;

const checkProduct = async (product: ProductDoc) => {
  if (!product.name?.trim()) {
    throw new AppError(400, "Please enter the product title.");
  }

  if (!product.category || !(await Category.exists({ _id: product.category }))) {
    throw new AppError(400, "Please choose a category.");
  }

  if (product.oldPrice != null && product.oldPrice <= product.price) {
    throw new AppError(
      400,
      "The regular price must be higher than the sale price.",
    );
  }

  if (product.status === "scheduled" && !product.publishedAt) {
    throw new AppError(
      400,
      "Please pick the date and time a scheduled product goes live.",
    );
  }

  for (const url of [...product.images, ...product.gallery]) {
    if (!isOurPhoto(url)) {
      throw new AppError(400, "Please add photos with the Add Image button.");
    }
  }

  product.tags = [...new Set(product.tags.map(slugify).filter(Boolean))];
};

export const createProduct = async (req: Request, res: Response) => {
  const product = new Product(pickEditableFields(req.body));
  await checkProduct(product);

  product.slug = await uniqueSlug(product.name);

  if (!product.sku?.trim()) {
    const category = await Category.findById(product.category);
    product.sku = await newSku(category!.name);
  }

  await product.save();

  res.status(201).json({
    message: `'${product.name}' has been created.`,
    product,
  });
};

export const updateProduct = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  const product = await findProduct(req.params.id);
  const photosBefore = [...product.images, ...product.gallery];

  product.set(pickEditableFields(req.body));
  await checkProduct(product);
  await product.save();

  const photosNow = [...product.images, ...product.gallery];
  await deleteUnusedPhotos(photosBefore.filter((url) => !photosNow.includes(url)));

  const where =
    product.status === "published"
      ? "is live"
      : product.status === "draft"
        ? "is saved as a draft"
        : "is scheduled";
  res.json({ message: `'${product.name}' ${where}.`, product });
};

export const generateSku = async (req: Request, res: Response) => {
  const id = text(req.query.category);
  const category = OBJECT_ID.test(id) ? await Category.findById(id) : null;
  res.json({ sku: await newSku(category?.name ?? "") });
};

// ---- Delete ------------------------------------------------------------------

export const deleteProduct = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  const product = await findProduct(req.params.id);

  await product.deleteOne();

  await Promise.all([
    Review.deleteMany({ product: product._id }),
    User.updateMany(
      { savedItems: product._id },
      { $pull: { savedItems: product._id } },
    ),
    Product.updateMany(
      { $or: [{ bundleProducts: product._id }, { relatedProducts: product._id }] },
      {
        $pull: {
          bundleProducts: product._id,
          relatedProducts: product._id,
        },
      },
    ),
  ]);

  await deleteUnusedPhotos([...product.images, ...product.gallery]);

  res.json({ message: `'${product.name}' has been deleted.` });
};
