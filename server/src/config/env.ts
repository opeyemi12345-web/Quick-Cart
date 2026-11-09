//env.ts
//Reads the settings from the .env file in one place, so the rest of the code uses `env.pert`, `env.moguri` etc.

import dotenv from "dotenv";
dotenv.config({ quiet: true });

//=== Step1: read the settings from .env
// All settings (port, database adresss, JWT secret... )are raed from .env here, once, so the rest of the code usesenv.port, env.monogoUri And so on

//Next: step2 ( coNNECT TO mONGOdB) -> SEVER/src/confing/database.ts

export const env = {
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI || "",
  jwtSecret: process.env.JWT_SECRET || "dev-Secret-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "15d", // remain logedd in for 15days
  ClientUrl: process.env.CLIENT_URL || "http://localhost:5173",
};
