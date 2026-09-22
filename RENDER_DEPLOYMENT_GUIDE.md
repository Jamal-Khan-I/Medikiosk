# MediKiosk — Render Production Deployment Guide

This guide details how to deploy **MediKiosk** to [Render](https://render.com) so that **every single feature works in production**:
- ✅ **Patient Touchscreen Kiosk** with all 22 Eighth Schedule Indian Languages + English
- ✅ **Bhashini Voice Engine** (ASR speech recognition & TTS voice playback)
- ✅ **Google Gemini Clinical AI** (Intelligent clinical summarization, red flag triage guardrails, entity extraction)
- ✅ **Bhashini Document OCR** (Prescription & lab report scanning)
- ✅ **Real-Time WebSockets** (Instant queue updates & Emergency Triage HUD alerts)
- ✅ **Direct Physician Workstation** (Zero login friction, clinical editing, FHIR R4 encounter sign-off)
- ✅ **Hospital Admin Panel & AYUSH Dashavidha Pariksha Intake**

---

## Architecture Overview on Render

MediKiosk is engineered as a **Unified High-Performance Node.js Service**:
- **Single Port:** The Node.js Express server (`backend/server.js`) hosts the REST API (`/api/*`), the real-time WebSocket server (`wss://...`), and serves the compiled static Vite frontend bundle (`frontend/dist`) on the exact same port.
- **Zero CORS / Domain Hassles:** Because both frontend and backend share the same origin URL (`https://your-service.onrender.com`), there are no cross-origin restrictions, cookie issues, or SSL certificate mismatches.
- **Automatic WSS Upgrade:** WebSocket connections automatically switch to `wss://` under Render's managed SSL/TLS.

---

## Prerequisites

1. A **GitHub account** with access to your repository: `https://github.com/Jamal-Khan-I/Medikiosk`
2. A **Render account** (Sign up free at [render.com](https://render.com))
3. Your **API Keys**:
   - **Google Gemini API Key** (`GEMINI_API_KEY`)
   - **Bhashini Keys** (`BHASHINI_UDYAT_KEY` and `BHASHINI_INFERENCE_KEY`)

---

## Deployment Option 1: 1-Click Render Blueprint (Recommended)

MediKiosk includes a ready-to-use [`render.yaml`](./render.yaml) blueprint in the root directory.

### Step-by-Step Instructions:
1. Log in to your [Render Dashboard](https://dashboard.render.com).
2. Click the **"New +"** button in the top right and select **"Blueprint"**.
3. Connect your GitHub account and select your **`Medikiosk`** repository.
4. Render will detect the `render.yaml` file automatically and show the `medikiosk` web service.
5. Render will prompt you to enter values for the required secret environment variables:
   - `GEMINI_API_KEY`: Paste your Gemini API Key
   - `BHASHINI_UDYAT_KEY`: Paste your Bhashini Udyat User ID
   - `BHASHINI_INFERENCE_KEY`: Paste your Bhashini Inference API Key
6. Click **"Apply"**.
7. Render will automatically:
   - Install backend and frontend dependencies
   - Build the optimized Vite production bundle
   - Launch the server on `process.env.PORT`
   - Attach a free SSL certificate (`https://your-service.onrender.com`)

---

## Deployment Option 2: Manual Web Service Setup

If you prefer to configure the service manually through Render's Web UI:

### Step 1: Create New Web Service
1. In the Render Dashboard, click **"New +"** → **"Web Service"**.
2. Select **"Build and deploy from a Git repository"** and choose `Medikiosk`.

### Step 2: Configure Service Settings
| Setting | Recommended Value | Notes |
|:---|:---|:---|
| **Name** | `medikiosk` | Determines your default URL: `medikiosk.onrender.com` |
| **Region** | `Singapore` or `Frankfurt` or `Oregon` | Select the region closest to your users |
| **Branch** | `main` | Production branch |
| **Root Directory** | *(Leave blank)* | Defaults to repo root |
| **Runtime** | `Node` | Native Node.js runtime |
| **Build Command** | `npm run build` | Installs deps and builds Vite frontend |
| **Start Command** | `npm start` | Boots up `backend/server.js` |
| **Instance Type** | `Free` | Upgradeable to Starter/Standard anytime |

### Step 3: Add Health Check Path
Under **Advanced Settings**:
- **Health Check Path:** `/api/health`
  *(Render will probe this endpoint to verify server health before routing traffic)*

### Step 4: Configure Environment Variables
In the **Environment Variables** section, add the following key-value pairs:

| Variable Name | Value / Description | Example |
|:---|:---|:---|
| `NODE_ENV` | `production` | Enables production optimizations |
| `GEMINI_API_KEY` | Your Google Gemini API Key | `AIzaSy...` |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Fast clinical reasoning & triage |
| `BHASHINI_UDYAT_KEY` | Your Bhashini User ID | `462851d08f-...` |
| `BHASHINI_INFERENCE_KEY` | Your Bhashini Pipeline Inference Key | `Gwav96j...` |
| `JWT_SECRET` | Strong random secret string | *(Click "Generate" in Render)* |

### Step 5: Deploy
Click **"Create Web Service"**. Render will stream the build logs in real-time. Once the build finishes and the health check responds with HTTP 200, your app will be live at `https://<your-service-name>.onrender.com`!

---

## Feature Verification Checklist on Render

Once your deployment is live, verify that all features work properly:

### 1. Health & Server Status
- Open `https://<your-service>.onrender.com/api/health` in your browser.
- Expected response:
  ```json
  {"status":"HEALTHY","timestamp":"...","version":"2.4.1"}
  ```

### 2. Patient Kiosk (Surface A)
- Navigate to your main Render URL (`https://<your-service>.onrender.com`).
- Click **"A: Patient Kiosk"** (or **"Launch Patient Kiosk"**).
- **Step 1 (Language Selector):**
  - Verify all 22 Indian languages + English appear in authentic native scripts.
  - Test the instant search filter (e.g., type "Tamil" or "தமிழ்").
  - Test regional filter pills ("South", "North", "Commonly Used").
- **Step 1 (Identity & ABHA):**
  - Enter ABHA ID `91-2345-6789-0123` or tap "Generate / Link ABHA".
  - Test Aadhaar OTP challenge with sample OTP `123456`.
- **Step 2 (DPDP Statutory Consent):**
  - Check consent notice cards in the selected native language.
  - Check the mandatory and optional consent checkboxes.
- **Step 3 (Clinical Voice & Touch Intake):**
  - Choose standard SOCRATES or AYUSH Dashavidha Pariksha mode.
  - Speak into the microphone or use touch chip options.
  - Test red-flag triage detection (e.g., mention severe chest pain with breathing difficulty).
- **Step 4 (Document OCR Scanner):**
  - Upload a prescription or lab report image / PDF.
  - Verify OCR entity extraction displays extracted vitals, medicines, or lab values.
- **Step 5 (Review & Token Card):**
  - Confirm intake details and generate OPD token (e.g., `TK-101`).

### 3. Physician Workstation (Surface B)
- Click **"B: Physician"** from the top surface switcher.
- Notice **zero sign-in barriers** — the Outpatient Queue loads immediately!
- Verify the active clinician badge (`Dr. Ajmal Khan, MD`).
- Select any patient encounter from the queue:
  - Review AI clinical summary and extracted entities.
  - Test inline clinical note editing with real-time audit ledger logging.
  - Click **"Sign-Off Encounter & Generate ABDM FHIR"** to produce a validated FHIR R4 Bundle.

### 4. Emergency Triage HUD (Surface D)
- Click **"D: Triage HUD"**.
- If a patient reported severe acute symptoms during Kiosk intake, an emergency banner with auditory siren warning appears in real-time.
- Test "Acknowledge" and "Resolve Alert" workflow.

### 5. Hospital Admin Panel (Surface C)
- Click **"C: Admin"**.
- View live OPD registration statistics, triage breakdown charts, and language distribution graphs.
- Inspect the staff registry and DPDP compliance audit trail.

---

## Render Free Tier Notes & Best Practices

1. **Cold Start Wake-Up (Free Tier Spin-Down):**
   - Render's free tier services spin down after **15 minutes of inactivity**.
   - The first request after spin-down may take ~30–50 seconds while the container boots up.
   - *Pro-Tip:* To keep it awake during clinical demonstrations or hackathons, use a free cron monitor like [UptimeRobot](https://uptimerobot.com) to ping `https://<your-service>.onrender.com/api/health` every 10 minutes.

2. **File-Backed JSON Database Persistence:**
   - MediKiosk uses an optimized JSON datastore (`backend/db/medikiosk_data.json`) that saves state in-memory and writes to disk.
   - On Render's Free tier, the filesystem is ephemeral (it resets to the initial demo state whenever the service restarts or redeploys).
   - If you want patient records and logs to permanently persist across redeploys, add a **Render Persistent Disk** (`/opt/render/project/src/backend/db`) under the service's Disks tab, or upgrade to a database like PostgreSQL / MongoDB when migrating to enterprise production.

3. **Microphone Permissions over HTTPS:**
   - Modern web browsers strictly require HTTPS to access the microphone.
   - Render automatically provisions a valid SSL/TLS certificate for your `*.onrender.com` domain, guaranteeing that microphone voice recording works seamlessly on mobile devices and desktop kiosks.
