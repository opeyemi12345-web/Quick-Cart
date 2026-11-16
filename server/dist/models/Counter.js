"use strict";
// Counter model server/src/models/Counter.ts
// Hands out numbers one after another (1, 2, 3...), even when two orders are placed at the same moment.
// Used for order numbers: #QC-1042, #QC-1043...
Object.defineProperty(exports, "__esModule", { value: true });
exports.nextNumber = exports.Counter = void 0;
// STEP 22 (part 1): A counter for order numbers
const mongoose_1 = require("mongoose");
const counterSchema = new mongoose_1.Schema({
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 },
});
exports.Counter = (0, mongoose_1.model)("Counter", counterSchema);
// nextNumber("order") -> 1, then 2, then 3...
// $inc adds 1 INSIDE MongoDB in one step, so two orders at the same time can never get the same number.
// upsert: true = if the counter doesn't exist yet, create it (the first call gives 1).
const nextNumber = async (name) => {
    const counter = await exports.Counter.findOneAndUpdate({ _id: name }, { $inc: { seq: 1 } }, { upsert: true, returnDocument: "after" });
    return counter.seq; // "!" = with upsert there is always a counter
};
exports.nextNumber = nextNumber;
