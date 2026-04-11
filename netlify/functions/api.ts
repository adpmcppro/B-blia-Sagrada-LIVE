import serverless from "serverless-http";
import { app, createServer } from "../../server";

let handlerInstance: any;

export const handler: any = async (event: any, context: any) => {
  if (!handlerInstance) {
    await createServer();
    handlerInstance = serverless(app);
  }
  return handlerInstance(event, context);
};
