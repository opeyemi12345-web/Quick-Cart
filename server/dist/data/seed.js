"use strict";
// seed.ts
// fills the database with the demodata : npm run seed
// Running it again wipes the demo collections and starts fresh, so its always safe to re-run
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDatabase = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Category_1 = require("../models/Category");
const Counter_1 = require("../models/Counter");
const Order_1 = require("../models/Order");
const Products_1 = require("../models/Products");
const PromoCode_1 = require("../models/PromoCode");
const Review_1 = require("../models/Review");
const User_1 = require("../models/User");
const demoData_1 = require("./demoData");
const cloudinary_1 = require("../config/cloudinary");
const product_1 = require("./product");
const database_1 = require("../config/database");
const promoCodes_1 = require("./promoCodes");
const demoOrders_1 = require("./demoOrders");
// STEP 13:The seed command
// seedDatabase() does the work and is exported, so the demo panel can reuse it.
// The bottom of the file runs it only when you type npm run seed.
const seedDatabase = async () => {
    // 1. Empty the collections (both at the same time with Promise.all)
    await Promise.all([
        Category_1.Category.deleteMany({}),
        Products_1.Product.deleteMany({}),
        User_1.User.deleteMany({}),
        PromoCode_1.PromoCode.deleteMany({}),
        Order_1.Order.deleteMany({}),
        Counter_1.Counter.deleteMany({}), // so the next order is #QC-1042 again
        Review_1.Review.deleteMany({}),
    ]);
    // 2. Save the users with create() so password save hooks hash their passwords.
    const savedUsers = await User_1.User.create((0, demoData_1.demoUsers)());
    // 3. Save the categories, then remember each ones id by slug.
    const savedCategories = await Category_1.Category.insertMany((0, demoData_1.demoCategories)());
    const categoryIds = new Map(savedCategories.map((category) => {
        return [category.slug, category._id];
    }));
    // 4. Which photos are on cloudinary?
    const photoIds = await (0, cloudinary_1.listProductPhotoIds)();
    // 5. Save the products
    const saveProducts = await Products_1.Product.insertMany((0, demoData_1.demoProducts)(categoryIds, photoIds));
    // 6. Link bundles and related products. products.ts uses names: we swap each name for its id.
    const productIds = new Map(saveProducts.map((product) => {
        return [product.name, product._id];
    }));
    //   Gold-plated 3.5mm AUX Cable", ..] -> [ObjectId(...)...]
    // A misspelt name stops the seed with a clear message instead of silently dropping the link.
    const idsFor = (names, owner) => {
        return (names ?? []).map((name) => {
            const id = productIds.get(name);
            if (!id) {
                throw new Error(`"${owner}" links to a product that doesnt exost: "${name}"`);
            }
            return id;
        });
    };
    //   bulkwrite sends all 40 updates to mongodb in one trip instead of 40 seperate saves
    await Products_1.Product.bulkWrite(product_1.products.map((item) => {
        return {
            updateOne: {
                filter: { _id: productIds.get(item.name) },
                update: {
                    $set: {
                        bundleProducts: idsFor(item.bundle, item.name),
                        relatedProducts: idsFor(item.related, item.name),
                    },
                },
            },
        };
    }));
    // 7. Save the promo codes (insertMany is fine here: promo codes have no save hooks)
    const savedPromoCodes = await PromoCode_1.PromoCode.insertMany(promoCodes_1.promoCodes);
    // 8. Demo orders (STEP 28): 4 more shoppers and ~40 orders, so the dashboard and Order History have data
    const demoOrderCount = await (0, demoOrders_1.createDemoOrders)(saveProducts);
    // 9. A summary for whoever ran the seed.
    return {
        users: savedUsers.length + demoOrders_1.demoShoppers.length,
        categories: savedCategories.length,
        products: saveProducts.length,
        promoCodes: savedPromoCodes.length,
        orders: demoOrderCount,
        withoutPhotos: saveProducts
            .filter((Product) => {
            return Product.images.length === 0;
        })
            .map((Product) => {
            return Product.name;
        }),
    };
};
exports.seedDatabase = seedDatabase;
// Runs when you type "npm run seed": connect,seed,report and disconnected
const runSeed = async () => {
    try {
        await (0, database_1.connectDB)();
        const result = await (0, exports.seedDatabase)();
        console.log(`Seeded ${result.categories} categories, ${result.products} products, ${result.users} users, ${result.promoCodes} promo codes and ${result.orders} demo orders`);
    }
    catch (error) {
        console.error("Seed failed:", error.message);
        process.exitCode = 1; //m tells the terminal it failed, without  cutting off the disconnect below
    }
    finally {
        await mongoose_1.default.disconnect(); //without this the ommand would hang and never finish
    }
};
// "requir.main == "module" is true only when this file is run directly (npm run seed),
// not when another file imports seedDatabase (the demo panel). so importing never re-seeds by accident
if (require.main === module) {
    runSeed();
}
