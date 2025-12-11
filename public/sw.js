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
      notificationData.title = "New notification";
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

  // Get URL and notification ID from notification data
  const urlToOpen = event.notification.data?.url || "/";
  const notificationId = event.notification.data?.notificationId;

  // If we have a notification ID, append it to the URL as a query parameter
  let finalUrl = urlToOpen;
  if (notificationId) {
    try {
      const url = new URL(urlToOpen, self.location.origin);
      url.searchParams.set("notificationId", notificationId);
      finalUrl = url.pathname + url.search + url.hash;
    } catch (e) {
      console.error("Error appending notificationId to URL:", e);
      // Fall back to original URL if parsing fails
    }
  }

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open to the app
        const targetUrl = new URL(finalUrl, self.location.origin);

        console.log("Navigating to:", targetUrl.href);
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          const clientUrl = new URL(client.url);
          // Match if the origins are the same (looser matching to handle query params)
          if (clientUrl.origin === targetUrl.origin && "focus" in client) {
            // Navigate to the target URL and focus
            if (client.navigate) {
              client.navigate(finalUrl);
            }
            return client.focus();
          }
        }
        // If no window is open, open a new one
        if (self.clients.openWindow) {
          return self.clients.openWindow(finalUrl);
        }
      }),
  );
});
