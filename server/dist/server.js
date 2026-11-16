"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
//server.ts
//THE starting point of the API:CONNECT to MongoDB, then start listening for requests.
const app_1 = __importDefault(require("./app"));
const database_1 = require("./config/database");
const env_1 = require("./config/env");
//STEP 6: Start the server
//THE starting point: connect to MongoDB first, then start listening on the port. if the database can't  be reached, show the error
const startServer = async () => {
    try {
        await (0, database_1.connectDB)(); //MONGO_URI from the .env file
        app_1.default.listen(env_1.env.port, () => {
            console.log(`QuickCart API running on http://localhost:${env_1.env.port}`);
        });
    }
    catch (error) {
        console.error("COuld not connect to MongoDB:", error.message);
        process.exit(1);
    }
};
startServer();
