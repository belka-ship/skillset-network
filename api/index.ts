import { createApp } from "../server/app";
import type { IncomingMessage, ServerResponse } from "http";

let appInstance: any = null;

async function getApp() {
  if (!appInstance) {
    const { app } = await createApp();
    appInstance = app;
  }
  return appInstance;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const app = await getApp();
  return app(req, res);
}
