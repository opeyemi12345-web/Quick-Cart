"use strict";
// promoRoutes.ts server/src/routes/promoRoutes.ts
// routes/index.ts puts these under /api/promo-codes.
Object.defineProperty(exports, "__esModule", { value: true });
// STEP 21 (part 5): Promo code routes
const express_1 = require("express");
const promoControllers_1 = require("../controllers/promoControllers");
const router = (0, express_1.Router)();
// No protect: shoppers who aren't logged in can try a code in their cart too
router.post("/check", promoControllers_1.checkPromoCode);
exports.default = router;
