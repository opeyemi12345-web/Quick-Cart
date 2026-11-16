"use strict";
//slugify
//Turns a name into a web-friendly id, e.g "Home & living" -> "home-living"
Object.defineProperty(exports, "__esModule", { value: true });
exports.slugify = void 0;
//STEP: Make web-friendly names (slugs)
const slugify = (text) => {
    return text
        .toLowerCase()
        .replace(/&/g, " ")
        .replace(/[^a-z0-9]+/g, "-") //anything that is not alleter or number becomes "-"
        .replace(/^-+|-+$/g, "");
};
exports.slugify = slugify;
