// authController.ts server/src/controllers/authController.ts
// Create an account, log in, "who am I", log out, and "is this email free?"

// STEP 18 (part 3): The auth controller
// POST /api/auth/register           -> create an account, reply with a token
// POST /api/auth/login              -> check email + password, reply with a token
// GET  /api/auth/me                 -> the logged-in user          (protect)
// POST /api/auth/logout             -> "logged out"                (protect)
// GET  /api/auth/check-email?email= -> { available: true/false }  (the "Available" tick)
//
// STEP 19 (part 4): Forgot / reset password and verify email
// POST /api/auth/forgot-password       -> "email" a reset link
// GET  /api/auth/reset-password/:token -> is this link still good? (to show "Link Expired" straight away)
// POST /api/auth/reset-password/:token -> set the new password
// POST /api/auth/send-verification     -> "email" a 6-digit code    (protect)
// POST /api/auth/verify-email          -> check the code            (protect)

import { Request, Response } from "express";
import { env } from "../config/env";
import { User } from "../models/User";
import { AppError } from "../utils/AppError";
import { checkNewPassword } from "../utils/password";
import { hashSecret, makeCode, makeResetToken } from "../utils/secrets";
import { sendEmail } from "../utils/sendEmail";
import { signToken } from "../utils/token";

// POST /api/auth/register
export const register = async (req: Request, res: Response) => {
  // "?? {}": in Express 5, req.body is undefined when nothing was sent, and destructuring undefined crashes
  const {
    firstName,
    lastName,
    email,
    phone,
    password,
    confirmPassword,
    agreeToTerms,
  } = req.body ?? {};

  if (!agreeToTerms) {
    throw new AppError(
      400,
      "Please agree to the Terms of Service and Privacy Policy.",
    );
  }

  // 8+ characters, uppercase, number, and both passwords match (utils/password.ts)
  checkNewPassword(password, confirmPassword);

  // Pick the fields one by one. NEVER do User.create(req.body): someone could send "role": "admin"!
  // Missing names or a bad email -> the model's messages (400). Email already used -> 409.
  const user = await User.create({
    firstName,
    lastName,
    email,
    phone,
    password,
  });

  // 201 = "created". Log them straight in by sending a token too.
  // The user's toJSON (STEP 17) removes the password from the reply.
  res.status(201).json({ token: signToken(String(user._id)), user });
};

// POST /api/auth/login
export const login = async (req: Request, res: Response) => {
  const { email, password, rememberMe } = req.body ?? {};

  if (!email || !password) {
    throw new AppError(400, "Please enter your email and password.");
  }

  // The password has select: false, so we must ask for it to compare it
  const user = await User.findOne({
    email: String(email).toLowerCase().trim(),
  }).select("+password");

  // The SAME message for "no such email" and "wrong password": don't tell strangers which emails have accounts
  if (!user || !(await user.comparePassword(String(password)))) {
    throw new AppError(401, "Incorrect email or password.");
  }

  res.json({ token: signToken(String(user._id), Boolean(rememberMe)), user });
};

// GET /api/auth/me (after protect, so req.user is already loaded)
// The website calls this when it opens, to know who is logged in (the avatar, "Hi Ada", admin menu).
export const getMe = async (req: Request, res: Response) => {
  res.json({ user: req.user });
};

// POST /api/auth/logout
// Nothing to delete on the server: the website deletes its token. This just confirms it.
export const logout = async (_req: Request, res: Response) => {
  res.json({ message: "You have been logged out." });
};

// GET /api/auth/check-email?email=ada.obi@example.com -> { available: false }
export const checkEmail = async (req: Request, res: Response) => {
  const email = String(req.query.email ?? "")
    .toLowerCase()
    .trim();

  if (!email) {
    throw new AppError(400, "Please give an email to check.");
  }

  const taken = await User.exists({ email }); // exists = cheap "is there one?" (only the _id comes back)
  res.json({ available: !taken });
};

// Reset links and email codes stop working after 15 minutes (the design: "15-minute validity window")
const FIFTEEN_MINUTES = 15 * 60 * 1000; // in milliseconds

