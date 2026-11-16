"use strict";
// password.ts server/src/utils/password.ts
// The password rules from the registration and reset screens, in one place.
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkNewPassword = void 0;
// STEP 19 (part 1): Password rules
const AppError_1 = require("./AppError");
// 8+ characters, an uppercase letter and a number.
// (?=.*[A-Z]) = "somewhere there is an A-Z", (?=.*\d) = "somewhere there is a 0-9", .{8,} = 8 or more characters
const PASSWORD_RULE = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
// Throws a 400 with a friendly message if the new password breaks a rule; otherwise gives it back.
// (Returning it as a string tells TypeScript "this is definitely a string now".)
const checkNewPassword = (password, confirmPassword) => {
    if (typeof password !== "string" || !PASSWORD_RULE.test(password)) {
        throw new AppError_1.AppError(400, "Password must be at least 8 characters with one uppercase letter (A-Z) and one number (0-9).");
    }
    if (password !== confirmPassword) {
        throw new AppError_1.AppError(400, "Passwords do not match.");
    }
    return password;
};
exports.checkNewPassword = checkNewPassword;
