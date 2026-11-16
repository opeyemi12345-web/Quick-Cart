"use strict";
// productRoutes.ts server/src/routes/productRoutes.ts
// Which URL runs which function for products. routes/index.ts puts these under /api/products.
Object.defineProperty(exports, "__esModule", { value: true });
// STEP 16 (part 2): The products API routes
const express_1 = require("express");
const productController_1 = require("../controllers/productController");
const router = (0, express_1.Router)();
router.get("/", productController_1.getProducts); // GET /api/products?category=...&search=...&sort=...&page=...
router.get("/:idOrSlug", productController_1.getProduct); // GET /api/products/smart-watch-ultra
exports.default = router;
