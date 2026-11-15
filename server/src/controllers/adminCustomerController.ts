// adminCustomerController.ts server/src/controllers/adminCustomerController.ts
// The admin's Customers page: every customer with how many orders they placed and how much they spent.

// STEP 26 (part 2): Admin customers
// GET /api/admin/customers       ?search=ada&sort=spent&page=1&limit=10
// GET /api/admin/customers/:id   -> one customer, their addresses and their orders

import { Request, Response } from "express";
import { PipelineStage, Types } from "mongoose";
import { Order } from "../models/Order";
import { User } from "../models/User";
import { AppError } from "../utils/AppError";
import { escapeRegex } from "../utils/escapeRegex";
import { OBJECT_ID, wholeNumber } from "./productController";

const text = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const CUSTOMER_FIELDS = {
  firstName: 1,
  lastName: 1,
  email: 1,
  phone: 1,
  isEmailVerified: 1,
  createdAt: 1,
};

const SORTS: Record<string, Record<string, 1 | -1>> = {
  newest: { createdAt: -1, _id: -1 },
  spent: { totalSpent: -1, _id: -1 },
  orders: { orderCount: -1, _id: -1 },
  name: { firstName: 1, lastName: 1, _id: 1 },
};

const withOrderStats: PipelineStage[] = [
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

export const getCustomers = async (req: Request, res: Response) => {
  const match: Record<string, unknown> = { role: "customer" };

  const search = text(req.query.search);
  if (search) {
    match.$or = [
      { email: new RegExp(escapeRegex(search), "i") },
      { phone: new RegExp(escapeRegex(search), "i") },
      {
        $expr: {
          $regexMatch: {
            input: { $concat: ["$firstName", " ", "$lastName"] },
            regex: escapeRegex(search),
            options: "i",
          },
        },
      },
    ];
  }

  const sort = SORTS[text(req.query.sort)] ?? SORTS.newest;
  const limit = Math.min(wholeNumber(req.query.limit, 10), 100);
  const page = wholeNumber(req.query.page, 1);

  const [result] = await User.aggregate<{
    customers: unknown[];
    total: { count: number }[];
  }>([
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

export const getCustomer = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  if (!OBJECT_ID.test(req.params.id)) {
    throw new AppError(404, "Customer not found");
  }

  const [customer] = await User.aggregate([
    { $match: { _id: new Types.ObjectId(req.params.id), role: "customer" } },
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
    throw new AppError(404, "Customer not found");
  }

  const orders = await Order.find({ user: customer._id })
    .select("orderNumber total status payment.status items.quantity createdAt")
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  res.json({ customer, orders });
};
