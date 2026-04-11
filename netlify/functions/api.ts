import serverless from "serverless-http";
import { app, createServer } from "../../server";

// Initialize the server routes
await createServer();

export const handler = serverless(app);
