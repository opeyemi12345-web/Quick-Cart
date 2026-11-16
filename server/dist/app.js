"use strict";
// "not found" and error handlers.
// It does not start listening; server.ts does that
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const env_1 = require("./config/env");
const routes_1 = __importDefault(require("./routes"));
const notFound_1 = require("./middleware/notFound");
const errorHandler_1 = require("./middleware/errorHandler");
// STEP 3: Create the Express app
// The Express app: allow the website to call us (CORS), read JSON bodies, server
// uploaded photos, put every route under /api, then the 404 and error handlers.
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: env_1.env.clientUrl, credentials: true })); // let the website (CLIENT_URL) call the API
app.use(express_1.default.json());
app.use("/api", routes_1.default); // every route lives under /api, e.g. /api/health
app.use(notFound_1.notFound); // must come after the routes: runs only when nothing above matched
app.use(errorHandler_1.errorHandler); //must be last: catches errors thrown by any route above
exports.default = app;
// Next: STEP 4 (handle unknown URLs and errors) -> server/src/middleware/notFound.ts
