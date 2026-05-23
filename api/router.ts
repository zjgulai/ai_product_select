import { createRouter, publicQuery } from "./middleware";
import { dataManagerRouter } from "./routers/dataManager";
import { amazonRouter } from "./routers/amazon";
import { tiktokRouter } from "./routers/tiktok";
import { fusionRouter } from "./routers/fusion";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  dataManager: dataManagerRouter,
  amazon: amazonRouter,
  tiktok: tiktokRouter,
  fusion: fusionRouter,
});

export type AppRouter = typeof appRouter;
