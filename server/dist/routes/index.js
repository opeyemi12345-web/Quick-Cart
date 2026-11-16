"use strict";
// routes/index.ts
// Joins all the route files together app.ts puts these under /api
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminRoutes_1 = __importDefault(require("./adminRoutes"));
const accountRoutes_1 = __importDefault(require("./accountRoutes"));
const authRoutes_1 = __importDefault(require("./authRoutes"));
const categoryRoutes_1 = __importDefault(require("./categoryRoutes"));
const newsletterRoutes_1 = __importDefault(require("./newsletterRoutes"));
const orderRoutes_1 = __importDefault(require("./orderRoutes"));
const productRoutes_1 = __importDefault(require("./productRoutes"));
const promoRoutes_1 = __importDefault(require("./promoRoutes"));
const reviewRoutes_1 = __importDefault(require("./reviewRoutes"));
// STEP 5: Join the routes and add a health check
// One router joins all the route files. app.ts mounts it at /api, so a rout like e.g "/
// products" becomes /api/products
const router = (0, express_1.Router)();
// GET /api/health: a quick check that the API is running
router.get("health", (_req, res) => {
    res.json({ status: "ok", message: "QuickCart API is running" });
});
router.use("/categories", categoryRoutes_1.default); // /api/categories...
router.use("/products", productRoutes_1.default); // /api/products...
router.use("/auth", authRoutes_1.default); // /api/auth...
router.use("/account", accountRoutes_1.default); // /api/account...
router.use("/promo-codes", promoRoutes_1.default); // /api/promo-codes...
router.use("/orders", orderRoutes_1.default); // /api/orders...
router.use("/reviews", reviewRoutes_1.default); // /api/reviews...
router.use("/newsletter", newsletterRoutes_1.default); // /api/newsletter...
router.use("/admin", adminRoutes_1.default); // /api/admin...
exports.default = router;
// Next: STEP 6 (start the server) -> server/src/server.
