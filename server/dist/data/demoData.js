"use strict";
// demoData.ts
// Turns the demo data files (categories.ts, products.ts) into records shaped like the
// models, ready for seed.ts to save. Nothing here talks to MongoDB.
Object.defineProperty(exports, "__esModule", { value: true });
exports.demoProducts = exports.demoUsers = exports.demoCategories = exports.photosFor = exports.makeRatingCounts = void 0;
const cloudinary_1 = require("../config/cloudinary");
const categories_1 = require("./categories");
const product_1 = require("./product");
const users_1 = require("./users");
const slugify_1 = require("../utils/slugify");
// STEP 12: Put the demo data in the database (part 1: shap the records)
// The data files use slugs and simple names; the database needs real ids, full photo
// addresses and every field the model expects. these functions do that translation
//---- Star rating breakdown---------------------------------
//The product page show bars for 5, 4, 3, 2, 1, stars, when product.ts doesnt give ratings counts, we make believabale one for the average rating.
//Each row: "if the rating is atleast minRating, Spit the reviews like this (percent)"
const RATING_SHARE = [
    { minRating: 4.7, shares: [80, 14, 4, 1, 1] },
    { minRating: 4.4, shares: [65, 22, 8, 3, 2] },
    { minRating: 4.0, shares: [50, 28, 12, 6, 4] },
    { minRating: 0, shares: [35, 30, 18, 10, 7] },
];
//makeRatingCounts(4,8, 248)
const makeRatingCounts = (rating, reviewCount) => {
    const { shares } = RATING_SHARE.find((row) => {
        return rating >= row.minRating;
    });
    const counts = shares.map((share) => {
        return Math.round((reviewCount * share) / 100);
    });
    //Rounding can lead us one or two off; give the difference to the star bar
    const total = counts.reduce((sum, count) => {
        return sum + count;
    }, 0);
    counts[0] += reviewCount - total;
    return counts;
};
exports.makeRatingCounts = makeRatingCounts;
//------------photos--------------------------------
// from all phhoto ids on cloudinary, pick this products ones ("<slug>-1", "<slug>-2",...)
//put them in number order, and turn them into full adress
const photosFor = (slug, photoIds) => {
    const prefix = `${cloudinary_1.PHOTO_FOLDER}/${slug}-`;
    return photoIds
        .filter((id) => {
        return id.startsWith(prefix) && /^\d+$/.test(id.slice(prefix.length));
    })
        .sort((a, b) => {
        return Number(a.slice(prefix.length)) - Number(b.slice(prefix.length));
    })
        .map(cloudinary_1.photoUrl);
};
exports.photosFor = photosFor;
// -----Categories -----------------
// ctaegories.ts is already shaped like the category model, so we hand it over as it is.
const demoCategories = () => {
    return categories_1.categories;
};
exports.demoCategories = demoCategories;
// --- Users ---------------------------------------------------------------------------
// users.ts is already shaped like the User model. Passwords are hashed by the model when seed.ts saves them.
const demoUsers = () => {
    return users_1.users;
};
exports.demoUsers = demoUsers;
//-----------products -------------------------------
//one product from product.ts -> one record shape like the product model.
//bundle and related are left out here: they point to other products, which dont have ids until they are saved.seed.ts links afterward(STEP 13)
const buildProduct = (item, categoryId, photoIds) => {
    const slug = (0, slugify_1.slugify)(item.name);
    return {
        name: item.name,
        slug,
        description: item.description,
        tagline: item.tagline,
        priceNote: item.priceNote,
        features: item.features ?? [],
        specs: item.specs ?? [],
        category: categoryId,
        brand: item.brand,
        sku: item.sku,
        price: item.price,
        oldPrice: item.oldPrice,
        costPrice: Math.round(item.price * 0.6), // pretend the shop paid 60% (admin margin display)
        trackStock: true,
        stock: item.stock,
        lowStockThreshold: 10,
        images: (0, exports.photosFor)(item.photo ?? slug, photoIds),
        gallery: [], // empty = the product page uses images
        colors: item.colors ?? [],
        tags: item.tags ?? [],
        badge: item.badge,
        highlights: item.highlights ?? [],
        ratings: item.rating, // products.ts says "rating", the model says "ratings"
        reviewCount: item.reviewCount,
        ratingCounts: item.ratingCounts ?? (0, exports.makeRatingCounts)(item.rating, item.reviewCount),
        sold: item.sold ?? item.reviewCount * 4,
        flashSaleStock: item.flashSaleStock,
        status: "published",
    };
};
//All 40 products. ctegoryIds maps a category slug to its save _id,
//e.g "electronics" -> ObjectId("665f...")
const demoProducts = (categoryIds, photoIds) => {
    return product_1.products.map((item) => {
        const categoryId = categoryIds.get(item.category);
        //A typo in products.ts (e,g "electronic") should top seed loudly, not save bad data
        if (!categoryId) {
            throw new Error(`"${item.name}" has an unknown category: "${item.category}"`);
        }
        return buildProduct(item, categoryId, photoIds);
    });
};
exports.demoProducts = demoProducts;
