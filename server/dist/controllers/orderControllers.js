"use strict";
// orderController.ts server/src/controllers/orderController.ts
// Checkout and the customer's own orders.
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelOrder = exports.getOrder = exports.getOrderSummary = exports.getMyOrders = exports.placeOrder = exports.releaseStock = void 0;
const mongoose_1 = require("mongoose");
const env_1 = require("../config/env");
const Counter_1 = require("../models/Counter");
const Order_1 = require("../models/Order");
const Products_1 = require("../models/Products");
const PromoCode_1 = require("../models/PromoCode");
const AppError_1 = require("../utils/AppError");
const escapeRegex_1 = require("../utils/escapeRegex");
const orderRules_1 = require("../utils/orderRules");
const promo_1 = require("../utils/promo");
const sendEmail_1 = require("../utils/sendEmail");
const accountController_1 = require("./accountController");
const me = (req) => req.user;
const MAX_QUANTITY = 10; // per cart line
const FIRST_ORDER_NUMBER = 1042; // the first order is #QC-1042, like the designs
// ===== Helpers =====
// The body's "items" -> [{ productId, quantity, color }], or a 400 the checkout can show
const readCart = (items) => {
    if (!Array.isArray(items) || items.length === 0) {
        throw new AppError_1.AppError(400, "Your cart is empty.");
    }
    return items.map((item) => {
        const { productId, quantity, color } = (item ?? {});
        const qty = Number(quantity);
        if (!(0, mongoose_1.isValidObjectId)(productId)) {
            throw new AppError_1.AppError(400, "An item in your cart is no longer available. Please refresh your cart.");
        }
        // Number.isInteger: 2 yes; 1.5, "two", NaN no
        if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QUANTITY) {
            throw new AppError_1.AppError(400, `Quantity must be a whole number from 1 to ${MAX_QUANTITY}.`);
        }
        return {
            productId: String(productId),
            quantity: qty,
            color: color ? String(color) : undefined,
        };
    });
};
// Take the stock: one update per product. "stock: { $gte: qty }" = only if there's still enough.
// Two people buying the last one at the same moment: MongoDB lets only one update match, the other gets the 409.
const reserveStock = async (wanted, products) => {
    const reserved = [];
    for (const [id, quantity] of wanted) {
        const product = products.get(id);
        const result = product.trackStock
            ? await Products_1.Product.updateOne({ _id: id, stock: { $gte: quantity } }, { $inc: { stock: -quantity, sold: quantity } })
            : await Products_1.Product.updateOne({ _id: id }, { $inc: { sold: quantity } }); // made to order: stock isn't counted
        if (result.modifiedCount === 0) {
            await (0, exports.releaseStock)(reserved); // give back what we already took for this order
            throw new AppError_1.AppError(409, `Sorry, "${product.name}" just sold out. Please update your cart.`);
        }
        reserved.push({ product: id, quantity });
    }
};
// Put stock back (a cancelled order, or a checkout that failed half-way)
const releaseStock = async (lines) => {
    if (lines.length === 0)
        return; // bulkWrite refuses an empty list
    await Products_1.Product.bulkWrite(lines.flatMap(({ product, quantity }) => [
        {
            updateOne: {
                filter: { _id: product },
                update: { $inc: { sold: -quantity } },
            },
        },
        // only products that count their stock get it back
        {
            updateOne: {
                filter: { _id: product, trackStock: true },
                update: { $inc: { stock: quantity } },
            },
        },
    ]));
};
exports.releaseStock = releaseStock;
// The confirmation email (plain text: sendEmail turns it into simple HTML)
const confirmationEmail = (order) => {
    const delivery = orderRules_1.DELIVERY_OPTIONS[order.deliveryMethod];
    const address = order.shippingAddress;
    const lines = [
        `Hi ${order.contact.firstName},`,
        "",
        `Thank you for your order! We have received order #${order.orderNumber} and started preparing it for delivery.`,
        "",
        ...order.items.map((item) => `- ${item.name}${item.color ? ` (${item.color})` : ""} x ${item.quantity}: ${(0, promo_1.naira)(item.lineTotal)}`),
        "",
        `Subtotal: ${(0, promo_1.naira)(order.subtotal)}`,
        `Delivery (${delivery.label}): ${order.deliveryFee === 0 ? "FREE" : (0, promo_1.naira)(order.deliveryFee)}`,
    ];
    if (order.discount > 0) {
        lines.push(`Discount (${order.promoCode}): -${(0, promo_1.naira)(order.discount)}`);
    }
    lines.push(`Total: ${(0, promo_1.naira)(order.total)}`, "", order.payment.method === "card"
        ? `Payment: paid with ${order.payment.cardBrand} ending in ${order.payment.cardLast4}`
        : "Payment: pay on delivery (cash or POS)", `Delivering to: ${address.fullName}, ${address.street}, ${address.city}, ${address.state}`, `Estimated delivery: ${(0, orderRules_1.formatDate)(order.estimatedDelivery.from)} - ${(0, orderRules_1.formatDate)(order.estimatedDelivery.to)}`, "", `Track your order: ${env_1.env.clientUrl}/account/orders/${order.orderNumber}`, "", "Changed your mind? You can cancel free of charge within 1 hour of placing your order.", "", "The QuickCart team");
    return lines.join("\n");
};
// An order + what the "Cancel Order" button needs ("46 mins remaining")
const withCancelInfo = (order) => ({
    order,
    canCancel: (0, orderRules_1.canCancel)(order),
    cancelDeadline: (0, orderRules_1.cancelDeadline)(order),
});
// How many of MY orders are in each status: { processing: 1, delivered: 3, ... }
const countByStatus = async (userId) => {
    const groups = await Order_1.Order.aggregate([
        { $match: { user: userId } },
        { $group: { _id: "$status", count: { $sum: 1 } } }, // one group per status, counting the orders
    ]);
    const counts = { processing: 0, shipped: 0, delivered: 0, cancelled: 0 };
    for (const group of groups)
        counts[group._id] = group.count;
    return counts;
};
// Find one of MY orders from the URL: "QC-1042", "qc-1042" or "1042" all work. Someone else's order = 404.
const findMyOrder = async (req) => {
    let orderNumber = req.params.orderNumber.trim().toUpperCase();
    if (/^\d+$/.test(orderNumber))
        orderNumber = `QC-${orderNumber}`; // "1042" -> "QC-1042"
    const order = await Order_1.Order.findOne({ orderNumber, user: me(req)._id });
    if (!order) {
        throw new AppError_1.AppError(404, "Order not found");
    }
    return order;
};
// ===== Place an order =====
// POST /api/orders
// {
//   "items": [{ "productId": "...", "quantity": 2, "color": "Midnight Black" }],
//   "contact": { "firstName", "lastName", "email", "phone" },   (optional: the account's details are used)
//   "addressId": "..."  OR  "address": { "fullName", "phone", "street", "city", "state", "instructions"? },
//   "deliveryMethod": "standard" | "express",
//   "paymentMethod": "card" | "pay_on_delivery",
//   "card": { "number": "4242 4242 4242 4242", "expiry": "08/28", "cvv": "987" },   (card only)
//   "promoCode": "QUICK25"   (optional)
// }
const placeOrder = async (req, res) => {
    const user = me(req);
    const body = req.body ?? {};
    const cart = readCart(body.items);
    const ids = [...new Set(cart.map((line) => line.productId))];
    const found = await Products_1.Product.find({
        $and: [{ _id: { $in: ids } }, (0, Products_1.liveProducts)()],
    });
    const products = new Map(found.map((product) => [String(product._id), product]));
    if (products.size !== ids.length) {
        throw new AppError_1.AppError(400, "An item in your cart is no longer available. Please refresh your cart.");
    }
    const wanted = new Map();
    const items = cart.map((line) => {
        const product = products.get(line.productId);
        wanted.set(line.productId, (wanted.get(line.productId) ?? 0) + line.quantity);
        return {
            product: product._id,
            name: product.name,
            image: product.images[0] ?? "",
            sku: product.sku,
            price: product.price,
            quantity: line.quantity,
            color: line.color,
            lineTotal: product.price * line.quantity,
        };
    });
    for (const [id, quantity] of wanted) {
        const product = products.get(id);
        if (product.trackStock && product.stock < quantity) {
            throw new AppError_1.AppError(400, product.stock === 0
                ? `"${product.name}" is sold out. Please remove it from your cart.`
                : `Only ${product.stock} left of "${product.name}". Please lower the quantity.`);
        }
    }
    const deliveryMethod = body.deliveryMethod ?? "standard";
    if (deliveryMethod !== "standard" && deliveryMethod !== "express") {
        throw new AppError_1.AppError(400, "Please choose a delivery method.");
    }
    const paymentMethod = body.paymentMethod;
    if (paymentMethod !== "card" && paymentMethod !== "pay_on_delivery") {
        throw new AppError_1.AppError(400, "Please choose a payment method.");
    }
    let shippingAddress;
    if (body.addressId) {
        const saved = user.addresses.find((address) => String(address._id) === String(body.addressId));
        if (!saved) {
            throw new AppError_1.AppError(404, "Address not found");
        }
        shippingAddress = (0, accountController_1.pickAddress)(saved);
    }
    else if (body.address && typeof body.address === "object") {
        shippingAddress = (0, accountController_1.pickAddress)(body.address);
    }
    else {
        throw new AppError_1.AppError(400, "Please choose a delivery address.");
    }
    if (deliveryMethod === "express" && !(0, orderRules_1.isLagos)(shippingAddress.state)) {
        throw new AppError_1.AppError(400, "Express Same-Day Dispatch is only available in Lagos.");
    }
    if (paymentMethod === "pay_on_delivery" && !(0, orderRules_1.isLagos)(shippingAddress.state)) {
        throw new AppError_1.AppError(400, "Pay on Delivery is only available in Lagos.");
    }
    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    let discount = 0;
    let promoCode;
    if (body.promoCode) {
        const result = await (0, promo_1.applyPromo)(body.promoCode, subtotal);
        discount = result.discount;
        promoCode = result.promo.code;
    }
    const deliveryFee = orderRules_1.DELIVERY_OPTIONS[deliveryMethod].fee;
    const total = subtotal - discount + deliveryFee;
    const contact = body.contact ?? {};
    const placedAt = new Date();
    const order = new Order_1.Order({
        user: user._id,
        items,
        contact: {
            firstName: contact.firstName ?? user.firstName,
            lastName: contact.lastName ?? user.lastName,
            email: contact.email ?? user.email,
            phone: contact.phone ?? user.phone,
        },
        shippingAddress,
        deliveryMethod,
        payment: { method: paymentMethod, status: "pending" },
        subtotal,
        deliveryFee,
        discount,
        promoCode,
        total,
        status: "processing",
        statusHistory: [{ status: "processing", note: "Order placed", at: placedAt }],
        estimatedDelivery: (0, orderRules_1.estimateDelivery)(deliveryMethod, placedAt),
    });
    await order.validate();
    if (paymentMethod === "card") {
        Object.assign(order.payment, {
            status: "paid",
            ...(0, orderRules_1.chargeCard)(body.card),
        });
    }
    await reserveStock(wanted, products);
    try {
        order.orderNumber = `QC-${FIRST_ORDER_NUMBER - 1 + (await (0, Counter_1.nextNumber)("order"))}`;
        await order.save();
    }
    catch (error) {
        await (0, exports.releaseStock)(items);
        throw error;
    }
    if (promoCode) {
        await PromoCode_1.PromoCode.updateOne({ code: promoCode }, { $inc: { usedCount: 1 } });
    }
    void (0, sendEmail_1.sendEmail)(order.contact.email, `Order #${order.orderNumber} confirmed`, confirmationEmail(order));
    res.status(201).json({
        message: "Your order has been placed!",
        ...withCancelInfo(order),
    });
};
exports.placeOrder = placeOrder;
// ===== My orders =====
const STATUS_TABS = new Map([
    ["in-progress", "processing"],
    ["shipped", "shipped"],
    ["delivered", "delivered"],
    ["cancelled", "cancelled"],
]);
// GET /api/orders?status=delivered&search=QC-1042&sort=oldest
const getMyOrders = async (req, res) => {
    const { status, search, sort } = req.query;
    const filter = { user: me(req)._id };
    if (typeof status === "string" && STATUS_TABS.has(status)) {
        filter.status = STATUS_TABS.get(status);
    }
    if (typeof search === "string" && search.trim()) {
        const text = new RegExp((0, escapeRegex_1.escapeRegex)(search.trim().replace(/^#/, "")), "i");
        filter.$or = [{ orderNumber: text }, { "items.name": text }];
    }
    const [orders, counts] = await Promise.all([
        Order_1.Order.find(filter).sort({ createdAt: sort === "oldest" ? 1 : -1 }),
        countByStatus(me(req)._id),
    ]);
    res.json({
        orders,
        counts: {
            all: counts.processing + counts.shipped + counts.delivered + counts.cancelled,
            "in-progress": counts.processing,
            shipped: counts.shipped,
            delivered: counts.delivered,
            cancelled: counts.cancelled,
        },
    });
};
exports.getMyOrders = getMyOrders;
// GET /api/orders/summary -> the My Account overview
const getOrderSummary = async (req, res) => {
    const [counts, recentOrders] = await Promise.all([
        countByStatus(me(req)._id),
        Order_1.Order.find({ user: me(req)._id }).sort({ createdAt: -1 }).limit(3),
    ]);
    res.json({
        totalOrders: counts.processing + counts.shipped + counts.delivered + counts.cancelled,
        inProgress: counts.processing + counts.shipped,
        delivered: counts.delivered,
        recentOrders,
    });
};
exports.getOrderSummary = getOrderSummary;
// GET /api/orders/:orderNumber
const getOrder = async (req, res) => {
    res.json(withCancelInfo(await findMyOrder(req)));
};
exports.getOrder = getOrder;
// ===== Cancel =====
// PATCH /api/orders/:orderNumber/cancel   { "reason"?: "Ordered the wrong colour" }
const cancelOrder = async (req, res) => {
    const order = await findMyOrder(req);
    if (order.status === "cancelled") {
        throw new AppError_1.AppError(400, "This order is already cancelled.");
    }
    if (order.status !== "processing") {
        throw new AppError_1.AppError(400, "This order has already left our warehouse, so it can't be cancelled. Please contact support.");
    }
    if (!(0, orderRules_1.canCancel)(order)) {
        throw new AppError_1.AppError(400, "Free cancellation is only available within 1 hour of placing your order. Please contact support.");
    }
    const now = new Date();
    const cancelled = await Order_1.Order.findOneAndUpdate({ _id: order._id, status: "processing" }, {
        $set: {
            status: "cancelled",
            cancelledAt: now,
            cancelReason: String(req.body?.reason ?? "").trim() || undefined,
            "payment.status": order.payment.status === "paid" ? "refunded" : order.payment.status,
        },
        $push: {
            statusHistory: {
                status: "cancelled",
                note: "Cancelled by you",
                at: now,
            },
        },
    }, { returnDocument: "after" });
    if (!cancelled) {
        throw new AppError_1.AppError(400, "This order is already cancelled.");
    }
    await (0, exports.releaseStock)(cancelled.items);
    if (cancelled.promoCode) {
        await PromoCode_1.PromoCode.updateOne({ code: cancelled.promoCode }, { $inc: { usedCount: -1 } });
    }
    void (0, sendEmail_1.sendEmail)(cancelled.contact.email, `Order #${cancelled.orderNumber} cancelled`, [
        `Hi ${cancelled.contact.firstName},`,
        "",
        `Your order #${cancelled.orderNumber} has been cancelled.`,
        cancelled.payment.status === "refunded"
            ? `Your payment of ${(0, promo_1.naira)(cancelled.total)} will be refunded to your ${cancelled.payment.cardBrand} card ending in ${cancelled.payment.cardLast4}.`
            : "You have not been charged.",
        "",
        "The QuickCart team",
    ].join("\n"));
    res.json({
        message: "Your order has been cancelled.",
        ...withCancelInfo(cancelled),
    });
};
exports.cancelOrder = cancelOrder;
