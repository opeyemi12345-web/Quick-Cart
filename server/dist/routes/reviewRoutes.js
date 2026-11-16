"use strict";
// reviewRoutes.ts server/src/routes/reviewRoutes.ts
// routes/index.ts puts these under /api/reviews.
Object.defineProperty(exports, "__esModule", { value: true });
// STEP 23 (part 3): Review routes
const express_1 = require("express");
const reviewControllers_1 = require("../controllers/reviewControllers");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get("/product/:idOrSlug", reviewControllers_1.getProductReviews);
router.get("/mine", auth_1.protect, reviewControllers_1.getMyReviews);
router.get("/can-review/:productId", auth_1.protect, reviewControllers_1.canReviewProduct);
router.post("/", auth_1.protect, reviewControllers_1.createReview);
router.patch("/:reviewId", auth_1.protect, reviewControllers_1.updateReview);
router.delete("/:reviewId", auth_1.protect, reviewControllers_1.deleteReview);
exports.default = router;
