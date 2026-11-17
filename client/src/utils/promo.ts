// promo.ts client/src/utils/promo.ts
// Remembers the promo code for this browser tab; the server revalidates it at checkout.

// STEP 36 (part 1): Remember the promo code

const KEY = "quickcart_promo";

export const getSavedPromo = () => sessionStorage.getItem(KEY) ?? "";
export const savePromo = (code: string) => sessionStorage.setItem(KEY, code);
export const clearSavedPromo = () => sessionStorage.removeItem(KEY);

// POST /api/promo-codes/check -> what the server answers (server STEP 21)
export type PromoResult = {
  code: string;
  description: string;
  discount: number;
  subtotalAfterDiscount: number;
};
