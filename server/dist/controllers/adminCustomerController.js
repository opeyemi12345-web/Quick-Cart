"use strict";
// adminCustomerController.ts server/src/controllers/adminCustomerController.ts
// The admin's Customers page: every customer with how many orders they placed and how much they spent.
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCustomer = exports.getCustomers = void 0;
const mongoose_1 = require("mongoose");
const Order_1 = require("../models/Order");
const User_1 = require("../models/User");
const AppError_1 = require("../utils/AppError");
const escapeRegex_1 = require("../utils/escapeRegex");
const productController_1 = require("./productController");
const text = (value) => typeof value === "string" ? value.trim() : "";
const CUSTOMER_FIELDS = {
    firstName: 1,
    lastName: 1,
    email: 1,
    phone: 1,
    isEmailVerified: 1,
    createdAt: 1,
};
const SORTS = {
    newest: { createdAt: -1, _id: -1 },
    spent: { totalSpent: -1, _id: -1 },
    orders: { orderCount: -1, _id: -1 },
    name: { firstName: 1, lastName: 1, _id: 1 },
};
const withOrderStats = [
    {
        $lookup: {
            from: "orders",
            localField: "_id",
            foreignField: "user",
            as: "orders",
            pipeline: [{ $project: { total: 1, status: 1, createdAt: 1 } }],
        },
    },
    {
        $addFields: {
            orderCount: { $size: "$orders" },
            totalSpent: {
                $sum: {
                    $map: {
                        input: {
                            $filter: {
                                input: "$orders",
                                cond: { $ne: ["$$this.status", "cancelled"] },
                            },
                        },
                        in: "$$this.total",
                    },
                },
            },
            lastOrderAt: { $max: "$orders.createdAt" },
        },
    },
];
const getCustomers = async (req, res) => {
    const match = { role: "customer" };
    const search = text(req.query.search);
    if (search) {
        match.$or = [
            { email: new RegExp((0, escapeRegex_1.escapeRegex)(search), "i") },
            { phone: new RegExp((0, escapeRegex_1.escapeRegex)(search), "i") },
            {
                $expr: {
                    $regexMatch: {
                        input: { $concat: ["$firstName", " ", "$lastName"] },
                        regex: (0, escapeRegex_1.escapeRegex)(search),
                        options: "i",
                    },
                },
            },
        ];
    }
    const sort = SORTS[text(req.query.sort)] ?? SORTS.newest;
    const limit = Math.min((0, productController_1.wholeNumber)(req.query.limit, 10), 100);
    const page = (0, productController_1.wholeNumber)(req.query.page, 1);
    const [result] = await User_1.User.aggregate([
        { $match: match },
        ...withOrderStats,
        {
            $project: {
                ...CUSTOMER_FIELDS,
                orderCount: 1,
                totalSpent: 1,
                lastOrderAt: 1,
            },
        },
        { $sort: sort },
        {
            $facet: {
                customers: [{ $skip: (page - 1) * limit }, { $limit: limit }],
                total: [{ $count: "count" }],
            },
        },
    ]);
    const total = result.total[0]?.count ?? 0;
    res.json({ customers: result.customers, total, page, pages: Math.ceil(total / limit) });
};
exports.getCustomers = getCustomers;
const getCustomer = async (req, res) => {
    if (!productController_1.OBJECT_ID.test(req.params.id)) {
        throw new AppError_1.AppError(404, "Customer not found");
    }
    const [customer] = await User_1.User.aggregate([
        { $match: { _id: new mongoose_1.Types.ObjectId(req.params.id), role: "customer" } },
        ...withOrderStats,
        {
            $project: {
                ...CUSTOMER_FIELDS,
                addresses: 1,
                orderCount: 1,
                totalSpent: 1,
                lastOrderAt: 1,
            },
        },
    ]);
    if (!customer) {
        throw new AppError_1.AppError(404, "Customer not found");
    }
    const orders = await Order_1.Order.find({ user: customer._id })
        .select("orderNumber total status payment.status items.quantity createdAt")
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();
    res.json({ customer, orders });
};
exports.getCustomer = getCustomer;
