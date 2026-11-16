"use strict";
// categoryController.ts
// What happens when someone asks for categories: read them from MongoDB and reply with JSON.
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCategoryBySlug = exports.getCategories = void 0;
const Category_1 = require("../models/Category");
const Products_1 = require("../models/Products");
const AppError_1 = require("../utils/AppError");
// How many products shoppers can see in each category: { "665f...": 15, "6660...": 6, ... }
// One "aggregate" query counts them all at once, instead of one query per category.
const countProductsByCategory = async () => {
    const rows = await Products_1.Product.aggregate([
        { $match: (0, Products_1.liveProducts)() }, // only published (or scheduled and already live) products
        { $group: { _id: "$category", count: { $sum: 1 } } }, // one row per category, adding 1 per product
    ]);
    // Turn the rows into a Map so we can look a count up by category id
    return new Map(rows.map((row) => [String(row._id), row.count]));
};
// GET /api/categories
const getCategories = async (_req, res) => {
    // Run both queries at the same time
    const [categories, counts] = await Promise.all([
        Category_1.Category.find().select("-__v").sort({ _id: 1 }).lean(), // _id order = the order they were seeded
        countProductsByCategory(),
    ]);
    res.json({
        categories: categories.map((category) => ({
            ...category,
            productCount: counts.get(String(category._id)) ?? 0, // a category with no products gets 0
        })),
    });
};
exports.getCategories = getCategories;
// GET /api/categories/:slug
const getCategoryBySlug = async (req, res) => {
    const category = await Category_1.Category.findOne({
        slug: req.params.slug.toLowerCase(),
    })
        .select("-__v")
        .lean();
    // No such category: errorHandler (STEP 14) turns this into a 404 JSON reply
    if (!category) {
        throw new AppError_1.AppError(404, `Category not found: ${req.params.slug}`);
    }
    const productCount = await Products_1.Product.countDocuments({
        ...(0, Products_1.liveProducts)(),
        category: category._id,
    });
    res.json({ category: { ...category, productCount } });
};
exports.getCategoryBySlug = getCategoryBySlug;
