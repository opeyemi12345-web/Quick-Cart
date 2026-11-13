// seed.ts
// fills the database with the demodata : npm run seed
// Running it again wipes the demo collections and starts fresh, so its always safe to re-run

import mongoose, { Types } from "mongoose";
import { Category } from "../models/Category";
import { Product } from "../models/Products";
import { User } from "../models/User";
import { demoCategories, demoProducts, demoUsers } from "./demoData";
import { listProductPhotoIds } from "../config/cloudinary";
import { products } from "./product";
import { categories } from "./categories";
import { connectDB } from "../config/database";

// STEP 13:The seed command
// seedDatabase() does the work and is exported, so the demo panel can reuse it.
// The bottom of the file runs it only when you type npm run seed.

export const seedDatabase = async () => {
  // 1. Empty the collections (both at the same time with Promise.all)
  await Promise.all([
    Category.deleteMany({}),
    Product.deleteMany({}),
    User.deleteMany({}),
  ]);

  // 2. Save the users with create() so password save hooks hash their passwords.
  const savedUsers = await User.create(demoUsers());

  // 3. Save the categories, then remember each ones id by slug.
  const savedCategories = await Category.insertMany(demoCategories());
  const categoryIds = new Map<string, Types.ObjectId>(
    savedCategories.map((category) => {
      return [category.slug, category._id];
    }),
  );

  // 4. Which photos are on cloudinary?
  const photoIds = await listProductPhotoIds();

  // 5. Save the products
  const saveProducts = await Product.insertMany(
    demoProducts(categoryIds, photoIds),
  );

  // 6. Link bundles and related products. products.ts uses names: we swap each name for its id.
  const productIds = new Map<string, Types.ObjectId>(
    saveProducts.map((product) => {
      return [product.name, product._id];
    }),
  );

  //   Gold-plated 3.5mm AUX Cable", ..] -> [ObjectId(...)...]
  // A misspelt name stops the seed with a clear message instead of silently dropping the link.

  const idsFor = (names: string[] | undefined, owner: string) => {
    return (names ?? []).map((name) => {
      const id = productIds.get(name);
      if (!id) {
        throw new Error(
          `"${owner}" links to a product that doesnt exost: "${name}"`,
        );
      }

      return id;
    });
  };

  //   bulkwrite sends all 40 updates to mongodb in one trip instead of 40 seperate saves
  await Product.bulkWrite(
    products.map((item) => {
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
    }),
  );

  // 7. A summary for whoever ran the seed.
  return {
    users: savedUsers.length,
    categories: savedCategories.length,
    products: saveProducts.length,
    withoutPhotos: saveProducts
      .filter((Product) => {
        return Product.images.length === 0;
      })

      .map((Product) => {
        return (Product.name, User);
      }),
  };
};

// Runs when you type "npm run seed": connect,seed,report and disconnected

const runSeed = async () => {
  try {
    await connectDB();
    const result = await seedDatabase();

    console.log(
      `Seeded ${result.users} users, ${result.categories} categories and ${result.products} products`,
    );
  } catch (error) {
    console.error("Seed failed:", (error as Error).message);
    process.exitCode = 1; //m tells the terminal it failed, without  cutting off the disconnect below
  } finally {
    await mongoose.disconnect(); //without this the ommand would hang and never finish
  }
};

// "requir.main == "module" is true only when this file is run directly (npm run seed),
// not when another file imports seedDatabase (the demo panel). so importing never re-seeds by accident

if (require.main === module) {
  runSeed();
}
