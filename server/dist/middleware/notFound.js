"use strict";
//not found
//Runs when no route matches th request, and replies with a 404 message.
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFound = void 0;
//STEP4: Handle unknown URLs and errors
// RUns when no route  matched:replies 404 as json. errorHAndler.ts(same step) turns any throen error into a json reply instead of crashing
const notFound = (req, res) => {
    res
        .status(404)
        .json({ message: `Not found: ${req.method} ${req.originalUrl}` });
};
exports.notFound = notFound;
//Next: STEP 5(join the routes and add a health check) ->server/src/routes/index.ts
