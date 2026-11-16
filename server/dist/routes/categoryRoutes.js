"use strict";
// categoryRoutes.ts server/src/routes/categoryRoutes.ts
// Which URL runs which function for categories. routes/index.ts puts these under /api/categories.
Object.defineProperty(exports, "__esModule", { value: true });
// STEP 15 (part 2): The categories API routes
const express_1 = require("express");
const categoryController_1 = require("../controllers/categoryController");
const router = (0, express_1.Router)();
router.get("/", categoryController_1.getCategories); // GET /api/categories
router.get("/:slug", categoryController_1.getCategoryBySlug); // GET /api/categories/home-living
exports.default = router;
