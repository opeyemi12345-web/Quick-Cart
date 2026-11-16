// demoController.ts server/src/controllers/demoController.ts
// The demo panel: buttons for whoever is presenting the shop (admins only).

// STEP 28 (part 3): The demo panel
// POST /api/admin/demo/reset            { "confirm": "RESET" }  -> everything back to the demo data
// POST /api/admin/demo/advance-orders   -> every order moves one step: processing -> shipped -> delivered

import { randomInt } from "crypto";
import { Request, Response } from "express";
import { deleteAllUploadedPhotos } from "../config/cloudinary";
import { seedDatabase } from "../data/seed";
import { Order } from "../models/Order";
import { AppError } from "../utils/AppError";
import { COURIERS } from "./adminOrderController";

// POST /api/admin/demo/reset
// The same as "npm run seed", from the website, plus the photos admins uploaded are deleted from Cloudinary.
// Newsletter subscribers are kept: they're real people (STEP 24).
export const resetDemo = async (req: Request, res: Response) => {
  if (req.body?.confirm !== "RESET") {
    throw new AppError(400, 'This deletes all changes. Send { "confirm": "RESET" } to go ahead.');
  }

  await deleteAllUploadedPhotos();
  const result = await seedDatabase();

  res.json({
    message: "The demo data has been reset. Please log in again.",
    ...result,
  });
};

// POST /api/admin/demo/advance-orders
// Shows the order tracker moving during a demo without clicking every order. No emails are sent.
export const advanceOrders = async (_req: Request, res: Response) => {
  const now = new Date();
  let delivered = 0;
  let shipped = 0;

  // Shipments already in transit are delivered first, so newly shipped orders wait until the next call.
  const inTransit = await Order.find({ status: "shipped" });
  for (const order of inTransit) {
    const set: Record<string, unknown> = { status: "delivered", deliveredAt: now };
    if (order.payment.status === "pending") {
      set["payment.status"] = "paid";
      set["payment.paidAt"] = now;
    }
    const updated = await Order.updateOne(
      { _id: order._id, status: "shipped" },
      { $set: set, $push: { statusHistory: { status: "delivered", note: "Delivered", at: now } } },
    );
    delivered += updated.modifiedCount;
  }

  const waiting = await Order.find({ status: "processing" });
  const couriers = Object.keys(COURIERS);
  for (const order of waiting) {
    const courier = couriers[randomInt(couriers.length)];
    const waybill = `${COURIERS[courier]}-${randomInt(100000, 1000000)}`;
    const updated = await Order.updateOne(
      { _id: order._id, status: "processing" },
      {
        $set: { status: "shipped", courier, waybill },
        $push: { statusHistory: { status: "shipped", note: `Dispatched with ${courier} (waybill ${waybill})`, at: now } },
      },
    );
    shipped += updated.modifiedCount;
  }

  res.json({ message: `${shipped} order(s) shipped and ${delivered} order(s) delivered.`, shipped, delivered });
};
