/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import https from 'https';
import http from 'http';
import { execSync } from 'child_process';
import { v2 as cloudinary } from 'cloudinary';

dotenv.config();

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Helper to ensure SSL certificates exist
function ensureSSLCertificates() {
  if (process.env.USE_SSL !== 'true') {
    return null;
  }

  const keyPath = path.join(process.cwd(), 'key.pem');
  const certPath = path.join(process.cwd(), 'cert.pem');

  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    return { keyPath, certPath };
  }

  console.log("SnapQR - SSL certificates (key.pem/cert.pem) not found. Attempting to generate self-signed certificate...");
  try {
    // Run openssl to generate self-signed cert
    execSync(`openssl req -x509 -newkey rsa:2048 -keyout "${keyPath}" -out "${certPath}" -sha256 -days 365 -nodes -subj "/CN=localhost"`, { stdio: 'ignore' });
    console.log("SnapQR - Successfully generated self-signed certificate (key.pem/cert.pem).");
    return { keyPath, certPath };
  } catch (err) {
    console.warn("SnapQR - Failed to generate SSL certificates via openssl. Camera will not work on non-secure contexts (http://public-ip) unless SSL certs are provided manually.", err);
    return null;
  }
}

const app = express();
const PORT = 3000;

// Resolve paths
const DATA_DIR = path.join(process.cwd(), 'data');
const IMAGES_DIR = path.join(DATA_DIR, 'images');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const PHOTOS_FILE = path.join(DATA_DIR, 'photos.json');
// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

// Initial default database structure
const DEFAULT_DB = {
  config: {
    eventName: "Open Day GGITS 2026",
    eventDate: "2026-06-26",
    eventLogo: "", // Optional Base64
    customWatermark: "Open Day GGITS 2026 📸",
    enabledCustomizations: {
      frames: true,
      stickers: true,
      text: true,
      filters: true
    }
  },
  photos: {} as Record<string, {
    id: string;
    createdAt: string;
    imageUrl: string;
    frameId: string;
    themeId: string;
    downloadCount: number;
    scanCount: number;
  }>,
  analytics: {
    totalPhotosTaken: 0,
    totalQrScans: 0,
    totalDownloads: 0,
    frameUsage: {} as Record<string, number>,
    themeUsage: {} as Record<string, number>
  }
};

// Helper to read database safely
function readDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      // Migrate or update if it has the older defaults
      if (parsed.config && (parsed.config.eventName === "Open Day Festival 2026" || parsed.config.eventName === "Campus Spring Festival 2026" || parsed.config.eventName === "Open Day GGITS 2026")) {
        parsed.config.eventName = "Open Day GGITS 2026";
        parsed.config.customWatermark = "Open Day GGITS 2026 📸";
        fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2), 'utf-8');
      }
      return parsed;
    }
  } catch (err) {
    console.error("Error reading database file, using defaults:", err);
  }
  // Write default DB if it doesn't exist
  writeDB(DEFAULT_DB);
  return DEFAULT_DB;
}

// Helper to write database safely
function writeDB(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error("Error writing database file:", err);
  }
}

