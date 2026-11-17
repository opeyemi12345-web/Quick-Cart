import type { ProductSummary } from "../types/api";

const RECENTLY_VIEWED_KEY = "quickcart_recently_viewed";
const MAX_RECENTLY_VIEWED = 8;

const isProductSummary = (value: unknown): value is ProductSummary => {
  if (typeof value !== "object" || value === null) return false;
  const product = value as Partial<ProductSummary>;
  return (
    typeof product._id === "string" &&
    typeof product.name === "string" &&
    typeof product.slug === "string" &&
    typeof product.brand === "string" &&
    typeof product.price === "number" &&
    Array.isArray(product.images) &&
    typeof product.ratings === "number" &&
    typeof product.reviewCount === "number" &&
    Array.isArray(product.tags) &&
    typeof product.sold === "number" &&
    typeof product.stock === "number" &&
    typeof product.trackStock === "boolean" &&
    Array.isArray(product.colors) &&
    typeof product.category === "object" &&
    product.category !== null
  );
};

export const getRecentlyViewed = (): ProductSummary[] => {
  try {
    const stored: unknown = JSON.parse(
      localStorage.getItem(RECENTLY_VIEWED_KEY) ?? "[]",
    );
    if (!Array.isArray(stored)) return [];
    return stored.filter(isProductSummary).slice(0, MAX_RECENTLY_VIEWED);
  } catch {
    return [];
  }
};

export const addRecentlyViewed = (product: ProductSummary): void => {
  const products = getRecentlyViewed().filter(
    (recent) => recent._id !== product._id,
  );
  localStorage.setItem(
    RECENTLY_VIEWED_KEY,
    JSON.stringify([product, ...products].slice(0, MAX_RECENTLY_VIEWED)),
  );
};
