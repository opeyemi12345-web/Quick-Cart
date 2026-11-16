// adminRoutes.ts server/src/routes/adminRoutes.ts
// Everything the admin panel calls. routes/index.ts puts these under /api/admin.
// STEP 26 and 27 add orders, customers and the dashboard to this same file.

// STEP 25 (part 4): Admin routes

import { Router } from "express";
import {
  createCategory,
  deleteCategory,
  getAdminCategories,
  updateCategory,
} from "../controllers/adminCategoryController";
import {
  createProduct,
  deleteProduct,
  generateSku,
  getAdminProduct,
  getAdminProducts,
  updateProduct,
  uploadProductPhotos,
} from "../controllers/adminProductController";
import { getCustomer, getCustomers } from "../controllers/adminCustomerController";
import { getAdminOrder, getAdminOrders, updateOrderStatus } from "../controllers/adminOrderController";
import { getDashboard } from "../controllers/adminDashboardController";
import { advanceOrders, resetDemo } from "../controllers/demoController";
import { adminOnly, protect } from "../middleware/auth";
import { uploadPhotos } from "../middleware/upload";

const router = Router();

router.use(protect, adminOnly);

// Dashboard (STEP 27)
router.get("/dashboard", getDashboard);

// Demo panel (STEP 28)
router.post("/demo/reset", resetDemo);
router.post("/demo/advance-orders", advanceOrders);

router.post("/uploads", uploadPhotos, uploadProductPhotos);

router.get("/products", getAdminProducts);
router.get("/products/new-sku", generateSku);
router.get("/products/:id", getAdminProduct);
router.post("/products", createProduct);
router.patch("/products/:id", updateProduct);
router.delete("/products/:id", deleteProduct);

router.get("/categories", getAdminCategories);
router.post("/categories", createCategory);
router.patch("/categories/:id", updateCategory);
router.delete("/categories/:id", deleteCategory);

// Orders (STEP 26)
router.get("/orders", getAdminOrders);
router.get("/orders/:orderNumber", getAdminOrder);
router.patch("/orders/:orderNumber/status", updateOrderStatus);

// Customers (STEP 26)
router.get("/customers", getCustomers);
router.get("/customers/:id", getCustomer);

export default router;
