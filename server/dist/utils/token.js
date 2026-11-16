"use strict";
// token.ts server/src/utils/token.ts
// Makes login tokens (JWTs) and checks them.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.signToken = void 0;
// STEP 18 (part 1): Tokens
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
// signToken("6650...") -> "eyJhbGciOi..."
// rememberMe ("Remember me for 30 days" on the login screen) -> 30 days, otherwise JWT_EXPIRES_IN (15d)
const signToken = (userId, rememberMe = false) => {
    // The "as" is needed because TypeScript only accepts strings like "15d" here, and env gives a plain string
    const expiresIn = (rememberMe ? "30d" : env_1.env.jwtExpiresIn);
    return jsonwebtoken_1.default.sign({ id: userId }, env_1.env.jwtSecret, { expiresIn });
};
exports.signToken = signToken;
// verifyToken("eyJhbGciOi...") -> { id, iat, exp }
// If the token was changed, faked or has expired, jwt.verify THROWS (JsonWebTokenError / TokenExpiredError).
// We don't catch it: errorHandler part 6 (STEP 14) already turns those into a 401.
const verifyToken = (token) => {
    return jsonwebtoken_1.default.verify(token, env_1.env.jwtSecret);
};
exports.verifyToken = verifyToken;
