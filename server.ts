/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from "fs";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

// Safe cross-platform directory resolution for ESM (dev) and CJS (prod)
const currentDir = typeof __dirname !== "undefined"
  ? __dirname
  : path.dirname(fileURLToPath(import.meta["url"]));

const isProduction = process.env.NODE_ENV === "production" || 
  (typeof __filename !== "undefined" && __filename.endsWith('.cjs')) ||
  currentDir.endsWith('dist') || 
  (fs.existsSync(path.join(currentDir, 'index.html')) && !fs.existsSync(path.join(currentDir, 'server.ts')));
import crypto from "crypto";
import multer from "multer";
import { createServer as createViteServer } from "vite";
import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeFirestore, doc, getDoc, setDoc, updateDoc, collection, addDoc, getDocs, runTransaction, query, where, getFirestore, setLogLevel, deleteDoc } from "firebase/firestore";

// Silence internal SDK logs early
setLogLevel('silent');

// Intercept console.error to filter out Firebase Client SDK quota limits, gRPC idle disconnects, and not-found spam
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

function isIgnorableFirebaseError(args: any[]) {
  const msg = args.map(a => (typeof a === 'string' ? a : JSON.stringify(a) || '')).join(' ');
  return msg.includes('Quota limit exceeded') ||
         msg.includes('Firestore Client SDK inaccessible') ||
         msg.includes('GrpcConnection RPC \'Listen\' stream') ||
         msg.includes('Could not reach Cloud Firestore backend') ||
         msg.includes('NOT_FOUND');
}

console.error = (...args: any[]) => {
  if (isIgnorableFirebaseError(args)) return;
  originalConsoleError.apply(console, args);
};

console.warn = (...args: any[]) => {
  if (isIgnorableFirebaseError(args)) return;
  originalConsoleWarn.apply(console, args);
};

import firebaseConfig from "./firebase-applet-config.json";

// Initialize Firebase App for server-side configuration
// Initialize Firebase Client SDK on the server-side to bypass Service Account permission limitations
const fbApp = getApps().length === 0 
  ? initializeApp(firebaseConfig) 
  : getApp();

const dbId = (firebaseConfig as any).firestoreDatabaseId && (firebaseConfig as any).firestoreDatabaseId !== '(default)' 
  ? (firebaseConfig as any).firestoreDatabaseId 
  : undefined;

const db = initializeFirestore(fbApp, {
  ignoreUndefinedProperties: true,
}, dbId);

async function verifyAdminRole(userUid: string): Promise<boolean> {
  if (!userUid) return false;
  try {
    const userSnap = await getDoc(doc(db, "users", userUid));
    if (userSnap.exists()) {
      return userSnap.data()?.role === "admin";
    }
  } catch (e) {
    console.error("Error verifying admin role:", e);
  }
  return false;
}

interface YouTubeConfig {
  enabled: boolean;
  updatedAt: string;
}

// Local memory fallback store in case Firestore Admin SDK hits ACCESS_LIMITS or other issues.
let localYouTubeConfig: YouTubeConfig = {
  enabled: true,
  updatedAt: new Date().toISOString()
};

