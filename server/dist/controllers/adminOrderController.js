"use strict";
// adminOrderController.ts server/src/controllers/adminOrderController.ts
// The admin's Orders Management page: every customer's orders, and moving an order along
// processing -> shipped -> delivered (or cancelling it).
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateOrderStatus = exports.getAdminOrder = exports.getAdminOrders = exports.COURIERS = void 0;
// STEP 26 (part 1): Admin orders
// GET   /api/admin/orders                      ?status=processing&search=ada&payment=paid&courier=GIG Logistics&days=30&page=1
// GET   /api/admin/orders/:orderNumber         -> one order with its customer
// PATCH /api/admin/orders/:orderNumber/status  { "status": "shipped", "courier": "GIG Logistics", "waybill"?: "..." }
//                                              { "status": "delivered" }
//                                              { "status": "cancelled", "reason": "Out of stock" }
const crypto_1 = require("crypto");
const env_1 = require("../config/env");
const Order_1 = require("../models/Order");
const PromoCode_1 = require("../models/PromoCode");
const AppError_1 = require("../utils/AppError");
const escapeRegex_1 = require("../utils/escapeRegex");
const promo_1 = require("../utils/promo");
const sendEmail_1 = require("../utils/sendEmail");
const orderControllers_1 = require("./orderControllers");
const productController_1 = require("./productController");
exports.COURIERS = {
    "QuickCart Express": "QCX",
    "GIG Logistics": "GIG",
    "DHL Express": "DHL",
};
const NEXT_STATUS = {
    processing: ["shipped", "cancelled"],
    shipped: ["delivered", "cancelled"],
    delivered: [],
    cancelled: [],
};
const text = (value) => typeof value === "string" ? value.trim() : "";
const toOrderNumber = (value) => {
    const cleaned = value.trim().toUpperCase().replace(/^#/, "");
    return /^\d+$/.test(cleaned) ? `QC-${cleaned}` : cleaned;
};
const findOrder = async (orderNumber) => {
    const order = await Order_1.Order.findOne({
        orderNumber: toOrderNumber(orderNumber),
    });
    if (!order) {
        throw new AppError_1.AppError(404, "Order not found");
    }
    return order;
};
const TABLE_FIELDS = "orderNumber waybill courier contact shippingAddress.city shippingAddress.state items.name items.image items.quantity total payment.method payment.status payment.cardBrand status createdAt";
const getAdminOrders = async (req, res) => {
    const conditions = [];
    const status = text(req.query.status) || "all";
    if (status !== "all") {
        if (!Order_1.ORDER_STATUSES.includes(status)) {
            throw new AppError_1.AppError(400, `Unknown status: ${status}. Use all, ${Order_1.ORDER_STATUSES.join(", ")}.`);
        }
        conditions.push({ status });
    }
    const search = text(req.query.search).replace(/^#/, "");
    if (search) {
        const pattern = new RegExp((0, escapeRegex_1.escapeRegex)(search), "i");
        conditions.push({
            $or: [
                { orderNumber: pattern },
                { waybill: pattern },
                { "contact.email": pattern },
                {
                    $expr: {
                        $regexMatch: {
                            input: {
                                $concat: ["$contact.firstName", " ", "$contact.lastName"],
                            },
                            regex: (0, escapeRegex_1.escapeRegex)(search),
                            options: "i",
                        },
                    },
                },
            ],
        });
    }
    const payment = text(req.query.payment);
    if (payment) {
        conditions.push({ "payment.status": payment });
    }
    const courier = text(req.query.courier);
    if (courier) {
        conditions.push({ courier });
    }
    const days = (0, productController_1.wholeNumber)(req.query.days, 0);
    if (days > 0) {
        conditions.push({
            createdAt: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) },
        });
    }
    const filter = conditions.length > 0 ? { $and: conditions } : {};
    const limit = Math.min((0, productController_1.wholeNumber)(req.query.limit, 10), 100);
    const page = (0, productController_1.wholeNumber)(req.query.page, 1);
    const [orders, total, groups] = await Promise.all([
        Order_1.Order.find(filter)
            .select(TABLE_FIELDS)
            .sort({ createdAt: -1, _id: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        Order_1.Order.countDocuments(filter),
        Order_1.Order.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                    amount: { $sum: "$total" },
                },
            },
        ]),
    ]);
    const counts = {
        all: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
    };
    let sales = 0;
    let refunded = 0;
    for (const group of groups) {
        counts[group._id] = group.count;
        counts.all += group.count;
        if (group._id === "cancelled") {
            refunded = group.amount;
        }
        else {
            sales += group.amount;
        }
    }
    res.json({
        orders,
        total,
        page,
        pages: Math.ceil(total / limit),
        counts,
        sales,
        refunded,
        couriers: Object.keys(exports.COURIERS),
    });
};
exports.getAdminOrders = getAdminOrders;
const getAdminOrder = async (req, res) => {
    const order = await findOrder(req.params.orderNumber);
    await order.populate("user", "firstName lastName email phone createdAt");
    res.json({
        order,
        nextStatuses: NEXT_STATUS[order.status],
        couriers: Object.keys(exports.COURIERS),
    });
};
exports.getAdminOrder = getAdminOrder;
const statusEmail = (order) => {
    const hi = `Hi ${order.contact.firstName},`;
    const track = `Track your order: ${env_1.env.clientUrl}/account/orders/${order.orderNumber}`;
    if (order.status === "shipped") {
        return {
            subject: `Order #${order.orderNumber} is on its way 🚚`,
            text: [
                hi,
                "",
                `Your order has left our warehouse with ${order.courier}.`,
                `Waybill number: ${order.waybill}`,
                "",
                track,
                "",
                "The QuickCart team",
            ],
        };
    }
    if (order.status === "delivered") {
        return {
            subject: `Order #${order.orderNumber} has been delivered`,
            text: [
                hi,
                "",
                "Your order has been delivered. We hope you love it!",
                "",
                `Tell other shoppers what you think: ${env_1.env.clientUrl}/account/orders/${order.orderNumber}`,
                "",
                "The QuickCart team",
            ],
        };
    }
    return {
        subject: `Order #${order.orderNumber} cancelled`,
        text: [
            hi,
            "",
            `We're sorry: we had to cancel your order #${order.orderNumber}.`,
            ...(order.cancelReason ? [`Reason: ${order.cancelReason}`] : []),
            order.payment.status === "refunded"
                ? `Your payment of ${(0, promo_1.naira)(order.total)} will be refunded to your ${order.payment.cardBrand} card ending in ${order.payment.cardLast4}.`
                : "You have not been charged.",
            "",
            "The QuickCart team",
        ],
    };
};
const updateOrderStatus = async (req, res) => {
    const order = await findOrder(req.params.orderNumber);
    const next = text(req.body?.status);
    if (!Order_1.ORDER_STATUSES.includes(next)) {
        throw new AppError_1.AppError(400, `Please choose the new status: ${Order_1.ORDER_STATUSES.join(", ")}.`);
    }
    if (!NEXT_STATUS[order.status].includes(next)) {
        throw new AppError_1.AppError(400, `A ${order.status} order can't be marked as ${next}.`);
    }
    const now = new Date();
    const set = { status: next };
    let note;
    if (next === "shipped") {
        const courier = text(req.body?.courier);
        if (!exports.COURIERS[courier]) {
            throw new AppError_1.AppError(400, `Please choose a courier: ${Object.keys(exports.COURIERS).join(", ")}.`);
        }
        const waybill = text(req.body?.waybill).toUpperCase() ||
            `${exports.COURIERS[courier]}-${(0, crypto_1.randomInt)(100000, 1000000)}`;
        set.courier = courier;
        set.waybill = waybill;
        note = `Dispatched with ${courier} (waybill ${waybill})`;
    }
    else if (next === "delivered") {
        set.deliveredAt = now;
        if (order.payment.status === "pending") {
            set["payment.status"] = "paid";
            set["payment.paidAt"] = now;
        }
        note = "Delivered";
    }
    else {
        set.cancelledAt = now;
        const reason = text(req.body?.reason);
        if (reason) {
            set.cancelReason = reason;
        }
        if (order.payment.status === "paid") {
            set["payment.status"] = "refunded";
        }
        note =
            order.status === "shipped"
                ? "Returned by the courier and cancelled by QuickCart"
                : "Cancelled by QuickCart";
    }
    const updated = await Order_1.Order.findOneAndUpdate({ _id: order._id, status: order.status }, { $set: set, $push: { statusHistory: { status: next, note, at: now } } }, { returnDocument: "after", runValidators: true });
    if (!updated) {
        throw new AppError_1.AppError(409, "This order was just changed by someone else. Please refresh and try again.");
    }
    if (next === "cancelled") {
        await (0, orderControllers_1.releaseStock)(updated.items);
        if (updated.promoCode) {
            await PromoCode_1.PromoCode.updateOne({ code: updated.promoCode }, { $inc: { usedCount: -1 } });
        }
    }
    const email = statusEmail(updated);
    void (0, sendEmail_1.sendEmail)(updated.contact.email, email.subject, email.text.join("\n"));
    res.json({
        message: `Order #${updated.orderNumber} is now ${next}.`,
        order: updated,
        nextStatuses: NEXT_STATUS[updated.status],
    });
};
exports.updateOrderStatus = updateOrderStatus;
