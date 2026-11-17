// admin.ts client/src/types/admin.ts
// The shapes of the admin API's replies (server STEPs 25–28).

// STEP 41 (part 1): Admin types

import type { Order, OrderStatus } from "./api";

export type DashboardRange = "7d" | "30d" | "90d" | "year";

// GET /api/admin/dashboard?range=30d
export type DashboardResponse = {
  range: DashboardRange;
  cards: {
    totalSales: number;
    salesChange: number | null;
    totalOrders: number;
    ordersChange: number | null;
    catalogProducts: number;
    needsRestock: number;
    totalCustomers: number;
    newCustomers: number;
    subscribers: number;
  };
  chart: { date: string; label: string; sales: number; orders: number }[];
  peak: { date: string; label: string; sales: number; orders: number } | null;
  avgOrderValue: number;
  refundRate: number;
  recentOrders: Pick<
    Order,
    "_id" | "orderNumber" | "contact" | "total" | "status" | "payment" | "createdAt"
  >[];
  totalOrdersAllTime: number;
  topProducts: {
    productId: string;
    name: string;
    image: string;
    sku: string;
    sold: number;
    revenue: number;
  }[];
  lowStock: {
    _id: string;
    name: string;
    sku: string;
    stock: number;
    lowStockThreshold: number;
    images: string[];
  }[];
};

// The tab numbers of GET /api/admin/orders (STEP 26)
export type AdminOrderCounts = Record<"all" | OrderStatus, number>;
