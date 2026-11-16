"use strict";
// uploadImages.ts
//sends every product photo in afolder on your computer to cloudinary, into "quickcart/products"
// A file called "smart-watch-ultra-1-jpeg" becomes the photo "quickcart/products/smart-watch-ultra-1"
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const cloudinary_1 = require("../config/cloudinary");
const fs_1 = __importDefault(require("fs"));
//STEP 11: put the demo products on cloudinary
// Run it from the server folder: npm run upload-images -- "C:/Users/USER/Desktop/quickCart-product photos"
//Everything after "--" is handed to this script process.argv[2] is the folder
//only these files types are photos; anything else in the folder (e.g desktop.ini) is skipped
const PHOTO_TYPES = [".jpg", ".jpeg", ".png", "webp"];
const uploadImages = async () => {
    const folder = process.argv[2];
    //1.check we have everything before we start
    if (!folder) {
        console.error('Say where the photos are: npm run upload-images "C:/path/to/photos"');
        process.exit(1);
    }
    if (!cloudinary_1.isCloudinaryReady) {
        console.error(cloudinary_1.CLOUDINARY_MISSING);
        process.exit(1);
    }
    if (!fs_1.default.existsSync(folder)) {
        console.error(`Folder not found: ${folder}`);
        process.exit(1);
    }
    //2. list the photo files in the folder
    const files = fs_1.default.readdirSync(folder).filter((file) => {
        return PHOTO_TYPES.includes(path_1.default.extname(file).toLowerCase());
    });
    console.log(`Uploading ${files.length} photos to Cloudinary...`);
    //upload them one at a time (simple, and kind to a slow connection)
    let uploaded = 0;
    let failed = 0;
    for (const file of files) {
        //"smart-watch-ultra-1.jpeg -> "smart-watch-ultra-1(trim remives stray spaces)"
        const name = path_1.default.parse(file).name.trim().toLowerCase();
        const bytes = fs_1.default.readFileSync(path_1.default.join(folder, file));
        try {
            const publicId = await (0, cloudinary_1.uploadPhoto)(bytes, `${cloudinary_1.PHOTO_FOLDER}/${name}`);
            uploaded++;
            console.log(`Uploaded ${uploaded}/${files.length}: ${publicId}`);
        }
        catch (error) {
            failed++;
            console.error(`Failed to upload ${file}:`, error);
        }
    }
    console.log(`Done. Uploaded ${uploaded} file(s); failed ${failed}.`);
};
uploadImages();
