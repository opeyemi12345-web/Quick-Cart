"use strict";
// adminRoutes.ts server/src/routes/adminRoutes.ts
// Everything the admin panel calls. routes/index.ts puts these under /api/admin.
// STEP 26 and 27 add orders, customers and the dashboard to this same file.
Object.defineProperty(exports, "__esModule", { value: true });
// STEP 25 (part 4): Admin routes
const express_1 = require("express");
const adminCategoryController_1 = require("../controllers/adminCategoryController");
const adminProductController_1 = require("../controllers/adminProductController");
const adminCustomerController_1 = require("../controllers/adminCustomerController");
const adminOrderController_1 = require("../controllers/adminOrderController");
const adminDashboardController_1 = require("../controllers/adminDashboardController");
const demoController_1 = require("../controllers/demoController");
const auth_1 = require("../middleware/auth");
const upload_1 = require("../middleware/upload");
const router = (0, express_1.Router)();
router.use(auth_1.protect, auth_1.adminOnly);
// Dashboard (STEP 27)
router.get("/dashboard", adminDashboardController_1.getDashboard);
// Demo panel (STEP 28)
router.post("/demo/reset", demoController_1.resetDemo);
router.post("/demo/advance-orders", demoController_1.advanceOrders);
router.post("/uploads", upload_1.uploadPhotos, adminProductController_1.uploadProductPhotos);
router.get("/products", adminProductController_1.getAdminProducts);
router.get("/products/new-sku", adminProductController_1.generateSku);
router.get("/products/:id", adminProductController_1.getAdminProduct);
router.post("/products", adminProductController_1.createProduct);
router.patch("/products/:id", adminProductController_1.updateProduct);
router.delete("/products/:id", adminProductController_1.deleteProduct);
router.get("/categories", adminCategoryController_1.getAdminCategories);
router.post("/categories", adminCategoryController_1.createCategory);
router.patch("/categories/:id", adminCategoryController_1.updateCategory);
router.delete("/categories/:id", adminCategoryController_1.deleteCategory);
// Orders (STEP 26)
router.get("/orders", adminOrderController_1.getAdminOrders);
router.get("/orders/:orderNumber", adminOrderController_1.getAdminOrder);
router.patch("/orders/:orderNumber/status", adminOrderController_1.updateOrderStatus);
// Customers (STEP 26)
router.get("/customers", adminCustomerController_1.getCustomers);
router.get("/customers/:id", adminCustomerController_1.getCustomer);
exports.default = router;
