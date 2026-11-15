// newsletterRoutes.ts server/src/routes/newsletterRoutes.ts
// routes/index.ts puts these under /api/newsletter.

// STEP 24 (part 4): Newsletter routes

import { Router } from "express";
import { subscribe, unsubscribe } from "../controllers/newsletterControllers";

const router = Router();

router.post("/subscribe", subscribe);
router.get("/unsubscribe/:token", unsubscribe);

export default router;
