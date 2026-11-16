"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listProductPhotoIds = exports.deleteAllUploadedPhotos = exports.deletePhoto = exports.uploadPhoto = exports.uploadedPhotoId = exports.isOurPhoto = exports.productPhotoUrl = exports.photoUrl = exports.CLOUDINARY_MISSING = exports.isCloudinaryReady = exports.UPLOAD_FOLDER = exports.PHOTO_FOLDER = void 0;
// cloudinary.ts
// Product photo lives on cloudinary, a service that stores pictures and serves them quickly from anywhere in the world this file logs in to cloudinary once and has small helpers for photo addressses
const cloudinary_1 = require("cloudinary");
const env_1 = require("./env");
// Every product photo is kept in  the "quickcart/products" folder:
// quickcart/products/smart-watch-ultra
exports.PHOTO_FOLDER = "quickcart/products";
exports.UPLOAD_FOLDER = `${exports.PHOTO_FOLDER}/uploads`;
// Store products photos on Cloudinary
// Log into cloudinary with the 3 settings from .env, and build photo addressess. f_auto, q_auto in an address asks cloudinary for the best format and size for each browser, so photos loads faster
exports.isCloudinaryReady = Boolean(env_1.env.cloudinaryCloudName && env_1.env.cloudinaryApiKey && env_1.env.cloudinaryApiSecret);
// What  to do when the cloudinary settings are missing
exports.CLOUDINARY_MISSING = "Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY AND CLOUDINARY_API_SECRET to server/.env./";
cloudinary_1.v2.config({
    cloud_name: env_1.env.cloudinaryCloudName,
    api_key: env_1.env.cloudinaryApiKey,
    api_secret: env_1.env.cloudinaryApiSecret,
    secure: true, // http addresss
});
const PHOTO_URL_START = `https://res.cloudinary.com/${env_1.env.cloudinaryCloudName}/image/upload/f_auto,q_auto/`;
// "quickcart/products/smart-watch-ultra" -> "https://res.cloudinary.com/my-cloud/image/upload/f_auto,q_auto/quickcart/products/smart/watch/ultra"
const photoUrl = (publicId) => {
    return PHOTO_URL_START + publicId;
};
exports.photoUrl = photoUrl;
// the photo of a demo product, from its slug: "smart-watch-ultra" -> its cloudinary address
const productPhotoUrl = (slug) => {
    return (0, exports.photoUrl)(`${exports.PHOTO_FOLDER}/${slug}`);
};
exports.productPhotoUrl = productPhotoUrl;
// is this one of our own product photos? (an address in our cloudinary folder, nothing else)
const isOurPhoto = (url) => {
    if (!exports.isCloudinaryReady ||
        !url.startsWith(PHOTO_URL_START + exports.PHOTO_FOLDER + "/")) {
        return false;
    }
    return /^[\w/-]+$/.test(url.slice(PHOTO_URL_START.length));
};
exports.isOurPhoto = isOurPhoto;
// the cloudinary name (public id) of a photo an admin uploads, or null for any other photo.
// Demo photos are never deleted from admin; npm run upload images puts them there.
const uploadedPhotoId = (url) => {
    if (!exports.isCloudinaryReady ||
        !url.startsWith(PHOTO_URL_START + exports.UPLOAD_FOLDER + "/")) {
        return null;
    }
    return url.slice(PHOTO_URL_START.length);
};
exports.uploadedPhotoId = uploadedPhotoId;
// Sends a photo (the file's bytes) to cloudinary and returns its public id
const uploadPhoto = (bytes, publicId) => {
    return new Promise((resolve, reject) => {
        const upload = cloudinary_1.v2.uploader.upload_stream({ public_id: publicId, overwrite: true, resource_type: "image" }, (error, result) => {
            return error || !result
                ? reject(error ?? new Error("Cloudinary didnt answer"))
                : resolve(result.public_id);
        });
        upload.end(bytes);
    });
};
exports.uploadPhoto = uploadPhoto;
// Deletes one photo from cloudinary (a missing photo is not an error)
const deletePhoto = async (publicId) => {
    await cloudinary_1.v2.uploader
        .destroy(publicId, { invalidate: true })
        .catch(() => { });
};
exports.deletePhoto = deletePhoto;
// Deletes every photo admins uploads (the demo panels "Reset demo data" does this)
const deleteAllUploadedPhotos = async () => {
    if (!exports.isCloudinaryReady) {
        return;
    }
    await cloudinary_1.v2.api
        .delete_resources_by_prefix(`${exports.UPLOAD_FOLDER}/`)
        .catch(() => { });
};
exports.deleteAllUploadedPhotos = deleteAllUploadedPhotos;
//list the names (public ids) of all demo product photos on cloudinary
//e.g ["quickcart/products/smart-watch-ultra-1", ...]. Admin uploads are left out
//cloudinary sends at most 500 per pages, so we keep asking for the next page until there is none
//Empty list when cloudinary isn't set up (the products are then saved without pfotos.)
const listProductPhotoIds = async () => {
    if (!exports.isCloudinaryReady) {
        return [];
    }
    const ids = [];
    let nextCursor = undefined;
    do {
        const page = await cloudinary_1.v2.api.resources({
            type: "upload",
            prefix: `${exports.PHOTO_FOLDER}`,
            max_results: 500,
            next_cursor: nextCursor,
        });
        for (const photo of page.resources) {
            ids.push(photo.public_id);
        }
        nextCursor = page.next_cursor; //undefined on the last page which end th loop
    } while (nextCursor);
    return ids.filter((id) => {
        return !id.startsWith(`${exports.UPLOAD_FOLDER}/`);
    });
};
exports.listProductPhotoIds = listProductPhotoIds;