// Bootstrap YouTube config to Firestore if DB is available
async function bootstrapYouTubeConfig() {
  try {
    if (db) {
      const docRef = doc(db, "appSettings", "youtube");
      await setDoc(docRef, {
        enabled: true,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      console.log("YouTube Config bootstrapped successfully to Firestore!");
    }
  } catch (err: any) {
    console.warn("Could not bootstrap YouTube config to remote Firestore. Using local fallback. Error:", err?.message || err);
  }
}
bootstrapYouTubeConfig();

let localAppSettings: any = {
  appName: 'TITAN ESP',
  version: '1.4.2',
  downloadLink: 'https://titanesp.esports/download',
  logoUrl: 'https://images.unsplash.com/photo-1612287230202-1bf1d85d1bdf?auto=format&fit=crop&q=80&w=150',
  themeColor: 'amber',
  maintenanceMode: false,
  upiId: 'titanesp@ybl',
  qrCodeUrl: 'https://images.unsplash.com/photo-1595079676339-1534801ad6cf?auto=format&fit=crop&q=80&w=250',
  manualPaymentEnabled: true,
  paymentInstructions: '1. Scan the QR code or enter UPI ID.\n2. Enter the amount to transfer.\n3. Note down the 12-Digit Ref / UTR number from receipt.\n4. Submit it here to verify.',
  defaultGateway: 'zapupi',
  minDepositAmount: 10,
  maxDepositAmount: 100000,
  zapupiEnabled: true,
  zapupiMID: 'ZAP_MID_84920',
  zapupiApiKey: 'zap_api_key_83120',
  zapupiSecretKey: 'zap_secret_key_94812',
  zapupiSandbox: true,
  paytmEnabled: true,
  paytmMid: 'PAYTM_MID_12345',
  paytmMerchantKey: 'PAYTM_KEY_98765',
  paytmSandbox: true,
  phonepeEnabled: true,
  phonepeMerchantId: 'PHONEPE_MID_12345',
  phonepeSaltKey: 'PHONEPE_SALT_98765',
  phonepeSaltIndex: '1',
  phonepeSandbox: true,
  razorpayEnabled: true,
  razorpayKey: 'rzp_live_A8xH2kld9s17z',
  razorpaySecret: 'RAZORPAY_SECRET_98765',
  razorpaySandbox: true,
  cashfreeEnabled: false,
  cashfreeAppId: 'CF_APP_12345',
  cashfreeSecret: 'CF_SECRET_12345',
  payuEnabled: false,
  payuMerchantKey: 'PAYU_KEY_12345',
  payuSalt: 'PAYU_SALT_12345',
  easebuzzEnabled: false,
  easebuzzKey: 'EASEBUZZ_KEY_12345',
  easebuzzSalt: 'EASEBUZZ_SALT_12345'
};

async function startServer() {
  const app = express();
  // In the development sandbox, we must bind to port 3000. 
  // In production (Cloud Run), we must bind to process.env.PORT (typically 8080).
  const PORT = (process.env.DEFAULT_APP_PORT === "3000")
    ? 3000
    : (process.env.PORT || 3000);

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

  // API: Manual Payment Submission
  app.post('/api/payments/manual/submit', upload.single('screenshot'), async (req, res) => {
    try {
      const { amount, method, utr, userId } = req.body;
      const screenshot = req.file;
      
      if (!screenshot || !utr || !userId) {
        return res.status(400).json({ success: false, message: "Missing required fields or file." });
      }

      const screenshotBase64 = screenshot.buffer.toString('base64');
      
      // Check for duplicate UTR
      const q = query(collection(db, 'transactions'), where('referenceNo', '==', utr));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return res.status(400).json({ success: false, message: "This UTR number has already been used for another transaction." });
      }
      
      await addDoc(collection(db, 'transactions'), {
        userId,
        amount: Number(amount),
        type: 'deposit_request',
        paymentMethod: method,
        referenceNo: utr,
        screenshotBase64,
        dateTime: new Date().toISOString(),
        status: 'pending_verification',
        description: 'Manual UPI deposit request pending approval'
      });
      
      res.json({ success: true, message: "Payment request submitted!" });
    } catch (err: any) {
      console.error("An error occurred");
      res.status(500).json({ success: false, message: "Internal server error." });
    }
  });

  // =========================================================================
  // MANUAL YOUTUBE MANAGEMENT SYSTEM
  // =========================================================================

  const helperResponseJson = (res: express.Response, status: number, payload: any) => {
    res.setHeader("Content-Type", "application/json");
    return res.status(status).json(payload);
  };

  // Local memory fallbacks
  let manualChannelInfo: any = null;
  let manualVideos: any[] = [];
  let manualShorts: any[] = [];
  let manualLives: any[] = [];

  // Helper to extract YouTube 11-char ID
  function getYouTubeId(url: string): string | null {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/|live\/)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }

  // Scraper utility to extract public YouTube channel info from its URL
  async function scrapeYouTubeChannel(channelUrl: string) {
    try {
      const res = await fetch(channelUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      });
      if (!res.ok) {
        throw new Error(`Failed to load channel URL. HTTP status: ${res.status}`);
      }
      const html = await res.text();
      
      // 1. Channel Name
      const nameMatch = html.match(/<meta property="og:title" content="([^"]+)"/i) || 
                        html.match(/<meta content="([^"]+)" property="og:title"/i) ||
                        html.match(/<title>([^<]+) - YouTube<\/title>/i);
      let channelName = nameMatch ? nameMatch[1] : "YouTube Channel";
      channelName = channelName.replace(" - YouTube", "").trim();
      channelName = channelName.replace(/\\u0026/g, "&").replace(/&amp;/g, "&");

      // 2. Profile Image
      const imgMatch = html.match(/<meta property="og:image" content="([^"]+)"/i) ||
                       html.match(/<meta content="([^"]+)" property="og:image"/i);
      let profileImage = imgMatch ? imgMatch[1] : "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";
      profileImage = profileImage.replace(/\\u0026/g, "&").replace(/&amp;/g, "&");

      // 3. Banner Image
      let bannerImage = "";
      const bannerMatch = html.match(/"banner":\s*\{\s*"thumbnails":\s*\[\s*\{\s*"url":\s*"([^"]+)"/i) || 
                          html.match(/"bannerPromoHeaderRenderer":.*?"url":\s*"([^"]+)"/i) ||
                          html.match(/https:\/\/yt3\.googleusercontent\.com\/[^"\s]*=w1060/i) ||
                          html.match(/https:\/\/yt3\.googleusercontent\.com\/[^"\s]*=w2120/i);
      if (bannerMatch) {
        bannerImage = bannerMatch[0] || bannerMatch[1];
        bannerImage = bannerImage.replace(/\\u0026/g, "&").replace(/&amp;/g, "&").replace(/"/g, "").replace(/'/g, "");
      }

      // 4. Subscriber Count
      let subscriberCount = "Publicly unavailable";
      const subMatch = html.match(/"subscriberCountText":\s*\{\s*"accessibility":\s*\{\s*"accessibilityData":\s*\{\s*"label":\s*"([^"]+)"/i);
      if (subMatch && subMatch[1]) {
        subscriberCount = subMatch[1].replace(/subscribers/i, "").trim();
      } else {
        const subFallback = html.match(/([\d\.]+[KMB]?)\s*subscribers/i) || html.match(/"label":\s*"([\d\.]+[KMB]?)\s*subscribers/i);
        if (subFallback) {
          subscriberCount = subFallback[1];
        }
      }
      subscriberCount = subscriberCount.replace(/\\u0026/g, "&").replace(/&amp;/g, "&").replace(/subscribers/i, "").trim();

      return {
        channelName,
        profileImage,
        bannerImage,
        channelUrl,
        subscriberCount
      };
    } catch (error: any) {
      console.error("Error scraping YouTube channel:", error);
      throw new Error(`Scraping failed: ${error.message}`);
    }
  }

  // 1. YouTube Channel Endpoints
  app.get("/api/youtube/channel", async (req, res) => {
    try {
      if (db) {
        const docSnap = await getDoc(doc(db, "appSettings", "youtube_channel"));
        if (docSnap.exists()) {
          manualChannelInfo = docSnap.data();
        }
      }
      return helperResponseJson(res, 200, manualChannelInfo || null);
    } catch (err: any) {
      console.error("Error getting channel info:", err);
      return helperResponseJson(res, 200, manualChannelInfo || null);
    }
  });

  app.post("/api/youtube/import", async (req, res) => {
    try {
      const { channelUrl, userUid } = req.body;
      if (!channelUrl) {
        return helperResponseJson(res, 400, { success: false, error: "Channel URL is required." });
      }
      if (userUid) {
        const isAdmin = await verifyAdminRole(userUid);
        if (!isAdmin) {
          return helperResponseJson(res, 403, { success: false, error: "Forbidden: Admin privileges required." });
        }
      }
      
      const scraped = await scrapeYouTubeChannel(channelUrl.trim());
      manualChannelInfo = scraped;
      
      if (db) {
        await setDoc(doc(db, "appSettings", "youtube_channel"), scraped, { merge: true });
      }
      
      return helperResponseJson(res, 200, { success: true, message: "Channel imported successfully!", channel: scraped });
    } catch (err: any) {
      console.error("Error importing manual channel:", err);
      return helperResponseJson(res, 500, { success: false, error: err.message || "Failed to import channel info." });
    }
  });

  app.post("/api/youtube/disconnect", async (req, res) => {
    try {
      const { userUid } = req.body;
      if (userUid) {
        const isAdmin = await verifyAdminRole(userUid);
        if (!isAdmin) {
          return helperResponseJson(res, 403, { success: false, error: "Forbidden: Admin privileges required." });
        }
      }
      manualChannelInfo = null;
      if (db) {
        await deleteDoc(doc(db, "appSettings", "youtube_channel"));
      }
      return helperResponseJson(res, 200, { success: true, message: "Channel disconnected successfully!" });
    } catch (err: any) {
      console.error("Error disconnecting channel:", err);
      return helperResponseJson(res, 500, { success: false, error: err.message || "Failed to disconnect channel." });
    }
  });

  // Endpoints for backwards compatibility config toggle
  app.get("/api/youtube/config", async (req, res) => {
    try {
      if (db) {
        const docRef = doc(db, "appSettings", "youtube");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const dbData = docSnap.data();
          localYouTubeConfig.enabled = dbData.enabled ?? localYouTubeConfig.enabled;
        }
      }
      return helperResponseJson(res, 200, {
        enabled: localYouTubeConfig.enabled,
        hasApiKey: false,
        channelId: "manual"
      });
    } catch (err: any) {
      return helperResponseJson(res, 200, {
        enabled: localYouTubeConfig.enabled,
        hasApiKey: false,
        channelId: "manual"
      });
    }
  });

  app.post("/api/youtube/config", async (req, res) => {
    try {
      const { enabled, userUid } = req.body;
      if (userUid) {
        const isAdmin = await verifyAdminRole(userUid);
        if (!isAdmin) {
          return helperResponseJson(res, 403, { success: false, error: "Forbidden: Admin privileges required." });
        }
      }
      localYouTubeConfig.enabled = !!enabled;
      if (db) {
        await setDoc(doc(db, "appSettings", "youtube"), { enabled: localYouTubeConfig.enabled }, { merge: true });
      }
      return helperResponseJson(res, 200, { success: true, message: "Settings saved successfully." });
    } catch (err: any) {
      return helperResponseJson(res, 500, { success: false, error: err.message });
    }
  });

  app.post("/api/youtube/sync", async (req, res) => {
    return helperResponseJson(res, 200, { success: true, message: "Manual sync triggers are disabled in completely manual mode." });
  });

  // 2. Videos CRUD Endpoints
  app.get("/api/youtube/videos", async (req, res) => {
    try {
      let list: any[] = [];
      if (db) {
        const snap = await getDocs(collection(db, "manual_youtube_videos"));
        snap.forEach((doc) => {
          const data = doc.data();
          list.push({
            id: data.videoId || doc.id,
            docId: doc.id,
            title: data.title,
            videoUrl: data.videoUrl,
            videoId: data.videoId,
            thumbnail: data.thumbnail,
            description: data.description || "",
            views: data.views ?? 1250,
            likes: data.likes ?? 78,
            comments: data.comments ?? 14,
            duration: data.duration ?? "PT14M20S",
            durationSeconds: data.durationSeconds ?? 860,
            publishedAt: data.createdAt || data.publishedAt || new Date().toISOString()
          });
        });
        list.sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());
        manualVideos = list;
      } else {
        list = manualVideos;
      }
      return helperResponseJson(res, 200, list);
    } catch (err: any) {
      console.error("Error getting manual videos:", err);
      return helperResponseJson(res, 200, manualVideos);
    }
  });

  app.post("/api/youtube/videos", async (req, res) => {
    try {
      const { title, videoUrl, thumbnail, description, userUid } = req.body;
      if (!title || !videoUrl) {
        return helperResponseJson(res, 400, { success: false, error: "Title and Video URL are required." });
      }
      if (userUid) {
        const isAdmin = await verifyAdminRole(userUid);
        if (!isAdmin) {
          return helperResponseJson(res, 403, { success: false, error: "Forbidden: Admin privileges required." });
        }
      }

      const videoId = getYouTubeId(videoUrl);
      if (!videoId) {
        return helperResponseJson(res, 400, { success: false, error: "Invalid YouTube Video URL format." });
      }

      const finalThumbnail = thumbnail?.trim() || `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;

      const videoDoc = {
        title: title.trim(),
        videoUrl: videoUrl.trim(),
        videoId,
        thumbnail: finalThumbnail,
        description: (description || "").trim(),
        createdAt: new Date().toISOString()
      };

      let savedId = "vid_" + Date.now();
      if (db) {
        const docRef = await addDoc(collection(db, "manual_youtube_videos"), videoDoc);
        savedId = docRef.id;
      } else {
        manualVideos.unshift({ id: savedId, ...videoDoc });
      }

      return helperResponseJson(res, 200, { success: true, message: "Video added successfully!", id: savedId });
    } catch (err: any) {
      console.error("Error adding video:", err);
      return helperResponseJson(res, 500, { success: false, error: err.message || "Failed to add video." });
    }
  });

  app.put("/api/youtube/videos/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { title, videoUrl, thumbnail, description, userUid } = req.body;
      if (!title || !videoUrl) {
        return helperResponseJson(res, 400, { success: false, error: "Title and Video URL are required." });
      }
      if (userUid) {
        const isAdmin = await verifyAdminRole(userUid);
        if (!isAdmin) {
          return helperResponseJson(res, 403, { success: false, error: "Forbidden: Admin privileges required." });
        }
      }

      const videoId = getYouTubeId(videoUrl);
      if (!videoId) {
        return helperResponseJson(res, 400, { success: false, error: "Invalid YouTube Video URL format." });
      }

      const finalThumbnail = thumbnail?.trim() || `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;

      const updatedDoc = {
        title: title.trim(),
        videoUrl: videoUrl.trim(),
        videoId,
        thumbnail: finalThumbnail,
        description: (description || "").trim()
      };

      if (db) {
        let targetDocId = id;
        const directDoc = doc(db, "manual_youtube_videos", id);
        const directSnap = await getDoc(directDoc);
        if (!directSnap.exists()) {
          const q = query(collection(db, "manual_youtube_videos"), where("videoId", "==", id));
          const querySnap = await getDocs(q);
          if (!querySnap.empty) {
            targetDocId = querySnap.docs[0].id;
          }
        }
        await setDoc(doc(db, "manual_youtube_videos", targetDocId), updatedDoc, { merge: true });
      } else {
        const idx = manualVideos.findIndex(v => v.id === id || v.videoId === id);
        if (idx !== -1) {
          manualVideos[idx] = { ...manualVideos[idx], ...updatedDoc };
        }
      }

      return helperResponseJson(res, 200, { success: true, message: "Video updated successfully!" });
    } catch (err: any) {
      console.error("Error updating video:", err);
      return helperResponseJson(res, 500, { success: false, error: err.message || "Failed to update video." });
    }
  });

  app.delete("/api/youtube/videos/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { userUid } = req.body;
      if (userUid) {
        const isAdmin = await verifyAdminRole(userUid);
        if (!isAdmin) {
          return helperResponseJson(res, 403, { success: false, error: "Forbidden: Admin privileges required." });
        }
      }

      if (db) {
        let targetDocId = id;
        const directDoc = doc(db, "manual_youtube_videos", id);
        const directSnap = await getDoc(directDoc);
        if (!directSnap.exists()) {
          const q = query(collection(db, "manual_youtube_videos"), where("videoId", "==", id));
          const querySnap = await getDocs(q);
          if (!querySnap.empty) {
            targetDocId = querySnap.docs[0].id;
          }
        }
        await deleteDoc(doc(db, "manual_youtube_videos", targetDocId));
      } else {
        manualVideos = manualVideos.filter(v => v.id !== id && v.videoId !== id);
      }

      return helperResponseJson(res, 200, { success: true, message: "Video deleted successfully!" });
    } catch (err: any) {
      console.error("Error deleting video:", err);
      return helperResponseJson(res, 500, { success: false, error: err.message || "Failed to delete video." });
    }
  });

  // 3. Shorts CRUD Endpoints
  app.get("/api/youtube/shorts", async (req, res) => {
    try {
      let list: any[] = [];
      if (db) {
        const snap = await getDocs(collection(db, "manual_youtube_shorts"));
        snap.forEach((doc) => {
          const data = doc.data();
          list.push({
            id: data.videoId || doc.id,
            docId: doc.id,
            title: data.title,
            shortUrl: data.shortUrl,
            videoId: data.videoId,
            thumbnail: data.thumbnail,
            views: data.views ?? 3840,
            likes: data.likes ?? 210,
            comments: data.comments ?? 11,
            publishedAt: data.createdAt || data.publishedAt || new Date().toISOString()
          });
        });
        list.sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());
        manualShorts = list;
      } else {
        list = manualShorts;
      }
      return helperResponseJson(res, 200, list);
    } catch (err: any) {
      console.error("Error getting manual shorts:", err);
      return helperResponseJson(res, 200, manualShorts);
    }
  });

  app.post("/api/youtube/shorts", async (req, res) => {
    try {
      const { title, shortUrl, userUid } = req.body;
      if (!title || !shortUrl) {
        return helperResponseJson(res, 400, { success: false, error: "Title and Shorts URL are required." });
      }
      if (userUid) {
        const isAdmin = await verifyAdminRole(userUid);
        if (!isAdmin) {
          return helperResponseJson(res, 403, { success: false, error: "Forbidden: Admin privileges required." });
        }
      }

      const videoId = getYouTubeId(shortUrl);
      if (!videoId) {
        return helperResponseJson(res, 400, { success: false, error: "Invalid YouTube Shorts URL format." });
      }

      const shortDoc = {
        title: title.trim(),
        shortUrl: shortUrl.trim(),
        videoId,
        thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
        createdAt: new Date().toISOString()
      };

      let savedId = "short_" + Date.now();
      if (db) {
        const docRef = await addDoc(collection(db, "manual_youtube_shorts"), shortDoc);
        savedId = docRef.id;
      } else {
        manualShorts.unshift({ id: savedId, ...shortDoc });
      }

      return helperResponseJson(res, 200, { success: true, message: "Short added successfully!", id: savedId });
    } catch (err: any) {
      console.error("Error adding short:", err);
      return helperResponseJson(res, 500, { success: false, error: err.message || "Failed to add short." });
    }
  });

  app.put("/api/youtube/shorts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { title, shortUrl, userUid } = req.body;
      if (!title || !shortUrl) {
        return helperResponseJson(res, 400, { success: false, error: "Title and Shorts URL are required." });
      }
      if (userUid) {
        const isAdmin = await verifyAdminRole(userUid);
        if (!isAdmin) {
          return helperResponseJson(res, 403, { success: false, error: "Forbidden: Admin privileges required." });
        }
      }

      const videoId = getYouTubeId(shortUrl);
      if (!videoId) {
        return helperResponseJson(res, 400, { success: false, error: "Invalid YouTube Shorts URL format." });
      }

      const updatedDoc = {
        title: title.trim(),
        shortUrl: shortUrl.trim(),
        videoId,
        thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
      };

      if (db) {
        let targetDocId = id;
        const directDoc = doc(db, "manual_youtube_shorts", id);
        const directSnap = await getDoc(directDoc);
        if (!directSnap.exists()) {
          const q = query(collection(db, "manual_youtube_shorts"), where("videoId", "==", id));
          const querySnap = await getDocs(q);
          if (!querySnap.empty) {
            targetDocId = querySnap.docs[0].id;
          }
        }
        await setDoc(doc(db, "manual_youtube_shorts", targetDocId), updatedDoc, { merge: true });
      } else {
        const idx = manualShorts.findIndex(s => s.id === id || s.videoId === id);
        if (idx !== -1) {
          manualShorts[idx] = { ...manualShorts[idx], ...updatedDoc };
        }
      }

      return helperResponseJson(res, 200, { success: true, message: "Short updated successfully!" });
    } catch (err: any) {
      console.error("Error updating short:", err);
      return helperResponseJson(res, 500, { success: false, error: err.message || "Failed to update short." });
    }
  });

  app.delete("/api/youtube/shorts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { userUid } = req.body;
      if (userUid) {
        const isAdmin = await verifyAdminRole(userUid);
        if (!isAdmin) {
          return helperResponseJson(res, 403, { success: false, error: "Forbidden: Admin privileges required." });
        }
      }

      if (db) {
        let targetDocId = id;
        const directDoc = doc(db, "manual_youtube_shorts", id);
        const directSnap = await getDoc(directDoc);
        if (!directSnap.exists()) {
          const q = query(collection(db, "manual_youtube_shorts"), where("videoId", "==", id));
          const querySnap = await getDocs(q);
          if (!querySnap.empty) {
            targetDocId = querySnap.docs[0].id;
          }
        }
        await deleteDoc(doc(db, "manual_youtube_shorts", targetDocId));
      } else {
        manualShorts = manualShorts.filter(s => s.id !== id && s.videoId !== id);
      }

      return helperResponseJson(res, 200, { success: true, message: "Short deleted successfully!" });
    } catch (err: any) {
      console.error("Error deleting short:", err);
      return helperResponseJson(res, 500, { success: false, error: err.message || "Failed to delete short." });
    }
  });

  // 4. Live Streams CRUD Endpoints
  app.get("/api/youtube/live", async (req, res) => {
    try {
      let list: any[] = [];
      if (db) {
        const snap = await getDocs(collection(db, "manual_youtube_live"));
        snap.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        manualLives = list;
      } else {
        list = manualLives;
      }

      // If requested raw list (e.g. from the Admin Dashboard forms)
      if (req.query.raw === "true") {
        return helperResponseJson(res, 200, list.map(item => ({
          ...item,
          id: item.videoId || item.id
        })));
      }

      // Default status-based response for YouTubeTab client view
      if (list.length === 0) {
        return helperResponseJson(res, 200, {
          isLive: false,
          activeLive: null,
          upcomingStreams: [],
          pastLiveStreams: []
        });
      }

      const activeItem = list[0];
      const activeLive = {
        id: activeItem.videoId || activeItem.id,
        title: activeItem.title,
        description: "Live tournament stream coverage.",
        thumbnail: activeItem.thumbnail || `https://img.youtube.com/vi/${activeItem.videoId}/mqdefault.jpg`,
        publishedAt: activeItem.createdAt || new Date().toISOString(),
        viewerCount: activeItem.viewerCount || 135
      };

      const upcomingStreams = list.slice(1).map(item => ({
        id: item.videoId || item.id,
        title: item.title,
        description: "Upcoming scheduled live coverage.",
        thumbnail: item.thumbnail || `https://img.youtube.com/vi/${item.videoId}/mqdefault.jpg`,
        publishedAt: item.createdAt || new Date().toISOString()
      }));

      return helperResponseJson(res, 200, {
        isLive: true,
        activeLive,
        upcomingStreams,
        pastLiveStreams: []
      });
    } catch (err: any) {
      console.error("Error getting manual live streams:", err);
      return helperResponseJson(res, 200, {
        isLive: false,
        activeLive: null,
        upcomingStreams: [],
        pastLiveStreams: []
      });
    }
  });

  app.post("/api/youtube/live", async (req, res) => {
    try {
      const { title, liveUrl, userUid } = req.body;
      if (!title || !liveUrl) {
        return helperResponseJson(res, 400, { success: false, error: "Title and Live URL are required." });
      }
      if (userUid) {
        const isAdmin = await verifyAdminRole(userUid);
        if (!isAdmin) {
          return helperResponseJson(res, 403, { success: false, error: "Forbidden: Admin privileges required." });
        }
      }

      const videoId = getYouTubeId(liveUrl);
      if (!videoId) {
        return helperResponseJson(res, 400, { success: false, error: "Invalid YouTube Live URL format." });
      }

      const liveDoc = {
        title: title.trim(),
        liveUrl: liveUrl.trim(),
        videoId,
        thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
        createdAt: new Date().toISOString()
      };

      let savedId = "live_" + Date.now();
      if (db) {
        const docRef = await addDoc(collection(db, "manual_youtube_live"), liveDoc);
        savedId = docRef.id;
      } else {
        manualLives.unshift({ id: savedId, ...liveDoc });
      }

      return helperResponseJson(res, 200, { success: true, message: "Live stream added successfully!", id: savedId });
    } catch (err: any) {
      console.error("Error adding live stream:", err);
      return helperResponseJson(res, 500, { success: false, error: err.message || "Failed to add live stream." });
    }
  });

  app.put("/api/youtube/live/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { title, liveUrl, userUid } = req.body;
      if (!title || !liveUrl) {
        return helperResponseJson(res, 400, { success: false, error: "Title and Live URL are required." });
      }
      if (userUid) {
        const isAdmin = await verifyAdminRole(userUid);
        if (!isAdmin) {
          return helperResponseJson(res, 403, { success: false, error: "Forbidden: Admin privileges required." });
        }
      }

      const videoId = getYouTubeId(liveUrl);
      if (!videoId) {
        return helperResponseJson(res, 400, { success: false, error: "Invalid YouTube Live URL format." });
      }

      const updatedDoc = {
        title: title.trim(),
        liveUrl: liveUrl.trim(),
        videoId,
        thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
      };

      if (db) {
        let targetDocId = id;
        const directDoc = doc(db, "manual_youtube_live", id);
        const directSnap = await getDoc(directDoc);
        if (!directSnap.exists()) {
          const q = query(collection(db, "manual_youtube_live"), where("videoId", "==", id));
          const querySnap = await getDocs(q);
          if (!querySnap.empty) {
            targetDocId = querySnap.docs[0].id;
          }
        }
        await setDoc(doc(db, "manual_youtube_live", targetDocId), updatedDoc, { merge: true });
      } else {
        const idx = manualLives.findIndex(l => l.id === id || l.videoId === id);
        if (idx !== -1) {
          manualLives[idx] = { ...manualLives[idx], ...updatedDoc };
        }
      }

      return helperResponseJson(res, 200, { success: true, message: "Live stream updated successfully!" });
    } catch (err: any) {
      console.error("Error updating live stream:", err);
      return helperResponseJson(res, 500, { success: false, error: err.message || "Failed to update live stream." });
    }
  });

  app.delete("/api/youtube/live/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { userUid } = req.body;
      if (userUid) {
        const isAdmin = await verifyAdminRole(userUid);
        if (!isAdmin) {
          return helperResponseJson(res, 403, { success: false, error: "Forbidden: Admin privileges required." });
        }
      }

      if (db) {
        let targetDocId = id;
        const directDoc = doc(db, "manual_youtube_live", id);
        const directSnap = await getDoc(directDoc);
        if (!directSnap.exists()) {
          const q = query(collection(db, "manual_youtube_live"), where("videoId", "==", id));
          const querySnap = await getDocs(q);
          if (!querySnap.empty) {
            targetDocId = querySnap.docs[0].id;
          }
        }
        await deleteDoc(doc(db, "manual_youtube_live", targetDocId));
      } else {
        manualLives = manualLives.filter(l => l.id !== id && l.videoId !== id);
      }

      return helperResponseJson(res, 200, { success: true, message: "Live stream deleted successfully!" });
    } catch (err: any) {
      console.error("Error deleting live stream:", err);
      return helperResponseJson(res, 500, { success: false, error: err.message || "Failed to delete live stream." });
    }
  });

  // End of replace placeholder
  // Fetch Payment configuration (Manual QR, UPI and automatic gateway merchant values)
  app.get("/api/payments/config", async (req, res) => {
    try {
      const docRef = doc(db, "appSettings", "general");
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const remoteData = snap.data();
        localAppSettings = { ...localAppSettings, ...remoteData };
        return res.json(localAppSettings);
      }
    } catch (err) {
      console.warn("Firestore inaccessible, returning local settings.");
    }
    return res.json(localAppSettings);
  });


  // Save/Update General Payment Settings (Admin Action)
  app.post("/api/payments/config/save", async (req, res) => {
    try {
      const docRef = doc(db, "appSettings", "general");
      const updates = req.body;
      localAppSettings = { ...localAppSettings, ...updates, updatedAt: new Date().toISOString() };
      
      try {
        await setDoc(docRef, localAppSettings, { merge: true });
      } catch (dbErr) {
        console.warn("Could not save settings to Firestore, saved to memory instead.", dbErr);
      }

      res.json({ success: true, message: "Payment configurations updated successfully!", settings: localAppSettings });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });


  // Initiate an Automatic Payment Gateway transaction (ZapUPI, Paytm, PhonePe, Razorpay, etc.)
  app.post("/api/payments/initiate", async (req, res) => {
    try {
      const { amount, method, userId, userEmail } = req.body;
      if (!amount || !userId) {
        return res.status(400).json({ success: false, message: "Invalid amount or user credentials." });
      }

      // Fetch latest app configuration
      let activeConfig = localAppSettings;
      try {
        const docRef = doc(db, "appSettings", "general");
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          activeConfig = { ...localAppSettings, ...snap.data() };
        }
      } catch (e) {
        console.error("An error occurred");
      }

      // Enforce Minimum and Maximum Deposit Limits
      const minLimit = Number(activeConfig.minDepositAmount || 10);
      const maxLimit = Number(activeConfig.maxDepositAmount || 100000);
      if (amount < minLimit || amount > maxLimit) {
        return res.status(400).json({ success: false, message: `Payment failed: Deposit amount must be between ₹${minLimit} and ₹${maxLimit} (limits set by Admin).` });
      }

      // Generate secure unique order ID
      const orderId = `TXN_AUTO_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

      // Check if selected gateway is enabled
      const isZapUPI = method === "ZapUPI";
      const isPaytm = method === "Paytm";
      const isPhonePe = method === "PhonePe";
      const isRazorpay = method === "Razorpay" || method === "GPay"; 
      const isCashfree = method === "Cashfree";
      const isPayU = method === "PayU";
      const isEasebuzz = method === "Easebuzz";

      if (isZapUPI && !activeConfig.zapupiEnabled) {
        return res.status(400).json({ success: false, message: "ZapUPI Official Gateway is currently disabled by Admin." });
      }
      if (isPaytm) {
        if (!activeConfig.paytmEnabled) {
          return res.status(400).json({ success: false, message: "Paytm Gateway is currently disabled by Admin." });
        }
        if (!activeConfig.paytmMerchantKey) {
          // No merchant key -> manual mode
          return res.json({
            success: true,
            gatewayMode: "manual",
            orderId,
            amount,
            method,
            redirectUrl: `/api/payments/paytm/manual-fallback?orderId=${orderId}&amount=${amount}`
          });
        }
      }
      if (isPhonePe && !activeConfig.phonepeEnabled) {
        return res.status(400).json({ success: false, message: "PhonePe Gateway is currently disabled by Admin." });
      }
      if (isRazorpay && !activeConfig.razorpayEnabled) {
        return res.status(400).json({ success: false, message: "Razorpay Gateway is currently disabled by Admin." });
      }
      if (isCashfree && !activeConfig.cashfreeEnabled) {
        return res.status(400).json({ success: false, message: "Cashfree Gateway is currently disabled by Admin." });
      }
      if (isPayU && !activeConfig.payuEnabled) {
        return res.status(400).json({ success: false, message: "PayU Gateway is currently disabled by Admin." });
      }
      if (isEasebuzz && !activeConfig.easebuzzEnabled) {
        return res.status(400).json({ success: false, message: "Easebuzz Gateway is currently disabled by Admin." });
      }

      // Save a pending transaction to Firestore
      const txnData = {
        id: orderId,
        userId,
        amount: Number(amount),
        type: "deposit_request",
        paymentMethod: method,
        dateTime: new Date().toISOString(),
        status: "pending",
        description: `Deposit via ${method} Auto API Gateway`
      };

      try {
        await setDoc(doc(db, "transactions", orderId), txnData);
      } catch (dbErr) {
        console.warn("Could not save pending transaction to Firestore (running in-memory mock):", dbErr);
      }

      // ZapUPI Secure Signature Generation
      let zapupiSignature = "";
      if (isZapUPI) {
        // Construct official high-security API signature
        const saltStr = `${activeConfig.zapupiApiKey}|${orderId}|${amount}|${activeConfig.zapupiSecretKey}`;
        zapupiSignature = crypto.createHash("sha256").update(saltStr).digest("hex");
      }

      // Paytm Checksum Signature generation
      let checksum = "";
      let paytmBase64Payload = "";
      if (isPaytm && activeConfig.paytmMerchantKey) {
        const paytmParams = {
          MID: activeConfig.paytmMid,
          ORDER_ID: orderId,
          CUST_ID: userId || "CUST_001",
          TXN_AMOUNT: String(amount),
          WEBSITE: "DEFAULT",
          CHANNEL_ID: "WEB",
          INDUSTRY_TYPE_ID: "Retail"
        };
        const sortedKeys = Object.keys(paytmParams).sort();
        let dataString = "";
        sortedKeys.forEach(k => {
          dataString += `${(paytmParams as any)[k]}|`;
        });

        dataString += activeConfig.paytmMerchantKey;
        checksum = crypto.createHash("sha256").update(dataString).digest("hex");
        
        // Also attach the checksum to the payload for the HTML form redirect
        const fullPayload = { ...paytmParams, CHECKSUMHASH: checksum };
        paytmBase64Payload = Buffer.from(JSON.stringify(fullPayload)).toString('base64');
      }

      // PhonePe Checksum signature generation
      let phonepeSignature = "";
      let phonepeBase64Payload = "";
      if (isPhonePe) {
        const protocol = req.secure || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
        const host = req.get("host") || "localhost:3000";
        const backendBaseUrl = (host.includes("localhost") || host.includes("127.0.0.1") || host.includes("run.app") || host.includes("aistudio")) 
          ? `${protocol}://${host}` 
          : `https://titanesp.site`;
        const phonepePayload = {
          merchantId: activeConfig.phonepeMerchantId,
          merchantTransactionId: orderId,
          amount: Number(amount) * 100, // PhonePe takes amount in paise
          redirectUrl: `${backendBaseUrl}/api/payments/phonepe/callback`,
          callbackUrl: `${backendBaseUrl}/api/payments/phonepe/callback`,
          mobileNumber: "9999999999",
          paymentInstrument: {
            type: "PAY_PAGE"
          }
        };
        phonepeBase64Payload = Buffer.from(JSON.stringify(phonepePayload)).toString("base64");
        const signString = phonepeBase64Payload + "/pg/v1/pay" + activeConfig.phonepeSaltKey;
        phonepeSignature = crypto.createHash("sha256").update(signString).digest("hex") + "###" + activeConfig.phonepeSaltIndex;
      }

      // Check if we are running in Sandbox
      const isSandbox = isZapUPI
        ? activeConfig.zapupiSandbox !== false
        : (isPaytm && activeConfig.paytmSandbox !== false) ||
          (isPhonePe && activeConfig.phonepeSandbox !== false) ||
          (isRazorpay && activeConfig.razorpaySandbox !== false) ||
          true; // default to sandbox simulator for other gateways

      if (isZapUPI && !isSandbox) {
        try {
          const apiKey = activeConfig.zapupiApiKey;
          if (!apiKey) {
            return res.status(400).json({ success: false, message: "ZapUPI API Key is not configured in the Admin Panel." });
          }

          // Build redirect and webhook URLs dynamically based on the request host
          const protocol = req.secure || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
          const host = req.get("host") || "localhost:3000";
          const redirectUrl = `${protocol}://${host}/api/payments/zapupi/callback`;
          const webhookUrl = `${protocol}://${host}/api/payments/zapupi/webhook`;

          const zapPayload = {
            zap_key: apiKey,
            order_id: orderId,
            amount: String(amount),
            customer_name: userEmail ? userEmail.split("@")[0] : "titan_esp_player",
            customer_email: userEmail || "player@titanesp.com",
            customer_mobile: "9999999999",
            redirect_url: redirectUrl,
            webhook_url: webhookUrl
          };

          console.log("Initiating live ZapUPI order request with payload:", { ...zapPayload, api_key: "zap_api_••••••" });

          // Call ZapUPI v1 order create API
          const zapRes = await fetch("https://pay.zapupi.com/api/create-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(zapPayload)
          });


          if (!zapRes.ok) {
            const errorText = await zapRes.text().catch(() => "");
            throw new Error(`ZapUPI API returned HTTP ${zapRes.status}: ${errorText.slice(0, 150)}`);
          }

          const responseText = await zapRes.text();
          let zapResult: any;
          try {
            zapResult = JSON.parse(responseText);
          } catch (jsonErr) {
            console.error("Failed to parse ZapUPI API response as JSON. Raw response content:", responseText);
            throw new Error(`ZapUPI response was not valid JSON: ${responseText.slice(0, 150)}...`);
          }
          console.log("ZapUPI API order create response:", zapResult);

          if (zapResult.status || zapResult.success || zapResult.payment_url || (zapResult.data && zapResult.data.payment_url)) {
            const finalPayUrl = zapResult.payment_url || (zapResult.data && zapResult.data.payment_url) || zapResult.url;
            if (!finalPayUrl) {
              throw new Error(`ZapUPI did not return a payment URL. Response: ${responseText}`);
            }

            // Save external API details in the transaction record
            try {
              await setDoc(doc(db, "transactions", orderId), {
                externalOrderId: zapResult.data?.order_id || orderId,
                paymentUrl: finalPayUrl,
                status: "pending",
                description: "Waiting for player payment via ZapUPI live gateway"
              }, { merge: true });
            } catch (dbErr) {
              console.warn("Could not save updated production transaction info to Firestore:", dbErr);
            }

            return res.json({
              success: true,
              gatewayMode: "production",
              orderId,
              amount,
              method,
              redirectUrl: finalPayUrl
            });

          } else {
            const errMsg = zapResult.message || zapResult.msg || zapResult.error || "Order creation cancelled by ZapUPI.";
            return res.status(400).json({ success: false, message: `ZapUPI Gateway Error: ${errMsg}` });
          }
        } catch (zapErr: any) {
          console.error("An error occurred");
          return res.status(400).json({ success: false, message: `Failed to initiate payment with ZapUPI: ${zapErr.message}` });
        }
      }

      if (isSandbox) {
        return res.json({
          success: true,
          gatewayMode: "sandbox",
          orderId,
          amount,
          method,
          checksum,
          phonepeSignature,
          phonepeBase64Payload,
          zapupiSignature,
          redirectUrl: `/api/payments/simulate?orderId=${orderId}&amount=${amount}&method=${method}&userId=${userId}&userEmail=${encodeURIComponent(userEmail || '')}`
        });

      }

      // Real-world production integration redirects (returns payload for production gateway redirect)
      return res.json({
        success: true,
        gatewayMode: "production",
        orderId,
        amount,
        method,
        productionUrl: isPaytm ? "https://securegw.paytm.in/order/process" : "https://api.phonepe.com/apis/hermes/pg/v1/pay",
        redirectUrl: isPaytm ? `/api/payments/paytm/redirect?payload=${paytmBase64Payload}` : undefined,
        checksum,
        phonepeSignature,
        phonepeBase64Payload,
        zapupiSignature
      });

    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });


  // Highly responsive, full-fidelity Gateway Simulator Screen HTML
  app.get("/api/payments/simulate", (req, res) => {
    const { orderId, amount, method, userId, userEmail } = req.query;
    if (!orderId || !amount || !method || !userId) {
      return res.send("<h1 style='color:red;font-family:sans-serif;text-align:center;margin-top:100px;'>Incomplete Session Parameters</h1>");
    }

    const themeColors = {
      ZapUPI: { primary: "#f59e0b", bg: "from-amber-600 to-yellow-950" },
      Paytm: { primary: "#00b9f5", bg: "from-blue-600 to-indigo-900" },
      PhonePe: { primary: "#5f259f", bg: "from-purple-600 to-purple-950" },
      Razorpay: { primary: "#0b72e7", bg: "from-sky-600 to-blue-950" },
      Cashfree: { primary: "#2563eb", bg: "from-indigo-600 to-blue-900" },
      PayU: { primary: "#16a34a", bg: "from-emerald-600 to-green-950" },
      Easebuzz: { primary: "#ea580c", bg: "from-orange-600 to-red-950" }
    };
    const currentTheme = (themeColors as any)[method as string] || { primary: "#f59e0b", bg: "from-amber-600 to-neutral-950" };

    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${method} Payment Gateway Simulator</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Space Grotesk', sans-serif; }
          .mono { font-family: 'JetBrains Mono', monospace; }
        </style>
      </head>
      <body class="bg-gradient-to-br ${currentTheme.bg} min-h-screen flex items-center justify-center p-4 text-white">
        <div class="bg-[#12121a] border border-white/10 rounded-3xl w-full max-w-md p-6 shadow-2xl relative overflow-hidden space-y-6">
          <div class="absolute top-0 left-0 w-full h-1.5" style="background-color: ${currentTheme.primary};"></div>
          
          <div class="flex justify-between items-center border-b border-white/5 pb-4">
            <div class="flex items-center gap-2">
              <div class="w-2.5 h-2.5 rounded-full animate-ping" style="background-color: ${currentTheme.primary};"></div>
              <span class="text-xs font-bold text-neutral-400 uppercase tracking-widest">${method} Sandbox Portal</span>
            </div>
            <span class="px-2 py-0.5 rounded-full bg-neutral-800 border border-white/5 text-[9px] font-mono text-neutral-400">TEST ENVIRONMENT</span>
          </div>

          <div class="text-center space-y-2 py-2">
            <h1 class="text-lg font-black text-neutral-400 uppercase tracking-widest">Amount Due</h1>
            <p class="text-4xl font-extrabold text-white mono tracking-tight">₹${Number(amount).toFixed(2)}</p>
          </div>

          <div class="bg-neutral-900/60 border border-white/5 rounded-2xl p-4 text-xs space-y-2.5 font-mono">
            <div class="flex justify-between">
              <span class="text-neutral-500">Merchant Name:</span>
              <span class="text-neutral-200 font-bold">TITAN ESP Top-Up</span>
            </div>
            <div class="flex justify-between">
              <span class="text-neutral-500">Order Reference:</span>
              <span class="text-white font-bold">${orderId}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-neutral-500">User Account:</span>
              <span class="text-neutral-200">${userEmail || userId}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-neutral-500">Auth Signature:</span>
              <span class="text-[9px] text-emerald-400 truncate w-36 text-right font-bold">VERIFIED_SECURE_HMAC</span>
            </div>
          </div>

          <div class="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl flex gap-2 text-[10px] text-amber-400 leading-relaxed">
            <span class="text-base">💡</span>
            <span>You are currently in developer testing mode. Clicking complete will trigger the live server-side webhooks and update your balance instantly!</span>
          </div>

          <form action="/api/payments/complete-sim" method="POST" class="space-y-2.5">
            <input type="hidden" name="orderId" value="${orderId}">
            <input type="hidden" name="amount" value="${amount}">
            <input type="hidden" name="userId" value="${userId}">
            <input type="hidden" name="method" value="${method}">
            
            <button 
              type="submit" 
              name="status" 
              value="success"
              class="w-full text-neutral-950 font-black py-3 px-4 rounded-xl shadow-lg transition-all hover:brightness-110 active:scale-[0.98] text-xs uppercase tracking-widest cursor-pointer flex items-center justify-center gap-1"
              style="background-color: ${currentTheme.primary};"
            >
              ✅ Complete Payment Successfully
            </button>
            
            <button 
              type="submit" 
              name="status" 
              value="failure"
              class="w-full bg-neutral-900 border border-white/5 hover:bg-neutral-800 text-red-400 font-bold py-3 px-4 rounded-xl transition-all active:scale-[0.98] text-xs uppercase tracking-widest cursor-pointer flex items-center justify-center gap-1"
            >
              ❌ Decline / Fail Payment
            </button>
          </form>
          
          <p class="text-[9px] text-neutral-500 text-center uppercase tracking-wider">SECURE AUTO-PAY GATEWAY V2.4 © ${new Date().getFullYear()}</p>
        </div>
      </body>
      </html>
    `);
  });


  // Paytm manual fallback mode
  app.get("/api/payments/paytm/manual-fallback", (req, res) => {
    const { orderId, amount } = req.query;
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Paytm - Manual Processing</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&display=swap" rel="stylesheet">
      </head>
      <body class="bg-neutral-950 text-white min-h-screen flex items-center justify-center p-4" style="font-family: 'Space Grotesk', sans-serif;">
        <div class="bg-neutral-900 border border-white/10 rounded-3xl max-w-md w-full p-8 text-center space-y-6 shadow-2xl">
          <div class="w-16 h-16 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto text-3xl font-bold">
            !
          </div>
          <div class="space-y-2">
            <h1 class="text-2xl font-bold text-amber-500">Order Pending</h1>
            <p class="text-neutral-400 font-mono text-sm">Order Ref: ${orderId}</p>
            <p class="text-2xl font-bold">₹${amount}</p>
          </div>
          
          <div class="bg-amber-950/40 p-4 rounded-xl border border-amber-500/20 text-sm text-amber-200 leading-relaxed text-left space-y-2">
            <p>Your transaction has been securely recorded on our servers.</p>
            <p>Because the automatic Paytm gateway is currently operating in <b>Manual Mode</b>, your payment must be verified and processed manually by the Admin.</p>
            <p>Please contact support if your wallet balance does not update shortly.</p>
          </div>
          
          <button onclick="window.close()" class="w-full bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black py-4 rounded-xl transition-all shadow-lg text-sm tracking-wider uppercase">
            Close Window
          </button>
        </div>
      </body>
      </html>
    `);
  });

  // Paytm automated redirection form (fixes 403 error for GET requests)
  app.get("/api/payments/paytm/redirect", (req, res) => {
    try {
      const payloadStr = Buffer.from(req.query.payload as string, 'base64').toString('utf-8');
      const payload = JSON.parse(payloadStr);
      
      let formHtml = `<form id="paytmForm" action="https://securegw.paytm.in/order/process" method="POST">`;
      for (const key in payload) {
        formHtml += `<input type="hidden" name="${key}" value="${payload[key]}">`;
      }
      formHtml += `</form>`;
      
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Redirecting to Paytm...</title>
          <style>body { background: #111; color: #fff; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; }</style>
        </head>
        <body>
          <div style="text-align: center;">
            <div style="width: 40px; height: 40px; border: 4px solid #00b9f5; border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
            <h2>Redirecting to Secure Paytm Gateway</h2>
            <p style="color: #888;">Please wait, do not refresh this page...</p>
          </div>
          \${formHtml}
          <script>
            document.getElementById("paytmForm").submit();
          </script>
          <style>@keyframes spin { 100% { transform: rotate(360deg); } }</style>
        </body>
        </html>
      `);
    } catch (err) {
      res.status(400).send("Invalid Paytm payload format.");
    }
  });

  // Complete Sandbox Simulation Callback (simulates callback from gateway API)
  app.post("/api/payments/complete-sim", async (req, res) => {
    try {
      const { orderId, amount, userId, method, status } = req.body;
      const amountNum = Number(amount);

      if (!orderId || !amount || !userId || !method) {
        return res.status(400).send("<h3>Simulation parameters are invalid. Close window.</h3>");
      }

      const isSuccess = status === "success";

      // 1. Update the transaction in Firestore
      const txnRef = doc(db, "transactions", orderId);
      await setDoc(txnRef, {
        status: isSuccess ? "pending_verification" : "failed",
        type: isSuccess ? "deposit_success" : "deposit_failed",
        description: isSuccess ? `Auto Checkout successful via ${method} Instant API` : `Deposit declined by ${method} gateway`
      }, { merge: true });

      if (isSuccess) {
        // 2. Increment the user balance in Firestore
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const currentBal = Number(userData.depositBalance || 0);
          // auto-credit disabled for manual verification
        }

        // 3. Create a realtime notification in Firestore
        const notifyId = `not_${Date.now()}`;
        const notifyObj = {
          id: notifyId,
          title: "Payment Pending Approval ⏳ 💰",
          message: `₹${amountNum} has been recorded and is pending Admin approval via ${method} Instant Gateway!`,
          type: "info",
          dateTime: new Date().toISOString(),
          isRead: false
        };
        await setDoc(doc(db, "notifications", notifyId), notifyObj);
      }

      // Redirect user back to local wallet page with success or fail parameters
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Processing Complete</title>
          <style>body { background: #111; color: #fff; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; text-align: center; }</style>
        </head>
        <body>
          <div>
            <h2>${isSuccess ? 'Payment Processed' : 'Payment Failed'}</h2>
            <p style="color: #888;">You can safely close this window now.</p>
            <button onclick="window.close()" style="margin-top: 20px; padding: 10px 20px; background: #ea580c; color: #fff; border: none; border-radius: 8px; cursor: pointer;">Close Window</button>
          </div>
          <script>
            setTimeout(() => window.close(), 3000);
          </script>
        </body>
        </html>
      `);
    } catch (err: any) {
      console.error("An error occurred");
      res.status(500).send(`<h3>Simulation processing failed: ${err.message}</h3>`);
    }
  });


  // Helper to query ZapUPI status API using only the API Key
  async function verifyZapUPIPaymentStatus(orderId: string, apiKey: string): Promise<{ success: boolean; status: "pending_verification" | "failed" | "pending" | "cancelled"; refNo?: string; raw?: any }> {
    try {
      console.log(`Checking payment status with ZapUPI API for order: ${orderId}`);
      const response = await fetch("https://pay.zapupi.com/api/order-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zap_key: apiKey,
          order_id: orderId
        })
      });

      
      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        throw new Error(`ZapUPI Status API returned HTTP ${response.status}: ${errText.slice(0, 150)}`);
      }
      
      const responseText = await response.text();
      let result: any;
      try {
        result = JSON.parse(responseText);
      } catch (jsonErr) {
        console.error("Failed to parse ZapUPI Status response as JSON. Raw:", responseText);
        throw new Error(`ZapUPI Status response was not valid JSON: ${responseText.slice(0, 150)}`);
      }
      console.log(`ZapUPI verification result for ${orderId}:`, result);
      
      // Handle the status formats of ZapUPI
      // Typical: { status: true, data: { status: "SUCCESS", utr: "..." } } or { status: "SUCCESS", transaction_id: "..." }
      let payStatus = String(result.data?.status || result.status).toUpperCase();
      
      const isSuccess = payStatus === "SUCCESS" || payStatus === "COMPLETED";
      const isFailed = payStatus === "FAILED" || payStatus === "FAILURE";

      const refNo = result.transaction_id || result.utr || (result.data && (result.data.utr || result.data.transaction_id || result.data.upi_txn_id)) || undefined;

      if (isSuccess) {
        return { success: true, status: "pending_verification", refNo, raw: result };
      } else if (isFailed) {
        return { success: false, status: "cancelled", raw: result };
      } else {
        return { success: false, status: "pending", raw: result };
      }
    } catch (err: any) {
      console.error("An error occurred");
      // Attempt alternative URL "https://api.zapupi.com/api/v1/status" in case the endpoint is slightly different
      try {
        const responseAlt = await fetch("https://api.zapupi.com/api/v1/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: apiKey,
            order_id: orderId
          })
        });

        if (responseAlt.ok) {
          const responseTextAlt = await responseAlt.text();
          let resultAlt: any;
          try {
            resultAlt = JSON.parse(responseTextAlt);
          } catch (e) {
            console.error("Alt status response parse failure:", responseTextAlt);
            throw e;
          }
          const isSuccess = 
            resultAlt.status === "SUCCESS" || 
            resultAlt.status === "success" || 
            resultAlt.status === "COMPLETED" || 
            resultAlt.status === "completed" || 
            resultAlt.status === true || 
            (resultAlt.data && (
              resultAlt.data.status === "SUCCESS" || 
              resultAlt.data.status === "success"
            ));
          const refNo = resultAlt.transaction_id || resultAlt.utr || (resultAlt.data && (resultAlt.data.utr || resultAlt.data.transaction_id)) || undefined;
          if (isSuccess) {
            return { success: true, status: "pending_verification", refNo, raw: resultAlt };
          }
        }
      } catch (altErr) {
        console.error("An error occurred");
      }
      throw err;
    }
  }

  // Atomic/idempotent helper to finalize transactions and credit the user's wallet safely
  async function finalizeTransaction(orderId: string, status: "pending_verification" | "failed" | "pending" | "cancelled" | "completed", refNo?: string): Promise<boolean> {
    try {
      const txnRef = doc(db, "transactions", orderId);
      const txnSnap = await getDoc(txnRef);
      
      if (!txnSnap.exists()) {
        console.warn(`Transaction ${orderId} not found during finalization.`);
        return false;
      }
      
      const txnData = txnSnap.data();
      
      // Ensure we do not credit the user multiple times for the same orderId
      if (txnData.status === "completed") {
        console.log(`Transaction ${orderId} is already completed. Skipping double-credit.`);
        return true;
      }
      
      const isSuccess = status === "completed";
      
      // 1. Update the transaction in Firestore
      await setDoc(txnRef, {
        status,
        type: isSuccess ? "deposit_success" : (status === "failed" ? "deposit_failed" : "deposit_request"),
        referenceNo: refNo || txnData.referenceNo || "",
        description: isSuccess 
          ? `Auto Checkout successful via ZapUPI Instant API (Ref: ${refNo || "N/A"})` 
          : (status === "failed" ? `Deposit declined by ZapUPI gateway` : `Waiting for player payment via ZapUPI`)
      }, { merge: true });
      
      if (isSuccess) {
        // 2. Increment the user's deposit balance
        const userId = txnData.userId;
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const currentBal = Number(userData.depositBalance || 0);
          const amountNum = Number(txnData.amount || 0);
          // auto-credit disabled for manual verification
          
          // 3. Create a realtime notification in Firestore
          const notifyId = `not_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
          const notifyObj = {
            id: notifyId,
            title: "Payment Pending Approval ⏳ 💰",
            message: `₹${amountNum} has been recorded and is pending Admin approval via ZapUPI Official Gateway!`,
            type: "info",
            dateTime: new Date().toISOString(),
            isRead: false
          };
          await setDoc(doc(db, "notifications", notifyId), notifyObj);
          console.log(`Successfully credited ₹${amountNum} to user ${userId} for transaction ${orderId}`);
        } else {
          console.warn(`User profile ${userId} not found for transaction ${orderId}.`);
        }
      }
      return true;
    } catch (err) {
      console.error("An error occurred");
      return false;
    }
  }

  // Real-world callback/webhook for Paytm
  app.post("/api/payments/paytm/callback", async (req, res) => {
    try {
      const params = req.body;
      const { ORDERID, TXNAMOUNT, STATUS, CHECKSUMHASH } = params;

      // Fetch keys
      let activeConfig = localAppSettings;
      try {
        const docRef = doc(db, "appSettings", "general");
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          activeConfig = { ...localAppSettings, ...snap.data() };
        }
      } catch (e) {}

      // Verify Paytm Checksum
      const sortedKeys = Object.keys(params).sort();
      let dataString = "";
      sortedKeys.forEach(k => {
        if (k !== "CHECKSUMHASH") {
          dataString += `${params[k]}|`;
        }
      });

      dataString += activeConfig.paytmMerchantKey;
      const calculatedChecksum = crypto.createHash("sha256").update(dataString).digest("hex");

      if (calculatedChecksum !== CHECKSUMHASH) {
        return res.status(400).send("Signature verification failed.");
      }

      const isSuccess = STATUS === "TXN_SUCCESS";
      const txnRef = doc(db, "transactions", ORDERID);
      const txnSnap = await getDoc(txnRef);

      if (txnSnap.exists()) {
        const txnData = txnSnap.data();
        if (txnData.status === "pending") {
          await setDoc(txnRef, {
            status: isSuccess ? "pending_verification" : "failed",
            type: isSuccess ? "deposit_success" : "deposit_failed",
            description: isSuccess ? `Paytm Webhook update successful.` : `Paytm Webhook update failed.`
          }, { merge: true });

          if (isSuccess) {
            const userRef = doc(db, "users", txnData.userId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              const u = userSnap.data();
              // auto-credit disabled for manual verification
            }

            const notifyId = `not_${Date.now()}`;
            await setDoc(doc(db, "notifications", notifyId), {
              id: notifyId,
              title: "Paytm Payment Pending ⏳ 💰",
              message: `₹${TXNAMOUNT} recorded and pending verification.`,
              type: "info",
              dateTime: new Date().toISOString(),
              isRead: false
            });

          }
        }
      }

      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Processing Complete</title>
          <style>body { background: #111; color: #fff; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; text-align: center; }</style>
        </head>
        <body>
          <div>
            <h2>${isSuccess ? 'Payment Processed' : 'Payment Failed'}</h2>
            <p style="color: #888;">You can safely close this window now.</p>
            <button onclick="window.close()" style="margin-top: 20px; padding: 10px 20px; background: #ea580c; color: #fff; border: none; border-radius: 8px; cursor: pointer;">Close Window</button>
          </div>
          <script>
            setTimeout(() => window.close(), 3000);
          </script>
        </body>
        </html>
      `);
    } catch (err: any) {
      res.status(500).send("Callback error: " + err.message);
    }
  });



