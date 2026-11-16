"use strict";
// reviewController.ts server/src/controllers/reviewController.ts
// Product reviews. Only customers who bought a product AND received it (a delivered order) can review it.
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteReview = exports.updateReview = exports.createReview = exports.canReviewProduct = exports.getMyReviews = exports.getProductReviews = void 0;
const mongoose_1 = require("mongoose");
const Order_1 = require("../models/Order");
const Products_1 = require("../models/Products");
const Review_1 = require("../models/Review");
const AppError_1 = require("../utils/AppError");
const productController_1 = require("./productController");
const me = (req) => req.user;
const PUBLIC_FIELDS = "name rating title comment createdAt";
const updateProductRating = async (productId, change) => {
    const product = await Products_1.Product.findById(productId).select("ratings reviewCount ratingCounts");
    if (!product)
        return;
    const counts = [0, 1, 2, 3, 4].map((i) => product.ratingCounts[i] ?? 0);
    let starsTotal = product.ratings * product.reviewCount;
    let reviewCount = product.reviewCount;
    if (change.remove) {
        counts[5 - change.remove] = Math.max(0, counts[5 - change.remove] - 1);
        starsTotal -= change.remove;
        reviewCount -= 1;
    }
    if (change.add) {
        counts[5 - change.add] += 1;
        starsTotal += change.add;
        reviewCount += 1;
    }
    reviewCount = Math.max(0, reviewCount);
    const average = reviewCount > 0 ? starsTotal / reviewCount : 0;
    await Products_1.Product.updateOne({ _id: productId }, {
        $set: {
            ratingCounts: counts,
            reviewCount,
            ratings: Math.min(5, Math.max(0, Math.round(average * 100) / 100)),
        },
    });
};
const displayName = (user) => {
    const first = user.firstName.charAt(0).toUpperCase() + user.firstName.slice(1);
    return `${first} ${user.lastName.charAt(0).toUpperCase()}.`;
};
const deliveredOrderWith = (userId, productId) => Order_1.Order.findOne({
    user: userId,
    status: "delivered",
    "items.product": productId,
}).select("_id orderNumber");
const findMyReview = async (req) => {
    const review = (0, mongoose_1.isValidObjectId)(req.params.reviewId)
        ? await Review_1.Review.findOne({
            _id: req.params.reviewId,
            user: me(req)._id,
        })
        : null;
    if (!review) {
        throw new AppError_1.AppError(404, "Review not found");
    }
    return review;
};
// ===== Public =====
const SORTS = new Map([
    ["newest", { createdAt: -1 }],
    ["oldest", { createdAt: 1 }],
    ["highest", { rating: -1, createdAt: -1 }],
    ["lowest", { rating: 1, createdAt: -1 }],
]);
const getProductReviews = async (req, res) => {
    const { idOrSlug } = req.params;
    const which = productController_1.OBJECT_ID.test(idOrSlug)
        ? { _id: idOrSlug }
        : { slug: idOrSlug.toLowerCase() };
    const product = await Products_1.Product.findOne({
        $and: [which, (0, Products_1.liveProducts)()],
    }).select("ratings reviewCount ratingCounts");
    if (!product) {
        throw new AppError_1.AppError(404, "Product not found");
    }
    const filter = { product: product._id };
    const rating = Number(req.query.rating);
    if (Number.isInteger(rating) && rating >= 1 && rating <= 5) {
        filter.rating = rating;
    }
    const sort = SORTS.get(String(req.query.sort)) ?? SORTS.get("newest");
    const limit = Math.min((0, productController_1.wholeNumber)(req.query.limit, 10), 50);
    const page = (0, productController_1.wholeNumber)(req.query.page, 1);
    const [reviews, total] = await Promise.all([
        Review_1.Review.find(filter)
            .select(PUBLIC_FIELDS)
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(limit),
        Review_1.Review.countDocuments(filter),
    ]);
    res.json({
        summary: {
            ratings: product.ratings,
            reviewCount: product.reviewCount,
            ratingCounts: product.ratingCounts,
        },
        reviews,
        total,
        page,
        pages: Math.ceil(total / limit),
    });
};
exports.getProductReviews = getProductReviews;
// ===== Logged in =====
const getMyReviews = async (req, res) => {
    const reviews = await Review_1.Review.find({ user: me(req)._id })
        .select(`${PUBLIC_FIELDS} product`)
        .populate("product", "name slug images")
        .sort({ createdAt: -1 });
    res.json({ reviews });
};
exports.getMyReviews = getMyReviews;
const canReviewProduct = async (req, res) => {
    const { productId } = req.params;
    if (!(0, mongoose_1.isValidObjectId)(productId)) {
        throw new AppError_1.AppError(404, "Product not found");
    }
    const review = await Review_1.Review.findOne({
        product: productId,
        user: me(req)._id,
    });
    if (review) {
        return res.json({
            canReview: false,
            reason: "You have already reviewed this product.",
            review,
        });
    }
    const order = await deliveredOrderWith(me(req)._id, productId);
    res.json({
        canReview: Boolean(order),
        reason: order
            ? null
            : "Only customers who have received this product can review it.",
        review: null,
    });
};
exports.canReviewProduct = canReviewProduct;
const createReview = async (req, res) => {
    const user = me(req);
    const { productId, rating, title, comment } = req.body ?? {};
    if (!(0, mongoose_1.isValidObjectId)(productId) ||
        !(await Products_1.Product.exists({
            $and: [{ _id: productId }, (0, Products_1.liveProducts)()],
        }))) {
        throw new AppError_1.AppError(404, "Product not found");
    }
    if (await Review_1.Review.exists({ product: productId, user: user._id })) {
        throw new AppError_1.AppError(409, "You have already reviewed this product. You can edit your review instead.");
    }
    const order = await deliveredOrderWith(user._id, productId);
    if (!order) {
        throw new AppError_1.AppError(403, "Only customers who have received this product can review it.");
    }
    let review;
    try {
        review = await Review_1.Review.create({
            product: productId,
            user: user._id,
            order: order._id,
            name: displayName(user),
            rating,
            title,
            comment,
        });
    }
    catch (error) {
        if (error.code === 11000) {
            throw new AppError_1.AppError(409, "You have already reviewed this product. You can edit your review instead.");
        }
        throw error;
    }
    await updateProductRating(review.product, { add: review.rating });
    res.status(201).json({ message: "Thank you for your review!", review });
};
exports.createReview = createReview;
const updateReview = async (req, res) => {
    const review = await findMyReview(req);
    const oldRating = review.rating;
    const { rating, title, comment } = req.body ?? {};
    if (rating !== undefined)
        review.rating = rating;
    if (title !== undefined)
        review.title = title;
    if (comment !== undefined)
        review.comment = comment;
    await review.save();
    if (review.rating !== oldRating) {
        await updateProductRating(review.product, {
            remove: oldRating,
            add: review.rating,
        });
    }
    res.json({ message: "Your review has been updated.", review });
};
exports.updateReview = updateReview;
const deleteReview = async (req, res) => {
    const user = me(req);
    if (!(0, mongoose_1.isValidObjectId)(req.params.reviewId)) {
        throw new AppError_1.AppError(404, "Review not found");
    }
    const filter = user.role === "admin"
        ? { _id: req.params.reviewId }
        : { _id: req.params.reviewId, user: user._id };
    const review = await Review_1.Review.findOneAndDelete(filter);
    if (!review) {
        throw new AppError_1.AppError(404, "Review not found");
    }
    await updateProductRating(review.product, { remove: review.rating });
    res.json({ message: "The review has been deleted." });
};
exports.deleteReview = deleteReview;
