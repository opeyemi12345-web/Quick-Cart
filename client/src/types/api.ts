// The shapes of what the server sends back, so TypeScript knows "category.name" exists.
// They copy the server's models (server/src/models). Later steps add Product, User, Order...

// STEP 30 (part 1): Types for the server's replies

// GET /api/categories -> { categories: Category[] } (server: categoryController.ts)
export type Category = {
  _id: string;
  name: string;
  slug: string;
  icon: string;
  productCount: number;
};

export type CategoriesResponse = { categories: Category[] };

// STEP 31: Users (server: models/User.ts)

export type Address = {
  _id: string;
  label: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  country: string;
  instructions?: string;
  isDefault: boolean;
};

// The logged-in user. The server never sends the password or the secret tokens (User.toJSON, server STEP 17).
export type User = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: "customer" | "admin";
  isEmailVerified: boolean;
  addresses: Address[];
  savedItems: string[];
  createdAt: string;
};

// POST /api/auth/login and /register -> { token, user }
export type AuthResponse = { token: string; user: User };

// STEP 32: Products (server: models/Product.ts and CARD_FIELDS in productController.ts)

export type ProductColor = { name: string; hex: string };

// What a product CARD gets from GET /api/products: the fields cards need, not the whole product
export type ProductSummary = {
  _id: string;
  name: string;
  slug: string;
  brand: string;
  price: number;
  oldPrice?: number;
  images: string[];
  ratings: number;
  reviewCount: number;
  badge?: string;
  tagline?: string;
  priceNote?: string;
  tags: string[];
  sold: number;
  stock: number;
  trackStock: boolean;
  flashSaleStock?: number;
  colors: ProductColor[];
  category: { _id: string; name: string; slug: string };
};

// GET /api/products -> one page of products
export type ProductsResponse = {
  products: ProductSummary[];
  total: number;
  page: number;
  pages: number;
};

// STEP 35: One product, and its reviews (server: productController.ts getProduct, reviewController.ts)

export type ProductSpec = { group: string; label: string; value: string };
export type ProductHighlight = { icon: string; title: string; text: string };

// GET /api/products/:idOrSlug -> { product }: everything for the Product Details page
export type Product = ProductSummary & {
  description: string;
  features: string[];
  specs: ProductSpec[];
  highlights: ProductHighlight[];
  sku: string;
  gallery: string[];
  lowStockThreshold: number;
  ratingCounts: number[];
  category: { _id: string; name: string; slug: string; icon: string };
  bundleProducts: ProductSummary[];
  relatedProducts: ProductSummary[];
};

export type ProductResponse = { product: Product };

export type Review = {
  _id: string;
  name: string;
  rating: number;
  title?: string;
  comment: string;
  createdAt: string;
};

// GET /api/reviews/product/:idOrSlug
export type ReviewsResponse = {
  summary: { ratings: number; reviewCount: number; ratingCounts: number[] };
  reviews: Review[];
  total: number;
  page: number;
  pages: number;
};

// GET /api/reviews/can-review/:productId
export type CanReviewResponse = {
  canReview: boolean;
  reason: string | null;
  review: Review | null;
};

// STEP 38: Orders (server: models/Order.ts, orderController.ts)

export type OrderStatus = "processing" | "shipped" | "delivered" | "cancelled";

export type OrderItem = {
  product: string;
  name: string;
  image: string;
  sku: string;
  price: number;
  quantity: number;
  color?: string;
  lineTotal: number;
};

export type Order = {
  _id: string;
  orderNumber: string;
  items: OrderItem[];
  contact: { firstName: string; lastName: string; email: string; phone: string };
  shippingAddress: Omit<Address, "_id" | "isDefault" | "label"> & {
    label?: string;
  };
  deliveryMethod: "standard" | "express";
  payment: {
    method: "card" | "pay_on_delivery";
    status: "paid" | "pending" | "refunded";
    cardBrand?: string;
    cardLast4?: string;
    reference?: string;
    paidAt?: string;
  };
  subtotal: number;
  deliveryFee: number;
  discount: number;
  promoCode?: string;
  total: number;
  status: OrderStatus;
  statusHistory: { status: OrderStatus; note: string; at: string }[];
  estimatedDelivery: { from: string; to: string };
  courier?: string;
  waybill?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  createdAt: string;
};

// POST /api/orders and GET /api/orders/:orderNumber
export type OrderResponse = {
  order: Order;
  canCancel: boolean;
  cancelDeadline: string;
};
