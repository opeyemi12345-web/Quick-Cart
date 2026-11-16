"use strict";
// demoOrders.ts server/src/data/demoOrders.ts
// Demo orders, so the admin dashboard, Orders Management and Ada's Order History aren't empty after a seed.
// seed.ts calls createDemoOrders() last, after the products and users are saved.
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDemoOrders = exports.demoShoppers = void 0;
const adminOrderController_1 = require("../controllers/adminOrderController");
const Order_1 = require("../models/Order");
const User_1 = require("../models/User");
const orderRules_1 = require("../utils/orderRules");
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const LAST_DEMO_NUMBER = 1041;
const shopper = (firstName, lastName, email, phone, street, city, state) => ({
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
exports.demoShoppers = [
    shopper("Babatunde", "Adeleke", "tunde.adeleke@example.com", "+2348021112233", "8 Isaac John Street", "Ikeja GRA", "Lagos State"),
    shopper("Chioma", "Nwosu", "chioma.nwosu@example.com", "+2348034445566", "21 Ogui Road", "Independence Layout", "Enugu State"),
    shopper("Emeka", "Okafor", "emeka.okafor@example.com", "+2348057778899", "5 Aminu Kano Crescent", "Maitama", "FCT Abuja"),
    shopper("Fatima", "Danjuma", "fatima.danjuma@example.com", "+2348090001122", "14 Sultan Road", "Nassarawa GRA", "Kano State"),
];
const makeRandom = (seed) => () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const buildOrder = (plan, orderNumber, random) => {
    const { customer, address, placedAt, status, method } = plan;
    const items = plan.lines.map(({ product, quantity }) => ({
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
    const deliveryFee = orderRules_1.DELIVERY_OPTIONS[method].fee;
    const history = [
        { status: "processing", note: "Order placed", at: placedAt },
    ];
    const courier = Object.keys(adminOrderController_1.COURIERS)[Math.floor(random() * 3)];
    const waybill = `${adminOrderController_1.COURIERS[courier]}-${100000 + Math.floor(random() * 900000)}`;
    const shippedAt = new Date(placedAt.getTime() + 20 * HOUR);
    const deliveredAt = new Date(shippedAt.getTime() + (1 + Math.floor(random() * 2)) * DAY);
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
            method: "card",
            status: status === "cancelled" ? "refunded" : "paid",
            cardBrand: ["Visa", "Mastercard", "Verve"][Math.floor(random() * 3)],
            cardLast4: String(1000 + Math.floor(random() * 9000)),
            reference: `PSTK-${100000000 + Math.floor(random() * 900000000)}`,
            paidAt: placedAt,
        }
        : {
            method: "pay_on_delivery",
            status: status === "delivered" ? "paid" : "pending",
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
        estimatedDelivery: (0, orderRules_1.estimateDelivery)(method, placedAt),
        ...(status === "shipped" || status === "delivered" ? { courier, waybill } : {}),
        ...(status === "delivered" ? { deliveredAt } : {}),
        ...(status === "cancelled" ? { cancelledAt } : {}),
        createdAt: placedAt,
    };
};
const statusForAge = (daysAgo, random) => {
    if (random() < 0.06)
        return "cancelled";
    if (daysAgo < 1)
        return "processing";
    if (daysAgo < 3)
        return "shipped";
    return "delivered";
};
const createDemoOrders = async (products) => {
    const random = makeRandom(1042);
    const now = Date.now();
    const bySku = new Map(products.map((product) => [product.sku, product]));
    const sku = (code) => bySku.get(code);
    const ada = await User_1.User.findOne({ email: "ada.obi@example.com" }).lean();
    const shoppers = await User_1.User.create(exports.demoShoppers);
    const customers = shoppers.map((user) => user.toObject());
    const plans = [];
    if (ada) {
        const [home, office] = ada.addresses;
        const adaOrder = (daysAgo, status, lines, address = home) => plans.push({
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
        adaOrder(12, "delivered", [
            ["QC-HM-108", 1],
            [products.find((product) => product.name === "Design Systems Handbook").sku, 1],
        ], office);
        adaOrder(40, "delivered", [
            [products.find((product) => product.name === "Compact GaN Fast Charger 65W").sku, 1],
        ]);
        adaOrder(70, "delivered", [
            [products.find((product) => product.name === "Eco Grip Yoga Mat").sku, 1],
        ]);
    }
    const forSale = products.filter((product) => product.status === "published" && product.images.length > 0);
    for (let i = 0; i < 36; i++) {
        const daysAgo = Math.pow(random(), 1.6) * 90;
        const customer = customers[Math.floor(random() * customers.length)];
        const address = customer.addresses[0];
        const inLagos = /lagos/i.test(address.state);
        const lineCount = 1 + Math.floor(random() * 3);
        const picked = new Set();
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
    const orders = plans.map((plan, index) => buildOrder(plan, firstNumber + index, random));
    await Order_1.Order.insertMany(orders);
    return orders.length;
};
exports.createDemoOrders = createDemoOrders;
