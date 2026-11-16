"use strict";
// orderRules.ts server/src/utils/orderRules.ts
// The shop's order rules in one place: delivery prices, delivery dates, the 1-hour cancel window,
// Lagos-only options and the pretend card payment.
Object.defineProperty(exports, "__esModule", { value: true });
exports.chargeCard = exports.formatDate = exports.canCancel = exports.cancelDeadline = exports.estimateDelivery = exports.addBusinessDays = exports.isLagos = exports.CANCEL_WINDOW_MINUTES = exports.DELIVERY_OPTIONS = void 0;
// STEP 22 (part 3): Order rules
const crypto_1 = require("crypto");
const AppError_1 = require("./AppError");
// The checkout's "Delivery Method" box
exports.DELIVERY_OPTIONS = {
    standard: {
        label: "Standard Delivery",
        fee: 0,
        minDays: 2,
        maxDays: 3,
    }, // Free, 2-3 business days
    express: {
        label: "Express Same-Day Dispatch",
        fee: 2500,
        minDays: 0,
        maxDays: 0,
    }, // ₦2,500, today (Lagos only)
};
exports.CANCEL_WINDOW_MINUTES = 60; // "Free cancellation available within 1 hour of placement"
// Express delivery and Pay on Delivery are "Lagos Metro Only" in the designs
const isLagos = (state) => /lagos/i.test(String(state ?? ""));
exports.isLagos = isLagos;
// Monday + 2 business days = Wednesday. Friday + 2 = Tuesday (Saturday and Sunday are skipped).
const addBusinessDays = (start, days) => {
    const date = new Date(start);
    let added = 0;
    while (added < days) {
        date.setDate(date.getDate() + 1);
        const weekday = date.getDay();
        if (weekday !== 0 && weekday !== 6)
            added++;
    }
    return date;
};
exports.addBusinessDays = addBusinessDays;
// "Estimated Delivery: Oct 26 - Oct 27"
const estimateDelivery = (method, placedAt) => {
    const option = exports.DELIVERY_OPTIONS[method];
    return {
        from: (0, exports.addBusinessDays)(placedAt, option.minDays),
        to: (0, exports.addBusinessDays)(placedAt, option.maxDays),
    };
};
exports.estimateDelivery = estimateDelivery;
// The last moment the order can be cancelled: placed + 60 minutes
const cancelDeadline = (order) => new Date(order.createdAt.getTime() + exports.CANCEL_WINDOW_MINUTES * 60 * 1000);
exports.cancelDeadline = cancelDeadline;
// Shows or hides the "Cancel Order" button: still being packed AND within the hour
const canCancel = (order) => order.status === "processing" && Date.now() < (0, exports.cancelDeadline)(order).getTime();
exports.canCancel = canCancel;
// Oct 24, 2026 (for emails)
const formatDate = (date) => date.toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
});
exports.formatDate = formatDate;
// "4..." Visa, "51-55..." or "22-27..." Mastercard, "506/507/650..." Verve
const cardBrand = (digits) => {
    if (/^4/.test(digits))
        return "Visa";
    if (/^(5[1-5]|2[2-7])/.test(digits))
        return "Mastercard";
    if (/^(506|507|650)/.test(digits))
        return "Verve";
    return "Card";
};
// A PRETEND card payment ("Simulated environment for capstone UI" in the checkout design).
// It checks the card looks right, then "pays". No money moves and the card details are never saved.
// Any card number ending in 0000 is declined, so you can demo a failed payment.
const chargeCard = (card) => {
    const { number, expiry, cvv } = (card ?? {});
    const digits = String(number ?? "").replace(/\D/g, "");
    if (digits.length < 12 || digits.length > 19) {
        throw new AppError_1.AppError(400, "Please enter a valid card number.");
    }
    const match = /^(\d{2})\s*\/\s*(\d{2})$/.exec(String(expiry ?? "").trim());
    const month = Number(match?.[1]);
    if (!match || month < 1 || month > 12) {
        throw new AppError_1.AppError(400, "Please enter the expiry date as MM/YY, e.g. 08/28.");
    }
    // A card that says 08/28 works until the END of August 2028, i.e. until 1 September 2028.
    const firstDayAfterExpiry = new Date(2000 + Number(match[2]), month, 1);
    if (firstDayAfterExpiry.getTime() <= Date.now()) {
        throw new AppError_1.AppError(400, "This card has expired.");
    }
    if (!/^\d{3,4}$/.test(String(cvv ?? ""))) {
        throw new AppError_1.AppError(400, "Please enter the 3-digit CVV from the back of your card.");
    }
    if (digits.endsWith("0000")) {
        throw new AppError_1.AppError(402, "Your card was declined. Please try another card.");
    }
    return {
        cardBrand: cardBrand(digits),
        cardLast4: digits.slice(-4),
        reference: `PSTK-${(0, crypto_1.randomInt)(100000000, 1000000000)}`,
        paidAt: new Date(),
    };
};
exports.chargeCard = chargeCard;
