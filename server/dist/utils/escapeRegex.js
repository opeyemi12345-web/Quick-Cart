"use strict";
// escapeRegex.ts server/src/utils/escapeRegex.ts
// Makes user text safe to put inside a regular expression: "3.5mm (black)" -> "3\.5mm \(black\)"
// Without it, "." would match any character and "(" would crash the search.
Object.defineProperty(exports, "__esModule", { value: true });
exports.escapeRegex = void 0;
// STEP 16: The products API (helper)
const escapeRegex = (text) => {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& = "the character that matched"
};
exports.escapeRegex = escapeRegex;
