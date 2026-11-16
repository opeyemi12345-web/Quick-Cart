// CartContext.ts client/src/context/CartContext.ts
// The shopping cart for the whole website:
//   const { items, count, subtotal, addItem } = useCart();
// The values come from CartProvider.tsx (wrapped around the app in main.tsx).

// STEP 32 (part 2): The cart context

import { createContext, useContext } from "react";
import type { ProductSummary } from "../types/api";

// One line in the cart. Product details are copied so the cart doesn't fetch each item again.
export type CartItem = {
  key: string;
  productId: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  oldPrice?: number;
  color?: string;
  quantity: number;
  maxQuantity: number;
};

export type AddResult =
  | { ok: true; item: CartItem }
  | { ok: false; message: string };

export type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  addItem: (
    product: ProductSummary,
    options?: { color?: string; quantity?: number },
  ) => AddResult;
  updateQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clearCart: () => void;
  lastAdded: CartItem | null;
  dismissLastAdded: () => void;
};

export const CartContext = createContext<CartContextValue | null>(null);

export const useCart = () => {
  const value = useContext(CartContext);
  if (!value) {
    throw new Error("useCart must be used inside <CartProvider> (see main.tsx)");
  }
  return value;
};
