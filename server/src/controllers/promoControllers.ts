// promoController.ts server/src/controllers/promoController.ts
// The cart's "Apply" button.

// STEP 21 (part 4): Check a promo code
// POST /api/promo-codes/check   { "code": "QUICK25", "subtotal": 117500 }

import { Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { applyPromo } from "../utils/promo";

export const checkPromoCode = async (req: Request, res: Response) => {
  const { code, subtotal } = req.body ?? {};
  const amount = Number(subtotal);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new AppError(400, "Your cart is empty.");
  }

  const { promo, discount } = await applyPromo(code, amount);

  res.json({
    code: promo.code,
    description: promo.description,
    discount,
    subtotalAfterDiscount: amount - discount,
  });
};