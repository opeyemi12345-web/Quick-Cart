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
