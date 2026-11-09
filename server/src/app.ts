// app.ts
// Creates the Express app: settings first, then all the /api
// routes, then the "not found" and error handlers.
// it does not start listening; server.ts does that

import express from "express";
import { env } from "./config/env";

// STEP 3: Create the Express app
// The express app: allow the website to call us (CORS), read JSON bodies, server uploaded photos,
// put every route under /api, then the 404 and error handlers

const app = express();

app.use(express.json());
export default app;
// Step 4: (AHndle unknown url and errors) -> Server/src/middlware/notfound.ts
