"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promoCodes = void 0;
exports.promoCodes = [
    {
        code: "QUICK25",
        description: "₦2,000 off orders of ₦25,000 or more",
        type: "fixed",
        value: 2000,
        minSubtotal: 25000,
        isActive: true,
        usedCount: 0,
    },
    {
        code: "QUICK10",
        description: "10% off your order",
        type: "percent",
        value: 10,
        minSubtotal: 0,
        isActive: true,
        usedCount: 0,
    },
];
