"use strict";
// database.ts
// Connects to MongoDB using the MONGO_URI from the .env file
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("./env");
// STEP 2: connect to MongoDB
// connectDB() opens the connections to MongoDB with the address from .env . server.ts calls
// it befoe the APi
const connectDB = async () => {
    const connection = await mongoose_1.default.connect(env_1.env.mongoUri);
    console.log(`MongoDB connected: ${connection.connection.host}`);
};
exports.connectDB = connectDB;
//Next: STEP 3 (Create the Express app) -> server/srclapp.ts
