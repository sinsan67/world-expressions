/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import { ExpirationPlugin, Serwist, StaleWhileRevalidate } from "serwist";

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: (string | import("serwist").PrecacheEntry)[];
};

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // Render backend GET requests: return cached data immediately while
    // revalidating in background — masks the 30-50s cold start on free tier.
    {
      matcher: ({ url }) => url.hostname.endsWith("onrender.com"),
      method: "GET",
      handler: new StaleWhileRevalidate({
        cacheName: "render-api",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 128,
            maxAgeSeconds: 24 * 60 * 60,
          }),
        ],
      }),
    },
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();