// Helper to generate a friendly alphanumeric ID
function generateId(length = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

interface PhotoMetadata {
  id: string;
  imageUrl: string;
  createdAt: string;
  frameId: string;
  themeId: string;
  scanCount: number;
  downloadCount: number;
}

type PhotosData = Record<string, PhotoMetadata>;

function loadPhotos(): PhotosData {
  try {
    if (fs.existsSync(PHOTOS_FILE)) {
      const data = fs.readFileSync(PHOTOS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading photos database file:", err);
  }
  return {};
}

function savePhotos(photos: PhotosData) {
  try {
    fs.writeFileSync(PHOTOS_FILE, JSON.stringify(photos, null, 2), 'utf-8');
  } catch (err) {
    console.error("Error writing photos database file:", err);
  }
}

function initPhotosDatabase() {
  if (!fs.existsSync(PHOTOS_FILE)) {
    try {
      if (fs.existsSync(DB_FILE)) {
        const dbData = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
        if (dbData && dbData.photos) {
          savePhotos(dbData.photos);
          console.log("SnapQR - Successfully migrated legacy photos to photos.json");
          return;
        }
      }
    } catch (e) {
      console.error("Migration of legacy photos failed:", e);
    }
    savePhotos({});
  }
}

// Initialize photos database on load
initPhotosDatabase();

function cleanupExpiredPhotos() {
  console.log("SnapQR - Starting cleanup of photos older than 24 hours...");
  try {
    const photos = loadPhotos();
    const now = new Date();
    const expiryTime = 24 * 60 * 60 * 1000; // 24 hours in ms
    let deletedCount = 0;

    for (const id of Object.keys(photos)) {
      const photo = photos[id];
      const createdDate = new Date(photo.createdAt);
      if (now.getTime() - createdDate.getTime() > expiryTime) {
        // Delete from metadata
        delete photos[id];
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      savePhotos(photos);
      console.log(`SnapQR - Cleaned up ${deletedCount} expired photos.`);
    } else {
      console.log("SnapQR - No expired photos found.");
    }
  } catch (err) {
    console.error("Error during cleanupExpiredPhotos:", err);
  }
}

// Clean on server startup and every hour
cleanupExpiredPhotos();
setInterval(cleanupExpiredPhotos, 60 * 60 * 1000);

// Use JSON body parser with generous limit for Base64 image payloads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Local upload serving removed - Cloudinary is used instead

// --- API ROUTES ---

// 1. Get Event Configuration & Analytics Summary
app.get('/api/config', (req, res) => {
  const db = readDB();
  res.json({
    config: db.config,
    analytics: db.analytics
  });
});

// 2. Update Event Configuration (Admin Panel)
app.post('/api/config', (req, res) => {
  const db = readDB();
  const { eventName, eventDate, eventLogo, customWatermark, enabledCustomizations } = req.body;

  if (eventName !== undefined) db.config.eventName = eventName;
  if (eventDate !== undefined) db.config.eventDate = eventDate;
  if (eventLogo !== undefined) db.config.eventLogo = eventLogo;
  if (customWatermark !== undefined) db.config.customWatermark = customWatermark;
  if (enabledCustomizations !== undefined) {
    db.config.enabledCustomizations = {
      ...db.config.enabledCustomizations,
      ...enabledCustomizations
    };
  }

  writeDB(db);
  res.json({ success: true, config: db.config });
});

// 3. Reset Analytics (Admin Panel Helper)
app.post('/api/config/reset-analytics', (req, res) => {
  const db = readDB();
  db.analytics = {
    totalPhotosTaken: 0,
    totalQrScans: 0,
    totalDownloads: 0,
    frameUsage: {},
    themeUsage: {}
  };
  writeDB(db);
  res.json({ success: true, analytics: db.analytics });
});

// 4. Upload photo strip (Base64 PNG)
app.post('/api/upload', async (req, res) => {
  try {
    const { image, frameId, themeId } = req.body;
    if (!image) {
      return res.status(400).json({ success: false, error: "Missing image data" });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(image, {
      folder: "snapqr",
    });

    const id = generateId(8);
    const absoluteImageUrl = result.secure_url;

    const photos = loadPhotos();
    const photoRecord = {
      id,
      imageUrl: absoluteImageUrl,
      createdAt: new Date().toISOString(),
      frameId: frameId || 'classic',
      themeId: themeId || 'festival',
      downloadCount: 0,
      scanCount: 0
    };

    // Save metadata
    photos[id] = photoRecord;
    savePhotos(photos);

    // Update global analytics in db.json
    const db = readDB();
    db.analytics.totalPhotosTaken += 1;
    db.analytics.frameUsage[photoRecord.frameId] = (db.analytics.frameUsage[photoRecord.frameId] || 0) + 1;
    db.analytics.themeUsage[photoRecord.themeId] = (db.analytics.themeUsage[photoRecord.themeId] || 0) + 1;
    writeDB(db);

    res.json({
      success: true,
      id,
      imageUrl: absoluteImageUrl
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ success: false, error: "Upload failed" });
  }
});

// 5. Get photo metadata (no expiration check - saved permanently)
app.get('/api/photos/:id', (req, res) => {
  const { id } = req.params;
  const photos = loadPhotos();
  const photo = photos[id];

  if (!photo) {
    return res.status(404).json({ error: "Photo strip not found", expired: false });
  }

  const absoluteImageUrl = photo.imageUrl;

  res.json({
    id: photo.id,
    createdAt: photo.createdAt,
    frameId: photo.frameId,
    themeId: photo.themeId,
    scanCount: photo.scanCount,
    downloadCount: photo.downloadCount,
    imageUrl: absoluteImageUrl
  });
});

// 6. Serve the raw image file directly - Removed, images served from Cloudinary

// 7. Track QR scan
app.post('/api/photos/:id/scan', (req, res) => {
  const { id } = req.params;
  const photos = loadPhotos();
  const photo = photos[id];

  if (photo) {
    photo.scanCount += 1;
    savePhotos(photos);

    // Update global analytics in db.json
    const db = readDB();
    db.analytics.totalQrScans += 1;
    writeDB(db);

    return res.json({ success: true, scanCount: photo.scanCount });
  }

  res.status(404).json({ error: "Photo not found" });
});

// 8. Track download
app.post('/api/photos/:id/download', (req, res) => {
  const { id } = req.params;
  const photos = loadPhotos();
  const photo = photos[id];

  if (photo) {
    photo.downloadCount += 1;
    savePhotos(photos);

    // Update global analytics in db.json
    const db = readDB();
    db.analytics.totalDownloads += 1;
    writeDB(db);

    return res.json({ success: true, downloadCount: photo.downloadCount });
  }

  res.status(404).json({ error: "Photo not found" });
});

// --- VITE MIDDLEWARE SETUP ---

async function startServer() {
  const ssl = ensureSSLCertificates();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: ssl ? { protocol: 'wss' } : undefined
      },
      appType: "custom",
    });

    // First, pass through all static assets and vite compiled files
    app.use(vite.middlewares);

    // Fallback HTML routing for SPA paths (like /share/:id)
    app.get('*', async (req, res, next) => {
      const url = req.originalUrl;

      // If the request points to an API endpoint or has a file extension, let it fall through
      if (url.startsWith('/api/') || url.includes('.')) {
        return next();
      }

      try {
        let template = fs.readFileSync(
          path.resolve(process.cwd(), 'index.html'),
          'utf-8'
        );

        // Transform index.html through Vite to inject standard dev scripts and styles
        template = await vite.transformIndexHtml(url, template);

        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = ssl ? https.createServer({
    key: fs.readFileSync(ssl.keyPath),
    cert: fs.readFileSync(ssl.certPath)
  }, app) : http.createServer(app);

  server.listen(PORT, "0.0.0.0", () => {
    const scheme = ssl ? "https" : "http";
    console.log(`[SnapQR Server] Running on ${scheme}://localhost:${PORT}`);
    console.log(`[SnapQR Server] Running on ${scheme}://0.0.0.0:${PORT}`);
    console.log(`[SnapQR Server] Storage directory: ${IMAGES_DIR}`);
  });
}

startServer();
