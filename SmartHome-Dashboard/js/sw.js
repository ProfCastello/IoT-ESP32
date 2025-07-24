/**
 * Service Worker para Smart Home Dashboard
 * Permite funcionamento offline e cache de recursos
 */

const CACHE_NAME = "smart-home-dashboard-v1.0.0";
const STATIC_CACHE_URLS = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/app.js",
  "./js/ui-controller.js",
  "./js/mqtt-client.js",
  "./js/chart-controller.js",
  "./manifest.json",
  // CDN resources (cache when accessed)
  "https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css",
  "https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js",
  "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.2/font/bootstrap-icons.css",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css",
  "https://cdn.jsdelivr.net/npm/chart.js",
  "https://unpkg.com/paho-mqtt@1.1.0/paho-mqtt.js",
];

/**
 * Install Event - Cache static resources
 */
self.addEventListener("install", (event) => {
  console.log("Service Worker: Installing...");

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Service Worker: Caching static resources");
        // Primeiro tenta cachear recursos locais
        return cache.addAll([
          "./",
          "./index.html",
          "./css/style.css",
          "./js/app.js",
          "./js/ui-controller.js",
          "./js/mqtt-client.js",
          "./js/chart-controller.js",
          "./manifest.json",
        ]);
      })
      .then(() => {
        console.log("Service Worker: Static resources cached");
        self.skipWaiting(); // Força a ativação imediata
      })
      .catch((error) => {
        console.error("Service Worker: Error caching static resources:", error);
      })
  );
});

/**
 * Activate Event - Clean old caches
 */
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activating...");

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log("Service Worker: Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log("Service Worker: Activated");
        return self.clients.claim(); // Toma controle imediato
      })
  );
});

/**
 * Fetch Event - Serve from cache or network
 */
self.addEventListener("fetch", (event) => {
  // Ignora requisições não HTTP/HTTPS (como chrome-extension://)
  if (!event.request.url.startsWith("http")) {
    return;
  }

  // Ignora requisições MQTT WebSocket
  if (
    event.request.url.includes("mqtt") ||
    event.request.url.includes("websocket")
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Se encontrou no cache, retorna
      if (response) {
        console.log("Service Worker: Serving from cache:", event.request.url);
        return response;
      }

      // Senão, busca na rede
      console.log("Service Worker: Fetching from network:", event.request.url);
      return fetch(event.request)
        .then((networkResponse) => {
          // Se a resposta é válida, adiciona ao cache
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type === "basic"
          ) {
            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }

          return networkResponse;
        })
        .catch((error) => {
          console.error("Service Worker: Network fetch failed:", error);

          // Para navegação, retorna página offline se disponível
          if (event.request.destination === "document") {
            return caches.match("./index.html");
          }

          // Para outros recursos, retorna erro padrão
          return new Response("Offline - Recurso não disponível", {
            status: 503,
            statusText: "Service Unavailable",
            headers: new Headers({
              "Content-Type": "text/plain",
            }),
          });
        });
    })
  );
});

/**
 * Message Event - Handle messages from main thread
 */
self.addEventListener("message", (event) => {
  console.log("Service Worker: Message received:", event.data);

  if (event.data && event.data.type) {
    switch (event.data.type) {
      case "SKIP_WAITING":
        self.skipWaiting();
        break;

      case "GET_VERSION":
        event.ports[0].postMessage({ version: CACHE_NAME });
        break;

      case "CLEAR_CACHE":
        caches.delete(CACHE_NAME).then(() => {
          event.ports[0].postMessage({ cleared: true });
        });
        break;

      default:
        console.log("Service Worker: Unknown message type:", event.data.type);
    }
  }
});

/**
 * Background Sync Event (for future use)
 */
self.addEventListener("sync", (event) => {
  console.log("Service Worker: Background sync:", event.tag);

  if (event.tag === "background-sync") {
    event.waitUntil(
      // Aqui poderia implementar sincronização de dados em background
      Promise.resolve()
    );
  }
});

/**
 * Push Event (for future notifications)
 */
self.addEventListener("push", (event) => {
  console.log("Service Worker: Push received");

  const options = {
    body: event.data ? event.data.text() : "Nova notificação do Smart Home",
    // icon: "./icon-192.png",
    // badge: "./icon-192.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: "explore",
        title: "Abrir Dashboard",
        // icon: "./icon-192.png",
      },
      {
        action: "close",
        title: "Fechar",
        // icon: "./icon-192.png",
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification("Smart Home Dashboard", options)
  );
});

/**
 * Notification Click Event
 */
self.addEventListener("notificationclick", (event) => {
  console.log("Service Worker: Notification click received");

  event.notification.close();

  if (event.action === "explore") {
    event.waitUntil(clients.openWindow("./"));
  } else if (event.action === "close") {
    // Apenas fecha a notificação
  } else {
    // Clique na notificação (sem action específica)
    event.waitUntil(clients.openWindow("./"));
  }
});
