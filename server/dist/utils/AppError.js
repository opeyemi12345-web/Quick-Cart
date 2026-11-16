"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
//App error
//App error with an Http status code attached, e.g throw new AppError(404, "Product not found")
//errorHandler.ts replies with that status and message.
class AppError extends Error {
    statusCode;
    constructor(statusCode, message) {
        super(message); //let the normal Error the message
        this.statusCode = statusCode;
    }
}
exports.AppError = AppError;
