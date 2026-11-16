"use strict";
// adminDashboardController.ts server/src/controllers/adminDashboardController.ts
// The admin's Dashboard Overview: the 4 cards, the sales chart, average order value, refund rate,
// recent orders, top-selling products and low-stock alerts, all in ONE request.
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboard = void 0;
const Order_1 = require("../models/Order");
const Products_1 = require("../models/Products");
const Subscriber_1 = require("../models/Subscriber");
const User_1 = require("../models/User");
const AppError_1 = require("../utils/AppError");
const DAY = 24 * 60 * 60 * 1000;
const RANGES = {
    "7d": { days: 7, per: "day" },
    "30d": { days: 30, per: "day" },
    "90d": { days: 90, per: "day" },
    year: { days: 365, per: "month" },
};
const TIME_ZONE = "Africa/Lagos";
const dateKey = (date, per) => {
    const day = new Intl.DateTimeFormat("en-CA", {
        timeZone: TIME_ZONE,
    }).format(date);
    return per === "day" ? day : day.slice(0, 7);
};
const keyLabel = (key) => {
    const date = new Date(`${key.length === 7 ? `${key}-15` : key}T12:00:00Z`);
    return key.length === 7
        ? date.toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
            timeZone: "UTC",
        })
        : date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            timeZone: "UTC",
        });
};
const percentChange = (now, before) => before === 0 ? null : Math.round(((now - before) / before) * 1000) / 10;
const totalsBetween = async (from, to) => {
    const [totals] = await Order_1.Order.aggregate([
        { $match: { createdAt: { $gte: from, $lt: to } } },
        {
            $group: {
                _id: null,
                orders: { $sum: 1 },
                keptOrders: {
                    $sum: { $cond: [{ $ne: ["$status", "cancelled"] }, 1, 0] },
                },
                sales: {
                    $sum: {
                        $cond: [{ $ne: ["$status", "cancelled"] }, "$total", 0],
                    },
                },
                refunded: {
                    $sum: { $cond: [{ $eq: ["$payment.status", "refunded"] }, 1, 0] },
                },
            },
        },
    ]);
    return totals ?? { orders: 0, keptOrders: 0, sales: 0, refunded: 0 };
};
const NEEDS_RESTOCK = {
    trackStock: true,
    $expr: { $lte: ["$stock", "$lowStockThreshold"] },
};
const getDashboard = async (req, res) => {
    const rangeName = typeof req.query.range === "string" ? req.query.range : "30d";
    const range = RANGES[rangeName];
    if (!range) {
        throw new AppError_1.AppError(400, `Unknown range: ${rangeName}. Use one of: ${Object.keys(RANGES).join(", ")}.`);
    }
    const now = new Date();
    const from = new Date(now.getTime() - range.days * DAY);
    const previousFrom = new Date(from.getTime() - range.days * DAY);
    const [current, previous, chartRows, productCount, restockCount, lowStock, customerCount, newCustomers, subscribers, orderCount, recentOrders, topProducts,] = await Promise.all([
        totalsBetween(from, now),
        totalsBetween(previousFrom, from),
        Order_1.Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: from, $lt: now },
                    status: { $ne: "cancelled" },
                },
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            date: "$createdAt",
                            format: range.per === "day" ? "%Y-%m-%d" : "%Y-%m",
                            timezone: TIME_ZONE,
                        },
                    },
                    sales: { $sum: "$total" },
                    orders: { $sum: 1 },
                },
            },
        ]),
        Products_1.Product.countDocuments(),
        Products_1.Product.countDocuments(NEEDS_RESTOCK),
        Products_1.Product.find(NEEDS_RESTOCK)
            .select("name sku stock lowStockThreshold images")
            .sort({ stock: 1, name: 1 })
            .limit(5)
            .lean(),
        User_1.User.countDocuments({ role: "customer" }),
        User_1.User.countDocuments({
            role: "customer",
            createdAt: { $gte: from },
        }),
        Subscriber_1.Subscriber.countDocuments({ isSubscribed: true }),
        Order_1.Order.countDocuments(),
        Order_1.Order.find()
            .select("orderNumber contact total status payment.status payment.method createdAt")
            .sort({ createdAt: -1, _id: -1 })
            .limit(5)
            .lean(),
        Order_1.Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: from, $lt: now },
                    status: { $ne: "cancelled" },
                },
            },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.product",
                    name: { $first: "$items.name" },
                    image: { $first: "$items.image" },
                    sku: { $first: "$items.sku" },
                    sold: { $sum: "$items.quantity" },
                    revenue: { $sum: "$items.lineTotal" },
                },
            },
            { $sort: { sold: -1, revenue: -1 } },
            { $limit: 5 },
        ]),
    ]);
    const byKey = new Map(chartRows.map((row) => [row._id, row]));
    const keys = new Set();
    for (let time = from.getTime(); time <= now.getTime(); time += DAY) {
        keys.add(dateKey(new Date(time), range.per));
    }
    keys.add(dateKey(now, range.per));
    const chart = [...keys].map((key) => ({
        date: key,
        label: keyLabel(key),
        sales: byKey.get(key)?.sales ?? 0,
        orders: byKey.get(key)?.orders ?? 0,
    }));
    const peak = chart.reduce((best, point) => point.sales > 0 && (!best || point.sales > best.sales) ? point : best, null);
    res.json({
        range: rangeName,
        from,
        to: now,
        cards: {
            totalSales: current.sales,
            salesChange: percentChange(current.sales, previous.sales),
            totalOrders: current.orders,
            ordersChange: percentChange(current.orders, previous.orders),
            catalogProducts: productCount,
            needsRestock: restockCount,
            totalCustomers: customerCount,
            newCustomers,
            subscribers,
        },
        chart,
        peak,
        avgOrderValue: current.keptOrders === 0
            ? 0
            : Math.round(current.sales / current.keptOrders),
        refundRate: current.orders === 0
            ? 0
            : Math.round((current.refunded / current.orders) * 1000) / 10,
        recentOrders,
        totalOrdersAllTime: orderCount,
        topProducts: topProducts.map(({ _id, ...product }) => ({
            productId: _id,
            ...product,
        })),
        lowStock,
    });
};
exports.getDashboard = getDashboard;
