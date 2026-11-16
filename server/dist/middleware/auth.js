"use strict";
// auth.ts server/src/middleware/auth.ts
// Guards for routes:
//   router.get("/me", protect, getMe)                     -> must be logged in
//   router.post("/", protect, adminOnly, createProduct)   -> must be an admin
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminOnly = exports.protect = void 0;
const User_1 = require("../models/User");
const AppError_1 = require("../utils/AppError");
const token_1 = require("../utils/token");
// protect: let the request through only if it carries a valid token for a user who still exists
const protect = async (req, _res, next) => {
    // 1. The header looks like "Bearer eyJhbGciOi..."
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
        throw new AppError_1.AppError(401, "Please log in to continue.");
    }
    const token = header.split(" ")[1]; // the part after "Bearer "
    // 2. Check the token. A fake or expired one throws here -> errorHandler -> 401
    const payload = (0, token_1.verifyToken)(token);
    // 3. The user might have been deleted since the token was made
    const user = await User_1.User.findById(payload.id);
    if (!user) {
        throw new AppError_1.AppError(401, "This account no longer exists. Please log in again.");
    }
    // 4. If the password was changed AFTER this token was made, the token is no longer accepted.
    //    (Someone who stole an old token is locked out as soon as the real owner changes the password.)
    //    Math.floor: iat is in whole seconds, so we compare whole seconds too. Without it, a token made in
    //    the same second as the change (e.g. right after "change password" in STEP 20) would be refused.
    if (user.passwordChangedAt) {
        const changedAt = Math.floor(user.passwordChangedAt.getTime() / 1000);
        if (changedAt > payload.iat) {
            throw new AppError_1.AppError(401, "Your password was changed. Please log in again.");
        }
    }
    // 5. Remember who it is for the next function, and continue
    req.user = user;
    next();
};
exports.protect = protect;
// adminOnly: always put it AFTER protect (it needs req.user)
const adminOnly = (req, _res, next) => {
    if (req.user?.role !== "admin") {
        throw new AppError_1.AppError(403, "Only admins can do this."); // 403 = "I know who you are, but no"
    }
    next();
};
exports.adminOnly = adminOnly;
