# Victory Arena Esports - Render.com Deployment Guide

This guide describes how to deploy the full-stack Victory Arena Esports application on **Render.com** without encountering Out of Memory (OOM) errors.

---

## 🛠 What We Fixed for Render.com

1. **Memory Limits Optimized (`package.json`)**:
   Render's free tier provides **512 MB of RAM**. Previously, the build commanded `NODE_OPTIONS=--max-old-space-size=4096`, which allowed Node to balloon up to 4 GB. The OS would immediately terminate (OOM-kill) the build process when it exceeded 512 MB. We changed this to `--max-old-space-size=512`, which forces Node to garbage collect aggressively, successfully building the Vite + Tailwind CSS bundles within the limit.

2. **Server Bundle Size Reduced**:
   We optimized the production server build command to compile `server.ts` into a lightweight, bundled format `server.cjs` (in the root directory) without generating unnecessary sourcemaps, saving valuable memory.

3. **Removed `bun.lock`**:
   Render automatically attempts to build with Bun if `bun.lock` is detected in the repository. This caused compatibility issues with several custom Node scripts and standard packages. Deleting `bun.lock` guarantees Render deploys using stable **Node.js and npm**.

4. **Port Binding Configured**:
   The Express server is configured to dynamically bind to `process.env.PORT` or fall back to port `3000`, listening on the host address `0.0.0.0`, which is required for Render.com's ingress proxy to route web requests correctly.

---

## 🚀 Deployment Steps (Render.com)

You can deploy the app using either of the following two options:

### Option A: Using Render Blueprints (Recommended & Simplest)

1. Commit and push the updated code (including the newly created `render.yaml`) to your GitHub repository.
2. Log in to your [Render Dashboard](https://dashboard.render.com).
3. Click **New +** in the top right, and select **Blueprint**.
4. Connect your GitHub repository.
5. Render will detect the `render.yaml` file and automatically configure:
   - Service Type: **Web Service**
   - Runtime: **Node**
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
6. Fill in the environment variables when prompted on-screen (see the **Environment Variables** section below) and click **Apply**.

---

### Option B: Manual Web Service Deployment

If you prefer to configure the Web Service manually:

1. Log in to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** and select **Web Service**.
3. Connect your GitHub repository.
4. Set the following settings:
   - **Name**: `victory-arena-esports` (or any custom name)
   - **Language**: `Node`
   - **Branch**: `main` (or your active development branch)
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free` (512 MB RAM, 0.1 CPU)
5. Click **Advanced** and add the following **Environment Variables**:

| Key | Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Runs Express in production mode |
| `NODE_VERSION` | `20.11.0` | Recommended Node runtime version |
| `GEMINI_API_KEY` | `YOUR_API_KEY` | Your Gemini API Key from Google AI Studio |
| `APP_URL` | `https://your-app.onrender.com` | Your public Render app URL (set this after provisioning) |

---

## 🔐 Optional Custom Firebase Configuration

If you want to use a custom Firebase project for your production site instead of the default shared development sandbox:

Create a new project in the [Firebase Console](https://console.firebase.google.com/), enable **Firestore Database** and **Authentication** (such as Google/Email sign-in), and add these environment variables to Render's **Environment Variables** section:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_DATABASE_ID` (usually `default`)

*(Note: Don't forget to add your Render domain `https://your-app.onrender.com` to the Authorized Domains list in your Firebase Console Authentication tab to allow Google login to function properly!)*
