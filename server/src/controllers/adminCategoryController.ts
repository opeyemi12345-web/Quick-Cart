// adminCategoryController.ts server/src/controllers/adminCategoryController.ts
// The admin's Categories page: list, add, rename / change icon, delete.

// STEP 25 (part 3): Admin categories
// GET    /api/admin/categories        -> every category with ALL its products counted (drafts too)
// POST   /api/admin/categories        { "name": "Toys & Games", "icon": "toys" }
// PATCH  /api/admin/categories/:id    { "name": "...", "icon": "..." }
// DELETE /api/admin/categories/:id    (only when no product uses it)

import { Request, Response } from "express";
import { Types } from "mongoose";
import { Category } from "../models/Category";
import { Product } from "../models/Products";
import { AppError } from "../utils/AppError";
import { slugify } from "../utils/slugify";
import { OBJECT_ID } from "./productController";

const text = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const ICON_RULE = /^[a-z0-9_]*$/;

const findCategory = async (id: string) => {
  const category = OBJECT_ID.test(id) ? await Category.findById(id) : null;
  if (!category) {
    throw new AppError(404, "Category not found");
  }
  return category;
};

const checkIcon = (icon: string) => {
  if (!ICON_RULE.test(icon)) {
    throw new AppError(
      400,
      'The icon must be a Material icon name, e.g. "fitness_center".',
    );
  }
};

export const getAdminCategories = async (_req: Request, res: Response) => {
  const [categories, rows] = await Promise.all([
    Category.find().select("-__v").sort({ _id: 1 }).lean(),
    Product.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]),
  ]);

  const counts = new Map(rows.map((row) => [String(row._id), row.count]));

  res.json({
    categories: categories.map((category) => ({
      ...category,
      productCount: counts.get(String(category._id)) ?? 0,
    })),
  });
};

export const createCategory = async (req: Request, res: Response) => {
  const name = text(req.body?.name);
  const icon = text(req.body?.icon).toLowerCase();

  if (!name) {
    throw new AppError(400, "Please enter the category name.");
  }
  checkIcon(icon);

  const slug = slugify(name);
  if (!slug) {
    throw new AppError(
      400,
      "The category name needs at least one letter or number.",
    );
  }

  if (await Category.exists({ slug })) {
    throw new AppError(409, `There is already a category called '${name}'.`);
  }

  const category = await Category.create({ name, slug, icon });

  res
    .status(201)
    .json({ message: `'${category.name}' has been added.`, category });
};

export const updateCategory = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  const category = await findCategory(req.params.id);

  if (req.body?.name !== undefined) {
    const name = text(req.body.name);
    if (!name) {
      throw new AppError(400, "Please enter the category name.");
    }
    category.name = name;
  }

  if (req.body?.icon !== undefined) {
    const icon = text(req.body.icon).toLowerCase();
    checkIcon(icon);
    category.icon = icon;
  }

  await category.save();

  res.json({ message: `'${category.name}' has been updated.`, category });
};

export const deleteCategory = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  const category = await findCategory(req.params.id);

  const productCount = await Product.countDocuments({
    category: category._id,
  });
  if (productCount > 0) {
    throw new AppError(
      409,
      `'${category.name}' still has ${productCount} product${productCount === 1 ? "" : "s"}. Move or delete them first.`,
    );
  }

  await category.deleteOne();

  res.json({ message: `'${category.name}' has been deleted.` });
};
