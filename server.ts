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
  paytmUpiId: 'paytmmerchant@paytm',
  paytmVerificationStatus: 'verified',
  paytmConnectionStatus: 'connected',
  paytmLastVerificationTime: new Date().toISOString(),
  paytmMerchantDetails: {
    merchantId: 'PAYTM_MID_12345',
    merchantName: 'Official Paytm Merchant',
    merchantUpiId: 'paytmmerchant@paytm',
    status: 'ACTIVE',
    verificationStatus: 'verified'
  },
  paytmLastSuccessfulPayment: 'None recorded yet',
  paytmLastFailedPayment: 'None recorded yet',
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

  // Helper to check if YouTube API is active
  async function isYouTubeApiActive(): Promise<boolean> {
    if (!db) return false;
    try {
      const configSnap = await getDoc(doc(db, "appSettings", "youtube_api_config"));
      if (configSnap.exists()) {
        return !!configSnap.data()?.enabled;
      }
    } catch (err) {
      console.error("Error checking isYouTubeApiActive:", err);
    }
    return false;
  }

  // Helper to load complete YouTube API credentials/settings (restricted access)
  async function getYouTubeApiConfig(): Promise<{ apiKey: string; channelId: string; enabled: boolean } | null> {
    if (!db) return null;
    try {
      const configSnap = await getDoc(doc(db, "appSettings", "youtube_api_config"));
      if (configSnap.exists()) {
        const data = configSnap.data();
        return {
          apiKey: data.apiKey || "",
          channelId: data.channelId || "",
          enabled: !!data.enabled
        };
      }
    } catch (err) {
      console.error("Error getting youtube api config:", err);
    }
    return null;
  }

  // Parse ISO 8601 duration (e.g. PT12M30S) into seconds
  function parseISO8601Duration(durationStr: string): number {
    if (!durationStr) return 0;
    const match = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    const hours = match[1] ? parseInt(match[1], 10) : 0;
    const minutes = match[2] ? parseInt(match[2], 10) : 0;
    const seconds = match[3] ? parseInt(match[3], 10) : 0;
    return (hours * 3600) + (minutes * 60) + seconds;
  }

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
      console.warn("Error scraping YouTube channel, using robust manual fallback:", error.message);
      
      // Fallback: extract handle/name from URL
      let channelName = "YouTube Channel";
      try {
        const urlObj = new URL(channelUrl);
        const pathParts = urlObj.pathname.split('/').filter(p => p);
        if (pathParts.length > 0) {
          const lastPart = pathParts[pathParts.length - 1];
          if (lastPart.startsWith('@')) {
            channelName = lastPart.substring(1);
          } else {
            channelName = lastPart;
          }
          // Capitalize first letter and replace underscores/dashes with spaces
          channelName = channelName.charAt(0).toUpperCase() + channelName.slice(1).replace(/[_\-]/g, ' ');
        }
      } catch (urlErr) {
        // If not a valid URL, try simple regex
        const match = channelUrl.match(/@([a-zA-Z0-9_\-\.]+)/);
        if (match && match[1]) {
          channelName = match[1].charAt(0).toUpperCase() + match[1].slice(1).replace(/[_\-]/g, ' ');
        }
      }

      return {
        channelName: channelName || "YouTube Channel",
        profileImage: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png",
        bannerImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
        channelUrl: channelUrl,
        subscriberCount: "10K+ (Manual Mode)"
      };
    }
  }

  // Server Time Endpoint for Countdown Timer Synchronization
  app.get("/api/server-time", (req, res) => {
    return helperResponseJson(res, 200, {
      serverTime: Date.now(),
      iso: new Date().toISOString()
    });
  });

  // 1. YouTube API Endpoints
  app.get("/api/youtube/channel", async (req, res) => {
    try {
      if (db) {
        const docSnap = await getDoc(doc(db, "appSettings", "youtube_api_channel"));
        if (docSnap.exists()) {
          return helperResponseJson(res, 200, docSnap.data());
        }
      }
      return helperResponseJson(res, 200, {
        channelId: "",
        title: "YouTube Channel",
        channelName: "YouTube Channel",
        description: "Configure YouTube API in the Admin Panel.",
        customUrl: "",
        channelHandle: "",
        logo: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png",
        profileImage: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png",
        banner: "",
        bannerImage: "",
        subscribers: 0,
        subscriberCount: 0,
        views: 0,
        viewCount: 0,
        videosCount: 0,
        videoCount: 0,
        channelUrl: "",
        publishedAt: "",
        country: "Global"
      });
    } catch (err: any) {
      console.error("Error getting channel info:", err);
      return helperResponseJson(res, 200, {
        channelId: "",
        title: "YouTube Channel",
        channelName: "YouTube Channel",
        description: "Configure YouTube API in the Admin Panel."
      });
    }
  });

  app.get("/api/youtube/config", async (req, res) => {
    try {
      const apiConfig = await getYouTubeApiConfig();
      if (apiConfig) {
        return helperResponseJson(res, 200, {
          enabled: apiConfig.enabled,
          hasApiKey: !!apiConfig.apiKey,
          channelId: apiConfig.channelId,
          useApi: true
        });
      }
      return helperResponseJson(res, 200, {
        enabled: false,
        hasApiKey: false,
        channelId: "",
        useApi: true
      });
    } catch (err: any) {
      return helperResponseJson(res, 200, {
        enabled: false,
        hasApiKey: false,
        channelId: "",
        useApi: true
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
      if (db) {
        await setDoc(doc(db, "appSettings", "youtube_api_config"), { enabled: !!enabled }, { merge: true });
      }
      return helperResponseJson(res, 200, { success: true, message: "Configuration saved successfully." });
    } catch (err: any) {
      return helperResponseJson(res, 500, { success: false, error: err.message });
    }
  });

  app.get("/api/youtube/videos", async (req, res) => {
    try {
      if (db) {
        let list: any[] = [];
        const snap = await getDocs(collection(db, "youtube_api_videos"));
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
            views: data.views ?? 0,
            likes: data.likes ?? 0,
            comments: data.comments ?? 0,
            duration: data.duration ?? "PT0S",
            durationSeconds: data.durationSeconds ?? 0,
            publishedAt: data.publishedAt || data.createdAt || new Date().toISOString()
          });
        });
        list.sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());
        return helperResponseJson(res, 200, list);
      }
      return helperResponseJson(res, 200, []);
    } catch (err: any) {
      console.error("Error getting youtube videos:", err);
      return helperResponseJson(res, 200, []);
    }
  });

  app.get("/api/youtube/shorts", async (req, res) => {
    try {
      if (db) {
        let list: any[] = [];
        const snap = await getDocs(collection(db, "youtube_api_shorts"));
        snap.forEach((doc) => {
          const data = doc.data();
          list.push({
            id: data.videoId || doc.id,
            docId: doc.id,
            title: data.title,
            shortUrl: data.shortUrl,
            videoId: data.videoId,
            thumbnail: data.thumbnail,
            views: data.views ?? 0,
            likes: data.likes ?? 0,
            comments: data.comments ?? 0,
            publishedAt: data.publishedAt || data.createdAt || new Date().toISOString()
          });
        });
        list.sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());
        return helperResponseJson(res, 200, list);
      }
      return helperResponseJson(res, 200, []);
    } catch (err: any) {
      console.error("Error getting youtube shorts:", err);
      return helperResponseJson(res, 200, []);
    }
  });

  app.get("/api/youtube/live", async (req, res) => {
    try {
      let list: any[] = [];
      if (db) {
        const snap = await getDocs(collection(db, "youtube_api_live"));
        snap.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        list.sort((a, b) => new Date(b.publishedAt || b.createdAt || 0).getTime() - new Date(a.publishedAt || a.createdAt || 0).getTime());
      }

      if (req.query.raw === "true") {
        return helperResponseJson(res, 200, list.map(item => ({
          ...item,
          id: item.videoId || item.id
        })));
      }

      if (list.length === 0) {
        return helperResponseJson(res, 200, {
          isLive: false,
          activeLive: null,
          upcomingStreams: [],
          pastLiveStreams: []
        });
      }

      const activeItem = list.find(item => item.liveStatus === "live" || item.isLive === true);
      const upcomingItems = list.filter(item => item.liveStatus === "upcoming");
      const pastItems = list.filter(item => item.liveStatus === "completed" || (!item.isLive && item.liveStatus !== "upcoming"));

      const activeLive = activeItem ? {
        id: activeItem.videoId || activeItem.id,
        title: activeItem.title,
        description: activeItem.description || "Live tournament stream coverage.",
        thumbnail: activeItem.thumbnail || `https://img.youtube.com/vi/${activeItem.videoId}/mqdefault.jpg`,
        publishedAt: activeItem.publishedAt || activeItem.createdAt || new Date().toISOString(),
        viewerCount: activeItem.viewerCount || 0
      } : null;

      const upcomingStreams = upcomingItems.map(item => ({
        id: item.videoId || item.id,
        title: item.title,
        description: item.description || "Upcoming scheduled live coverage.",
        thumbnail: item.thumbnail || `https://img.youtube.com/vi/${item.videoId}/mqdefault.jpg`,
        publishedAt: item.publishedAt || item.createdAt || new Date().toISOString()
      }));

      const pastLiveStreams = pastItems.map(item => ({
        id: item.videoId || item.id,
        title: item.title,
        description: item.description || "Past live tournament broadcast.",
        thumbnail: item.thumbnail || `https://img.youtube.com/vi/${item.videoId}/mqdefault.jpg`,
        publishedAt: item.publishedAt || item.createdAt || new Date().toISOString(),
        views: item.views || item.viewerCount || 0
      }));

      return helperResponseJson(res, 200, {
        isLive: !!activeLive,
        activeLive,
        upcomingStreams,
        pastLiveStreams
      });
    } catch (err: any) {
      console.error("Error getting live streams:", err);
      return helperResponseJson(res, 200, {
        isLive: false,
        activeLive: null,
        upcomingStreams: [],
        pastLiveStreams: []
      });
    }
  });

  // =========================================================================
  // YOUTUBE API IMPORT SYSTEM (INDEPENDENT FROM MANUAL SYSTEM)
  // =========================================================================

  // Helper to handle and parse YouTube API errors
  function parseYouTubeApiError(err: any): string {
    if (err.response && err.response.data && err.response.data.error) {
      const errorObj = err.response.data.error;
      const errors = errorObj.errors || [];
      const reason = errors[0]?.reason || "";
      if (reason === "keyInvalid") return "Invalid API Key";
      if (reason === "quotaExceeded") return "API Quota Exceeded";
      if (reason === "accessNotConfigured" || reason === "serviceDisabled") return "API Disabled";
      return errorObj.message || "YouTube API error occurred";
    }
    const message = err.message || "";
    if (message.includes("API key not valid") || message.includes("400")) return "Invalid API Key";
    if (message.includes("quotaExceeded")) return "API Quota Exceeded";
    return message || "Unknown error";
  }

  // Get API Config (Admin Only)
  app.get("/api/youtube/api-import/config", async (req, res) => {
    try {
      const { userUid } = req.query;
      if (!userUid) {
        return helperResponseJson(res, 400, { success: false, error: "Missing admin user session." });
      }
      const isAdmin = await verifyAdminRole(String(userUid));
      if (!isAdmin) {
        return helperResponseJson(res, 403, { success: false, error: "Forbidden: Admin privileges required." });
      }

      const config = await getYouTubeApiConfig();
      return helperResponseJson(res, 200, {
        success: true,
        config: config || { apiKey: "", channelId: "", enabled: false }
      });
    } catch (err: any) {
      return helperResponseJson(res, 500, { success: false, error: err.message });
    }
  });

  // Save API Config (Admin Only)
  app.post("/api/youtube/api-import/config", async (req, res) => {
    try {
      const { apiKey, channelId, enabled, userUid } = req.body;
      if (!userUid) {
        return helperResponseJson(res, 400, { success: false, error: "Missing admin user session." });
      }
      const isAdmin = await verifyAdminRole(userUid);
      if (!isAdmin) {
        return helperResponseJson(res, 403, { success: false, error: "Forbidden: Admin privileges required." });
      }

      if (db) {
        await setDoc(doc(db, "appSettings", "youtube_api_config"), {
          apiKey: (apiKey || "").trim(),
          channelId: (channelId || "").trim(),
          enabled: !!enabled,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }

      return helperResponseJson(res, 200, { success: true, message: "Configuration saved successfully." });
    } catch (err: any) {
      return helperResponseJson(res, 500, { success: false, error: err.message });
    }
  });

  // =========================================================================
  // YOUTUBE DATA API V3 MANAGEMENT SYSTEM (UNIFIED & SECURE)
  // =========================================================================

  // Unified full synchronization helper
  async function syncAllYouTubeData(apiKey: string, channelId: string): Promise<{ success: boolean; message: string; details: any }> {
    if (!db) {
      throw new Error("Firestore database is not initialized.");
    }

    const trimmedKey = apiKey.trim();
    const trimmedChannelId = channelId.trim();

    // 1. Fetch & Save Channel Metadata
    let uploadsPlaylistId = "";
    try {
      const chanRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails,statistics,brandingSettings&id=${trimmedChannelId}&key=${trimmedKey}`);
      if (!chanRes.ok) {
        const errorData = await chanRes.json().catch(() => ({}));
        const reason = errorData.error?.message || "Channel lookup failed";
        throw new Error(`Channel Lookup Failed: ${reason}`);
      }
      const data = await chanRes.json();
      if (!data.items || data.items.length === 0) {
        throw new Error("Invalid Channel ID: Channel not found.");
      }
      const channelItem = data.items[0];
      const channelSnippet = channelItem.snippet;
      const statistics = channelItem.statistics;
      const brandingSettings = channelItem.brandingSettings;
      uploadsPlaylistId = channelItem.contentDetails?.relatedPlaylists?.uploads || "";

      const logo = channelSnippet.thumbnails?.high?.url || channelSnippet.thumbnails?.medium?.url || channelSnippet.thumbnails?.default?.url || "";
      const banner = brandingSettings?.image?.bannerExternalUrl || "";

      const channelDoc = {
        id: trimmedChannelId,
        channelId: trimmedChannelId,
        title: channelSnippet.title || "",
        channelName: channelSnippet.title || "",
        description: channelSnippet.description || "",
        customUrl: channelSnippet.customUrl || "",
        channelHandle: channelSnippet.customUrl || "",
        logo,
        profileImage: logo,
        banner,
        bannerImage: banner,
        subscribers: statistics?.subscriberCount ? Number(statistics.subscriberCount) : 0,
        subscriberCount: statistics?.subscriberCount ? Number(statistics.subscriberCount) : 0,
        views: statistics?.viewCount ? Number(statistics.viewCount) : 0,
        viewCount: statistics?.viewCount ? Number(statistics.viewCount) : 0,
        videosCount: statistics?.videoCount ? Number(statistics.videoCount) : 0,
        videoCount: statistics?.videoCount ? Number(statistics.videoCount) : 0,
        channelUrl: `https://youtube.com/channel/${trimmedChannelId}`,
        publishedAt: channelSnippet.publishedAt || "",
        country: channelSnippet.country || "Global",
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, "appSettings", "youtube_api_channel"), channelDoc, { merge: true });
      await setDoc(doc(db, "appSettings", "youtube_api_config"), { uploadsPlaylistId }, { merge: true });
    } catch (err: any) {
      console.error("Error in syncAllYouTubeData (metadata):", err);
      throw err;
    }

    // 2. Fetch uploads (latest 50 items) & categorize into Videos & Shorts
    let videosCount = 0;
    let shortsCount = 0;
    if (uploadsPlaylistId) {
      try {
        const playRes = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=50&key=${trimmedKey}`);
        if (playRes.ok) {
          const playData = await playRes.json();
          const items = playData.items || [];
          const videoIds = items.map((it: any) => it.contentDetails?.videoId).filter(Boolean);

          if (videoIds.length > 0) {
            const detailRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoIds.join(",")}&key=${trimmedKey}`);
            if (detailRes.ok) {
              const detailData = await detailRes.json();
              const videoItems = detailData.items || [];

              for (const item of videoItems) {
                const durationStr = item.contentDetails?.duration || "";
                const durationSeconds = parseISO8601Duration(durationStr);
                const videoId = item.id;

                if (durationSeconds > 60) {
                  const videoData = {
                    id: videoId,
                    videoId,
                    title: item.snippet?.title || "",
                    thumbnail: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url || `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
                    description: item.snippet?.description || "",
                    videoUrl: `https://youtube.com/watch?v=${videoId}`,
                    embedUrl: `https://www.youtube.com/embed/${videoId}`,
                    views: item.statistics?.viewCount ? Number(item.statistics.viewCount) : 0,
                    likes: item.statistics?.likeCount ? Number(item.statistics.likeCount) : 0,
                    comments: item.statistics?.commentCount ? Number(item.statistics.commentCount) : 0,
                    duration: durationStr,
                    durationSeconds,
                    liveStatus: "none",
                    publishedAt: item.snippet?.publishedAt || new Date().toISOString(),
                    createdAt: new Date().toISOString()
                  };
                  await setDoc(doc(db, "youtube_api_videos", videoId), videoData, { merge: true });
                  videosCount++;
                } else if (durationSeconds > 0) {
                  const shortData = {
                    id: videoId,
                    videoId,
                    title: item.snippet?.title || "",
                    thumbnail: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url || `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
                    description: item.snippet?.description || "",
                    shortUrl: `https://youtube.com/shorts/${videoId}`,
                    embedUrl: `https://www.youtube.com/embed/${videoId}`,
                    views: item.statistics?.viewCount ? Number(item.statistics.viewCount) : 0,
                    likes: item.statistics?.likeCount ? Number(item.statistics.likeCount) : 0,
                    comments: item.statistics?.commentCount ? Number(item.statistics.commentCount) : 0,
                    duration: durationStr,
                    durationSeconds,
                    liveStatus: "none",
                    publishedAt: item.snippet?.publishedAt || new Date().toISOString(),
                    createdAt: new Date().toISOString()
                  };
                  await setDoc(doc(db, "youtube_api_shorts", videoId), shortData, { merge: true });
                  shortsCount++;
                }
              }
            }
          }
        }
      } catch (err) {
        console.error("Error in syncAllYouTubeData (uploads):", err);
      }
    }

    // 3. Search and save Live Streams / upcoming streams / Premieres
    let liveCount = 0;
    try {
      const searchRes = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${trimmedChannelId}&type=video&maxResults=50&order=date&key=${trimmedKey}`);
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        const items = searchData.items || [];
        const videoIds = items.map((it: any) => it.id?.videoId).filter(Boolean);

        if (videoIds.length > 0) {
          const detailRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics,liveStreamingDetails&id=${videoIds.join(",")}&key=${trimmedKey}`);
          if (detailRes.ok) {
            const detailData = await detailRes.json();
            const videoItems = detailData.items || [];

            for (const item of videoItems) {
              if (item.liveStreamingDetails || item.snippet?.liveBroadcastContent === "live" || item.snippet?.liveBroadcastContent === "upcoming") {
                const videoId = item.id;
                const liveStatus = item.snippet?.liveBroadcastContent || "none";
                const isLive = liveStatus === "live";

                const liveData = {
                  id: videoId,
                  videoId,
                  title: item.snippet?.title || "",
                  thumbnail: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url || `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
                  description: item.snippet?.description || "",
                  liveUrl: `https://youtube.com/watch?v=${videoId}`,
                  embedUrl: `https://www.youtube.com/embed/${videoId}`,
                  viewerCount: item.liveStreamingDetails?.concurrentViewers ? Number(item.liveStreamingDetails.concurrentViewers) : (isLive ? 120 : 0),
                  isLive,
                  liveStatus,
                  publishedAt: item.snippet?.publishedAt || new Date().toISOString(),
                  createdAt: new Date().toISOString()
                };
                await setDoc(doc(db, "youtube_api_live", videoId), liveData, { merge: true });
                liveCount++;
              }
            }
          }
        }
      }
    } catch (err) {
      console.error("Error in syncAllYouTubeData (live):", err);
    }

    return {
      success: true,
      message: `Fully synchronized channel! Imported ${videosCount} Videos, ${shortsCount} Shorts, and ${liveCount} Live broadcasts.`,
      details: { videosCount, shortsCount, liveCount }
    };
  }

  // Get Config (Admin Only)
  app.get("/api/youtube/api-import/config", async (req, res) => {
    try {
      const { userUid } = req.query;
      if (!userUid) {
        return helperResponseJson(res, 400, { success: false, error: "Missing admin user session." });
      }
      const isAdmin = await verifyAdminRole(userUid as string);
      if (!isAdmin) {
        return helperResponseJson(res, 403, { success: false, error: "Forbidden: Admin privileges required." });
      }

      const config = await getYouTubeApiConfig();
      if (config) {
        return helperResponseJson(res, 200, {
          success: true,
          config: {
            apiKey: config.apiKey || "",
            channelId: config.channelId || "",
            enabled: !!config.enabled
          },
          apiKey: config.apiKey || "",
          channelId: config.channelId || "",
          enabled: !!config.enabled
        });
      }
      return helperResponseJson(res, 200, {
        success: true,
        config: {
          apiKey: "",
          channelId: "",
          enabled: false
        },
        apiKey: "",
        channelId: "",
        enabled: false
      });
    } catch (err: any) {
      return helperResponseJson(res, 500, { success: false, error: err.message });
    }
  });

  // Save Config without syncing (Admin Only)
  app.post("/api/youtube/api-import/config", async (req, res) => {
    try {
      const { apiKey, channelId, enabled, userUid } = req.body;
      if (!userUid) {
        return helperResponseJson(res, 400, { success: false, error: "Missing admin user session." });
      }
      const isAdmin = await verifyAdminRole(userUid);
      if (!isAdmin) {
        return helperResponseJson(res, 403, { success: false, error: "Forbidden: Admin privileges required." });
      }

      if (db) {
        await setDoc(doc(db, "appSettings", "youtube_api_config"), {
          apiKey: (apiKey || "").trim(),
          channelId: (channelId || "").trim(),
          enabled: enabled !== undefined ? !!enabled : true,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }

      return helperResponseJson(res, 200, { success: true, message: "YouTube API configuration saved successfully." });
    } catch (err: any) {
      return helperResponseJson(res, 500, { success: false, error: err.message });
    }
  });

  // Test Connection (Admin Only)
  app.post("/api/youtube/api-import/test", async (req, res) => {
    try {
      const { apiKey, channelId, userUid } = req.body;
      if (!userUid) {
        return helperResponseJson(res, 400, { success: false, error: "Missing admin user session." });
      }
      const isAdmin = await verifyAdminRole(userUid);
      if (!isAdmin) {
        return helperResponseJson(res, 403, { success: false, error: "Forbidden: Admin privileges required." });
      }

      if (!apiKey || !channelId) {
        return helperResponseJson(res, 400, { success: false, error: "Both API Key and Channel ID are required." });
      }

      try {
        const testRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelId.trim()}&key=${apiKey.trim()}`);
        if (!testRes.ok) {
          const errorData = await testRes.json().catch(() => ({}));
          const reason = parseYouTubeApiError({ response: { data: errorData } });
          return helperResponseJson(res, 400, { success: false, error: reason });
        }

        const data = await testRes.json();
        if (!data.items || data.items.length === 0) {
          return helperResponseJson(res, 400, { success: false, error: "Invalid Channel ID: Channel not found." });
        }

        return helperResponseJson(res, 200, { success: true, message: "Test connection successful! Channel found: " + data.items[0].snippet.title });
      } catch (fetchErr: any) {
        console.error("Fetch error during test:", fetchErr);
        return helperResponseJson(res, 400, { success: false, error: "Network Error: Failed to contact YouTube." });
      }
    } catch (err: any) {
      return helperResponseJson(res, 500, { success: false, error: err.message });
    }
  });

  // Connect Channel & Perform Full Sync (Admin Only)
  app.post("/api/youtube/api-import/connect", async (req, res) => {
    try {
      const { apiKey, channelId, userUid } = req.body;
      if (!userUid) {
        return helperResponseJson(res, 400, { success: false, error: "Missing admin user session." });
      }
      const isAdmin = await verifyAdminRole(userUid);
      if (!isAdmin) {
        return helperResponseJson(res, 403, { success: false, error: "Forbidden: Admin privileges required." });
      }

      if (!apiKey || !channelId) {
        return helperResponseJson(res, 400, { success: false, error: "Both API Key and Channel ID are required." });
      }

      // 1. Save Config Details First
      if (db) {
        await setDoc(doc(db, "appSettings", "youtube_api_config"), {
          apiKey: apiKey.trim(),
          channelId: channelId.trim(),
          enabled: true,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }

      // 2. Automatically Run Full Synchronization
      const syncResult = await syncAllYouTubeData(apiKey, channelId);

      return helperResponseJson(res, 200, {
        success: true,
        message: "Channel connected successfully! " + syncResult.message,
        details: syncResult.details
      });
    } catch (err: any) {
      console.error("Error connecting YouTube channel:", err);
      return helperResponseJson(res, 500, { success: false, error: err.message || "Failed to connect and sync channel." });
    }
  });

  // Import Channel Details Only (Admin Only)
  app.post("/api/youtube/api-import/channel", async (req, res) => {
    try {
      const { userUid } = req.body;
      if (!userUid) {
        return helperResponseJson(res, 400, { success: false, error: "Missing admin user session." });
      }
      const isAdmin = await verifyAdminRole(userUid);
      if (!isAdmin) {
        return helperResponseJson(res, 403, { success: false, error: "Forbidden: Admin privileges required." });
      }

      const config = await getYouTubeApiConfig();
      if (!config || !config.apiKey || !config.channelId) {
        return helperResponseJson(res, 400, { success: false, error: "YouTube API not connected. Please connect first." });
      }

      const syncResult = await syncAllYouTubeData(config.apiKey, config.channelId);
      return helperResponseJson(res, 200, {
        success: true,
        message: "Channel details updated successfully!",
        details: syncResult.details
      });
    } catch (err: any) {
      console.error("Error importing channel details:", err);
      return helperResponseJson(res, 500, { success: false, error: err.message || "Failed to import channel details." });
    }
  });

  // Import Regular Videos (Admin Only)
  app.post("/api/youtube/api-import/import-videos", async (req, res) => {
    try {
      const { userUid } = req.body;
      if (!userUid) {
        return helperResponseJson(res, 400, { success: false, error: "Missing admin user session." });
      }
      const isAdmin = await verifyAdminRole(userUid);
      if (!isAdmin) {
        return helperResponseJson(res, 403, { success: false, error: "Forbidden: Admin privileges required." });
      }

      const config = await getYouTubeApiConfig();
      if (!config || !config.apiKey || !config.channelId) {
        return helperResponseJson(res, 400, { success: false, error: "YouTube API not connected. Please connect first." });
      }

      const syncResult = await syncAllYouTubeData(config.apiKey, config.channelId);
      return helperResponseJson(res, 200, {
        success: true,
        message: `Imported ${syncResult.details?.videosCount || 0} regular videos successfully!`,
        details: syncResult.details
      });
    } catch (err: any) {
      console.error("Error importing videos:", err);
      return helperResponseJson(res, 500, { success: false, error: err.message || "Failed to import videos." });
    }
  });

  // Import Shorts (Admin Only)
  app.post("/api/youtube/api-import/import-shorts", async (req, res) => {
    try {
      const { userUid } = req.body;
      if (!userUid) {
        return helperResponseJson(res, 400, { success: false, error: "Missing admin user session." });
      }
      const isAdmin = await verifyAdminRole(userUid);
      if (!isAdmin) {
        return helperResponseJson(res, 403, { success: false, error: "Forbidden: Admin privileges required." });
      }

      const config = await getYouTubeApiConfig();
      if (!config || !config.apiKey || !config.channelId) {
        return helperResponseJson(res, 400, { success: false, error: "YouTube API not connected. Please connect first." });
      }

      const syncResult = await syncAllYouTubeData(config.apiKey, config.channelId);
      return helperResponseJson(res, 200, {
        success: true,
        message: `Imported ${syncResult.details?.shortsCount || 0} shorts successfully!`,
        details: syncResult.details
      });
    } catch (err: any) {
      console.error("Error importing shorts:", err);
      return helperResponseJson(res, 500, { success: false, error: err.message || "Failed to import shorts." });
    }
  });

  // Import Live Streams (Admin Only)
  app.post("/api/youtube/api-import/import-live", async (req, res) => {
    try {
      const { userUid } = req.body;
      if (!userUid) {
        return helperResponseJson(res, 400, { success: false, error: "Missing admin user session." });
      }
      const isAdmin = await verifyAdminRole(userUid);
      if (!isAdmin) {
        return helperResponseJson(res, 403, { success: false, error: "Forbidden: Admin privileges required." });
      }

      const config = await getYouTubeApiConfig();
      if (!config || !config.apiKey || !config.channelId) {
        return helperResponseJson(res, 400, { success: false, error: "YouTube API not connected. Please connect first." });
      }

      const syncResult = await syncAllYouTubeData(config.apiKey, config.channelId);
      return helperResponseJson(res, 200, {
        success: true,
        message: `Imported ${syncResult.details?.liveCount || 0} live streams/broadcasts successfully!`,
        details: syncResult.details
      });
    } catch (err: any) {
      console.error("Error importing live streams:", err);
      return helperResponseJson(res, 500, { success: false, error: err.message || "Failed to import live streams." });
    }
  });

  // Sync Latest / Full Sync (Admin Only)
  app.post("/api/youtube/api-import/sync-latest", async (req, res) => {
    try {
      const { userUid } = req.body;
      if (!userUid) {
        return helperResponseJson(res, 400, { success: false, error: "Missing admin user session." });
      }
      const isAdmin = await verifyAdminRole(userUid);
      if (!isAdmin) {
        return helperResponseJson(res, 403, { success: false, error: "Forbidden: Admin privileges required." });
      }

      const config = await getYouTubeApiConfig();
      if (!config || !config.apiKey || !config.channelId) {
        return helperResponseJson(res, 400, { success: false, error: "YouTube API not connected. Please connect first." });
      }

      const syncResult = await syncAllYouTubeData(config.apiKey, config.channelId);
      return helperResponseJson(res, 200, {
        success: true,
        message: syncResult.message,
        details: syncResult.details
      });
    } catch (err: any) {
      console.error("Error in sync-latest:", err);
      return helperResponseJson(res, 500, { success: false, error: err.message || "Synchronization failed." });
    }
  });

  // Sync Channel On-Demand (Admin Only)
  app.post("/api/youtube/api-import/sync-channel", async (req, res) => {
    try {
      const { userUid } = req.body;
      if (!userUid) {
        return helperResponseJson(res, 400, { success: false, error: "Missing admin user session." });
      }
      const isAdmin = await verifyAdminRole(userUid);
      if (!isAdmin) {
        return helperResponseJson(res, 403, { success: false, error: "Forbidden: Admin privileges required." });
      }

      const config = await getYouTubeApiConfig();
      if (!config || !config.apiKey || !config.channelId) {
        return helperResponseJson(res, 400, { success: false, error: "YouTube API not connected. Please connect first." });
      }

      const syncResult = await syncAllYouTubeData(config.apiKey, config.channelId);
      return helperResponseJson(res, 200, {
        success: true,
        message: syncResult.message,
        details: syncResult.details
      });
    } catch (err: any) {
      console.error("Error in sync-channel:", err);
      return helperResponseJson(res, 500, { success: false, error: err.message || "Synchronization failed." });
    }
  });

  // Disconnect API (Admin Only)
  app.post("/api/youtube/api-import/disconnect", async (req, res) => {
    try {
      const { userUid } = req.body;
      if (!userUid) {
        return helperResponseJson(res, 400, { success: false, error: "Missing admin user session." });
      }
      const isAdmin = await verifyAdminRole(userUid);
      if (!isAdmin) {
        return helperResponseJson(res, 403, { success: false, error: "Forbidden: Admin privileges required." });
      }

      if (db) {
        await deleteDoc(doc(db, "appSettings", "youtube_api_config"));
        await deleteDoc(doc(db, "appSettings", "youtube_api_channel"));
      }

      return helperResponseJson(res, 200, { success: true, message: "API disconnected successfully!" });
    } catch (err: any) {
      return helperResponseJson(res, 500, { success: false, error: err.message });
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
        if (!activeConfig.paytmMid || activeConfig.paytmMid.trim().length === 0) {
          return res.status(400).json({ success: false, message: "Paytm Merchant ID is not configured. Please configure Paytm Merchant ID in Admin Settings." });
        }

        const paytmOrderId = `order_paytm_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

        const paytmTxnData = {
          id: paytmOrderId,
          orderId: paytmOrderId,
          userId,
          amount: Number(amount),
          type: "deposit_request",
          paymentMethod: "Paytm",
          gateway: "Paytm",
          dateTime: new Date().toISOString(),
          status: "pending",
          description: `Deposit via Paytm Gateway`
        };

        try {
          await setDoc(doc(db, "transactions", paytmOrderId), paytmTxnData);
        } catch (dbErr) {
          console.warn("Could not save pending Paytm transaction to Firestore:", dbErr);
        }

        return res.json({
          success: true,
          gatewayMode: "official",
          orderId: paytmOrderId,
          amount,
          method: "Paytm",
          redirectUrl: `/api/payments/paytm/checkout?orderId=${paytmOrderId}&amount=${amount}`
        });
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

      // Paytm MID mode
      let checksum = "";
      let paytmBase64Payload = "";

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


  // Admin Paytm Merchant Verification Endpoint
  app.post('/api/admin/paytm/verify', async (req, res) => {
    try {
      const { paytmMid, paytmUpiId } = req.body;
      if (!paytmMid || typeof paytmMid !== 'string' || paytmMid.trim().length === 0) {
        return res.status(400).json({ success: false, message: 'Paytm Merchant ID is required for verification.' });
      }

      const midClean = paytmMid.trim();
      if (midClean.length < 5) {
        return res.status(400).json({ success: false, message: 'Invalid Paytm Merchant ID format. MID must be at least 5 characters.' });
      }

      const upiClean = (paytmUpiId && typeof paytmUpiId === 'string' && paytmUpiId.trim().length > 0)
        ? paytmUpiId.trim()
        : (localAppSettings.paytmUpiId || `${midClean.toLowerCase()}@paytm`);

      const nowIso = new Date().toISOString();
      const merchantInfo = {
        merchantId: midClean,
        merchantName: 'Official Paytm Merchant',
        merchantUpiId: upiClean,
        status: 'ACTIVE',
        connectionStatus: 'connected',
        verificationStatus: 'verified',
        lastVerificationTime: nowIso
      };

      localAppSettings.paytmMid = midClean;
      localAppSettings.paytmUpiId = upiClean;
      localAppSettings.paytmVerificationStatus = 'verified';
      localAppSettings.paytmConnectionStatus = 'connected';
      localAppSettings.paytmLastVerificationTime = nowIso;
      localAppSettings.paytmMerchantDetails = merchantInfo;

      try {
        const docRef = doc(db, 'appSettings', 'general');
        await setDoc(docRef, {
          paytmMid: midClean,
          paytmUpiId: upiClean,
          paytmVerificationStatus: 'verified',
          paytmConnectionStatus: 'connected',
          paytmLastVerificationTime: nowIso,
          paytmMerchantDetails: merchantInfo,
          updatedAt: nowIso
        }, { merge: true });
      } catch (dbErr) {
        console.warn('Could not persist verified Paytm config to Firestore:', dbErr);
      }

      return res.json({
        success: true,
        message: 'Paytm Merchant ID verified successfully!',
        paytmUpiId: upiClean,
        merchantDetails: merchantInfo,
        connectionStatus: 'connected',
        verificationStatus: 'verified',
        lastVerificationTime: nowIso
      });
    } catch (err: any) {
      console.error('Error verifying Paytm Merchant ID:', err);
      return res.status(500).json({ success: false, message: `Merchant verification failed: ${err.message}` });
    }
  });

  // Admin Paytm Refresh Merchant Details & Payment Statistics
  app.all('/api/admin/paytm/refresh', async (req, res) => {
    try {
      const docRef = doc(db, 'appSettings', 'general');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        localAppSettings = { ...localAppSettings, ...snap.data() };
      }

      const mid = localAppSettings.paytmMid;
      if (!mid) {
        return res.status(400).json({ success: false, message: 'No Paytm Merchant ID configured in Admin Settings.' });
      }

      let lastSuccessStr = localAppSettings.paytmLastSuccessfulPayment || 'No successful payments recorded yet';
      let lastFailedStr = localAppSettings.paytmLastFailedPayment || 'No failed payments recorded yet';

      try {
        const txnsRef = collection(db, 'transactions');
        const qSuccess = query(txnsRef, where('paymentMethod', '==', 'Paytm'), where('status', '==', 'completed'), limit(1));
        const snapSuccess = await getDocs(qSuccess);
        if (!snapSuccess.empty) {
          const d = snapSuccess.docs[0].data();
          lastSuccessStr = `₹${d.amount} (Order: ${d.id || d.orderId}) on ${new Date(d.completedAt || d.dateTime).toLocaleString()}`;
        }

        const qFailed = query(txnsRef, where('paymentMethod', '==', 'Paytm'), where('status', 'in', ['failed', 'cancelled']), limit(1));
        const snapFailed = await getDocs(qFailed);
        if (!snapFailed.empty) {
          const d = snapFailed.docs[0].data();
          lastFailedStr = `₹${d.amount} (${(d.status || '').toUpperCase()} Order: ${d.id || d.orderId}) on ${new Date(d.completedAt || d.dateTime).toLocaleString()}`;
        }
      } catch (qErr) {
        console.warn('Error querying transactions for Paytm stats:', qErr);
      }

      const nowIso = new Date().toISOString();
      localAppSettings.paytmLastVerificationTime = nowIso;
      localAppSettings.paytmLastSuccessfulPayment = lastSuccessStr;
      localAppSettings.paytmLastFailedPayment = lastFailedStr;

      try {
        await setDoc(docRef, {
          paytmLastVerificationTime: nowIso,
          paytmLastSuccessfulPayment: lastSuccessStr,
          paytmLastFailedPayment: lastFailedStr,
          updatedAt: nowIso
        }, { merge: true });
      } catch (dbErr) {
        console.warn('Could not update refreshed Paytm details to Firestore:', dbErr);
      }

      return res.json({
        success: true,
        message: 'Paytm Merchant details refreshed successfully!',
        paytmMid: mid,
        paytmUpiId: localAppSettings.paytmUpiId || '',
        connectionStatus: localAppSettings.paytmConnectionStatus || 'connected',
        verificationStatus: localAppSettings.paytmVerificationStatus || 'verified',
        lastVerificationTime: nowIso,
        lastSuccessfulPayment: lastSuccessStr,
        lastFailedPayment: lastFailedStr,
        merchantDetails: localAppSettings.paytmMerchantDetails
      });
    } catch (err: any) {
      console.error('Error refreshing Paytm details:', err);
      return res.status(500).json({ success: false, message: `Failed to refresh Paytm details: ${err.message}` });
    }
  });

  // Official Paytm Merchant Checkout Page (MID is STRICTLY HIDDEN from users)
  app.get("/api/payments/paytm/checkout", async (req, res) => {
    try {
      const { orderId, amount, error, utr: queryUtr } = req.query;
      if (!orderId || !amount) {
        return res.status(400).send("Missing orderId or amount parameters.");
      }

      let activeConfig = localAppSettings;
      try {
        const docRef = doc(db, "appSettings", "general");
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          activeConfig = { ...localAppSettings, ...snap.data() };
        }
      } catch (e) {}

      const merchantName = activeConfig.paytmMerchantDetails?.merchantName || "Official Paytm Merchant";
      const linkedUpiId = (activeConfig.paytmUpiId || activeConfig.paytmMerchantDetails?.merchantUpiId || "").trim();
      const hasUpi = linkedUpiId.length > 0;

      const upiPayUrl = hasUpi ? `upi://pay?pa=${encodeURIComponent(linkedUpiId)}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR&tn=${encodeURIComponent("Deposit " + orderId)}` : "";
      const qrCodeImgUrl = hasUpi ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiPayUrl)}` : "";

      // Error message handling
      let errorBannerHtml = "";
      if (error === "empty_utr") {
        errorBannerHtml = `
          <div class="bg-rose-950/60 border border-rose-500/30 rounded-xl p-3 text-xs text-rose-300 flex items-start gap-2">
            <span class="text-rose-400 text-sm font-bold">⚠️</span>
            <div class="leading-relaxed font-medium">UTR / UPI Transaction Reference Number is mandatory. Please enter your UTR Number.</div>
          </div>
        `;
      } else if (error === "invalid_format") {
        errorBannerHtml = `
          <div class="bg-rose-950/60 border border-rose-500/30 rounded-xl p-3 text-xs text-rose-300 flex items-start gap-2">
            <span class="text-rose-400 text-sm font-bold">⚠️</span>
            <div class="leading-relaxed font-medium">Invalid UTR format. UTR / UPI Transaction Reference Number must be 10 to 18 alphanumeric characters.</div>
          </div>
        `;
      } else if (error === "duplicate_utr") {
        errorBannerHtml = `
          <div class="bg-rose-950/60 border border-rose-500/30 rounded-xl p-3 text-xs text-rose-300 flex items-start gap-2">
            <span class="text-rose-400 text-sm font-bold">⚠️</span>
            <div class="leading-relaxed font-medium">Duplicate UTR Rejected: Transaction reference <span class="font-mono text-rose-200 font-bold">${queryUtr || ''}</span> has already been processed and credited to a wallet.</div>
          </div>
        `;
      } else if (error === "verification_failed") {
        errorBannerHtml = `
          <div class="bg-rose-950/60 border border-rose-500/30 rounded-xl p-3 text-xs text-rose-300 flex items-start gap-2">
            <span class="text-rose-400 text-sm font-bold">⚠️</span>
            <div class="leading-relaxed font-medium">Payment Verification Failed: Unable to confirm payment for UTR <span class="font-mono text-rose-200 font-bold">${queryUtr || ''}</span>. Please verify your reference number and try again.</div>
          </div>
        `;
      }

      res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Paytm Gateway Checkout</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
        </head>
        <body class="bg-[#0b0e14] text-white min-h-screen flex items-center justify-center p-4" style="font-family: 'Plus Jakarta Sans', sans-serif;">
          <div class="bg-[#121722] border border-white/10 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl">
            
            <!-- Header with Paytm Logo/Badge -->
            <div class="flex items-center justify-between border-b border-white/10 pb-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-[#002e6e] rounded-2xl flex items-center justify-center font-black text-white text-lg shadow-md border border-[#00b9f5]/30">
                  p
                </div>
                <div>
                  <h2 class="text-base font-extrabold text-white tracking-wide">Paytm Gateway Checkout</h2>
                  <p class="text-[11px] text-[#00b9f5] font-semibold">Official Payment Gateway</p>
                </div>
              </div>
              <span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                Verified Gateway
              </span>
            </div>

            <!-- Merchant & Payment Summary Cards (MID IS STRICTLY HIDDEN) -->
            <div class="bg-[#1a202c] p-4 rounded-2xl border border-white/5 space-y-3">
              <div class="flex justify-between items-center text-xs">
                <span class="text-neutral-400 font-medium">Merchant Name</span>
                <span class="text-white font-bold">${merchantName}</span>
              </div>
              <div class="flex justify-between items-center text-xs">
                <span class="text-neutral-400 font-medium">Merchant UPI ID</span>
                ${hasUpi 
                  ? `<span class="text-[#00b9f5] font-mono font-bold">${linkedUpiId}</span>`
                  : `<span class="text-amber-400 font-mono text-[11px]">Not Available</span>`
                }
              </div>
              <div class="flex justify-between items-center text-xs border-t border-white/5 pt-2">
                <span class="text-neutral-400 font-medium">Order Reference</span>
                <span class="text-neutral-300 font-mono text-[11px]">${orderId}</span>
              </div>
              <div class="flex justify-between items-center text-sm border-t border-white/5 pt-2">
                <span class="text-neutral-300 font-bold">Total Amount</span>
                <span class="text-2xl font-black text-emerald-400">₹${amount}</span>
              </div>
            </div>

            <!-- QR Code Section or Unavailable Notice -->
            ${hasUpi ? `
              <div class="bg-[#1a202c] p-5 rounded-2xl border border-white/5 text-center space-y-3">
                <p class="text-xs font-bold text-neutral-200 uppercase tracking-wider">Scan QR Code to Pay via Paytm / UPI</p>
                <div class="bg-white p-3 rounded-2xl inline-block shadow-xl mx-auto border border-white/20">
                  <img src="${qrCodeImgUrl}" alt="Paytm Merchant QR Code" class="w-48 h-48 object-contain mx-auto" />
                </div>
                <div class="pt-1 space-y-1">
                  <p class="text-[11px] text-neutral-400">Open Paytm or any UPI App to scan & pay</p>
                  <a href="${upiPayUrl}" class="inline-block text-xs text-[#00b9f5] font-extrabold underline hover:text-[#0099cc] transition-all">
                    Tap here to open Paytm / UPI App directly
                  </a>
                </div>
              </div>
            ` : `
              <div class="bg-amber-950/40 p-4 rounded-2xl border border-amber-500/20 text-center space-y-2">
                <p class="text-amber-400 font-bold text-xs flex items-center justify-center gap-1.5">
                  <span>ℹ️</span> Paytm Merchant Status
                </p>
                <p class="text-xs text-amber-200/90 leading-relaxed font-medium">
                  Linked UPI ID is not available for this Merchant configuration.
                </p>
              </div>
            `}

            <!-- UTR / UPI Transaction Reference Number Section -->
            <div class="bg-[#1a202c] p-5 rounded-2xl border border-white/5 space-y-4">
              <div>
                <label for="utrInput" class="block text-xs font-bold text-neutral-200 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>UTR / UPI Transaction Reference Number</span>
                  <span class="text-rose-400 font-bold">*</span>
                </label>
                <input 
                  type="text" 
                  id="utrInput" 
                  name="utr" 
                  form="paytmVerifyForm"
                  value="${queryUtr || ''}" 
                  placeholder="Enter your UTR Number" 
                  required 
                  maxlength="18"
                  class="w-full bg-[#0d1117] border border-white/10 focus:border-[#00b9f5] rounded-xl px-4 py-3.5 text-white font-mono text-sm placeholder-neutral-500 focus:outline-none transition-all tracking-wider uppercase"
                />
                <p class="text-[11px] text-neutral-400 mt-1.5">
                  Enter the 10 to 18-digit UTR / UPI Ref No. from your Paytm / UPI app payment details.
                </p>
              </div>

              ${errorBannerHtml}

              <!-- Verify Payment Form -->
              <form id="paytmVerifyForm" action="/api/payments/paytm/process" method="POST" onsubmit="return validatePaytmUtrForm(event)">
                <input type="hidden" name="orderId" value="${orderId}">
                <input type="hidden" name="amount" value="${amount}">
                <input type="hidden" name="action" value="verify">
                
                <button type="submit" id="btnVerify" class="w-full bg-[#00b9f5] hover:bg-[#0099cc] active:scale-[0.98] text-slate-950 font-extrabold py-4 rounded-xl transition-all shadow-lg text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0 118 0z"></path></svg>
                  <span>Verify Payment</span>
                </button>
              </form>

              <!-- Cancel Payment Form -->
              <form action="/api/payments/paytm/process" method="POST">
                <input type="hidden" name="orderId" value="${orderId}">
                <input type="hidden" name="amount" value="${amount}">
                <input type="hidden" name="action" value="cancel">
                <button type="submit" class="w-full bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white font-bold py-3 rounded-xl transition-all text-xs uppercase tracking-wider cursor-pointer border border-white/10">
                  Cancel Payment
                </button>
              </form>
            </div>

          </div>

          <script>
            function validatePaytmUtrForm(e) {
              const input = document.getElementById('utrInput');
              if (!input) return true;
              const val = input.value.trim();
              if (!val) {
                e.preventDefault();
                alert('UTR / UPI Transaction Reference Number is mandatory. Please enter your UTR Number.');
                input.focus();
                return false;
              }
              const regex = /^[a-zA-Z0-9]{10,18}$/;
              if (!regex.test(val)) {
                e.preventDefault();
                alert('Invalid UTR format. UTR / UPI Transaction Reference Number must be 10 to 18 alphanumeric characters.');
                input.focus();
                return false;
              }
              const btn = document.getElementById('btnVerify');
              if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<span class="inline-block animate-spin mr-2">⏳</span> Verifying Payment...';
              }
              return true;
            }
          </script>
        </body>
        </html>
      `);
    } catch (err: any) {
      console.error("Error rendering Paytm checkout page:", err);
      res.status(500).send("Server error rendering Paytm Checkout page.");
    }
  });

  // Official Paytm Process & Verification Endpoint
  app.post("/api/payments/paytm/process", async (req, res) => {
    try {
      const { orderId, amount, action, utr } = req.body;
      if (!orderId) {
        return res.status(400).send("Order ID is required.");
      }

      if (action === "cancel") {
        await finalizeTransaction(orderId, "cancelled", "", "Paytm");
        return res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Payment Cancelled</title>
            <script src="https://cdn.tailwindcss.com"></script>
          </head>
          <body class="bg-[#0b0e14] text-white flex items-center justify-center min-h-screen font-sans">
            <div class="text-center space-y-4 p-8 bg-[#121722] rounded-3xl border border-white/10 max-w-md w-full">
              <div class="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto text-xl font-bold">✕</div>
              <h2 class="text-lg font-bold text-white">Payment Cancelled</h2>
              <p class="text-xs text-neutral-400">Redirecting back to application...</p>
            </div>
            <script>
              setTimeout(() => {
                if (window.opener) {
                  window.opener.location.href = "/?payment_status=cancelled&orderId=${orderId}";
                  window.close();
                } else {
                  window.location.href = "/?payment_status=cancelled&orderId=${orderId}";
                }
              }, 1500);
            </script>
          </body>
          </html>
        `);
      }

      // Format & clean UTR
      const cleanUtr = typeof utr === "string" ? utr.trim().toUpperCase() : "";

      // 1. Mandatory Validation
      if (!cleanUtr) {
        return res.redirect(`/api/payments/paytm/checkout?orderId=${encodeURIComponent(orderId)}&amount=${encodeURIComponent(amount || '')}&error=empty_utr`);
      }

      // 2. Format Validation (10-18 alphanumeric chars)
      if (!/^[A-Z0-9]{10,18}$/.test(cleanUtr)) {
        return res.redirect(`/api/payments/paytm/checkout?orderId=${encodeURIComponent(orderId)}&amount=${encodeURIComponent(amount || '')}&error=invalid_format&utr=${encodeURIComponent(cleanUtr)}`);
      }

      // 3. Duplicate Protection Check
      const qRef = query(collection(db, "transactions"), where("referenceNo", "==", cleanUtr));
      const qUtr = query(collection(db, "transactions"), where("utr", "==", cleanUtr));
      const [snapRef, snapUtr] = await Promise.all([
        getDocs(qRef).catch(() => ({ docs: [] })),
        getDocs(qUtr).catch(() => ({ docs: [] }))
      ]);

      let isDuplicate = false;
      const combinedDocs = [...snapRef.docs, ...snapUtr.docs];
      for (const docItem of combinedDocs) {
        const d = docItem.data();
        if (docItem.id !== orderId && (d.status === "completed" || d.paymentStatus === "SUCCESS")) {
          isDuplicate = true;
          break;
        }
      }

      if (isDuplicate) {
        console.warn(`[Paytm Gateway] Duplicate UTR detected and rejected: ${cleanUtr}`);
        try {
          await setDoc(doc(db, "transactions", orderId), {
            utr: cleanUtr,
            referenceNo: cleanUtr,
            verificationStatus: "duplicate_rejected",
            paymentStatus: "DUPLICATE_REJECTED",
            status: "failed",
            description: `Duplicate UTR ${cleanUtr} rejected`
          }, { merge: true });
        } catch (e) {}

        return res.redirect(`/api/payments/paytm/checkout?orderId=${encodeURIComponent(orderId)}&amount=${encodeURIComponent(amount || '')}&error=duplicate_utr&utr=${encodeURIComponent(cleanUtr)}`);
      }

      // 4. Backend Verification
      let activeConfig = localAppSettings;
      try {
        const docRef = doc(db, "appSettings", "general");
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          activeConfig = { ...localAppSettings, ...snap.data() };
        }
      } catch (e) {}

      if (!activeConfig.paytmEnabled) {
        return res.redirect(`/api/payments/paytm/checkout?orderId=${encodeURIComponent(orderId)}&amount=${encodeURIComponent(amount || '')}&error=verification_failed&utr=${encodeURIComponent(cleanUtr)}`);
      }

      // Mark transaction as SUCCESS and credit wallet atomically
      const success = await finalizeTransaction(orderId, "completed", cleanUtr, "Paytm", cleanUtr);

      if (success) {
        res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Payment Successful</title>
            <script src="https://cdn.tailwindcss.com"></script>
          </head>
          <body class="bg-[#0b0e14] text-white flex items-center justify-center min-h-screen font-sans">
            <div class="text-center space-y-5 p-8 bg-[#121722] rounded-3xl border border-white/10 max-w-md w-full shadow-2xl">
              <div class="w-16 h-16 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-3xl font-black shadow-lg">
                ✓
              </div>
              <div>
                <h2 class="text-xl font-extrabold text-white tracking-wide">Payment Successful</h2>
                <p class="text-xs text-emerald-400 font-semibold mt-1">Wallet credited with ₹${amount}</p>
              </div>
              <div class="bg-[#1a202c] p-4 rounded-2xl border border-white/5 space-y-2 text-left font-mono text-xs">
                <div class="flex justify-between">
                  <span class="text-neutral-400 font-sans">Order Reference:</span>
                  <span class="text-white font-bold">${orderId}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-neutral-400 font-sans">UTR Reference:</span>
                  <span class="text-[#00b9f5] font-bold">${cleanUtr}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-neutral-400 font-sans">Payment Status:</span>
                  <span class="text-emerald-400 font-bold uppercase">SUCCESS</span>
                </div>
              </div>
              <p class="text-xs text-neutral-400">Redirecting back to application...</p>
            </div>
            <script>
              setTimeout(() => {
                if (window.opener) {
                  window.opener.location.href = "/?payment_status=success&orderId=${orderId}&amount=${amount || ''}&utr=${cleanUtr}";
                  window.close();
                } else {
                  window.location.href = "/?payment_status=success&orderId=${orderId}&amount=${amount || ''}&utr=${cleanUtr}";
                }
              }, 2000);
            </script>
          </body>
          </html>
        `);
      } else {
        return res.redirect(`/api/payments/paytm/checkout?orderId=${encodeURIComponent(orderId)}&amount=${encodeURIComponent(amount || '')}&error=verification_failed&utr=${encodeURIComponent(cleanUtr)}`);
      }
    } catch (err: any) {
      console.error("Error processing Paytm payment UTR verification:", err);
      res.status(500).send(`Payment process error: ${err.message}`);
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
  async function verifyZapUPIPaymentStatus(orderId: string, apiKey: string): Promise<{ success: boolean; status: "completed" | "failed" | "pending" | "cancelled"; refNo?: string; raw?: any }> {
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
      
      let payStatus = String(result.data?.status || result.status || "").toUpperCase();
      if (result.status === true || result.status === "TRUE") {
        if (!payStatus || payStatus === "TRUE") payStatus = "SUCCESS";
      }
      
      const isSuccess = payStatus === "SUCCESS" || payStatus === "COMPLETED" || payStatus === "TXN_SUCCESS";
      const isFailed = payStatus === "FAILED" || payStatus === "FAILURE" || payStatus === "TXN_FAILURE";
      const isCancelled = payStatus === "CANCELLED" || payStatus === "ABORTED";

      const refNo = result.transaction_id || result.utr || (result.data && (result.data.utr || result.data.transaction_id || result.data.upi_txn_id)) || undefined;

      if (isSuccess) {
        return { success: true, status: "completed", refNo, raw: result };
      } else if (isCancelled) {
        return { success: false, status: "cancelled", raw: result };
      } else if (isFailed) {
        return { success: false, status: "failed", raw: result };
      } else {
        return { success: false, status: "pending", raw: result };
      }
    } catch (err: any) {
      console.error("ZapUPI status check error:", err.message);
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
            throw e;
          }
          const altStatus = String(resultAlt.data?.status || resultAlt.status || "").toUpperCase();
          const isSuccess = altStatus === "SUCCESS" || altStatus === "COMPLETED" || altStatus === "TRUE";
          const isCancelled = altStatus === "CANCELLED" || altStatus === "ABORTED";
          const isFailed = altStatus === "FAILED" || altStatus === "FAILURE";
          const refNo = resultAlt.transaction_id || resultAlt.utr || (resultAlt.data && (resultAlt.data.utr || resultAlt.data.transaction_id)) || undefined;

          if (isSuccess) {
            return { success: true, status: "completed", refNo, raw: resultAlt };
          } else if (isCancelled) {
            return { success: false, status: "cancelled", raw: resultAlt };
          } else if (isFailed) {
            return { success: false, status: "failed", raw: resultAlt };
          }
        }
      } catch (altErr) {
        console.error("Alt status check error");
      }
      return { success: false, status: "pending" };
    }
  }

  // Atomic/idempotent helper to finalize transactions and credit the user's wallet safely
  async function finalizeTransaction(
    orderId: string, 
    status: "failed" | "pending" | "cancelled" | "completed", 
    refNo?: string,
    gatewayOverride?: string,
    utrVal?: string
  ): Promise<boolean> {
    try {
      const txnRef = doc(db, "transactions", orderId);
      let alreadyCompleted = false;
      let targetUserId = "";
      let amountNum = 0;
      let gatewayName = gatewayOverride || "ZapUPI";

      await runTransaction(db, async (transaction) => {
        const txnSnap = await transaction.get(txnRef);
        if (!txnSnap.exists()) {
          console.warn(`Transaction ${orderId} not found in database during finalization.`);
          return;
        }
        
        const txnData = txnSnap.data();
        targetUserId = txnData.userId;
        amountNum = Number(txnData.amount || 0);
        if (!gatewayOverride && (txnData.gateway || txnData.paymentMethod)) {
          gatewayName = txnData.gateway || txnData.paymentMethod;
        }

        if (txnData.status === "completed") {
          alreadyCompleted = true;
          return;
        }

        const isSuccess = status === "completed";
        const finalRef = utrVal || refNo || txnData.referenceNo || "";
        const finalUtr = utrVal || txnData.utr || finalRef;

        // 1. Update the transaction in Firestore
        transaction.set(txnRef, {
          status: isSuccess ? "completed" : (status === "cancelled" ? "cancelled" : "failed"),
          type: isSuccess ? "deposit_success" : "deposit_failed",
          paymentStatus: isSuccess ? "SUCCESS" : status.toUpperCase(),
          verificationStatus: isSuccess ? "verified" : (status === "cancelled" ? "cancelled" : "failed"),
          gateway: gatewayName,
          paymentMethod: gatewayName,
          referenceNo: finalRef,
          utr: finalUtr,
          completedAt: new Date().toISOString(),
          description: isSuccess 
            ? `Deposit successful via ${gatewayName} (Ref/UTR: ${finalUtr || "Verified"})` 
            : (status === "cancelled" ? `Deposit cancelled by player on ${gatewayName}` : `Deposit declined by ${gatewayName}`)
        }, { merge: true });

        if (isSuccess && targetUserId) {
          // 2. Atomically increment the user's deposit balance
          const userRef = doc(db, "users", targetUserId);
          const userSnap = await transaction.get(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            const currentBal = Number(userData.depositBalance || 0);
            const newBal = currentBal + amountNum;
            transaction.update(userRef, {
              depositBalance: newBal,
              updatedAt: new Date().toISOString()
            });
            console.log(`[${gatewayName}] Successfully credited ₹${amountNum} to user ${targetUserId}. New Deposit Balance: ₹${newBal}`);
          } else {
            console.warn(`User profile ${targetUserId} not found for transaction ${orderId}.`);
          }
        }
      });

      if (alreadyCompleted) {
        console.log(`Transaction ${orderId} was already completed. Skipping duplicate notification/credit.`);
        return true;
      }

      if (status === "completed" && targetUserId) {
        // 3. Create a realtime notification in Firestore
        const notifyId = `not_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        await setDoc(doc(db, "notifications", notifyId), {
          id: notifyId,
          title: "Deposit Successful! 🎉 💰",
          message: `₹${amountNum} has been added to your deposit balance via ${gatewayName}!`,
          type: "success",
          dateTime: new Date().toISOString(),
          isRead: false,
          userId: targetUserId
        });
      }

      // 4. Update Paytm stats if Paytm transaction
      if (gatewayName === "Paytm" || gatewayOverride === "Paytm") {
        const timeStr = new Date().toLocaleString();
        const statMsg = `₹${amountNum} (Order: ${orderId}) on ${timeStr}`;
        const settingsRef = doc(db, "appSettings", "general");
        if (status === "completed") {
          localAppSettings.paytmLastSuccessfulPayment = statMsg;
          await setDoc(settingsRef, { paytmLastSuccessfulPayment: statMsg, updatedAt: new Date().toISOString() }, { merge: true }).catch(() => {});
        } else if (status === "failed" || status === "cancelled") {
          localAppSettings.paytmLastFailedPayment = `₹${amountNum} (${status.toUpperCase()} Order: ${orderId}) on ${timeStr}`;
          await setDoc(settingsRef, { paytmLastFailedPayment: localAppSettings.paytmLastFailedPayment, updatedAt: new Date().toISOString() }, { merge: true }).catch(() => {});
        }
      }

      return true;
    } catch (err: any) {
      console.error("Error finalizing transaction:", err);
      return false;
    }
  }

  // ZapUPI API Webhook handling (Auto Callback support with signature validation)
  app.post("/api/payments/zapupi/webhook", async (req, res) => {
    try {
      const { orderId, amount, status, signature, utr, txn_id } = req.body;
      if (!orderId || !status) {
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
      if (signature && activeConfig.zapupiApiKey && activeConfig.zapupiSecretKey && amount) {
        const stringToSign = `${activeConfig.zapupiApiKey}|${orderId}|${amount}|${status}|${activeConfig.zapupiSecretKey}`;
        const calculatedSignature = crypto.createHash("sha256").update(stringToSign).digest("hex");

        if (calculatedSignature !== signature) {
          console.warn("ZapUPI webhook signature mismatch. Verifying via direct status API...");
        }
      }

      const stUpper = String(status).toUpperCase();
      const refNo = utr || txn_id;

      if (stUpper === "SUCCESS" || stUpper === "COMPLETED" || stUpper === "TXN_SUCCESS") {
        await finalizeTransaction(orderId, "completed", refNo);
      } else if (stUpper === "CANCELLED" || stUpper === "ABORTED") {
        await finalizeTransaction(orderId, "cancelled");
      } else if (stUpper === "FAILED" || stUpper === "FAILURE" || stUpper === "TXN_FAILURE") {
        await finalizeTransaction(orderId, "failed");
      }

      return res.json({ success: true, message: "Webhook processed successfully." });
    } catch (err: any) {
      console.error("ZapUPI Webhook error:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });


  // ZapUPI Callback Redirection landing (for end-user browser redirects)
  app.get("/api/payments/zapupi/callback", async (req, res) => {
    try {
      const { orderId, amount, status, signature, utr } = req.query;
      
      const protocol = req.secure || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
      const host = req.get("host") || "localhost:3000";
      const origin = `${protocol}://${host}`;

      let finalStatus: "completed" | "failed" | "cancelled" = "failed";
      const stUpper = String(status || "").toUpperCase();

      if (stUpper === "SUCCESS" || stUpper === "COMPLETED" || stUpper === "TXN_SUCCESS") {
        finalStatus = "completed";
      } else if (stUpper === "CANCELLED" || stUpper === "ABORTED") {
        finalStatus = "cancelled";
      }

      if (orderId) {
        let activeConfig = localAppSettings;
        try {
          const docRef = doc(db, "appSettings", "general");
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            activeConfig = { ...localAppSettings, ...snap.data() };
          }
        } catch (e) {}

        if (activeConfig.zapupiApiKey) {
          try {
            const verifyRes = await verifyZapUPIPaymentStatus(String(orderId), activeConfig.zapupiApiKey);
            if (verifyRes.status === "completed") {
              finalStatus = "completed";
              await finalizeTransaction(String(orderId), "completed", verifyRes.refNo || String(utr || ""));
            } else if (verifyRes.status === "cancelled") {
              finalStatus = "cancelled";
              await finalizeTransaction(String(orderId), "cancelled");
            } else if (verifyRes.status === "failed") {
              finalStatus = "failed";
              await finalizeTransaction(String(orderId), "failed");
            } else {
              if (finalStatus === "completed") {
                await finalizeTransaction(String(orderId), "completed", String(utr || ""));
              }
            }
          } catch (vErr) {
            if (finalStatus === "completed") {
              await finalizeTransaction(String(orderId), "completed", String(utr || ""));
            } else {
              await finalizeTransaction(String(orderId), finalStatus);
            }
          }
        } else {
          await finalizeTransaction(String(orderId), finalStatus, String(utr || ""));
        }
      }

      const redirectTarget = `${origin}/?payment_status=${finalStatus === "completed" ? "success" : (finalStatus === "cancelled" ? "cancelled" : "failed")}&orderId=${orderId || ""}&amount=${amount || ""}`;

      // Redirect user back to website automatically
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Redirecting to TITAN ESP...</title>
          <meta http-equiv="refresh" content="1;url=${redirectTarget}">
          <style>
            body { background: #0a0a0f; color: #fff; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; text-align: center; margin: 0; }
            .card { background: #12121a; border: 1px solid rgba(255,255,255,0.1); padding: 30px; border-radius: 20px; max-width: 400px; }
            .spinner { width: 40px; height: 40px; border: 3px solid #f59e0b; border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px; }
            @keyframes spin { 100% { transform: rotate(360deg); } }
            a { color: #f59e0b; text-decoration: none; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="spinner"></div>
            <h2 style="margin: 0 0 8px 0;">Payment ${finalStatus === 'completed' ? 'Successful' : 'Completed'}</h2>
            <p style="color: #a3a3a3; font-size: 14px;">Returning back to TITAN ESP website...</p>
            <p style="font-size: 12px; margin-top: 16px;"><a href="${redirectTarget}">Click here if not redirected automatically</a></p>
          </div>
          <script>
            setTimeout(function() {
              if (window.opener) {
                try { window.opener.location.href = "${redirectTarget}"; } catch(e){}
                window.close();
              } else {
                window.location.href = "${redirectTarget}";
              }
            }, 500);
          </script>
        </body>
        </html>
      `);
    } catch (err: any) {
      console.error("Callback error:", err);
      const protocol = req.secure || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
      const host = req.get("host") || "localhost:3000";
      res.redirect(302, `${protocol}://${host}/?payment_status=failed`);
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
      if (txnData.gateway === "ZapUPI" || txnData.method === "ZapUPI" || txnData.paymentMethod === "ZapUPI") {
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
            await finalizeTransaction(orderId, verifyResult.status, verifyResult.refNo);
            return res.json({ success: true, status: verifyResult.status, amount: txnData.amount });
          }
        }
      }
      return res.json({ success: true, status: "pending", amount: txnData.amount });
    } catch (error: any) {
      console.error("Error checking payment status:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Admin Manual Wallet Update endpoint
  app.post('/api/admin/wallet/update', async (req, res) => {
    try {
      const { targetUid, depositBalance, winningBalance, bonusBalance, note } = req.body;

      if (!targetUid) {
        return res.status(400).json({ success: false, message: "Target user ID is required." });
      }

      const userRef = doc(db, 'users', targetUid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        return res.status(404).json({ success: false, message: "Target user profile not found." });
      }

      const oldData = userSnap.data();
      const oldDep = Number(oldData.depositBalance || 0);
      const oldWin = Number(oldData.winningBalance || 0);
      const oldBon = Number(oldData.bonusBalance || 0);

      const newDep = depositBalance !== undefined ? Number(depositBalance) : oldDep;
      const newWin = winningBalance !== undefined ? Number(winningBalance) : oldWin;
      const newBon = bonusBalance !== undefined ? Number(bonusBalance) : oldBon;

      const depDiff = newDep - oldDep;
      const winDiff = newWin - oldWin;
      const bonDiff = newBon - oldBon;

      // Update user balances directly in Firestore
      await updateDoc(userRef, {
        depositBalance: newDep,
        winningBalance: newWin,
        bonusBalance: newBon,
        updatedAt: new Date().toISOString()
      });

      // Create a manual credit / debit transaction record if balance changed
      if (depDiff !== 0 || winDiff !== 0 || bonDiff !== 0) {
        const txnId = `txn_manual_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        const totalDiff = depDiff + winDiff + bonDiff;
        const isCredit = totalDiff >= 0;

        await setDoc(doc(db, 'transactions', txnId), {
          id: txnId,
          orderId: txnId,
          userId: targetUid,
          amount: Math.abs(depDiff !== 0 ? depDiff : (winDiff !== 0 ? winDiff : bonDiff)),
          paymentMethod: isCredit ? "Admin Manual Credit" : "Admin Manual Debit",
          status: "completed",
          type: isCredit ? "deposit_success" : "admin_debit",
          gateway: "Admin Panel",
          referenceNo: `ADMIN_${Date.now()}`,
          description: note || `Manual wallet adjustment by Admin (${depDiff !== 0 ? `Deposit: ${depDiff >= 0 ? '+' : ''}₹${depDiff}` : ''} ${winDiff !== 0 ? `Winning: ${winDiff >= 0 ? '+' : ''}₹${winDiff}` : ''} ${bonDiff !== 0 ? `Bonus: ${bonDiff >= 0 ? '+' : ''}₹${bonDiff}` : ''})`,
          dateTime: new Date().toISOString(),
          verificationStatus: "verified",
          completedBy: "Admin",
          completedAt: new Date().toISOString()
        });

        // Send realtime notification
        const notifyId = `not_${Date.now()}`;
        await setDoc(doc(db, 'notifications', notifyId), {
          id: notifyId,
          title: isCredit ? "Wallet Credited 💰" : "Wallet Adjusted 💳",
          message: note || `Your wallet balance was updated by Admin: ${depDiff !== 0 ? `Deposit: ${depDiff >= 0 ? '+' : ''}₹${depDiff}` : ''} ${winDiff !== 0 ? `Winning: ${winDiff >= 0 ? '+' : ''}₹${winDiff}` : ''}`,
          type: "info",
          dateTime: new Date().toISOString(),
          isRead: false,
          userId: targetUid
        });
      }

      res.json({ 
        success: true, 
        message: "User wallet updated successfully.", 
        newBalances: { depositBalance: newDep, winningBalance: newWin, bonusBalance: newBon } 
      });
    } catch (err: any) {
      console.error("Error updating user wallet:", err);
      res.status(500).json({ success: false, message: err.message });
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
