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
