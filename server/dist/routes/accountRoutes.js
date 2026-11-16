"use strict";
// accountRoutes.ts server/src/routes/accountRoutes.ts
// My Account routes. routes/index.ts puts these under /api/account.
Object.defineProperty(exports, "__esModule", { value: true });
// STEP 20: My Account routes
const express_1 = require("express");
const accountController_1 = require("../controllers/accountController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.protect);
router.patch("/profile", accountController_1.updateProfile);
router.patch("/password", accountController_1.changePassword);
router.get("/addresses", accountController_1.getAddresses);
router.post("/addresses", accountController_1.addAddress);
router.patch("/addresses/:addressId", accountController_1.updateAddress);
router.delete("/addresses/:addressId", accountController_1.deleteAddress);
router.get("/saved", accountController_1.getSavedItems);
router.post("/saved/:productId", accountController_1.saveItem);
router.delete("/saved/:productId", accountController_1.unsaveItem);
exports.default = router;