// POST /api/auth/forgot-password   { "email": "ada.obi@example.com" }
export const forgotPassword = async (req: Request, res: Response) => {
  const email = String(req.body?.email ?? "").toLowerCase().trim();

  if (!email) {
    throw new AppError(400, "Please enter your email address.");
  }

  // The SAME reply whether the account exists or not (don't tell strangers who has an account)
  const reply: { message: string; devResetUrl?: string } = {
    message:
      "If an account exists for that email, we've sent a link to reset your password.",
  };

  const user = await User.findOne({ email });

  if (user) {
    // A new random token replaces any older reset link.
    const { token, hashed } = makeResetToken();
    user.passwordResetToken = hashed;
    user.passwordResetExpires = new Date(Date.now() + FIFTEEN_MINUTES);
    await user.save();

    const resetUrl = `${env.clientUrl}/reset-password/${token}`;
    await sendEmail(
      user.email,
      "Reset your QuickCart password",
      `Hi ${user.firstName},\n\nClick this link to choose a new password (it works once, for 15 minutes):\n${resetUrl}\n\nIf you didn't ask for this, ignore this email.`,
    );

    if (env.demoMode) {
      reply.devResetUrl = resetUrl;
    }
  }

  res.json(reply);
};

// Finds the user a reset link belongs to, or refuses with the "Link Expired or Invalid" message.
const findUserByResetToken = async (token: string) => {
  const user = await User.findOne({
    passwordResetToken: hashSecret(token),
    passwordResetExpires: { $gt: new Date() },
  }).select("+password");

  if (!user) {
    throw new AppError(
      400,
      "This password reset link has expired or has already been used. Please request a new link.",
    );
  }

  return user;
};

// GET /api/auth/reset-password/:token
export const checkResetToken = async (
  req: Request<{ token: string }>,
  res: Response,
) => {
  await findUserByResetToken(req.params.token);
  res.json({ valid: true });
};

// POST /api/auth/reset-password/:token
export const resetPassword = async (
  req: Request<{ token: string }>,
  res: Response,
) => {
  const user = await findUserByResetToken(req.params.token);
  const password = checkNewPassword(
    req.body?.password,
    req.body?.confirmPassword,
  );

  if (await user.comparePassword(password)) {
    throw new AppError(
      400,
      "Your new password must be different from your old password.",
    );
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  res.json({
    message: "Your password has been reset.",
    token: signToken(String(user._id)),
    user,
  });
};

// POST /api/auth/send-verification   (protect: must be logged in)
export const sendVerification = async (req: Request, res: Response) => {
  const user = req.user!;

  if (user.isEmailVerified) {
    throw new AppError(400, "Your email is already verified.");
  }

  const { code, hashed } = makeCode();
  user.emailVerifyToken = hashed;
  user.emailVerifyExpires = new Date(Date.now() + FIFTEEN_MINUTES);
  await user.save();

  await sendEmail(
    user.email,
    "Your QuickCart verification code",
    `Hi ${user.firstName},\n\nYour verification code is ${code}. It expires in 15 minutes.`,
  );

  const reply: { message: string; devCode?: string } = {
    message: `We've sent a 6-digit code to ${user.email}.`,
  };

  if (env.demoMode) {
    reply.devCode = code;
  }

  res.json(reply);
};

// POST /api/auth/verify-email   { "code": "048213" }   (protect)
export const verifyEmail = async (req: Request, res: Response) => {
  const code = String(req.body?.code ?? "").trim();
  const user = await User.findById(req.user!._id).select(
    "+emailVerifyToken +emailVerifyExpires",
  );

  if (!user) {
    throw new AppError(401, "This account no longer exists. Please log in again.");
  }

  if (user.isEmailVerified) {
    throw new AppError(400, "Your email is already verified.");
  }

  const expired =
    !user.emailVerifyExpires || user.emailVerifyExpires.getTime() < Date.now();

  if (!code || expired || user.emailVerifyToken !== hashSecret(code)) {
    throw new AppError(
      400,
      "That code is wrong or has expired. Please request a new one.",
    );
  }

  user.isEmailVerified = true;
  user.emailVerifyToken = undefined;
  user.emailVerifyExpires = undefined;
  await user.save();

  res.json({ message: "Your email is verified.", user });
};
