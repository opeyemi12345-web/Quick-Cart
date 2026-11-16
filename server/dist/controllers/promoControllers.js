"use strict";
// promoController.ts server/src/controllers/promoController.ts
// The cart's "Apply" button.
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPromoCode = void 0;
const AppError_1 = require("../utils/AppError");
const promo_1 = require("../utils/promo");
const checkPromoCode = async (req, res) => {
    const { code, subtotal } = req.body ?? {};
    const amount = Number(subtotal);
    if (!Number.isFinite(amount) || amount <= 0) {
        throw new AppError_1.AppError(400, "Your cart is empty.");
    }
    const { promo, discount } = await (0, promo_1.applyPromo)(code, amount);
    res.json({
        code: promo.code,
        description: promo.description,
        discount,
        subtotalAfterDiscount: amount - discount,
    });
};
exports.checkPromoCode = checkPromoCode;
