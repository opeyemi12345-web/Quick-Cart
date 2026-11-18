"use strict";
// Product model
// Something the shop sells. Prices and whoke naira, e.g 54000 = N45,000
Object.defineProperty(exports, "__esModule", { value: true });
exports.Product = exports.liveProducts = void 0;
const mongoose_1 = require("mongoose");
const productSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: "" },
    tagline: { type: String },
    priceNote: { type: String },
    features: { type: [String], default: [] },
    specs: [{ group: String, label: String, value: String }],
    category: { type: mongoose_1.Schema.Types.ObjectId, ref: "Category", required: true },
    brand: { type: String, required: true },
    sku: { type: String, required: true, unique: true },
    price: { type: Number, required: true, min: 0 },
    oldPrice: { type: Number, min: 0 },
    costPrice: { type: Number, min: 0 },
    trackStock: { type: Boolean, default: true },
    stock: { type: Number, required: true, min: 0, default: 0 },
    lowStockThreshold: { type: Number, default: 10 },
    images: [{ type: String }],
    gallery: { type: [String], default: [] },
    colors: [{ name: String, hex: String }],
    tags: [{ type: String }],
    badge: { type: String },
    highlights: [
        {
            icon: String,
            title: String,
            text: String,
        },
    ],
    ratings: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    ratingCounts: [{ type: Number }],
    sold: { type: Number, default: 0, min: 0 },
    flashSaleStock: { type: Number, min: 0 },
    bundleProducts: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Product" }],
    relatedProducts: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Product" }],
    status: {
        type: String,
        enum: ["published", "draft", "scheduled"],
        default: "published",
    },
    publishedAt: { type: Date },
}, { timestamps: true });
// STEP 8 (part of this step): The Product model
// The filter every public product query uses.
// Products shoppers can see right now: published, or scheduled with their time already
// passed.
// Use it in every public query
const liveProducts = () => {
    return {
        $or: [
            { status: "published" },
            { status: "scheduled", publishedAt: { $lte: new Date() } },
        ],
    };
};
exports.liveProducts = liveProducts;
exports.Product = (0, mongoose_1.model)("Product", productSchema);
//Next: Step9 (Make web friendly name {slugs})-> server/src/utils/slugigy.ts
