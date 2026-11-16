"use strict";
// Review model server/src/models/Review.ts
// A customer's star rating and comment on a product they bought AND received.
Object.defineProperty(exports, "__esModule", { value: true });
exports.Review = void 0;
// STEP 23 (part 1): The Review model
const mongoose_1 = require("mongoose");
const reviewSchema = new mongoose_1.Schema({
    product: { type: mongoose_1.Schema.Types.ObjectId, ref: "Product", required: true },
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    order: { type: mongoose_1.Schema.Types.ObjectId, ref: "Order", required: true },
    name: { type: String, required: true },
    rating: {
        type: Number,
        required: [true, "Please choose a star rating."],
        cast: "Rating must be a whole number from 1 to 5.",
        min: [1, "Rating must be a whole number from 1 to 5."],
        max: [5, "Rating must be a whole number from 1 to 5."],
        validate: {
            validator: Number.isInteger,
            message: "Rating must be a whole number from 1 to 5.",
        },
    },
    title: {
        type: String,
        trim: true,
        maxlength: [100, "The title can be at most 100 characters."],
    },
    comment: {
        type: String,
        required: [true, "Please write a few words about the product."],
        trim: true,
        maxlength: [1000, "Your review can be at most 1,000 characters."],
    },
}, { timestamps: true });
// One review per customer per product.
reviewSchema.index({ product: 1, user: 1 }, { unique: true });
// The product page lists a product's reviews, newest first.
reviewSchema.index({ product: 1, createdAt: -1 });
exports.Review = (0, mongoose_1.model)("Review", reviewSchema);
