"use strict";
// demoController.ts server/src/controllers/demoController.ts
// The demo panel: buttons for whoever is presenting the shop (admins only).
Object.defineProperty(exports, "__esModule", { value: true });
exports.advanceOrders = exports.resetDemo = void 0;
// STEP 28 (part 3): The demo panel
// POST /api/admin/demo/reset            { "confirm": "RESET" }  -> everything back to the demo data
// POST /api/admin/demo/advance-orders   -> every order moves one step: processing -> shipped -> delivered
const crypto_1 = require("crypto");
const cloudinary_1 = require("../config/cloudinary");
const seed_1 = require("../data/seed");
const Order_1 = require("../models/Order");
const AppError_1 = require("../utils/AppError");
const adminOrderController_1 = require("./adminOrderController");
// POST /api/admin/demo/reset
// The same as "npm run seed", from the website, plus the photos admins uploaded are deleted from Cloudinary.
// Newsletter subscribers are kept: they're real people (STEP 24).
const resetDemo = async (req, res) => {
    if (req.body?.confirm !== "RESET") {
        throw new AppError_1.AppError(400, 'This deletes all changes. Send { "confirm": "RESET" } to go ahead.');
    }
    await (0, cloudinary_1.deleteAllUploadedPhotos)();
    const result = await (0, seed_1.seedDatabase)();
    res.json({
        message: "The demo data has been reset. Please log in again.",
        ...result,
    });
};
exports.resetDemo = resetDemo;
// POST /api/admin/demo/advance-orders
// Shows the order tracker moving during a demo without clicking every order. No emails are sent.
const advanceOrders = async (_req, res) => {
    const now = new Date();
    let delivered = 0;
    let shipped = 0;
    // Shipments already in transit are delivered first, so newly shipped orders wait until the next call.
    const inTransit = await Order_1.Order.find({ status: "shipped" });
    for (const order of inTransit) {
        const set = { status: "delivered", deliveredAt: now };
        if (order.payment.status === "pending") {
            set["payment.status"] = "paid";
            set["payment.paidAt"] = now;
        }
        const updated = await Order_1.Order.updateOne({ _id: order._id, status: "shipped" }, { $set: set, $push: { statusHistory: { status: "delivered", note: "Delivered", at: now } } });
        delivered += updated.modifiedCount;
    }
    const waiting = await Order_1.Order.find({ status: "processing" });
    const couriers = Object.keys(adminOrderController_1.COURIERS);
    for (const order of waiting) {
        const courier = couriers[(0, crypto_1.randomInt)(couriers.length)];
        const waybill = `${adminOrderController_1.COURIERS[courier]}-${(0, crypto_1.randomInt)(100000, 1000000)}`;
        const updated = await Order_1.Order.updateOne({ _id: order._id, status: "processing" }, {
            $set: { status: "shipped", courier, waybill },
            $push: { statusHistory: { status: "shipped", note: `Dispatched with ${courier} (waybill ${waybill})`, at: now } },
        });
        shipped += updated.modifiedCount;
    }
    res.json({ message: `${shipped} order(s) shipped and ${delivered} order(s) delivered.`, shipped, delivered });
};
exports.advanceOrders = advanceOrders;
