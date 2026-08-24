import express from "express";
import path from "path";
import fs from "fs";

interface SyncMessagePayload {
  key: string;
  data: any;
  updatedAt: number;
  clientId: string;
  origin?: string;
  label?: string;
}

interface ConnectedClient {
  id: string;
  deviceType: "desktop" | "mobile" | "tablet" | "other";
  res: express.Response;
  connectedAt: number;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  // In-memory data store with file persistence fallback
  const storeData: Record<string, { data: any; updatedAt: number; clientId: string }> = {};
  const dataFilePath = path.join(process.cwd(), ".sync_storage.json");

  // Load persistent store on startup if exists
  if (fs.existsSync(dataFilePath)) {
    try {
      const raw = fs.readFileSync(dataFilePath, "utf8");
      const loaded = JSON.parse(raw);
      Object.assign(storeData, loaded);
      console.log(`[SyncServer] Loaded ${Object.keys(storeData).length} collections from disk.`);
    } catch (e) {
      console.warn("[SyncServer] Could not load stored sync data:", e);
    }
  }

  const saveStoreToDisk = () => {
    try {
      fs.writeFileSync(dataFilePath, JSON.stringify(storeData, null, 2), "utf8");
    } catch (e) {
      // Non-fatal warning if filesystem is read-only or transient in container
      console.warn("[SyncServer] Disk persist skipped:", e);
    }
  };

  // Connected SSE subscribers for sub-millisecond real-time sync across devices
  const clients: Map<string, ConnectedClient> = new Map();

  const broadcastToClients = (event: string, payload: any, excludeClientId?: string) => {
    const deadClientIds: string[] = [];
    const rawData = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;

    clients.forEach((client, clientId) => {
      if (excludeClientId && clientId === excludeClientId) return;
      try {
        client.res.write(rawData);
      } catch (err) {
        deadClientIds.push(clientId);
      }
    });

    deadClientIds.forEach((id) => clients.delete(id));
  };

  // Keep-alive heartbeat every 15 seconds
  const heartbeatInterval = setInterval(() => {
    const heartbeatData = `event: ping\ndata: ${JSON.stringify({ timestamp: Date.now(), clientsCount: clients.size })}\n\n`;
    const deadIds: string[] = [];
    clients.forEach((client, id) => {
      try {
        client.res.write(heartbeatData);
      } catch {
        deadIds.push(id);
      }
    });
    deadIds.forEach((id) => clients.delete(id));
  }, 15000);

  const SERVER_START_TIME = Date.now();
  const BUILD_VERSION = `4.5.${SERVER_START_TIME}`;

  // Middleware to disable caching for SW, manifest, and root HTML
  app.use((req, res, next) => {
    if (req.path === "/sw.js" || req.path === "/" || req.path === "/index.html" || req.path === "/manifest.json" || req.path.startsWith("/api/")) {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
    }
    next();
  });

  // Explicit route for Service Worker to ensure correct content-type and headers
  app.get("/sw.js", (req, res) => {
    const swPath = path.join(process.cwd(), "public", "sw.js");
    if (fs.existsSync(swPath)) {
      res.setHeader("Content-Type", "application/javascript; charset=utf-8");
      res.setHeader("Service-Worker-Allowed", "/");
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.sendFile(swPath);
    } else {
      res.status(200).type("application/javascript").send("// No service worker configured");
    }
  });

  // Explicit route for Web App Manifest
  app.get("/manifest.json", (req, res) => {
    const manifestPath = path.join(process.cwd(), "public", "manifest.json");
    if (fs.existsSync(manifestPath)) {
      res.setHeader("Content-Type", "application/manifest+json; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0");
      res.sendFile(manifestPath);
    } else {
      res.status(404).json({ error: "Manifest not found" });
    }
  });

  // --- SYNC API ROUTES ---

