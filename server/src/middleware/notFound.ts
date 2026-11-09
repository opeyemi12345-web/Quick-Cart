//not found
//Runs when no route matches th request, and replies with a 404 message.

import { Request, Response } from "express";

//STEP4: Handle unknown URLs and errors
// RUns when no route  matched:replies 404 as json. errorHAndler.ts(same step) turns any throen error into a json reply instead of crashing

export const notFound = (req: Request, res: Response) => {
  res
    .status(404)
    .json({ message: `Not found: ${req.method} ${req.originalUrl}` });
};

//Next: STEP 5(join the routes and add a health check) ->server/src/routes/index.ts
