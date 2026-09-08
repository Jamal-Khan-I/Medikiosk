# MediKiosk

**MediKiosk** is a next-generation hospital outpatient intake platform that streamlines the patient check-in experience, removes language barriers, and saves valuable clinical time for doctors.

Using voice AI, interactive touch, and intelligent document scanning, patients can register, complete clinical questionnaires in their native language, and scan prior medical records before meeting the doctor. Physicians instantly receive a structured, prioritized clinical summary so they can focus on care rather than administrative data entry.

---

## 💡 How MediKiosk Works

```
┌────────────────────────────────┐         ┌────────────────────────────────┐
│      1. Patient Kiosk          │         │    2. AI Synthesis & Triage    │
│  • Voice / Touch in 9 Langs    │ ──────► │  • Real-time Red Flag Check    │
│  • ABHA / Phone Registration   │         │  • Document OCR & Extraction   │
│  • Medical Questionnaire & OCR │         │  • Auto-structured Summary     │
└────────────────────────────────┘         └───────────────┬────────────────┘
                                                           │
                                                           ▼
┌────────────────────────────────┐         ┌────────────────────────────────┐
│     4. Hospital Admin Desk     │         │    3. Doctor Workstation       │
│  • Live Patient Inflow & Queue │ ◄────── │  • Instant Patient Clinical EHR│
│  • Staff & Doctor Management   │         │  • Priority Triage Ranking     │
│  • Operational Analytics       │         │  • One-Click Sign-Off & Export │
└────────────────────────────────┘         └────────────────────────────────┘
```

### The 4 Simple Steps:
1. **Patient Arrives at Kiosk**: The patient selects their preferred language, verifies their identity (via ABHA or fast phone check-in), and answers dynamic clinical intake questions using their voice or touch screen.
2. **Document Digitization**: The patient holds up their previous doctor prescriptions or lab reports to the kiosk camera. MediKiosk digitizes and extracts test values, medications, and findings automatically.
3. **Instant Triage & Summarization**: If the patient reports acute emergency symptoms (e.g., severe chest pain, shortness of breath), the Emergency Triage HUD immediately flashes an alert for stretcher dispatch.
4. **Physician Consultation**: When the patient enters the consultation room, the doctor already has a pre-populated, organized clinical summary, past medical history, and digitized lab reports ready on their screen.

---

## 🌟 Key Portals & Features

### 1. 🗣️ Multilingual Patient OPD Kiosk (`/kiosk`)
- **9 Supported Languages**: English, Hindi, Tamil, Telugu, Kannada, Malayalam, Marathi, Bengali, and Punjabi.
- **Voice & Touch Navigation**: Speak naturally or tap on-screen pills; full keyboard <kbd>Enter</kbd> navigation support.
- **ABHA & Identity Verification**: Fast check-in via ABHA number, Aadhaar OTP, or standard mobile registration.
- **Prescription & Lab Report Scanner**: Built-in camera scanner with AI OCR to extract past medical documents and laboratory reports.
- **Adaptive Questionnaires**: Structured interview tailored to the patient's chief complaint.

### 2. 👨‍⚕️ Physician Clinical Workstation (`/physician`)
- **Live Patient Queue**: Real-time waiting list organized by arrival time and triage priority.
- **Structured Clinical Summary**: Automatically extracts Chief Complaints, History of Present Illness (HPI), Medications, and Allergies.
- **Critical Lab Highlighting**: Instantly flags abnormal laboratory results (e.g., critical glucose or HbA1c levels).
- **One-Click Clinical Sign-Off**: Edit, approve, and export standardized EHR records.

### 3. 📊 Hospital Admin Dashboard (`/admin`)
- **Live OPD Registry**: Real-time monitoring of tokens, registration timestamps, and patient status.
- **Clinical Staff Management**: Manage physician accounts, specialties, and duty status.
- **Operational Analytics**: Overview of daily patient volume, average intake duration, and language preferences.

### 4. 🚨 Emergency Triage Alert Surface (`/triage`)
- **Instant Red-Flag Detection**: Scans intake responses in real-time for critical emergencies.
- **Visual & Audio Alarm**: Flashes the kiosk ID and emergency trigger (e.g., Acute Coronary Syndrome) for rapid response team dispatch.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React, JavaScript, HTML, CSS |
| **Backend** | Node.js, Express.js |
| **Database** | File-backed In-Memory Relational Store (JSON / PostgreSQL Schema) |
| **Multilingual** | i18next (9 Indian Languages) |
| **Voice & Speech** | Web Speech API, Google Gemini Audio |
| **Real-Time Gateway** | WebSockets |
| **AI & Document OCR** | Google Gemini API (Multimodal Vision), Tesseract.js |
| **Security & Auth** | JWT (JSON Web Tokens) |

---

## 🚀 Quick Start (Running Locally)

### 1. Clone the repository
```bash
git clone https://github.com/Jamal-Khan-I/Medikiosk.git
cd Medikiosk
```

### 2. Install dependencies & build
```bash
npm run build
```

### 3. Start the server
```bash
npm start
```
Open **`http://localhost:4000`** in your browser.

---

## 📄 License
This project is open-source under the [MIT License](LICENSE).
