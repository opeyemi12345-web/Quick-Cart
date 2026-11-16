"use strict";
// Subscriber model server/src/models/Subscriber.ts
// An email address from the footer's "Subscribe to QuickCart VIP Drops" box.
// We keep our own list (so the admin can count subscribers) AND copy each one to Brevo (to send newsletters).
Object.defineProperty(exports, "__esModule", { value: true });
exports.Subscriber = void 0;
// STEP 24 (part 1): The Subscriber model
const mongoose_1 = require("mongoose");
const subscriberSchema = new mongoose_1.Schema({
    email: {
        type: String,
        required: [true, "Please enter your email address."],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address."],
    },
    isSubscribed: { type: Boolean, default: true },
    unsubscribeToken: { type: String, required: true, select: false },
    subscribedAt: { type: Date, default: Date.now },
    unsubscribedAt: { type: Date },
}, { timestamps: true });
exports.Subscriber = (0, mongoose_1.model)("Subscriber", subscriberSchema);
