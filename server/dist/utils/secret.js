"use strict";
// secrets.ts server/src/utils/secrets.ts
// Random one-time secrets: the password reset token (in the link) and the 6-digit email code.
// We send the REAL secret to the user and save only its HASH, like a password.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeCode = exports.makeResetToken = exports.hashSecret = void 0;
// STEP 19 (part 2): One-time secrets
const crypto_1 = __importDefault(require("crypto")); // built into Node, nothing to install
// "1ba4dc03..." -> its sha256 hash (64 characters).
// Why not bcrypt like passwords? bcrypt is slow on purpose and gives a different hash every time, so we couldn't
// FIND a user by it. sha256 always gives the same hash, and the token is long and random, so it's safe.
const hashSecret = (secret) => {
    return crypto_1.default.createHash("sha256").update(secret).digest("hex");
};
exports.hashSecret = hashSecret;
// The reset link token: 32 random bytes = 64 hex characters, impossible to guess
const makeResetToken = () => {
    const token = crypto_1.default.randomBytes(32).toString("hex");
    return { token, hashed: (0, exports.hashSecret)(token) }; // token -> the email, hashed -> the database
};
exports.makeResetToken = makeResetToken;
// The email code: 6 digits, e.g. "048213" (padStart keeps a leading 0, so it's always 6 digits)
const makeCode = () => {
    const code = String(crypto_1.default.randomInt(0, 1_000_000)).padStart(6, "0");
    return { code, hashed: (0, exports.hashSecret)(code) };
};
exports.makeCode = makeCode;
