"use strict";
// Order model server/src/models/Order.ts
// One placed order: what was bought (at what price), where it goes, how it's paid, and where it is now.
Object.defineProperty(exports, "__esModule", { value: true });
exports.Order = exports.ORDER_STATUSES = void 0;
// STEP 22 (part 2): The Order model
const mongoose_1 = require("mongoose");
const User_1 = require("./User");
// processing = placed, being packed  ("In Progress" tab)
// shipped    = with the courier      ("Shipped" tab; the tracker calls it "Dispatched")
// delivered  = handed over           ("Delivered" tab)
// cancelled  = cancelled             ("Cancelled" tab)
exports.ORDER_STATUSES = [
    "processing",
    "shipped",
    "delivered",
    "cancelled",
];
const orderItemSchema = new mongoose_1.Schema({
    product: { type: mongoose_1.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    image: { type: String, default: "" },
    sku: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    color: { type: String },
    lineTotal: { type: Number, required: true, min: 0 },
}, { _id: false });
const orderSchema = new mongoose_1.Schema({
    orderNumber: { type: String, unique: true },
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    items: [orderItemSchema],
    contact: {
        firstName: {
            type: String,
            required: [true, "First name is required"],
            trim: true,
        },
        lastName: {
            type: String,
            required: [true, "Last name is required"],
            trim: true,
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            lowercase: true,
            trim: true,
        },
        phone: {
            type: String,
            required: [true, "Phone number is required"],
            trim: true,
        },
    },
    // The SAME rules as a saved address (STEP 20.1): "Street address is required", ...
    shippingAddress: {
        type: User_1.addressSchema,
        required: [true, "Please choose a delivery address."],
    },
    deliveryMethod: {
        type: String,
        enum: ["standard", "express"],
        required: true,
    },
    payment: {
        method: { type: String, enum: ["card", "pay_on_delivery"], required: true },
        status: { type: String, enum: ["paid", "pending", "refunded"], required: true },
        cardBrand: { type: String },
        cardLast4: { type: String },
        reference: { type: String },
        paidAt: { type: Date },
    },
    subtotal: { type: Number, required: true, min: 0 },
    deliveryFee: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    promoCode: { type: String },
    total: { type: Number, required: true, min: 0 },
    status: { type: String, enum: exports.ORDER_STATUSES, default: "processing" },
    statusHistory: [
        {
            _id: false,
            status: { type: String, enum: exports.ORDER_STATUSES, required: true },
            note: { type: String, default: "" },
            at: { type: Date, default: Date.now },
        },
    ],
    estimatedDelivery: { from: Date, to: Date },
    courier: { type: String },
    waybill: { type: String },
    deliveredAt: { type: Date },
    cancelledAt: { type: Date },
    cancelReason: { type: String, trim: true },
}, { timestamps: true });
// "My orders" always searches by user, newest first: an index makes that fast
orderSchema.index({ user: 1, createdAt: -1 });
exports.Order = (0, mongoose_1.model)("Order", orderSchema);
