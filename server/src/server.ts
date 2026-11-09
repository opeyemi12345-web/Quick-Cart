//server.ts
//THE starting point of the API:CONNECT to MongoDB, then start listening for requests.
import app from "./app";
import { connectDB } from "./config/database";
import { env } from "./config/env";

//STEP 6: Start the server
//THE starting point: connect to MongoDB first, then start listening on the port. if the database can't  be reached, show the error
const startServer = async () => {
  try {
    await connectDB(); //MONGO_URI from the .env file

    app.listen(env.port, () => {
      console.log(`QuickCart API running on http://localhost:${env.port}`);
    });
  } catch (error) {
    console.error("COuld not connect to MongoDB:", (error as Error).message);
    process.exit(1);
  }
};

startServer();
