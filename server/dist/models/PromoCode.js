"use strict";
// PromoCode model server/src/models/PromoCode.ts
// A discount code typed in the cart, e.g. QUICK25 = ₦2,000 off, QUICK10 = 10% off.
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromoCode = void 0;
// STEP 21 (part 1): The PromoCode model
const mongoose_1 = require("mongoose");
const promoCodeSchema = new mongoose_1.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
    },
    description: { type: String, default: "" },
    type: { type: String, enum: ["fixed", "percent"], required: true },
    value: { type: Number, required: true, min: 0 },
    maxDiscount: { type: Number, min: 0 },
    minSubtotal: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date },
    usedCount: { type: Number, default: 0 },
}, { timestamps: true });
exports.PromoCode = (0, mongoose_1.model)("PromoCode", promoCodeSchema);
