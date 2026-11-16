"use strict";
// promo.ts server/src/utils/promo.ts
// Checks a promo code and works out its discount. Used by the cart's Apply button AND by checkout (STEP 22),
// so both always agree.
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyPromo = exports.discountFor = exports.naira = void 0;
// STEP 21 (part 3): Promo code rules
const PromoCode_1 = require("../models/PromoCode");
const AppError_1 = require("./AppError");
// 25000 -> "₦25,000" (toLocaleString adds the commas the Nigerian way)
const naira = (amount) => `₦${amount.toLocaleString("en-NG")}`;
exports.naira = naira;
// How much this code takes off this subtotal, in whole naira
const discountFor = (promo, subtotal) => {
    // fixed: the value itself (2000). percent: that % of the subtotal (10% of 18500 = 1850)
    let discount = promo.type === "percent" ? (subtotal * promo.value) / 100 : promo.value;
    if (promo.maxDiscount !== undefined) {
        discount = Math.min(discount, promo.maxDiscount); // QUICK10 never takes off more than ₦5,000
    }
    discount = Math.min(discount, subtotal); // never more than the order itself (no negative totals)
    return Math.round(discount); // naira, no kobo: 1234.5 -> 1235
};
exports.discountFor = discountFor;
// applyPromo("quick25", 117500) -> { promo, discount: 2000 }
// Throws a 400 with a message the cart can show if the code can't be used.
const applyPromo = async (code, subtotal) => {
    const cleanCode = String(code ?? "")
        .toUpperCase()
        .trim(); // " quick25 " -> "QUICK25"
    if (!cleanCode) {
        throw new AppError_1.AppError(400, "Please enter a promo code.");
    }
    const promo = await PromoCode_1.PromoCode.findOne({ code: cleanCode });
    // Doesn't exist, switched off, or expired: the shopper doesn't need to know which
    if (!promo ||
        !promo.isActive ||
        (promo.expiresAt && promo.expiresAt.getTime() < Date.now())) {
        throw new AppError_1.AppError(400, `"${cleanCode}" is not a valid promo code.`);
    }
    // Too small an order? Tell them how much more to add (that sells more!)
    if (subtotal < promo.minSubtotal) {
        throw new AppError_1.AppError(400, `${promo.code} needs an order of at least ${(0, exports.naira)(promo.minSubtotal)}. Add ${(0, exports.naira)(promo.minSubtotal - subtotal)} more to use it.`);
    }
    return { promo, discount: (0, exports.discountFor)(promo, subtotal) };
};
exports.applyPromo = applyPromo;
