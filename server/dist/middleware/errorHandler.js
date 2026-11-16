"use strict";
//errorHandler.ts
//The last middleware: turns ANY arror in aroute in to a JSON reply with the right status code, so the server never crashes and the website always get {message: "..."}
//STEP 14: Handle unknown URLs and errors
//notFound.ts answers "no route matched": this file answers "a route matched but some thing went wrong"
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const AppError_1 = require("../utils/AppError");
const mongoose_1 = __importDefault(require("mongoose"));
const multer_1 = __importDefault(require("multer"));
const upload_1 = require("./upload");
const errorHandler = (error, _req, res, _next) => {
    //1. Our own errors: throw new AppError(404,  "Product not Found")
    if (error instanceof AppError_1.AppError) {
        return res.status(error.statusCode).json({ message: error.message });
    }
    // 1b. multer refused an upload (STEP 25): a file too big, too many files, or the wrong field name
    if (error instanceof multer_1.default.MulterError) {
        const messages = {
            LIMIT_FILE_SIZE: `Each photo must be ${upload_1.MAX_PHOTO_MB}MB or smaller.`,
            LIMIT_FILE_COUNT: `You can upload up to ${upload_1.MAX_PHOTOS} photos at a time.`,
            LIMIT_UNEXPECTED_FILE: `Send the photos in a field called "photos" (up to ${upload_1.MAX_PHOTOS} at a time).`,
        };
        return res
            .status(400)
            .json({ message: messages[error.code] ?? error.message });
    }
    // 2. A record broke the models rules (e.g required Field missing, price below 0)
    if (error instanceof mongoose_1.default.Error.ValidationError) {
        const messages = Object.values(error.errors).map((field) => {
            return field.message;
        });
        return res.status(400).json({ message: messages.join(". ") });
    }
    //3. A badly formed id, e.g GET /api/products/123 ("123" is not a mongodb id)
    if (error instanceof mongoose_1.default.Error.CastError) {
        return res
            .status(400)
            .json({ message: `Invalid ${error.path}: ${String(error.value)}` });
    }
    // The remaining errors aren't classes we can check with instanceof, so we look at their fields
    const err = error;
    //4. A "unique" field already used, e.g registeringn with an email that exists (MongoDB code11000)
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue ?? {})[0] ?? "values";
        return res.status(409).json({ messgae: `That ${field} is already in use` });
    }
    //5. the websites sent broken JSON ( express.json()ncouldn't read the  body)
    if (err.type === "entity.parse.failed") {
        return res
            .status(400)
            .json({ message: "The request body is not valid JSON" });
    }
    //   6. A bad or expired login token
    if (err.name === "JsonwebTokenError" || err.name === "TokenExpiredError") {
        return res
            .status(401)
            .json({ message: "Your session has expired. please log in again." });
    }
    // 7.Anything else is abug on
    console.error(error);
    return res
        .status(500)
        .json({ message: "Something went wrong on our side. Please try again" });
};
exports.errorHandler = errorHandler;
