"use strict";
// upload.ts server/src/middleware/upload.ts
// Reads the photos the admin picks with "Add Image" (a multipart/form-data request, not JSON).
//   router.post("/uploads", uploadPhotos, uploadProductPhotos)
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadPhotos = exports.MAX_PHOTOS = exports.MAX_PHOTO_MB = void 0;
// STEP 25 (part 1): Read uploaded photos with multer
const multer_1 = __importDefault(require("multer"));
const AppError_1 = require("../utils/AppError");
exports.MAX_PHOTO_MB = 5; // the design says "Max 5MB"
exports.MAX_PHOTOS = 5; // the design has 5 photo slots ("4 / 5 Slots Active")
// The picture types browsers can show. (No SVG: an SVG file can contain code.)
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const upload = (0, multer_1.default)({
    // memoryStorage: keep each file's bytes in memory instead of saving it on disk.
    // We send the bytes straight to Cloudinary, so nothing is left behind on the server.
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: exports.MAX_PHOTO_MB * 1024 * 1024, files: exports.MAX_PHOTOS },
    fileFilter: (_req, file, accept) => {
        if (!PHOTO_TYPES.includes(file.mimetype)) {
            return accept(new AppError_1.AppError(400, "Photos must be JPG, PNG, WebP or AVIF images."));
        }
        accept(null, true);
    },
});
// The form field must be called "photos" (several files allowed). The files end up in req.files.
exports.uploadPhotos = upload.array("photos", exports.MAX_PHOTOS);
