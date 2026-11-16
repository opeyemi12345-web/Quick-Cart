"use strict";
// accountController.ts server/src/controllers/accountController.ts
// The logged-in user's own account: profile, password, delivery addresses and saved items.
Object.defineProperty(exports, "__esModule", { value: true });
exports.unsaveItem = exports.saveItem = exports.getSavedItems = exports.deleteAddress = exports.updateAddress = exports.addAddress = exports.getAddresses = exports.pickAddress = exports.changePassword = exports.updateProfile = void 0;
const mongoose_1 = require("mongoose");
const User_1 = require("../models/User");
const Products_1 = require("../models/Products");
const AppError_1 = require("../utils/AppError");
const password_1 = require("../utils/password");
const token_1 = require("../utils/token");
const productController_1 = require("./productController");
const me = (req) => req.user;
// ===== Profile =====
const updateProfile = async (req, res) => {
    const user = me(req);
    const { firstName, lastName, email, phone } = req.body ?? {};
    if (firstName !== undefined)
        user.firstName = firstName;
    if (lastName !== undefined)
        user.lastName = lastName;
    if (phone !== undefined)
        user.phone = phone;
    if (email !== undefined && String(email).toLowerCase().trim() !== user.email) {
        user.email = email;
        user.isEmailVerified = false;
    }
    await user.save();
    res.json({ message: "Your profile has been updated.", user });
};
exports.updateProfile = updateProfile;
// ===== Password =====
const changePassword = async (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body ?? {};
    if (!currentPassword) {
        throw new AppError_1.AppError(400, "Please enter your current password.");
    }
    const user = await User_1.User.findById(me(req)._id).select("+password");
    if (!user) {
        throw new AppError_1.AppError(401, "This account no longer exists. Please log in again.");
    }
    if (!(await user.comparePassword(String(currentPassword)))) {
        throw new AppError_1.AppError(400, "Your current password is incorrect.");
    }
    const password = (0, password_1.checkNewPassword)(newPassword, confirmPassword);
    if (password === currentPassword) {
        throw new AppError_1.AppError(400, "Your new password must be different from your old password.");
    }
    user.password = password;
    await user.save();
    res.json({
        message: "Your password has been changed.",
        token: (0, token_1.signToken)(String(user._id)),
        user,
    });
};
exports.changePassword = changePassword;
// ===== Addresses =====
const pickAddress = (body) => {
    const fields = [
        "label",
        "fullName",
        "phone",
        "street",
        "city",
        "state",
        "country",
        "instructions",
        "isDefault",
    ];
    const picked = {};
    for (const field of fields) {
        if (body[field] !== undefined)
            picked[field] = body[field];
    }
    return picked;
};
exports.pickAddress = pickAddress;
const findAddress = (req) => {
    const address = me(req).addresses.find((item) => String(item._id) === req.params.addressId);
    if (!address) {
        throw new AppError_1.AppError(404, "Address not found");
    }
    return address;
};
const makeOnlyDefault = (addresses, chosen) => {
    for (const address of addresses) {
        address.isDefault = address === chosen;
    }
};
const getAddresses = async (req, res) => {
    res.json({ addresses: me(req).addresses });
};
exports.getAddresses = getAddresses;
const addAddress = async (req, res) => {
    const user = me(req);
    user.addresses.push((0, exports.pickAddress)(req.body ?? {}));
    const added = user.addresses[user.addresses.length - 1];
    if (added.isDefault || user.addresses.length === 1) {
        makeOnlyDefault(user.addresses, added);
    }
    await user.save();
    res.status(201).json({ addresses: user.addresses });
};
exports.addAddress = addAddress;
const updateAddress = async (req, res) => {
    const user = me(req);
    const address = findAddress(req);
    const wasDefault = address.isDefault;
    Object.assign(address, (0, exports.pickAddress)(req.body ?? {}));
    if (address.isDefault) {
        makeOnlyDefault(user.addresses, address);
    }
    else if (wasDefault) {
        address.isDefault = true;
    }
    await user.save();
    res.json({ addresses: user.addresses });
};
exports.updateAddress = updateAddress;
const deleteAddress = async (req, res) => {
    const user = me(req);
    const address = findAddress(req);
    user.addresses = user.addresses.filter((item) => item !== address);
    if (address.isDefault && user.addresses.length > 0) {
        user.addresses[0].isDefault = true;
    }
    await user.save();
    res.json({ addresses: user.addresses });
};
exports.deleteAddress = deleteAddress;
// ===== Saved items =====
const getSavedItems = async (req, res) => {
    const products = await Products_1.Product.find({
        $and: [{ _id: { $in: me(req).savedItems } }, (0, Products_1.liveProducts)()],
    })
        .select(productController_1.CARD_FIELDS)
        .populate("category", "name slug")
        .lean();
    res.json({ products });
};
exports.getSavedItems = getSavedItems;
const saveItem = async (req, res) => {
    const { productId } = req.params;
    if (!(0, mongoose_1.isValidObjectId)(productId) ||
        !(await Products_1.Product.exists({
            $and: [{ _id: productId }, (0, Products_1.liveProducts)()],
        }))) {
        throw new AppError_1.AppError(404, "Product not found");
    }
    const user = await User_1.User.findByIdAndUpdate(me(req)._id, { $addToSet: { savedItems: productId } }, { returnDocument: "after" });
    res.json({ savedItems: user.savedItems });
};
exports.saveItem = saveItem;
const unsaveItem = async (req, res) => {
    if (!(0, mongoose_1.isValidObjectId)(req.params.productId)) {
        throw new AppError_1.AppError(404, "Product not found");
    }
    const user = await User_1.User.findByIdAndUpdate(me(req)._id, { $pull: { savedItems: req.params.productId } }, { returnDocument: "after" });
    res.json({ savedItems: user.savedItems });
};
exports.unsaveItem = unsaveItem;
