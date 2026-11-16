// demoOrders.ts server/src/data/demoOrders.ts
// Demo orders, so the admin dashboard, Orders Management and Ada's Order History aren't empty after a seed.
// seed.ts calls createDemoOrders() last, after the products and users are saved.

// STEP 28 (part 1): Demo orders

import { Types } from "mongoose";
import { COURIERS } from "../controllers/adminOrderController";
import { IOrder, IOrderItem, IStatusUpdate, Order } from "../models/Order";
import { IProduct } from "../models/Products";
import { IAddress, User } from "../models/User";
import {
  DELIVERY_OPTIONS,
  DeliveryMethod,
  estimateDelivery,
} from "../utils/orderRules";
import { DemoUser } from "./users";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const LAST_DEMO_NUMBER = 1041;

const shopper = (
  firstName: string,
  lastName: string,
  email: string,
  phone: string,
  street: string,
  city: string,
  state: string,
): DemoUser => ({
  firstName,
  lastName,
  email,
  phone,
  password: "Password@123",
  role: "customer",
  isEmailVerified: true,
  addresses: [
    {
      label: "Home",
      fullName: `${firstName} ${lastName}`,
      phone,
      street,
      city,
      state,
      country: "Nigeria",
      isDefault: true,
    },
  ],
});

export const demoShoppers: DemoUser[] = [
  shopper(
    "Babatunde",
    "Adeleke",
    "tunde.adeleke@example.com",
    "+2348021112233",
    "8 Isaac John Street",
    "Ikeja GRA",
    "Lagos State",
  ),
  shopper(
    "Chioma",
    "Nwosu",
    "chioma.nwosu@example.com",
    "+2348034445566",
    "21 Ogui Road",
    "Independence Layout",
    "Enugu State",
  ),
  shopper(
    "Emeka",
    "Okafor",
    "emeka.okafor@example.com",
    "+2348057778899",
    "5 Aminu Kano Crescent",
    "Maitama",
    "FCT Abuja",
  ),
  shopper(
    "Fatima",
    "Danjuma",
    "fatima.danjuma@example.com",
    "+2348090001122",
    "14 Sultan Road",
    "Nassarawa GRA",
    "Kano State",
  ),
];

const makeRandom = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

type SavedProduct = IProduct & { _id: Types.ObjectId };
type Customer = {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  addresses: IAddress[];
};

type Plan = {
  customer: Customer;
  address: IAddress;
  lines: { product: SavedProduct; quantity: number }[];
  placedAt: Date;
  status: IOrder["status"];
  method: DeliveryMethod;
  payOnDelivery: boolean;
};

const buildOrder = (
  plan: Plan,
  orderNumber: number,
  random: () => number,
): Partial<IOrder> => {
  const { customer, address, placedAt, status, method } = plan;

  const items: IOrderItem[] = plan.lines.map(({ product, quantity }) => ({
    product: product._id,
    name: product.name,
    image: product.images[0] ?? "",
    sku: product.sku,
    price: product.price,
    quantity,
    color: product.colors[0]?.name,
    lineTotal: product.price * quantity,
  }));

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const deliveryFee = DELIVERY_OPTIONS[method].fee;
  const history: IStatusUpdate[] = [
    { status: "processing", note: "Order placed", at: placedAt },
  ];
  const courier = Object.keys(COURIERS)[Math.floor(random() * 3)];
  const waybill = `${COURIERS[courier]}-${100000 + Math.floor(random() * 900000)}`;
  const shippedAt = new Date(placedAt.getTime() + 20 * HOUR);
  const deliveredAt = new Date(
    shippedAt.getTime() + (1 + Math.floor(random() * 2)) * DAY,
  );
  const cancelledAt = new Date(placedAt.getTime() + 30 * 60 * 1000);

  if (status === "shipped" || status === "delivered") {
    history.push({
      status: "shipped",
      note: `Dispatched with ${courier} (waybill ${waybill})`,
      at: shippedAt,
    });
  }
  if (status === "delivered") {
    history.push({ status: "delivered", note: "Delivered", at: deliveredAt });
  }
  if (status === "cancelled") {
    history.push({
      status: "cancelled",
      note: "Cancelled by you",
      at: cancelledAt,
    });
  }

  const card = !plan.payOnDelivery;
  const payment = card
    ? {
        method: "card" as const,
        status: status === "cancelled" ? ("refunded" as const) : ("paid" as const),
        cardBrand: ["Visa", "Mastercard", "Verve"][Math.floor(random() * 3)],
        cardLast4: String(1000 + Math.floor(random() * 9000)),
        reference: `PSTK-${100000000 + Math.floor(random() * 900000000)}`,
        paidAt: placedAt,
      }
    : {
        method: "pay_on_delivery" as const,
        status: status === "delivered" ? ("paid" as const) : ("pending" as const),
        paidAt: status === "delivered" ? deliveredAt : undefined,
      };

  const { _id, ...shippingAddress } = address;

  return {
    orderNumber: `QC-${orderNumber}`,
    user: customer._id,
    items,
    contact: {
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone ?? address.phone,
    },
    shippingAddress,
    deliveryMethod: method,
    payment,
    subtotal,
    deliveryFee,
    discount: 0,
    total: subtotal + deliveryFee,
    status,
    statusHistory: history,
    estimatedDelivery: estimateDelivery(method, placedAt),
    ...(status === "shipped" || status === "delivered" ? { courier, waybill } : {}),
    ...(status === "delivered" ? { deliveredAt } : {}),
    ...(status === "cancelled" ? { cancelledAt } : {}),
    createdAt: placedAt,
  };
};

