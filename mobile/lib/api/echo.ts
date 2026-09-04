import Echo from "laravel-echo";
import Pusher from "pusher-js";
import { API_HOST, getAuthToken } from "./client";

(globalThis as any).Pusher = Pusher;

let echoInstance: Echo<any> | null = null;

export const getEcho = (): Echo<any> | null => {
  if (echoInstance) return echoInstance;

  const token = getAuthToken();
  const host = process.env.EXPO_PUBLIC_PUSHER_HOST ?? API_HOST.replace(/^https?:\/\//, "").split(":")[0];
  const port = process.env.EXPO_PUBLIC_PUSHER_PORT ? parseInt(process.env.EXPO_PUBLIC_PUSHER_PORT, 10) : 6001;

  try {
    echoInstance = new Echo({
      broadcaster: "pusher",
      key: process.env.EXPO_PUBLIC_PUSHER_APP_KEY ?? "app-key",
      wsHost: host,
      wsPort: port,
      wssPort: port,
      forceTLS: false,
      encrypted: false,
      disableStats: true,
      enabledTransports: ["ws", "wss"],
      authEndpoint: `${API_HOST}/api/v1/broadcasting/auth`,
      auth: {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          Accept: "application/json",
        },
      },
    });
    return echoInstance;
  } catch (e) {
    console.warn("Failed to initialize Echo WebSocket client", e);
    return null;
  }
};

export const disconnectEcho = () => {
  if (echoInstance) {
    echoInstance.disconnect();
    echoInstance = null;
  }
};
