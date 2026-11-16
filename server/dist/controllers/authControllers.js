"use strict";
// authController.ts server/src/controllers/authController.ts
// Create an account, log in, "who am I", log out, and "is this email free?"
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyEmail = exports.sendVerification = exports.resetPassword = exports.checkResetToken = exports.forgotPassword = exports.checkEmail = exports.logout = exports.getMe = exports.login = exports.register = void 0;
const env_1 = require("../config/env");
const User_1 = require("../models/User");
const AppError_1 = require("../utils/AppError");
const password_1 = require("../utils/password");
const secrets_1 = require("../utils/secrets");
const sendEmail_1 = require("../utils/sendEmail");
const token_1 = require("../utils/token");
// POST /api/auth/register
const register = async (req, res) => {
    // "?? {}": in Express 5, req.body is undefined when nothing was sent, and destructuring undefined crashes
    const { firstName, lastName, email, phone, password, confirmPassword, agreeToTerms, } = req.body ?? {};
    if (!agreeToTerms) {
        throw new AppError_1.AppError(400, "Please agree to the Terms of Service and Privacy Policy.");
    }
    // 8+ characters, uppercase, number, and both passwords match (utils/password.ts)
    (0, password_1.checkNewPassword)(password, confirmPassword);
    // Pick the fields one by one. NEVER do User.create(req.body): someone could send "role": "admin"!
    // Missing names or a bad email -> the model's messages (400). Email already used -> 409.
    const user = await User_1.User.create({
        firstName,
        lastName,
        email,
        phone,
        password,
    });
    // 201 = "created". Log them straight in by sending a token too.
    // The user's toJSON (STEP 17) removes the password from the reply.
    res.status(201).json({ token: (0, token_1.signToken)(String(user._id)), user });
};
exports.register = register;
// POST /api/auth/login
const login = async (req, res) => {
    const { email, password, rememberMe } = req.body ?? {};
    if (!email || !password) {
        throw new AppError_1.AppError(400, "Please enter your email and password.");
    }
    // The password has select: false, so we must ask for it to compare it
    const user = await User_1.User.findOne({
        email: String(email).toLowerCase().trim(),
    }).select("+password");
    // The SAME message for "no such email" and "wrong password": don't tell strangers which emails have accounts
    if (!user || !(await user.comparePassword(String(password)))) {
        throw new AppError_1.AppError(401, "Incorrect email or password.");
    }
    res.json({ token: (0, token_1.signToken)(String(user._id), Boolean(rememberMe)), user });
};
exports.login = login;
// GET /api/auth/me (after protect, so req.user is already loaded)
// The website calls this when it opens, to know who is logged in (the avatar, "Hi Ada", admin menu).
const getMe = async (req, res) => {
    res.json({ user: req.user });
};
exports.getMe = getMe;
// POST /api/auth/logout
// Nothing to delete on the server: the website deletes its token. This just confirms it.
const logout = async (_req, res) => {
    res.json({ message: "You have been logged out." });
};
exports.logout = logout;
// GET /api/auth/check-email?email=ada.obi@example.com -> { available: false }
const checkEmail = async (req, res) => {
    const email = String(req.query.email ?? "")
        .toLowerCase()
        .trim();
    if (!email) {
        throw new AppError_1.AppError(400, "Please give an email to check.");
    }
    const taken = await User_1.User.exists({ email }); // exists = cheap "is there one?" (only the _id comes back)
    res.json({ available: !taken });
};
exports.checkEmail = checkEmail;
// Reset links and email codes stop working after 15 minutes (the design: "15-minute validity window")
const FIFTEEN_MINUTES = 15 * 60 * 1000; // in milliseconds
// POST /api/auth/forgot-password   { "email": "ada.obi@example.com" }
const forgotPassword = async (req, res) => {
    const email = String(req.body?.email ?? "").toLowerCase().trim();
    if (!email) {
        throw new AppError_1.AppError(400, "Please enter your email address.");
    }
    // The SAME reply whether the account exists or not (don't tell strangers who has an account)
    const reply = {
        message: "If an account exists for that email, we've sent a link to reset your password.",
    };
    const user = await User_1.User.findOne({ email });
    if (user) {
        // A new random token replaces any older reset link.
        const { token, hashed } = (0, secrets_1.makeResetToken)();
        user.passwordResetToken = hashed;
        user.passwordResetExpires = new Date(Date.now() + FIFTEEN_MINUTES);
        await user.save();
        const resetUrl = `${env_1.env.clientUrl}/reset-password/${token}`;
        await (0, sendEmail_1.sendEmail)(user.email, "Reset your QuickCart password", `Hi ${user.firstName},\n\nClick this link to choose a new password (it works once, for 15 minutes):\n${resetUrl}\n\nIf you didn't ask for this, ignore this email.`);
        if (env_1.env.demoMode) {
            reply.devResetUrl = resetUrl;
        }
    }
    res.json(reply);
};
exports.forgotPassword = forgotPassword;
// Finds the user a reset link belongs to, or refuses with the "Link Expired or Invalid" message.
const findUserByResetToken = async (token) => {
    const user = await User_1.User.findOne({
        passwordResetToken: (0, secrets_1.hashSecret)(token),
        passwordResetExpires: { $gt: new Date() },
    }).select("+password");
    if (!user) {
        throw new AppError_1.AppError(400, "This password reset link has expired or has already been used. Please request a new link.");
    }
    return user;
};
// GET /api/auth/reset-password/:token
const checkResetToken = async (req, res) => {
    await findUserByResetToken(req.params.token);
    res.json({ valid: true });
};
exports.checkResetToken = checkResetToken;
// POST /api/auth/reset-password/:token
const resetPassword = async (req, res) => {
    const user = await findUserByResetToken(req.params.token);
    const password = (0, password_1.checkNewPassword)(req.body?.password, req.body?.confirmPassword);
    if (await user.comparePassword(password)) {
        throw new AppError_1.AppError(400, "Your new password must be different from your old password.");
    }
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    res.json({
        message: "Your password has been reset.",
        token: (0, token_1.signToken)(String(user._id)),
        user,
    });
};
exports.resetPassword = resetPassword;
// POST /api/auth/send-verification   (protect: must be logged in)
const sendVerification = async (req, res) => {
    const user = req.user;
    if (user.isEmailVerified) {
        throw new AppError_1.AppError(400, "Your email is already verified.");
    }
    const { code, hashed } = (0, secrets_1.makeCode)();
    user.emailVerifyToken = hashed;
    user.emailVerifyExpires = new Date(Date.now() + FIFTEEN_MINUTES);
    await user.save();
    await (0, sendEmail_1.sendEmail)(user.email, "Your QuickCart verification code", `Hi ${user.firstName},\n\nYour verification code is ${code}. It expires in 15 minutes.`);
    const reply = {
        message: `We've sent a 6-digit code to ${user.email}.`,
    };
    if (env_1.env.demoMode) {
        reply.devCode = code;
    }
    res.json(reply);
};
exports.sendVerification = sendVerification;
// POST /api/auth/verify-email   { "code": "048213" }   (protect)
const verifyEmail = async (req, res) => {
    const code = String(req.body?.code ?? "").trim();
    const user = await User_1.User.findById(req.user._id).select("+emailVerifyToken +emailVerifyExpires");
    if (!user) {
        throw new AppError_1.AppError(401, "This account no longer exists. Please log in again.");
    }
    if (user.isEmailVerified) {
        throw new AppError_1.AppError(400, "Your email is already verified.");
    }
    const expired = !user.emailVerifyExpires || user.emailVerifyExpires.getTime() < Date.now();
    if (!code || expired || user.emailVerifyToken !== (0, secrets_1.hashSecret)(code)) {
        throw new AppError_1.AppError(400, "That code is wrong or has expired. Please request a new one.");
    }
    user.isEmailVerified = true;
    user.emailVerifyToken = undefined;
    user.emailVerifyExpires = undefined;
    await user.save();
    res.json({ message: "Your email is verified.", user });
};
exports.verifyEmail = verifyEmail;
