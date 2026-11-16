"use strict";
// newsletterController.ts server/src/controllers/newsletterController.ts
// The footer's "Subscribe to QuickCart VIP Drops" box, and the unsubscribe link in the emails.
Object.defineProperty(exports, "__esModule", { value: true });
exports.unsubscribe = exports.subscribe = void 0;
const env_1 = require("../config/env");
const Subscriber_1 = require("../models/Subscriber");
const AppError_1 = require("../utils/AppError");
const brevoContacts_1 = require("../utils/brevoContacts");
const secrets_1 = require("../utils/secrets");
const sendEmail_1 = require("../utils/sendEmail");
const EMAIL_RULE = /^\S+@\S+\.\S+$/;
const apiAddress = (req) => `${req.protocol}://${req.get("host")}`;
const welcomeEmail = (unsubscribeLink) => [
    "Welcome to QuickCart VIP Drops!",
    "",
    "You'll be the first to hear about flash deals, new arrivals and members-only coupons.",
    "",
    "Here's a welcome gift: use the code QUICK10 at checkout for 10% off orders of ₦10,000 or more (up to ₦5,000).",
    "",
    `Shop now: ${env_1.env.clientUrl}/shop`,
    "",
    "The QuickCart team",
    "",
    `Don't want these emails? Unsubscribe: ${unsubscribeLink}`,
].join("\n");
const escapeHtml = (text) => text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
const page = (title, text) => `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title></head>
<body style="font-family:Arial,sans-serif;background:#f4f6fb;margin:0;padding:48px 16px;text-align:center">
  <div style="max-width:440px;margin:auto;background:#fff;border-radius:16px;padding:32px">
    <h1 style="font-size:22px;color:#111827">${title}</h1>
    <p style="color:#4b5563;line-height:1.6">${text}</p>
    <a href="${env_1.env.clientUrl}" style="display:inline-block;margin-top:12px;background:#3730d6;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none">Back to QuickCart</a>
  </div>
</body></html>`;
const subscribe = async (req, res) => {
    const email = String(req.body?.email ?? "").toLowerCase().trim();
    if (!email) {
        throw new AppError_1.AppError(400, "Please enter your email address.");
    }
    if (!EMAIL_RULE.test(email)) {
        throw new AppError_1.AppError(400, "Please enter a valid email address.");
    }
    const existing = await Subscriber_1.Subscriber.findOne({ email });
    if (existing?.isSubscribed) {
        return res.json({
            message: "You're already subscribed to QuickCart VIP Drops.",
        });
    }
    const { token, hashed } = (0, secrets_1.makeResetToken)();
    if (existing) {
        existing.isSubscribed = true;
        existing.subscribedAt = new Date();
        existing.unsubscribedAt = undefined;
        existing.unsubscribeToken = hashed;
        await existing.save();
    }
    else {
        try {
            await Subscriber_1.Subscriber.create({ email, unsubscribeToken: hashed });
        }
        catch (error) {
            if (error.code === 11000) {
                return res.json({
                    message: "You're already subscribed to QuickCart VIP Drops.",
                });
            }
            throw error;
        }
    }
    void (0, brevoContacts_1.addContact)(email);
    void (0, sendEmail_1.sendEmail)(email, "Welcome to QuickCart VIP Drops 🎉", welcomeEmail(`${apiAddress(req)}/api/newsletter/unsubscribe/${token}`));
    res.status(201).json({
        message: "Thanks for subscribing! Check your inbox for a welcome gift.",
    });
};
exports.subscribe = subscribe;
const unsubscribe = async (req, res) => {
    const subscriber = await Subscriber_1.Subscriber.findOne({
        unsubscribeToken: (0, secrets_1.hashSecret)(req.params.token),
    });
    if (!subscriber) {
        return res
            .status(404)
            .send(page("Link not valid", "This unsubscribe link is not valid. It may be from an older email."));
    }
    if (subscriber.isSubscribed) {
        subscriber.isSubscribed = false;
        subscriber.unsubscribedAt = new Date();
        await subscriber.save();
        void (0, brevoContacts_1.removeContact)(subscriber.email);
    }
    res.send(page("You're unsubscribed", `${escapeHtml(subscriber.email)} will no longer receive QuickCart VIP Drops emails.`));
};
exports.unsubscribe = unsubscribe;
