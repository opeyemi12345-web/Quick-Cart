"use strict";
// orderRoutes.ts server/src/routes/orderRoutes.ts
// routes/index.ts puts these under /api/orders.
Object.defineProperty(exports, "__esModule", { value: true });
// STEP 22 (part 5): Order routes
const express_1 = require("express");
const orderControllers_1 = require("../controllers/orderControllers");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.protect);
router.post("/", orderControllers_1.placeOrder);
router.get("/", orderControllers_1.getMyOrders);
router.get("/summary", orderControllers_1.getOrderSummary);
router.get("/:orderNumber", orderControllers_1.getOrder);
router.patch("/:orderNumber/cancel", orderControllers_1.cancelOrder);
exports.default = router;
