// uploadImages.ts
//sends every product photo in afolder on your computer to cloudinary, into "quickcart/products"
// A file called "smart-watch-ultra-1-jpeg" becomes the photo "quickcart/products/smart-watch-ultra-1"

import path from "path";
import {
  CLOUDINARY_MISSING,
  isCloudinaryReady,
  PHOTO_FOLDER,
  uploadPhoto,
} from "../config/cloudinary";
import fs from "fs";

//STEP 11: put the demo products on cloudinary
// Run it from the server folder: npm run upload-images -- "C:/Users/USER/Desktop/quickCart-product photos"
//Everything after "--" is handed to this script process.argv[2] is the folder

//only these files types are photos; anything else in the folder (e.g desktop.ini) is skipped

const PHOTO_TYPES = [".jpg", ".jpeg", ".png", "webp"];

const uploadImages = async () => {
  const folder = process.argv[2];

  //1.check we have everything before we start
  if (!folder) {
    console.error(
      'Say where the photos are: npm run upload-images "C:/path/to/photos"',
    );
    process.exit(1);
  }

  if (!isCloudinaryReady) {
    console.error(CLOUDINARY_MISSING);
    process.exit(1);
  }

  if (!fs.existsSync(folder)) {
    console.error(`Folder not found: ${folder}`);
    process.exit(1);
  }

  //2. list the photo files in the folder
  const files = fs.readdirSync(folder).filter((file) => {
    return PHOTO_TYPES.includes(path.extname(file).toLowerCase());
  });
  console.log(`Uploading ${files.length} photos to Cloudinary...`);

  //upload them one at a time (simple, and kind to a slow connection)
  let uploaded = 0;
  let failed = 0;

  for (const file of files) {
    //"smart-watch-ultra-1.jpeg -> "smart-watch-ultra-1(trim remives stray spaces)"
    const name = path.parse(file).name.trim().toLowerCase();
    const bytes = fs.readFileSync(path.join(folder, file));

    try {
      const publicId = await uploadPhoto(bytes, `${PHOTO_FOLDER}/${name}`);
      uploaded++;
      console.log(`Uploaded ${uploaded}/${files.length}: ${publicId}`);
    } catch (error) {
      failed++;
      console.error(`Failed to upload ${file}:`, error);
    }
  }

  console.log(`Done. Uploaded ${uploaded} file(s); failed ${failed}.`);
};

uploadImages();
