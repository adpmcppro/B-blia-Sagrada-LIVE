import { app, createServer } from "../server";

let initialized = false;

const handler = async (req: any, res: any) => {
  console.log(`API Request: ${req.method} ${req.url}`);
  if (!initialized) {
    console.log("Initializing server...");
    await createServer();
    initialized = true;
  }
  return app(req, res);
};

export default handler;
