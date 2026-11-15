// accountController.ts server/src/controllers/accountController.ts
// The logged-in user's own account: profile, password, delivery addresses and saved items.

// STEP 20: My Account
// (every route has protect, so req.user is always the logged-in user)
// PATCH  /api/account/profile               -> change name, email, phone
// PATCH  /api/account/password              -> change password (current password required)
// GET    /api/account/addresses             -> my addresses
// POST   /api/account/addresses             -> add one
// PATCH  /api/account/addresses/:addressId  -> edit one (or make it the default)
// DELETE /api/account/addresses/:addressId  -> delete one
// GET    /api/account/saved                 -> my saved products (as product cards)
// POST   /api/account/saved/:productId      -> save a product
// DELETE /api/account/saved/:productId      -> unsave a product

import { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import { IAddress, User } from "../models/User";
import { liveProducts, Product } from "../models/Products";
import { AppError } from "../utils/AppError";
import { checkNewPassword } from "../utils/password";
import { signToken } from "../utils/token";
import { CARD_FIELDS } from "./productController";

const me = (req: Request) => req.user!;

// ===== Profile =====

export const updateProfile = async (req: Request, res: Response) => {
  const user = me(req);
  const { firstName, lastName, email, phone } = req.body ?? {};

  if (firstName !== undefined) user.firstName = firstName;
  if (lastName !== undefined) user.lastName = lastName;
  if (phone !== undefined) user.phone = phone;

  if (email !== undefined && String(email).toLowerCase().trim() !== user.email) {
    user.email = email;
    user.isEmailVerified = false;
  }

  await user.save();
  res.json({ message: "Your profile has been updated.", user });
};

// ===== Password =====

export const changePassword = async (req: Request, res: Response) => {
  const { currentPassword, newPassword, confirmPassword } = req.body ?? {};

  if (!currentPassword) {
    throw new AppError(400, "Please enter your current password.");
  }

  const user = await User.findById(me(req)._id).select("+password");
  if (!user) {
    throw new AppError(401, "This account no longer exists. Please log in again.");
  }

  if (!(await user.comparePassword(String(currentPassword)))) {
    throw new AppError(400, "Your current password is incorrect.");
  }

  const password = checkNewPassword(newPassword, confirmPassword);

  if (password === currentPassword) {
    throw new AppError(
      400,
      "Your new password must be different from your old password.",
    );
  }

  user.password = password;
  await user.save();

  res.json({
    message: "Your password has been changed.",
    token: signToken(String(user._id)),
    user,
  });
};

// ===== Addresses =====

const pickAddress = (body: Record<string, unknown>) => {
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
  ] as const;

  const picked: Partial<Record<(typeof fields)[number], unknown>> = {};
  for (const field of fields) {
    if (body[field] !== undefined) picked[field] = body[field];
  }

  return picked as Partial<IAddress>;
};

const findAddress = (req: Request<{ addressId: string }>) => {
  const address = me(req).addresses.find(
    (item) => String(item._id) === req.params.addressId,
  );

  if (!address) {
    throw new AppError(404, "Address not found");
  }

  return address;
};

const makeOnlyDefault = (addresses: IAddress[], chosen: IAddress) => {
  for (const address of addresses) {
    address.isDefault = address === chosen;
  }
};

export const getAddresses = async (req: Request, res: Response) => {
  res.json({ addresses: me(req).addresses });
};

export const addAddress = async (req: Request, res: Response) => {
  const user = me(req);

  user.addresses.push(pickAddress(req.body ?? {}) as IAddress);
  const added = user.addresses[user.addresses.length - 1];

  if (added.isDefault || user.addresses.length === 1) {
    makeOnlyDefault(user.addresses, added);
  }

  await user.save();
  res.status(201).json({ addresses: user.addresses });
};

export const updateAddress = async (
  req: Request<{ addressId: string }>,
  res: Response,
) => {
  const user = me(req);
  const address = findAddress(req);
  const wasDefault = address.isDefault;

  Object.assign(address, pickAddress(req.body ?? {}));

  if (address.isDefault) {
    makeOnlyDefault(user.addresses, address);
  } else if (wasDefault) {
    address.isDefault = true;
  }

  await user.save();
  res.json({ addresses: user.addresses });
};

export const deleteAddress = async (
  req: Request<{ addressId: string }>,
  res: Response,
) => {
  const user = me(req);
  const address = findAddress(req);

  user.addresses = user.addresses.filter((item) => item !== address);

  if (address.isDefault && user.addresses.length > 0) {
    user.addresses[0].isDefault = true;
  }

  await user.save();
  res.json({ addresses: user.addresses });
};

// ===== Saved items =====

export const getSavedItems = async (req: Request, res: Response) => {
  const products = await Product.find({
    $and: [{ _id: { $in: me(req).savedItems } }, liveProducts()],
  })
    .select(CARD_FIELDS)
    .populate("category", "name slug")
    .lean();

  res.json({ products });
};

export const saveItem = async (
  req: Request<{ productId: string }>,
  res: Response,
) => {
  const { productId } = req.params;

  if (
    !isValidObjectId(productId) ||
    !(await Product.exists({
      $and: [{ _id: productId }, liveProducts()],
    }))
  ) {
    throw new AppError(404, "Product not found");
  }

  const user = await User.findByIdAndUpdate(
    me(req)._id,
    { $addToSet: { savedItems: productId } },
    { returnDocument: "after" },
  );

  res.json({ savedItems: user!.savedItems });
};

export const unsaveItem = async (
  req: Request<{ productId: string }>,
  res: Response,
) => {
  if (!isValidObjectId(req.params.productId)) {
    throw new AppError(404, "Product not found");
  }

  const user = await User.findByIdAndUpdate(
    me(req)._id,
    { $pull: { savedItems: req.params.productId } },
    { returnDocument: "after" },
  );

  res.json({ savedItems: user!.savedItems });
};