const statusForAge = (
  daysAgo: number,
  random: () => number,
): IOrder["status"] => {
  if (random() < 0.06) return "cancelled";
  if (daysAgo < 1) return "processing";
  if (daysAgo < 3) return "shipped";
  return "delivered";
};

export const createDemoOrders = async (products: SavedProduct[]) => {
  const random = makeRandom(1042);
  const now = Date.now();
  const bySku = new Map(products.map((product) => [product.sku, product]));
  const sku = (code: string) => bySku.get(code)!;

  const ada = await User.findOne({ email: "ada.obi@example.com" }).lean<Customer>();
  const shoppers = await User.create(demoShoppers);
  const customers: Customer[] = shoppers.map((user) => user.toObject());

  const plans: Plan[] = [];

  if (ada) {
    const [home, office] = ada.addresses;
    const adaOrder = (
      daysAgo: number,
      status: IOrder["status"],
      lines: [string, number][],
      address = home,
    ) =>
      plans.push({
        customer: ada,
        address,
        lines: lines.map(([code, quantity]) => ({
          product: sku(code),
          quantity,
        })),
        placedAt: new Date(now - daysAgo * DAY),
        status,
        method: "standard",
        payOnDelivery: false,
      });

    adaOrder(0.02, "processing", [
      ["QC-AU-9042", 2],
      ["QC-HM-108", 1],
    ]);
    adaOrder(1.5, "shipped", [["QC-FTWR-312", 1]]);
    adaOrder(
      12,
      "delivered",
      [
        ["QC-HM-108", 1],
        [products.find((product) => product.name === "Design Systems Handbook")!.sku, 1],
      ],
      office,
    );
    adaOrder(40, "delivered", [
      [products.find((product) => product.name === "Compact GaN Fast Charger 65W")!.sku, 1],
    ]);
    adaOrder(70, "delivered", [
      [products.find((product) => product.name === "Eco Grip Yoga Mat")!.sku, 1],
    ]);
  }

  const forSale = products.filter(
    (product) => product.status === "published" && product.images.length > 0,
  );
  for (let i = 0; i < 36; i++) {
    const daysAgo = Math.pow(random(), 1.6) * 90;
    const customer = customers[Math.floor(random() * customers.length)];
    const address = customer.addresses[0];
    const inLagos = /lagos/i.test(address.state);
    const lineCount = 1 + Math.floor(random() * 3);
    const picked = new Set<SavedProduct>();
    while (picked.size < lineCount) {
      picked.add(forSale[Math.floor(random() * forSale.length)]);
    }

    plans.push({
      customer,
      address,
      lines: [...picked].map((product) => ({
        product,
        quantity: 1 + Math.floor(random() * 2),
      })),
      placedAt: new Date(now - daysAgo * DAY),
      status: statusForAge(daysAgo, random),
      method: inLagos && random() < 0.3 ? "express" : "standard",
      payOnDelivery: inLagos && random() < 0.4,
    });
  }

  plans.sort((a, b) => a.placedAt.getTime() - b.placedAt.getTime());
  const firstNumber = LAST_DEMO_NUMBER - plans.length + 1;
  const orders = plans.map((plan, index) =>
    buildOrder(plan, firstNumber + index, random),
  );

  await Order.insertMany(orders);

  return orders.length;
};