  // Version Check Endpoint for Auto-Updating Installed Apps
  app.get("/api/version", (req, res) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0");
    res.setHeader("Pragma", "no-cache");
    res.json({
      version: BUILD_VERSION,
      buildTime: SERVER_START_TIME,
      appName: "PATIL BIRYANI POS",
      serverTime: Date.now(),
      clientsCount: clients.size,
    });
  });

  // Health check endpoint (Used by Cloud Run and load balancers)
  app.get("/api/health", (req, res) => {
    res.status(200).json({
      status: "ok",
      version: BUILD_VERSION,
      clientsCount: clients.size,
      collectionsCount: Object.keys(storeData).length,
      timestamp: Date.now(),
    });
  });

  // Real-Time Server-Sent Events (SSE) Stream
  app.get("/api/sync/stream", (req, res) => {
    const clientId = (req.query.clientId as string) || `client_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const deviceType = (req.query.deviceType as any) || "other";

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders?.();

    const client: ConnectedClient = {
      id: clientId,
      deviceType,
      res,
      connectedAt: Date.now(),
    };

    clients.set(clientId, client);
    console.log(`[SyncServer] Device connected: ${clientId} (${deviceType}). Total active: ${clients.size}`);

    // Send initial snapshot info
    const initialPayload = {
      type: "INITIAL_STATE",
      store: storeData,
      clientsCount: clients.size,
      serverTime: Date.now(),
    };
    res.write(`event: init\ndata: ${JSON.stringify(initialPayload)}\n\n`);

    // Broadcast updated peer count
    broadcastToClients("peer_update", {
      clientsCount: clients.size,
      joinedClientId: clientId,
      deviceType,
    });

    req.on("close", () => {
      clients.delete(clientId);
      console.log(`[SyncServer] Device disconnected: ${clientId}. Total active: ${clients.size}`);
      broadcastToClients("peer_update", {
        clientsCount: clients.size,
        leftClientId: clientId,
      });
    });
  });

  // Push single state update from a client (Desktop or Mobile APK)
  app.post("/api/sync/push", (req, res) => {
    const { key, data, updatedAt, clientId, origin, label } = req.body as SyncMessagePayload;

    if (!key) {
      return res.status(400).json({ error: "Missing key" });
    }

    const effectiveTime = updatedAt || Date.now();
    const existing = storeData[key];

    // Accept update if newer or first time
    if (!existing || effectiveTime >= existing.updatedAt) {
      storeData[key] = {
        data,
        updatedAt: effectiveTime,
        clientId: clientId || "unknown",
      };

      // Save to disk asynchronously
      saveStoreToDisk();

      // Broadcast immediately to all other connected Mobile APKs and Desktop instances
      broadcastToClients(
        "sync_mutation",
        {
          key,
          data,
          updatedAt: effectiveTime,
          clientId: clientId || "unknown",
          origin: origin || "cloud_relay",
          label: label || `Updated ${key}`,
        },
        clientId // exclude the sender to avoid echo
      );
    }

    res.json({
      success: true,
      key,
      updatedAt: effectiveTime,
      activeClientsCount: clients.size,
    });
  });

  // Batch Push multiple keys (e.g. initial upload or bulk sync)
  app.post("/api/sync/batch", (req, res) => {
    const { bundle, clientId, origin } = req.body;
    if (!bundle || typeof bundle !== "object") {
      return res.status(400).json({ error: "Invalid bundle" });
    }

    const now = Date.now();
    const updatedKeys: string[] = [];

    Object.entries(bundle).forEach(([key, val]) => {
      if (key === "exportedAt" || key === "version" || key === "originClientId") return;
      storeData[key] = {
        data: val,
        updatedAt: now,
        clientId: clientId || "batch_upload",
      };
      updatedKeys.push(key);
    });

    saveStoreToDisk();

    // Broadcast batch sync to all peers
    broadcastToClients(
      "batch_sync",
      {
        keys: updatedKeys,
        bundle,
        updatedAt: now,
        clientId: clientId || "batch_upload",
        origin: origin || "cloud_batch",
      },
      clientId
    );

    res.json({
      success: true,
      updatedCount: updatedKeys.length,
      keys: updatedKeys,
      activeClientsCount: clients.size,
    });
  });

  // Pull current state
  app.get("/api/sync/pull", (req, res) => {
    const since = parseInt(req.query.since as string, 10) || 0;
    const result: Record<string, any> = {};

    Object.entries(storeData).forEach(([key, record]) => {
      if (record.updatedAt >= since) {
        result[key] = record;
      }
    });

    res.json({
      success: true,
      store: result,
      serverTime: Date.now(),
      activeClientsCount: clients.size,
    });
  });

  // Get current sync status
  app.get("/api/sync/status", (req, res) => {
    const devices = Array.from(clients.values()).map((c) => ({
      id: c.id,
      deviceType: c.deviceType,
      connectedAt: c.connectedAt,
    }));

    res.json({
      activeClientsCount: clients.size,
      devices,
      collectionsCount: Object.keys(storeData).length,
      serverTime: Date.now(),
    });
  });

  // Manual Ping broadcast test
  app.post("/api/sync/ping", (req, res) => {
    const { message, clientId, deviceType } = req.body;
    broadcastToClients("sync_ping", {
      message: message || "Real-Time Ping Test",
      senderClientId: clientId,
      deviceType,
      timestamp: Date.now(),
    });
    res.json({ success: true, broadcastedTo: clients.size });
  });

  // --- VITE MIDDLEWARE (DEV) / STATIC ASSETS (PRODUCTION) ---

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    const indexPath = path.join(distPath, "index.html");

    app.use(
      express.static(distPath, {
        setHeaders: (res, filePath) => {
          if (filePath.endsWith("index.html") || filePath.endsWith("sw.js") || filePath.endsWith("manifest.json")) {
            res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0");
            res.setHeader("Pragma", "no-cache");
            res.setHeader("Expires", "0");
          }
        },
      })
    );

    app.get("*", (req, res) => {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(200).send(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>PATIL BIRYANI</title></head><body><div id="root">Loading Patil Biryani...</div></body></html>`);
      }
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Patil Biryani Server] Running on http://0.0.0.0:${PORT} (env: ${process.env.NODE_ENV || "development"})`);
  });

  // Graceful shutdown handling for Cloud Run & container orchestration
  const shutdown = () => {
    console.log("[Patil Biryani Server] Shutting down gracefully...");
    clearInterval(heartbeatInterval);
    server.close(() => {
      console.log("[Patil Biryani Server] Closed all connections.");
      process.exit(0);
    });
    setTimeout(() => {
      process.exit(0);
    }, 5000);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

startServer().catch((err) => {
  console.error("[Patil Biryani Server] Fatal startup error:", err);
  process.exit(1);
});
