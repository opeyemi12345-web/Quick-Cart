// orderRoutes.ts server/src/routes/orderRoutes.ts
// routes/index.ts puts these under /api/orders.

// STEP 22 (part 5): Order routes

import { Router } from "express";
import {
  cancelOrder,
  getMyOrders,
  getOrder,
  getOrderSummary,
  placeOrder,
} from "../controllers/orderControllers";
import { protect } from "../middleware/auth";

const router = Router();

router.use(protect);

router.post("/", placeOrder);
router.get("/", getMyOrders);
router.get("/summary", getOrderSummary);
router.get("/:orderNumber", getOrder);
router.patch("/:orderNumber/cancel", cancelOrder);

export default router;