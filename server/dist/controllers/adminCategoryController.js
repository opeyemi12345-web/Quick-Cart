"use strict";
// adminCategoryController.ts server/src/controllers/adminCategoryController.ts
// The admin's Categories page: list, add, rename / change icon, delete.
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = exports.updateCategory = exports.createCategory = exports.getAdminCategories = void 0;
const Category_1 = require("../models/Category");
const Products_1 = require("../models/Products");
const AppError_1 = require("../utils/AppError");
const slugify_1 = require("../utils/slugify");
const productController_1 = require("./productController");
const text = (value) => typeof value === "string" ? value.trim() : "";
const ICON_RULE = /^[a-z0-9_]*$/;
const findCategory = async (id) => {
    const category = productController_1.OBJECT_ID.test(id) ? await Category_1.Category.findById(id) : null;
    if (!category) {
        throw new AppError_1.AppError(404, "Category not found");
    }
    return category;
};
const checkIcon = (icon) => {
    if (!ICON_RULE.test(icon)) {
        throw new AppError_1.AppError(400, 'The icon must be a Material icon name, e.g. "fitness_center".');
    }
};
const getAdminCategories = async (_req, res) => {
    const [categories, rows] = await Promise.all([
        Category_1.Category.find().select("-__v").sort({ _id: 1 }).lean(),
        Products_1.Product.aggregate([
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
exports.getAdminCategories = getAdminCategories;
const createCategory = async (req, res) => {
    const name = text(req.body?.name);
    const icon = text(req.body?.icon).toLowerCase();
    if (!name) {
        throw new AppError_1.AppError(400, "Please enter the category name.");
    }
    checkIcon(icon);
    const slug = (0, slugify_1.slugify)(name);
    if (!slug) {
        throw new AppError_1.AppError(400, "The category name needs at least one letter or number.");
    }
    if (await Category_1.Category.exists({ slug })) {
        throw new AppError_1.AppError(409, `There is already a category called '${name}'.`);
    }
    const category = await Category_1.Category.create({ name, slug, icon });
    res
        .status(201)
        .json({ message: `'${category.name}' has been added.`, category });
};
exports.createCategory = createCategory;
const updateCategory = async (req, res) => {
    const category = await findCategory(req.params.id);
    if (req.body?.name !== undefined) {
        const name = text(req.body.name);
        if (!name) {
            throw new AppError_1.AppError(400, "Please enter the category name.");
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
exports.updateCategory = updateCategory;
const deleteCategory = async (req, res) => {
    const category = await findCategory(req.params.id);
    const productCount = await Products_1.Product.countDocuments({
        category: category._id,
    });
    if (productCount > 0) {
        throw new AppError_1.AppError(409, `'${category.name}' still has ${productCount} product${productCount === 1 ? "" : "s"}. Move or delete them first.`);
    }
    await category.deleteOne();
    res.json({ message: `'${category.name}' has been deleted.` });
};
exports.deleteCategory = deleteCategory;
