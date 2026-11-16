"use strict";
// adminProductController.ts server/src/controllers/adminProductController.ts
// The admin's Products pages: the products table (tabs, search, filters), the Add / Edit Product form,
// photo uploads to Cloudinary, and deleting products.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProduct = exports.generateSku = exports.updateProduct = exports.createProduct = exports.getAdminProduct = exports.getAdminProducts = exports.uploadProductPhotos = void 0;
// STEP 25 (part 2): Admin products
// POST   /api/admin/uploads          (form-data, field "photos") -> { urls: [...] } to put in images / gallery
// GET    /api/admin/products         ?tab=low-stock&search=...&category=electronics&sort=price-asc&page=1
// GET    /api/admin/products/:id     -> everything, including costPrice and drafts
// POST   /api/admin/products         -> create
// PATCH  /api/admin/products/:id     -> change only the fields sent
// DELETE /api/admin/products/:id
const crypto_1 = __importDefault(require("crypto"));
const cloudinary_1 = require("../config/cloudinary");
const Category_1 = require("../models/Category");
const Order_1 = require("../models/Order");
const Products_1 = require("../models/Products");
const Review_1 = require("../models/Review");
const User_1 = require("../models/User");
const AppError_1 = require("../utils/AppError");
const escapeRegex_1 = require("../utils/escapeRegex");
const slugify_1 = require("../utils/slugify");
const productController_1 = require("./productController");
// ---- Photos -------------------------------------------------------------------
const uploadProductPhotos = async (req, res) => {
    if (!cloudinary_1.isCloudinaryReady) {
        throw new AppError_1.AppError(503, `Photo uploads are not set up. ${cloudinary_1.CLOUDINARY_MISSING}`);
    }
    const files = (req.files ?? []);
    if (files.length === 0) {
        throw new AppError_1.AppError(400, "Please choose at least one photo.");
    }
    const ids = await Promise.all(files.map((file) => (0, cloudinary_1.uploadPhoto)(file.buffer, `${cloudinary_1.UPLOAD_FOLDER}/${crypto_1.default.randomBytes(12).toString("hex")}`)));
    res.status(201).json({ urls: ids.map(cloudinary_1.photoUrl) });
};
exports.uploadProductPhotos = uploadProductPhotos;
const deleteUnusedPhotos = async (urls) => {
    for (const url of new Set(urls)) {
        const publicId = (0, cloudinary_1.uploadedPhotoId)(url);
        if (!publicId) {
            continue;
        }
        const [usedByProduct, usedByOrder] = await Promise.all([
            Products_1.Product.exists({ $or: [{ images: url }, { gallery: url }] }),
            Order_1.Order.exists({ "items.image": url }),
        ]);
        if (!usedByProduct && !usedByOrder) {
            await (0, cloudinary_1.deletePhoto)(publicId);
        }
    }
};
// ---- The products table -------------------------------------------------------
const TABS = {
    all: {},
    "in-stock": {
        $or: [
            { trackStock: false },
            { $expr: { $gt: ["$stock", "$lowStockThreshold"] } },
        ],
    },
    "low-stock": {
        trackStock: true,
        stock: { $gt: 0 },
        $expr: { $lte: ["$stock", "$lowStockThreshold"] },
    },
    "out-of-stock": { trackStock: true, stock: 0 },
    drafts: { status: "draft" },
};
const SORTS = {
    updated: { updatedAt: -1, _id: -1 },
    name: { name: 1, _id: 1 },
    "price-asc": { price: 1, _id: 1 },
    "price-desc": { price: -1, _id: -1 },
    "stock-asc": { stock: 1, _id: 1 },
};
const TABLE_FIELDS = "name slug sku brand category price oldPrice costPrice images trackStock stock lowStockThreshold status publishedAt badge updatedAt";
const text = (value) => typeof value === "string" ? value.trim() : "";
const getAdminProducts = async (req, res) => {
    const tab = text(req.query.tab) || "all";
    if (!TABS[tab]) {
        throw new AppError_1.AppError(400, `Unknown tab: ${tab}. Use one of: ${Object.keys(TABS).join(", ")}.`);
    }
    const conditions = [TABS[tab]];
    const search = text(req.query.search);
    if (search) {
        const pattern = new RegExp((0, escapeRegex_1.escapeRegex)(search), "i");
        conditions.push({ $or: [{ name: pattern }, { sku: pattern }] });
    }
    const categorySlug = text(req.query.category).toLowerCase();
    if (categorySlug) {
        const category = await Category_1.Category.findOne({ slug: categorySlug });
        conditions.push({ category: category?._id ?? null });
    }
    const minPrice = Number(text(req.query.minPrice));
    const maxPrice = Number(text(req.query.maxPrice));
    if (text(req.query.minPrice) && Number.isFinite(minPrice)) {
        conditions.push({ price: { $gte: minPrice } });
    }
    if (text(req.query.maxPrice) && Number.isFinite(maxPrice)) {
        conditions.push({ price: { $lte: maxPrice } });
    }
    const sort = SORTS[text(req.query.sort)] ?? SORTS.updated;
    const limit = Math.min((0, productController_1.wholeNumber)(req.query.limit, 8), 100);
    const page = (0, productController_1.wholeNumber)(req.query.page, 1);
    const filter = { $and: conditions };
    const [products, total, ...tabCounts] = await Promise.all([
        Products_1.Product.find(filter)
            .select(TABLE_FIELDS)
            .populate("category", "name slug")
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        Products_1.Product.countDocuments(filter),
        ...Object.values(TABS).map((condition) => Products_1.Product.countDocuments(condition)),
    ]);
    const counts = Object.fromEntries(Object.keys(TABS).map((name, index) => [name, tabCounts[index]]));
    res.json({ products, total, page, pages: Math.ceil(total / limit), counts });
};
exports.getAdminProducts = getAdminProducts;
const findProduct = async (id) => {
    const product = productController_1.OBJECT_ID.test(id) ? await Products_1.Product.findById(id) : null;
    if (!product) {
        throw new AppError_1.AppError(404, "Product not found");
    }
    return product;
};
const getAdminProduct = async (req, res) => {
    const product = await findProduct(req.params.id);
    res.json({ product });
};
exports.getAdminProduct = getAdminProduct;
// ---- Create and edit ----------------------------------------------------------
const EDITABLE_FIELDS = [
    "name",
    "description",
    "tagline",
    "priceNote",
    "features",
    "specs",
    "category",
    "brand",
    "sku",
    "price",
    "oldPrice",
    "costPrice",
    "trackStock",
    "stock",
    "lowStockThreshold",
    "images",
    "gallery",
    "colors",
    "tags",
    "badge",
    "highlights",
    "flashSaleStock",
    "bundleProducts",
    "relatedProducts",
    "status",
    "publishedAt",
];
const pickEditableFields = (body = {}) => Object.fromEntries(EDITABLE_FIELDS.filter((field) => body[field] !== undefined).map((field) => [field, body[field]]));
const uniqueSlug = async (name) => {
    const base = (0, slugify_1.slugify)(name) || "product";
    let slug = base;
    for (let n = 2; await Products_1.Product.exists({ slug }); n++) {
        slug = `${base}-${n}`;
    }
    return slug;
};
const newSku = async (categoryName) => {
    const letters = categoryName.replace(/[^a-z]/gi, "").slice(0, 2).toUpperCase() || "GN";
    let sku;
    do {
        sku = `QC-${letters}-${crypto_1.default.randomInt(1000, 10000)}`;
    } while (await Products_1.Product.exists({ sku }));
    return sku;
};
const checkProduct = async (product) => {
    if (!product.name?.trim()) {
        throw new AppError_1.AppError(400, "Please enter the product title.");
    }
    if (!product.category || !(await Category_1.Category.exists({ _id: product.category }))) {
        throw new AppError_1.AppError(400, "Please choose a category.");
    }
    if (product.oldPrice != null && product.oldPrice <= product.price) {
        throw new AppError_1.AppError(400, "The regular price must be higher than the sale price.");
    }
    if (product.status === "scheduled" && !product.publishedAt) {
        throw new AppError_1.AppError(400, "Please pick the date and time a scheduled product goes live.");
    }
    for (const url of [...product.images, ...product.gallery]) {
        if (!(0, cloudinary_1.isOurPhoto)(url)) {
            throw new AppError_1.AppError(400, "Please add photos with the Add Image button.");
        }
    }
    product.tags = [...new Set(product.tags.map(slugify_1.slugify).filter(Boolean))];
};
const createProduct = async (req, res) => {
    const product = new Products_1.Product(pickEditableFields(req.body));
    await checkProduct(product);
    product.slug = await uniqueSlug(product.name);
    if (!product.sku?.trim()) {
        const category = await Category_1.Category.findById(product.category);
        product.sku = await newSku(category.name);
    }
    await product.save();
    res.status(201).json({
        message: `'${product.name}' has been created.`,
        product,
    });
};
exports.createProduct = createProduct;
const updateProduct = async (req, res) => {
    const product = await findProduct(req.params.id);
    const photosBefore = [...product.images, ...product.gallery];
    product.set(pickEditableFields(req.body));
    await checkProduct(product);
    await product.save();
    const photosNow = [...product.images, ...product.gallery];
    await deleteUnusedPhotos(photosBefore.filter((url) => !photosNow.includes(url)));
    const where = product.status === "published"
        ? "is live"
        : product.status === "draft"
            ? "is saved as a draft"
            : "is scheduled";
    res.json({ message: `'${product.name}' ${where}.`, product });
};
exports.updateProduct = updateProduct;
const generateSku = async (req, res) => {
    const id = text(req.query.category);
    const category = productController_1.OBJECT_ID.test(id) ? await Category_1.Category.findById(id) : null;
    res.json({ sku: await newSku(category?.name ?? "") });
};
exports.generateSku = generateSku;
// ---- Delete ------------------------------------------------------------------
const deleteProduct = async (req, res) => {
    const product = await findProduct(req.params.id);
    await product.deleteOne();
    await Promise.all([
        Review_1.Review.deleteMany({ product: product._id }),
        User_1.User.updateMany({ savedItems: product._id }, { $pull: { savedItems: product._id } }),
        Products_1.Product.updateMany({ $or: [{ bundleProducts: product._id }, { relatedProducts: product._id }] }, {
            $pull: {
                bundleProducts: product._id,
                relatedProducts: product._id,
            },
        }),
    ]);
    await deleteUnusedPhotos([...product.images, ...product.gallery]);
    res.json({ message: `'${product.name}' has been deleted.` });
};
exports.deleteProduct = deleteProduct;
