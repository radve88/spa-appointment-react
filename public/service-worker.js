self.addEventListener("install", (event) => {
  console.log("[ServiceWorker] Install");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("[ServiceWorker] Activate");
});

self.addEventListener("fetch", (event) => {
  // Optional: intercept fetch for offline fallback
});