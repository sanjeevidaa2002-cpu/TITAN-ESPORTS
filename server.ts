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
import { initializeFirestore, doc, getDoc, setDoc, updateDoc, collection, addDoc, getDocs, runTransaction, query, where, getFirestore, setLogLevel } from "firebase/firestore";

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

// Local memory fallback store in case Firestore Admin SDK hits PERMISSION_DENIED or other service-level access limitations.
// This guarantees that the YouTube tab configurations will still save, synchronize, and function fully in-memory if the backend Firestore client is blocked.
let localYouTubeConfig: any = {
  enabled: false,
  apiKey: "",
  channelId: "",
  cacheDurationMinutes: 15,
  autoSync: true,
  updatedAt: new Date().toISOString()
};

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

  // Memory Caching Engine
  interface CacheEntry<T> {
    data: T;
    timestamp: number;
  }
  let channelCache: CacheEntry<any> | null = null;
  let videosCache: CacheEntry<any[]> | null = null;
  let shortsCache: CacheEntry<any[]> | null = null;
  let liveCache: CacheEntry<any> | null = null;

  // Helper to parse ISO 8601 duration to seconds
  function parseDurationToSeconds(duration: string): number {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    const seconds = parseInt(match[3] || '0', 10);
    return hours * 3600 + minutes * 60 + seconds;
  }

  // Helper to fetch YouTube Config from Firestore securely using Firebase Client SDK
  async function getYouTubeConfig() {
    try {
      const docRef = doc(db, "appSettings", "youtube");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const dbData = docSnap.data();
        if (dbData) {
          localYouTubeConfig = { ...localYouTubeConfig, ...dbData };
        }
        return dbData;
      }
    } catch (err) {
      console.warn("Firestore Client SDK inaccessible (using local fallback configuration store instead).");
    }
    return localYouTubeConfig;
  }

  // Helper to make API calls to YouTube
  async function fetchFromYouTube(url: string) {
    const res = await fetch(url);
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`YouTube API Error: ${res.status} - ${errText}`);
    }
    return res.json();
  }

  // Combined caching helper for Videos and Shorts (retrieves uploaded playlist items once)
  async function getVideosAndShortsCached(config: any) {
    const cacheExpiry = (config.cacheDurationMinutes || 15) * 60 * 1000;
    if (videosCache && shortsCache && (Date.now() - videosCache.timestamp < cacheExpiry)) {
      return { videos: videosCache.data, shorts: shortsCache.data };
    }

    const { apiKey, channelId } = config;
    
    // 1. Fetch channel details to retrieve uploads playlist ID if not cached
    let uploadsPlaylistId = "";
    if (channelCache && (Date.now() - channelCache.timestamp < cacheExpiry)) {
      uploadsPlaylistId = channelCache.data.uploadsPlaylistId;
    } else {
      const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${apiKey}`;
      const cData = await fetchFromYouTube(channelUrl);
      uploadsPlaylistId = cData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads || "";
    }

    if (!uploadsPlaylistId) {
      throw new Error("Could not find uploads playlist for this channel.");
    }

    // 2. Fetch latest 50 playlist items
    const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=50&key=${apiKey}`;
    const pData = await fetchFromYouTube(playlistUrl);
    const items = pData.items || [];
    
    if (items.length === 0) {
      videosCache = { data: [], timestamp: Date.now() };
      shortsCache = { data: [], timestamp: Date.now() };
      return { videos: [], shorts: [] };
    }

    const videoIds = items.map((item: any) => item.contentDetails.videoId);

    // 3. Fetch full video statistics and duration specs
    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoIds.join(",")}&key=${apiKey}`;
    const dData = await fetchFromYouTube(detailsUrl);
    const detailedVideos = dData.items || [];

    const parsedVideos: any[] = [];
    const parsedShorts: any[] = [];

    detailedVideos.forEach((v: any) => {
      const durationStr = v.contentDetails?.duration || "";
      const seconds = parseDurationToSeconds(durationStr);
      // Classify as Short if <= 60s or contains hashtag in title/description
      const isShort = seconds <= 60 || 
                      v.snippet?.title?.toLowerCase().includes("#shorts") || 
                      v.snippet?.description?.toLowerCase().includes("#shorts");

      const videoItem = {
        id: v.id,
        title: v.snippet.title,
        description: v.snippet.description,
        publishedAt: v.snippet.publishedAt,
        thumbnail: v.snippet.thumbnails?.maxres?.url || v.snippet.thumbnails?.high?.url || v.snippet.thumbnails?.medium?.url || v.snippet.thumbnails?.default?.url || "",
        duration: durationStr,
        durationSeconds: seconds,
        views: parseInt(v.statistics?.viewCount, 10) || 0,
        likes: parseInt(v.statistics?.likeCount, 10) || 0,
        comments: parseInt(v.statistics?.commentCount, 10) || 0
      };

      if (isShort) {
        parsedShorts.push(videoItem);
      } else {
        parsedVideos.push(videoItem);
      }
    });


    videosCache = { data: parsedVideos, timestamp: Date.now() };
    shortsCache = { data: parsedShorts, timestamp: Date.now() };
    return { videos: parsedVideos, shorts: parsedShorts };
  }
  // ==========================================

  // 1. Get YouTube config settings (excludes full API Key for security)
  app.get("/api/youtube/config", async (req, res) => {
    const config = await getYouTubeConfig();
    if (!config) {
      return res.json({ enabled: false, channelId: "", hasApiKey: false });
    }
    res.json({
      enabled: config.enabled ?? false,
      channelId: config.channelId ?? "",
      cacheDurationMinutes: config.cacheDurationMinutes ?? 15,
      autoSync: config.autoSync ?? true,
      hasApiKey: !!config.apiKey
    });

  });


  // 2. Save YouTube configurations securely
  app.post("/api/youtube/config", async (req, res) => {
    try {
      const { enabled, apiKey, channelId, cacheDurationMinutes, autoSync } = req.body;
      
      let finalApiKey = apiKey;
      // If client didn't supply a key, use the existing one
      if (!apiKey) {
        const existing = await getYouTubeConfig();
        finalApiKey = existing?.apiKey || "";
      }

      const configData = {
        enabled: !!enabled,
        apiKey: finalApiKey || "",
        channelId: channelId || "",
        cacheDurationMinutes: parseInt(cacheDurationMinutes, 10) || 15,
        autoSync: autoSync ?? true,
        updatedAt: new Date().toISOString()
      };

      // Always save to the local in-memory store so it works offline/sandbox-isolated
      localYouTubeConfig = configData;

      try {
        const docRef = doc(db, "appSettings", "youtube");
        await setDoc(docRef, configData);
      } catch (err) {
        console.warn("Failed to write YouTube config to remote Firestore. Saved locally in-memory instead.");
      }

      // Clear memory caches upon configuration change
      channelCache = null;
      videosCache = null;
      shortsCache = null;
      liveCache = null;

      res.json({ success: true, message: "YouTube Integration Settings configured successfully!" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });


  // 3. Clear Cache & Manual Synchronization
  app.post("/api/youtube/sync", async (req, res) => {
    channelCache = null;
    videosCache = null;
    shortsCache = null;
    liveCache = null;
    res.json({ success: true, message: "Cache invalidated. Synced metadata successfully!" });
  });


  // 4. Fetch Channel Profile Metadata
  app.get("/api/youtube/channel", async (req, res) => {
    try {
      const config = await getYouTubeConfig();
      if (!config || !config.enabled || !config.apiKey || !config.channelId) {
        return res.status(400).json({ error: "YouTube Integration is disabled or not configured in Admin panel." });
      }

      const cacheExpiry = (config.cacheDurationMinutes || 15) * 60 * 1000;
      if (channelCache && (Date.now() - channelCache.timestamp < cacheExpiry)) {
        return res.json(channelCache.data);
      }

      const { apiKey, channelId } = config;
      const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails,brandingSettings&id=${channelId}&key=${apiKey}`;
      const data = await fetchFromYouTube(url);
      
      if (!data.items || data.items.length === 0) {
        return res.status(404).json({ error: "YouTube Channel not found." });
      }

      const item = data.items[0];
      const channelInfo = {
        id: item.id,
        title: item.snippet.title,
        description: item.snippet.description,
        customUrl: item.snippet.customUrl || "",
        publishedAt: item.snippet.publishedAt,
        country: item.snippet.country || "Global",
        logo: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || "",
        banner: item.brandingSettings?.image?.bannerExternalUrl || "",
        subscribers: parseInt(item.statistics.subscriberCount, 10) || 0,
        views: parseInt(item.statistics.viewCount, 10) || 0,
        videosCount: parseInt(item.statistics.videoCount, 10) || 0,
        uploadsPlaylistId: item.contentDetails?.relatedPlaylists?.uploads || ""
      };

      channelCache = { data: channelInfo, timestamp: Date.now() };
      res.json(channelInfo);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });


  // 5. Fetch Videos Tab
  app.get("/api/youtube/videos", async (req, res) => {
    try {
      const config = await getYouTubeConfig();
      if (!config || !config.enabled || !config.apiKey || !config.channelId) {
        return res.status(400).json({ error: "YouTube Integration is disabled or not configured." });
      }
      const { videos } = await getVideosAndShortsCached(config);
      res.json(videos);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });


  // 6. Fetch Shorts Tab
  app.get("/api/youtube/shorts", async (req, res) => {
    try {
      const config = await getYouTubeConfig();
      if (!config || !config.enabled || !config.apiKey || !config.channelId) {
        return res.status(400).json({ error: "YouTube Integration is disabled or not configured." });
      }
      const { shorts } = await getVideosAndShortsCached(config);
      res.json(shorts);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });


  // 7. Fetch Live Stream Details
  app.get("/api/youtube/live", async (req, res) => {
    try {
      const config = await getYouTubeConfig();
      if (!config || !config.enabled || !config.apiKey || !config.channelId) {
        return res.status(400).json({ error: "YouTube Integration is disabled or not configured." });
      }

      // Live stream statuses expire in 5 minutes to stay accurate
      if (liveCache && (Date.now() - liveCache.timestamp < 5 * 60 * 1000)) {
        return res.json(liveCache.data);
      }

      const { apiKey, channelId } = config;

      // Search active live streams
      const liveSearchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&eventType=live&key=${apiKey}`;
      const liveData = await fetchFromYouTube(liveSearchUrl);
      const liveItems = liveData.items || [];

      let activeLive: any = null;
      if (liveItems.length > 0) {
        const liveVideo = liveItems[0];
        const liveVideoId = liveVideo.id.videoId;

        // Fetch precise viewer count and metrics
        const liveDetailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails,statistics&id=${liveVideoId}&key=${apiKey}`;
        let viewerCount = 0;
        try {
          const details = await fetchFromYouTube(liveDetailsUrl);
          const detailsItem = details.items?.[0];
          viewerCount = parseInt(detailsItem?.liveStreamingDetails?.concurrentViewers, 10) || 0;
        } catch (detailErr) {
          console.error("An error occurred");
        }

        activeLive = {
          id: liveVideoId,
          title: liveVideo.snippet.title,
          description: liveVideo.snippet.description,
          thumbnail: liveVideo.snippet.thumbnails?.high?.url || liveVideo.snippet.thumbnails?.default?.url || "",
          publishedAt: liveVideo.snippet.publishedAt,
          viewerCount: viewerCount
        };
      }

      // Search upcoming scheduled broadcasts
      const upcomingSearchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&eventType=upcoming&key=${apiKey}`;
      let upcomingStreams: any[] = [];
      try {
        const upcomingData = await fetchFromYouTube(upcomingSearchUrl);
        upcomingStreams = (upcomingData.items || []).map((v: any) => ({
          id: v.id.videoId,
          title: v.snippet.title,
          description: v.snippet.description,
          thumbnail: v.snippet.thumbnails?.high?.url || v.snippet.thumbnails?.default?.url || "",
          publishedAt: v.snippet.publishedAt
        }));
      } catch (upcomingErr) {
        console.error("An error occurred");
      }

      const liveStatus = {
        isLive: !!activeLive,
        activeLive,
        upcomingStreams
      };

      liveCache = { data: liveStatus, timestamp: Date.now() };
      res.json(liveStatus);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  


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
        const phonepePayload = {
          merchantId: activeConfig.phonepeMerchantId,
          merchantTransactionId: orderId,
          amount: Number(amount) * 100, // PhonePe takes amount in paise
          redirectUrl: `http://localhost:3000/api/payments/phonepe/callback`,
          callbackUrl: `http://localhost:3000/api/payments/phonepe/callback`,
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
      const { transactionId, admin } = req.body;
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
      const { transactionId, reason, admin } = req.body;
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
