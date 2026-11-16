"use strict";
// Category model
// A shop department, e.g. Electronics, Fashion, Home & Living
Object.defineProperty(exports, "__esModule", { value: true });
exports.Category = void 0;
const mongoose_1 = require("mongoose");
const categorySchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    icon: { type: String, default: "" },
}, { timestamps: true });
exports.Category = (0, mongoose_1.model)("Category", categorySchema);
//Next: STEP 8 (the Product model)-> server/src/models/product.ts
