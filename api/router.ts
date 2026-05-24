import { createRouter, publicQuery } from "./middleware";
import { dataManagerRouter } from "./routers/dataManager";
import { dataLineageRouter } from "./routers/dataLineage";
import { amazonRouter } from "./routers/amazon";
import { tiktokRouter } from "./routers/tiktok";
import { fusionRouter } from "./routers/fusion";
import { ipmsRouter } from "./routers/ipms";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  dataManager: dataManagerRouter,
  dataLineage: dataLineageRouter,
  amazon: amazonRouter,
  tiktok: tiktokRouter,
  fusion: fusionRouter,
  ipms: ipmsRouter,
});

export type AppRouter = typeof appRouter;
