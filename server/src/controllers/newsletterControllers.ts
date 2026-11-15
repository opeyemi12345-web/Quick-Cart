// newsletterController.ts server/src/controllers/newsletterController.ts
// The footer's "Subscribe to QuickCart VIP Drops" box, and the unsubscribe link in the emails.

// STEP 24 (part 3): Newsletter
// POST /api/newsletter/subscribe            { "email": "ada.obi@example.com" }
// GET  /api/newsletter/unsubscribe/:token   (the link in the welcome email: opens a small "You're unsubscribed" page)

import { Request, Response } from "express";
import { env } from "../config/env";
import { Subscriber } from "../models/Subscriber";
import { AppError } from "../utils/AppError";
import { addContact, removeContact } from "../utils/brevoContacts";
import { hashSecret, makeResetToken } from "../utils/secrets";
import { sendEmail } from "../utils/sendEmail";

const EMAIL_RULE = /^\S+@\S+\.\S+$/;

const apiAddress = (req: Request) => `${req.protocol}://${req.get("host")}`;

const welcomeEmail = (unsubscribeLink: string) =>
  [
    "Welcome to QuickCart VIP Drops!",
    "",
    "You'll be the first to hear about flash deals, new arrivals and members-only coupons.",
    "",
    "Here's a welcome gift: use the code QUICK10 at checkout for 10% off orders of ₦10,000 or more (up to ₦5,000).",
    "",
    `Shop now: ${env.clientUrl}/shop`,
    "",
    "The QuickCart team",
    "",
    `Don't want these emails? Unsubscribe: ${unsubscribeLink}`,
  ].join("\n");

const escapeHtml = (text: string) =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const page = (title: string, text: string) => `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title></head>
<body style="font-family:Arial,sans-serif;background:#f4f6fb;margin:0;padding:48px 16px;text-align:center">
  <div style="max-width:440px;margin:auto;background:#fff;border-radius:16px;padding:32px">
    <h1 style="font-size:22px;color:#111827">${title}</h1>
    <p style="color:#4b5563;line-height:1.6">${text}</p>
    <a href="${env.clientUrl}" style="display:inline-block;margin-top:12px;background:#3730d6;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none">Back to QuickCart</a>
  </div>
</body></html>`;

export const subscribe = async (req: Request, res: Response) => {
  const email = String(req.body?.email ?? "").toLowerCase().trim();

  if (!email) {
    throw new AppError(400, "Please enter your email address.");
  }
  if (!EMAIL_RULE.test(email)) {
    throw new AppError(400, "Please enter a valid email address.");
  }

  const existing = await Subscriber.findOne({ email });

  if (existing?.isSubscribed) {
    return res.json({
      message: "You're already subscribed to QuickCart VIP Drops.",
    });
  }

  const { token, hashed } = makeResetToken();

  if (existing) {
    existing.isSubscribed = true;
    existing.subscribedAt = new Date();
    existing.unsubscribedAt = undefined;
    existing.unsubscribeToken = hashed;
    await existing.save();
  } else {
    try {
      await Subscriber.create({ email, unsubscribeToken: hashed });
    } catch (error) {
      if ((error as { code?: number }).code === 11000) {
        return res.json({
          message: "You're already subscribed to QuickCart VIP Drops.",
        });
      }
      throw error;
    }
  }

  void addContact(email);
  void sendEmail(
    email,
    "Welcome to QuickCart VIP Drops 🎉",
    welcomeEmail(`${apiAddress(req)}/api/newsletter/unsubscribe/${token}`),
  );

  res.status(201).json({
    message: "Thanks for subscribing! Check your inbox for a welcome gift.",
  });
};

export const unsubscribe = async (
  req: Request<{ token: string }>,
  res: Response,
) => {
  const subscriber = await Subscriber.findOne({
    unsubscribeToken: hashSecret(req.params.token),
  });

  if (!subscriber) {
    return res
      .status(404)
      .send(
        page(
          "Link not valid",
          "This unsubscribe link is not valid. It may be from an older email.",
        ),
      );
  }

  if (subscriber.isSubscribed) {
    subscriber.isSubscribed = false;
    subscriber.unsubscribedAt = new Date();
    await subscriber.save();
    void removeContact(subscriber.email);
  }

  res.send(
    page(
      "You're unsubscribed",
      `${escapeHtml(subscriber.email)} will no longer receive QuickCart VIP Drops emails.`,
    ),
  );
};
