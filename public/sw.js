// service worker for push notifications

self.addEventListener("install", (event) => {
  console.log("Service Worker installing.");
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker activating.");
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  console.log("Push notification received", event);

  let notificationData = {
    title: "",
    body: "",
    icon: "/logo.png",
    badge: "/logo.png",
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        ...notificationData,
        ...data,
      };
    } catch (e) {
      console.error("Error parsing push notification data:", e);
      notificationData.body = event.data.text();
    }
  }

  // Don't display notification if title and body are both empty
  if (!notificationData.title && !notificationData.body) {
    console.log("Skipping notification: missing title or body");
    return;
  }

  const promiseChain = self.registration.showNotification(
    notificationData.title,
    {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      data: notificationData.data,
    },
  );

  event.waitUntil(promiseChain);
});

self.addEventListener("notificationclick", (event) => {
  console.log("Notification clicked", event);
  event.notification.close();

  // Navigate to the app or specific URL if provided
  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open to the app
        const targetUrl = new URL(urlToOpen, self.location.origin);
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          const clientUrl = new URL(client.url);
          // Match if the origins are the same (looser matching to handle query params)
          if (clientUrl.origin === targetUrl.origin && "focus" in client) {
            // Navigate to the target URL and focus
            if (client.navigate) {
              client.navigate(urlToOpen);
            }
            return client.focus();
          }
        }
        // If no window is open, open a new one
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      }),
  );
});
