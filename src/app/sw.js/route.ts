import { NextResponse } from "next/server";

export const dynamic = "force-static";

/**
 * Self-unregistering Service Worker cleanup endpoint.
 * If a developer's browser previously registered `/sw.js` on `localhost:3000`
 * from another project, this script clears stale CacheStorage entries and
 * unregisters the rogue worker cleanly instead of logging 404s or serving stale assets.
 */
const SW_CLEANUP_SCRIPT = `self.addEventListener("install", () => {
  self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.matchAll({ type: "window" }))
      .then((clients) => {
        for (const client of clients) {
          client.navigate(client.url);
        }
      })
  );
});
`;

export function GET() {
  return new NextResponse(SW_CLEANUP_SCRIPT, {
    status: 200,
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "Service-Worker-Allowed": "/",
    },
  });
}
