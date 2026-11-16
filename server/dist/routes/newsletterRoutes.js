"use strict";
// newsletterRoutes.ts server/src/routes/newsletterRoutes.ts
// routes/index.ts puts these under /api/newsletter.
Object.defineProperty(exports, "__esModule", { value: true });
// STEP 24 (part 4): Newsletter routes
const express_1 = require("express");
const newsletterControllers_1 = require("../controllers/newsletterControllers");
const router = (0, express_1.Router)();
router.post("/subscribe", newsletterControllers_1.subscribe);
router.get("/unsubscribe/:token", newsletterControllers_1.unsubscribe);
exports.default = router;
