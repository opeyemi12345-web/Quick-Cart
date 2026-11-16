"use strict";
// authRoutes.ts server/src/routes/authRoutes.ts
// Which URL runs which auth function. routes/index.ts puts these under /api/auth.
Object.defineProperty(exports, "__esModule", { value: true });
// STEP 18 (part 4): The auth routes
const express_1 = require("express");
const authControllers_1 = require("../controllers/authControllers");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post("/register", authControllers_1.register);
router.post("/login", authControllers_1.login);
router.get("/check-email", authControllers_1.checkEmail);
router.get("/me", auth_1.protect, authControllers_1.getMe); // protect runs first; getMe only runs if it calls next()
router.post("/logout", auth_1.protect, authControllers_1.logout);
router.post("/forgot-password", authControllers_1.forgotPassword);
router.get("/reset-password/:token", authControllers_1.checkResetToken);
router.post("/reset-password/:token", authControllers_1.resetPassword);
router.post("/send-verification", auth_1.protect, authControllers_1.sendVerification);
router.post("/verify-email", auth_1.protect, authControllers_1.verifyEmail);
exports.default = router;