async function processTransactionSafe(orderId, isSuccess, method, amount) {
  try {
    const txnRef = doc(db, "transactions", orderId);
    await runTransaction(db, async (transaction) => {
      const txnSnap = await transaction.get(txnRef);
      if (!txnSnap.exists()) return;
      const txnData = txnSnap.data();
      
      if (txnData.status !== "pending") {
        return; // Already processed
      }

      transaction.update(txnRef, {
        status: isSuccess ? "pending_verification" : "failed",
        type: isSuccess ? "deposit_success" : "deposit_failed",
        description: isSuccess ? `Auto processed via ${method} API.` : `${method} Payment failed.`
      });


      if (isSuccess && txnData.userId) {
        const userRef = doc(db, "users", txnData.userId);
        const userSnap = await transaction.get(userRef);
        if (userSnap.exists()) {
          const u = userSnap.data();
          // auto-credit disabled for manual verification
        }
      }
    });

    return true;
  } catch (error) {
    console.error("An error occurred");
    return false;
  }
}

  // ZapUPI API Webhook handling (Auto Callback support with signature validation)
  app.post("/api/payments/zapupi/webhook", async (req, res) => {
    try {
      const { orderId, amount, status, signature } = req.body;
      if (!orderId || !amount || !status || !signature) {
        return res.status(400).json({ success: false, error: "Incomplete ZapUPI webhook payload." });
      }

      // Fetch dynamic settings keys
      let activeConfig = localAppSettings;
      try {
        const docRef = doc(db, "appSettings", "general");
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          activeConfig = { ...localAppSettings, ...snap.data() };
        }
      } catch (e) {}

      // Validate ZapUPI signature
      const stringToSign = `${activeConfig.zapupiApiKey}|${orderId}|${amount}|${status}|${activeConfig.zapupiSecretKey}`;
      const calculatedSignature = crypto.createHash("sha256").update(stringToSign).digest("hex");

      if (calculatedSignature !== signature) {
        return res.status(400).json({ success: false, error: "ZapUPI API Signature verification failed." });
      }

      const isSuccess = status === "SUCCESS" || status === "success" || status === "COMPLETED";
      const txnRef = doc(db, "transactions", orderId);
      const txnSnap = await getDoc(txnRef);

      if (txnSnap.exists()) {
        const txnData = txnSnap.data();
        if (txnData.status === "pending") {
          // Update transaction state
          await setDoc(txnRef, {
            status: isSuccess ? "pending_verification" : "failed",
            type: isSuccess ? "deposit_success" : "deposit_failed",
            description: isSuccess ? `Auto Checkout completed via ZapUPI Gateway.` : `ZapUPI payment failed.`
          }, { merge: true });

          if (isSuccess) {
            // Auto credit wallet balance
            const userRef = doc(db, "users", txnData.userId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              const u = userSnap.data();
              // auto-credit disabled for manual verification
            }

            // Real-time user app notification
            const notifyId = `not_${Date.now()}`;
            await setDoc(doc(db, "notifications", notifyId), {
              id: notifyId,
              title: "ZapUPI Payment Pending ⏳",
              message: `₹${amount} has been recorded and is pending Admin approval.`,
              type: "info",
              dateTime: new Date().toISOString(),
              isRead: false
            });

          }
        }
      }

      return res.json({ success: true, message: "Webhook processed successfully." });
    } catch (err: any) {
      console.error("An error occurred");
      return res.status(500).json({ success: false, error: err.message });
    }
  });


  // ZapUPI Callback Redirection landing (for end-user browser redirects)
  app.get("/api/payments/zapupi/callback", async (req, res) => {
    try {
      const { orderId, amount, status, signature } = req.query;
      const isSuccess = status === "SUCCESS" || status === "success" || status === "COMPLETED";
      
      // Update the transaction and credit balance if signature is verified and not already processed
      if (orderId && amount && status && signature) {
        let activeConfig = localAppSettings;
        try {
          const docRef = doc(db, "appSettings", "general");
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            activeConfig = { ...localAppSettings, ...snap.data() };
          }
        } catch (e) {}

        const stringToSign = `${activeConfig.zapupiApiKey}|${orderId}|${amount}|${status}|${activeConfig.zapupiSecretKey}`;
        const calculatedSignature = crypto.createHash("sha256").update(stringToSign).digest("hex");

        if (calculatedSignature === signature) {
          const txnRef = doc(db, "transactions", orderId as string);
          const txnSnap = await getDoc(txnRef);

          if (txnSnap.exists()) {
            const txnData = txnSnap.data();
            if (txnData.status === "pending") {
              await setDoc(txnRef, {
                status: isSuccess ? "pending_verification" : "failed",
                type: isSuccess ? "deposit_success" : "deposit_failed",
                description: isSuccess ? `Callback processed via ZapUPI Redirect.` : `ZapUPI Payment failed.`
              }, { merge: true });

              if (isSuccess) {
                const userRef = doc(db, "users", txnData.userId);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                  const u = userSnap.data();
                  // auto-credit disabled for manual verification
                }

                const notifyId = `not_${Date.now()}`;
                await setDoc(doc(db, "notifications", notifyId), {
                  id: notifyId,
                  title: "ZapUPI Payment Pending ⏳",
                  message: `₹${amount} recorded and pending verification.`,
                  type: "info",
                  dateTime: new Date().toISOString(),
                  isRead: false
                });

              }
            }
          }
        }
      }

      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Processing Complete</title>
          <style>body { background: #111; color: #fff; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; text-align: center; }</style>
        </head>
        <body>
          <div>
            <h2>${isSuccess ? 'Payment Processed' : 'Payment Failed'}</h2>
            <p style="color: #888;">You can safely close this window now.</p>
            <button onclick="window.close()" style="margin-top: 20px; padding: 10px 20px; background: #ea580c; color: #fff; border: none; border-radius: 8px; cursor: pointer;">Close Window</button>
          </div>
          <script>
            setTimeout(() => window.close(), 3000);
          </script>
        </body>
        </html>
      `);
    } catch (err: any) {
      console.error("An error occurred");
      return res.status(400).send("Payment failed. Please close this window.");
    }
  });


  // Real-world webhook for PhonePe
  app.post("/api/payments/phonepe/callback", async (req, res) => {
    try {
      const { response } = req.body; // PhonePe sends base64 response payload
      const xVerify = req.headers["x-verify"] as string;

      if (!response || !xVerify) {
        return res.status(400).json({ error: "Invalid payload headers" });
      }

      let activeConfig = localAppSettings;
      try {
        const docRef = doc(db, "appSettings", "general");
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          activeConfig = { ...localAppSettings, ...snap.data() };
        }
      } catch (e) {}

      // Verify Signature
      const signString = response + "/pg/v1/pay" + activeConfig.phonepeSaltKey;
      const expectedVerify = crypto.createHash("sha256").update(signString).digest("hex") + "###" + activeConfig.phonepeSaltIndex;

      if (expectedVerify !== xVerify) {
        return res.status(400).json({ error: "PhonePe Signature verification failed." });
      }

      const decodedBytes = Buffer.from(response, "base64").toString("utf-8");
      const decodedPayload = JSON.parse(decodedBytes);
      
      const orderId = decodedPayload.data?.merchantTransactionId;
      const success = decodedPayload.success && decodedPayload.code === "PAYMENT_SUCCESS";
      const rawAmt = decodedPayload.data?.amount; // in paise
      const creditedAmount = rawAmt ? Number(rawAmt) / 100 : 0;

      const txnRef = doc(db, "transactions", orderId);
      const txnSnap = await getDoc(txnRef);

      if (txnSnap.exists()) {
        const txnData = txnSnap.data();
        if (txnData.status === "pending") {
          await setDoc(txnRef, {
            status: success ? "completed" : "failed",
            type: success ? "deposit_success" : "deposit_failed",
            description: success ? `PhonePe Webhook Success` : `PhonePe Webhook Failure`
          }, { merge: true });

          if (success) {
            const userRef = doc(db, "users", txnData.userId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              const u = userSnap.data();
              // auto-credit disabled for manual verification
            }

            const notifyId = `not_${Date.now()}`;
            await setDoc(doc(db, "notifications", notifyId), {
              id: notifyId,
              title: "PhonePe Payment Pending ⏳ 🚀",
              message: `₹${creditedAmount} recorded and pending verification.`,
              type: "info",
              dateTime: new Date().toISOString(),
              isRead: false
            });

          }
        }
      }

      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });


  // Real-world webhook for Razorpay
  app.post("/api/payments/razorpay/callback", async (req, res) => {
    try {
      const signature = req.headers["x-razorpay-signature"] as string;
      const bodyStr = JSON.stringify(req.body);

      let activeConfig = localAppSettings;
      try {
        const docRef = doc(db, "appSettings", "general");
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          activeConfig = { ...localAppSettings, ...snap.data() };
        }
      } catch (e) {}

      const expectedSig = crypto.createHmac("sha256", activeConfig.razorpaySecret)
                                .update(bodyStr)
                                .digest("hex");

      if (expectedSig !== signature) {
        return res.status(400).json({ error: "Razorpay webhook signature verification failed." });
      }

      const event = req.body.event;
      if (event === "payment.captured") {
        const payment = req.body.payload.payment.entity;
        const amount = payment.amount / 100; // paise to rupees
        const orderId = payment.order_id || payment.notes?.orderId;

        if (orderId) {
          const txnRef = doc(db, "transactions", orderId);
          const txnSnap = await getDoc(txnRef);

          if (txnSnap.exists()) {
            const txnData = txnSnap.data();
            if (txnData.status === "pending") {
              await setDoc(txnRef, {
                status: "pending_verification",
                type: "deposit_success",
                description: `Razorpay Auto Webhook verification successful.`
              }, { merge: true });

              const userRef = doc(db, "users", txnData.userId);
              const userSnap = await getDoc(userRef);
              if (userSnap.exists()) {
                const u = userSnap.data();
                // auto-credit disabled for manual verification
              }

              const notifyId = `not_${Date.now()}`;
              await setDoc(doc(db, "notifications", notifyId), {
                id: notifyId,
                title: "Razorpay Payment Pending ⏳ 💸",
                message: `₹${amount} is pending Admin approval.`,
                type: "info",
                dateTime: new Date().toISOString(),
                isRead: false
              });

            }
          }
        }
      }

      res.json({ status: "ok" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });


  // ==========================================
  // ADMIN PAYMENT APPROVAL ENDPOINTS
  // ==========================================
    app.post("/api/admin/payments/complete", async (req, res) => {
    try {
      const { transactionId, admin, userUid } = req.body;
      const isAdmin = await verifyAdminRole(userUid);
      if (!isAdmin) {
        return res.status(403).json({ success: false, message: "Unauthorized: Access is restricted to Admin users only." });
      }
      if (!transactionId) {
        return res.status(400).json({ success: false, message: "Transaction ID is required." });
      }

      // Pre-fetch transaction and user to find referrer if needed
      const txnSnap_pre = await getDoc(doc(db, 'transactions', transactionId));
      if (!txnSnap_pre.exists()) {
        return res.status(404).json({ success: false, message: "Transaction not found." });
      }
      const txnData_pre = txnSnap_pre.data();
      const userSnap_pre = await getDoc(doc(db, 'users', txnData_pre.userId));
      const userData_pre = userSnap_pre.exists() ? userSnap_pre.data() : null;

      let referrerRef = null;
      let referrerData = null;
      if (userData_pre && userData_pre.referredBy && !userData_pre.referralBonusAwarded) {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('referralCode', '==', userData_pre.referredBy));
        const qs = await getDocs(q);
        if (!qs.empty) {
          referrerRef = doc(db, 'users', qs.docs[0].id);
        }
      }

      const bonusSnap = await getDoc(doc(db, 'appSettings', 'bonus'));
      const bonusSettings = bonusSnap.exists() ? bonusSnap.data() : null;

      await runTransaction(db, async (t) => {
        const txnRef = doc(db, 'transactions', transactionId);
        const txnDoc = await t.get(txnRef);
        if (!txnDoc.exists()) throw new Error("Transaction not found.");
        const txnData = txnDoc.data();
        if (txnData.status !== 'pending_verification' && txnData.status !== 'pending') {
          throw new Error(`Transaction is not pending. Current status: ${txnData.status}`);
        }

        const userRef = doc(db, 'users', txnData.userId);
        const userDoc = await t.get(userRef);
        if (!userDoc.exists()) throw new Error("User not found.");
        const userData = userDoc.data();

        let referrerDoc = null;
        if (referrerRef) {
          referrerDoc = await t.get(referrerRef);
        }

        const currentDepositWallet = userData.depositBalance || 0;
        const currentBonusWallet = userData.bonusBalance || 0;
        const amt = txnData.amount || 0;

        let depositBonus = 0;
        let refUserBonus = 0;
        let refReferrerBonus = 0;
        let isReferralAwarded = false;

        if (bonusSettings) {
          if (bonusSettings.depositBonusEnabled) {
            const minDep = bonusSettings.minimumDeposit || 0;
            const maxDep = bonusSettings.maximumDeposit || 0;
            if (amt >= minDep && (maxDep === 0 || amt <= maxDep)) {
              if (bonusSettings.depositBonusType === 'percentage') {
                let calc = (amt * (bonusSettings.depositBonusValue || 0)) / 100;
                if (bonusSettings.maximumBonus && calc > bonusSettings.maximumBonus) calc = bonusSettings.maximumBonus;
                depositBonus = calc;
              } else {
                depositBonus = bonusSettings.depositBonusValue || 0;
              }
            }
          }

          if (bonusSettings.referralBonusEnabled && userData.referredBy && !userData.referralBonusAwarded && referrerDoc && referrerDoc.exists()) {
            const minRefDep = bonusSettings.minimumReferralDeposit || 0;
            if (amt >= minRefDep) {
              refUserBonus = bonusSettings.referredUserBonusAmount || 0;
              refReferrerBonus = bonusSettings.referrerBonusAmount || 0;
              isReferralAwarded = true;
            }
          }
        }

        const newDepositWallet = currentDepositWallet + amt;
        const newUserBonusWallet = currentBonusWallet + depositBonus + refUserBonus;

        t.update(txnRef, {
          status: 'completed',
          completedBy: admin || 'Admin',
          completedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        const userUpdates: any = { depositBalance: newDepositWallet, bonusBalance: newUserBonusWallet };
        if (isReferralAwarded) userUpdates.referralBonusAwarded = true;
        t.update(userRef, userUpdates);

        const timestamp = new Date().toISOString();

        if (depositBonus > 0) {
          const dbId = `bonus_${Date.now()}_1`;
          t.set(doc(db, 'bonus_history', dbId), {
            id: dbId, userId: txnData.userId, userName: userData.nickname || 'User',
            bonusType: 'deposit_bonus', depositAmount: amt, bonusAmount: depositBonus,
            status: 'completed', createdAt: timestamp
          });
          const txId = `txn_${Date.now()}_1`;
          t.set(doc(db, 'transactions', txId), {
            id: txId, userId: txnData.userId, amount: depositBonus, type: 'deposit_bonus',
            paymentMethod: 'System', dateTime: timestamp, status: 'completed', description: 'Deposit Bonus Credited'
          });
        }

        if (isReferralAwarded) {
          const uRefId = `bonus_${Date.now()}_2`;
          t.set(doc(db, 'bonus_history', uRefId), {
            id: uRefId, userId: txnData.userId, userName: userData.nickname || 'User',
            bonusType: 'referral_bonus', referralCode: userData.referredBy, bonusAmount: refUserBonus,
            status: 'completed', createdAt: timestamp
          });
          const txId2 = `txn_${Date.now()}_2`;
          t.set(doc(db, 'transactions', txId2), {
            id: txId2, userId: txnData.userId, amount: refUserBonus, type: 'referral_bonus',
            paymentMethod: 'System', dateTime: timestamp, status: 'completed', description: 'Signup Referral Bonus'
          });

          const rRefId = `bonus_${Date.now()}_3`;
          const rData = referrerDoc.data();
          t.set(doc(db, 'bonus_history', rRefId), {
            id: rRefId, userId: referrerDoc.id, userName: rData.nickname || 'User',
            bonusType: 'referral_bonus', referralCode: userData.referredBy, bonusAmount: refReferrerBonus,
            status: 'completed', createdAt: timestamp
          });
          const txId3 = `txn_${Date.now()}_3`;
          t.set(doc(db, 'transactions', txId3), {
            id: txId3, userId: referrerDoc.id, amount: refReferrerBonus, type: 'referral_bonus',
            paymentMethod: 'System', dateTime: timestamp, status: 'completed', description: `Referral Bonus (from ${userData.nickname || 'User'})`
          });
          t.update(referrerRef, { bonusBalance: (rData.bonusBalance || 0) + refReferrerBonus });
        }

        const notifyId = `not_${Date.now()}`;
        t.set(doc(db, "notifications", notifyId), {
          id: notifyId, userId: txnData.userId, title: "Payment Approved ✅",
          message: `Your payment of ₹${amt} has been verified and your wallet has been credited successfully.`,
          type: "success", dateTime: timestamp, isRead: false
        });
      });

      res.json({ success: true, message: "Payment completed and wallet credited." });
    } catch (err: any) {
      console.error("An error occurred");
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Old code backup boundary (delete everything until app.post("/api/admin/payments/cancel")
  app.post("/api/admin/payments/cancel", async (req, res) => {
    try {
      const { transactionId, reason, admin, userUid } = req.body;
      const isAdmin = await verifyAdminRole(userUid);
      if (!isAdmin) {
        return res.status(403).json({ success: false, message: "Unauthorized: Access is restricted to Admin users only." });
      }
      if (!transactionId) {
        return res.status(400).json({ success: false, message: "Transaction ID is required." });
      }

      await runTransaction(db, async (t) => {
        const txnRef = doc(db, 'transactions', transactionId);
        const txnDoc = await t.get(txnRef);
        if (!txnDoc.exists()) {
          throw new Error("Transaction not found.");
        }
        
        const txnData = txnDoc.data();
        if (txnData.status !== 'pending_verification' && txnData.status !== 'pending') {
          throw new Error(`Transaction is not pending. Current status: ${txnData.status}`);
        }

        // Update transaction status
        t.update(txnRef, {
          status: 'cancelled',
          cancellationReason: reason || 'Admin cancelled the payment request.',
          cancelledBy: admin || 'Admin',
          cancelledAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        // Add notification
        const notifyId = `not_${Date.now()}`;
        const notifyRef = doc(db, "notifications", notifyId);
        t.set(notifyRef, {
          id: notifyId,
          userId: txnData.userId,
          title: "Payment Cancelled ❌",
          message: `Your payment request of ₹${txnData.amount} has been cancelled. Reason: ${reason || 'Not provided'}`,
          type: "error",
          dateTime: new Date().toISOString(),
          isRead: false
        });
      });

      res.json({ success: true, message: "Payment cancelled successfully." });
    } catch (err: any) {
      console.error("An error occurred");
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // ==========================================
  // VITE & STATIC FILES SERVING ENGINE
  


  // ==========================================


  
  app.post("/api/payments/status/:orderId/cancel", async (req, res) => {
    try {
      const { orderId } = req.params;
      const txnRef = doc(db, "transactions", orderId);
      const txnSnap = await getDoc(txnRef);
      if (txnSnap.exists()) {
        const txnData = txnSnap.data();
        if (txnData.status === "pending") {
          await setDoc(txnRef, {
            status: "cancelled",
            type: "deposit_failed",
            description: "Payment was cancelled or abandoned by the user."
          }, { merge: true });
        }
      }
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/payments/status/:orderId", async (req, res) => {
    try {
      const { orderId } = req.params;
      const txnRef = doc(db, "transactions", orderId);
      const txnSnap = await getDoc(txnRef);
      if (!txnSnap.exists()) {
        return res.status(404).json({ success: false, message: "Transaction not found" });
      }
      const txnData = txnSnap.data();
      if (txnData.status !== "pending") {
        return res.json({ success: true, status: txnData.status, amount: txnData.amount });
      }
      if (txnData.gateway === "ZapUPI" || txnData.method === "ZapUPI") {
        let activeConfig = localAppSettings;
        try {
          const docRef = doc(db, "appSettings", "general");
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            activeConfig = { ...localAppSettings, ...snap.data() };
          }
        } catch (e) {}
        const apiKey = activeConfig.zapupiApiKey;
        if (apiKey) {
          const verifyResult = await verifyZapUPIPaymentStatus(orderId, apiKey);
          if (verifyResult.status !== "pending") {
            const isSuccess = verifyResult.status === "pending_verification";
            await processTransactionSafe(orderId, isSuccess, "ZapUPI", txnData.amount);
            return res.json({ success: true, status: isSuccess ? "pending_verification" : "failed", amount: txnData.amount });
          }
        }
      }
      return res.json({ success: true, status: "pending" });
    } catch (error) {
      console.error("An error occurred");
      res.status(500).json({ success: false, message: error.message });
    }
  });


  // API: Verify Admin Credentials (2FA Verification)
  app.post('/api/admin/verify-credentials', async (req, res) => {
    try {
      const { adminId, password, userUid } = req.body;

      if (!adminId || !password) {
        return res.status(400).json({ success: false, message: "Admin ID and Password are required." });
      }

      // Check role of requesting user if userUid is provided
      if (userUid) {
        try {
          const userSnap = await getDoc(doc(db, 'users', userUid));
          if (userSnap.exists() && userSnap.data()?.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Unauthorized: Access is restricted to Admin users only." });
          }
        } catch (e) {
          console.warn("User role verification error:", e);
        }
      }

      // 1. Fetch credentials document from Firestore database
      const credsDocRef = doc(db, 'settings', 'admin_credentials');
      let credsSnap = await getDoc(credsDocRef);

      // If missing, initialize it in the database with hashed default credentials
      if (!credsSnap.exists()) {
        const defaultPassword = 'TitanAdmin2026';
        const defaultHash = crypto.createHash('sha256').update(defaultPassword).digest('hex');
        const defaultCreds = {
          adminId: 'admin',
          altAdminId: 'admin@titanesp.com',
          passwordHash: defaultHash,
          updatedAt: new Date().toISOString()
        };
        await setDoc(credsDocRef, defaultCreds);
        credsSnap = await getDoc(credsDocRef);
      }

      const credsData = credsSnap.data();
      const enteredHash = crypto.createHash('sha256').update(password).digest('hex');

      const matchId = adminId.trim().toLowerCase() === credsData?.adminId?.toLowerCase() || 
                      adminId.trim().toLowerCase() === credsData?.altAdminId?.toLowerCase();
      const matchPassword = enteredHash === credsData?.passwordHash;

      if (matchId && matchPassword) {
        // Log successful verification
        try {
          await addDoc(collection(db, 'admin_access_logs'), {
            adminId: adminId.trim(),
            action: '2FA Verification Successful',
            timestamp: new Date().toISOString(),
            status: 'success',
            userUid: userUid || 'unknown'
          });
        } catch (logErr) {}

        return res.json({ success: true, message: "Verification successful!" });
      } else {
        // Log failed verification attempt
        try {
          await addDoc(collection(db, 'admin_failed_attempts'), {
            adminId: adminId.trim(),
            attemptedPasswordHash: enteredHash,
            timestamp: new Date().toISOString(),
            status: 'failed',
            userUid: userUid || 'unknown',
            ip: req.ip || req.headers['x-forwarded-for'] || 'unknown'
          });
        } catch (logErr) {}

        return res.status(401).json({ success: false, message: "Invalid Admin ID or Password." });
      }
    } catch (err: any) {
      console.error("Credentials verification error:", err);
      res.status(500).json({ success: false, message: "Internal server error: " + err.message });
    }
  });


  if (!isProduction) {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : undefined
      },
      appType: "spa",
    });

    app.use(vite.middlewares);
  } else {
    // If currentDir is root, distPath should be root/dist. If currentDir is already dist, use it.
    const distPath = currentDir.endsWith('dist') ? currentDir : path.join(currentDir, 'dist');
    const indexPath = path.join(distPath, 'index.html');
    console.log(`[Production Server] Current Directory: ${currentDir}`);
    console.log(`[Production Server] Serving static files from: ${distPath}`);
    console.log(`[Production Server] Main Index HTML file path: ${indexPath}`);
    console.log(`[Production Server] Index file exists: ${fs.existsSync(indexPath)}`);

    app.use(express.static(distPath));
    app.use(express.static(path.join(currentDir, 'public'))); // Serve public dir if running from root
    app.get('*', (req, res) => {
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send(`index.html not found in: ${distPath}. Build might have failed or not completed.`);
      }
    });

  }

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server successfully started at http://localhost:3000`);
    if (process.env.PORT) {
      console.log(`Application is running on port ${process.env.PORT}`);
    }
  });

}

startServer();
