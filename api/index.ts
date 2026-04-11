import { app, createServer } from "../server";

let initialized = false;

const handler = async (req: any, res: any) => {
  if (!initialized) {
    await createServer();
    initialized = true;
  }
  return app(req, res);
};

export default handler;
