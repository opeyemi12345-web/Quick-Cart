"use strict";
// User model server/src/models/User.ts
// A person with an account: a shopper ("customer") or a shop manager ("admin").
// Passwords are never stored as typed: they're scrambled ("hashed") with bcrypt before saving.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = exports.addressSchema = void 0;
// STEP 17: The User model
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const mongoose_1 = require("mongoose");
// An address is a "sub-document": it lives inside the user, not in its own collection
exports.addressSchema = new mongoose_1.Schema({
    label: { type: String, default: "Home", trim: true },
    fullName: {
        type: String,
        required: [true, "Full name is required"],
        trim: true,
    },
    phone: {
        type: String,
        required: [true, "Phone number is required"],
        trim: true,
    },
    street: {
        type: String,
        required: [true, "Street address is required"],
        trim: true,
    },
    city: { type: String, required: [true, "City is required"], trim: true },
    state: { type: String, required: [true, "State is required"], trim: true },
    country: { type: String, default: "Nigeria", trim: true },
    instructions: { type: String, trim: true },
    isDefault: { type: Boolean, default: false },
});
const userSchema = new mongoose_1.Schema({
    // [rule, message]: the message is what errorHandler (STEP 14) sends back when the rule fails
    firstName: {
        type: String,
        required: [true, "First name is required"],
        trim: true,
    },
    lastName: {
        type: String,
        required: [true, "Last name is required"],
        trim: true,
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true, // MongoDB refuses a second account with the same email (error 11000 -> 409)
        lowercase: true, // "Ada.Obi@Example.com" is saved as "ada.obi@example.com"
        trim: true,
        match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },
    phone: { type: String, trim: true },
    password: {
        type: String,
        required: [true, "Password is required"],
        minlength: [8, "Password must be at least 8 characters"],
        select: false, // left out of every query unless asked for with .select("+password")
    },
    role: { type: String, enum: ["customer", "admin"], default: "customer" },
    isEmailVerified: { type: Boolean, default: false },
    addresses: [exports.addressSchema],
    savedItems: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Product" }],
    // Secret tokens for STEP 19, hidden like the password
    emailVerifyToken: { type: String, select: false },
    emailVerifyExpires: { type: Date, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    passwordChangedAt: { type: Date },
}, {
    timestamps: true, // createdAt = "Member since"
    // toJSON runs whenever a user is sent with res.json(user): remove the secret fields, just in case
    toJSON: {
        transform: (_doc, ret) => {
            delete ret.password;
            delete ret.emailVerifyToken;
            delete ret.emailVerifyExpires;
            delete ret.passwordResetToken;
            delete ret.passwordResetExpires;
            delete ret.__v;
            return ret;
        },
    },
});
// Before every save: if the password was set or changed, replace it with its bcrypt hash.
// "function" (not an arrow) is required here: Mongoose sets "this" to the user being saved.
userSchema.pre("save", async function () {
    if (!this.isModified("password")) {
        return; // e.g. only the name changed: don't hash the hash again!
    }
    this.password = await bcryptjs_1.default.hash(this.password, 10); // 10 = how hard to scramble (the usual choice)
    // A changed password (not a brand-new account) is remembered for "Password last updated"
    if (!this.isNew) {
        this.passwordChangedAt = new Date();
    }
});
// user.comparePassword("typed password") -> true / false
// bcrypt hashes the typed password the same way and compares. (Needs .select("+password") when loading the user.)
userSchema.method("comparePassword", async function (candidate) {
    return bcryptjs_1.default.compare(candidate, this.password);
});
exports.User = (0, mongoose_1.model)("User", userSchema);
