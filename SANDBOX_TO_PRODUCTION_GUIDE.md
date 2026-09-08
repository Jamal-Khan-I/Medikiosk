# MediKiosk — Sandbox to Production Transition Guide

This document details all modules currently running against sandbox / stub implementations and specifies the exact configuration and endpoint changes required for full hospital production rollout.

---

## 1. Inventory of Sandbox / Simulated Modules

| Component | Current Implementation | Production Replacement | Code / Config Change Required |
|---|---|---|---|
| **ABDM M1 ABHA Gateway** | High-fidelity sandbox accepting 14-digit format and standard Aadhaar OTP `123456` | National Health Authority (NHA) ABDM Gateway (`https://dev.abdm.gov.in/gateway/v0.5`) | Set `ABDM_CLIENT_ID`, `ABDM_CLIENT_SECRET`, and `ABDM_GATEWAY_URL` in backend `.env` |
| **Aadhaar OTP Service** | Simulated in `abdmService.js` with instant verification | UIDAI / NHA e-KYC Auth Gateway | Route through NHA `/v1/registration/aadhaar/generateOtp` (No frontend UI change) |
| **FHIR Document Dispatch** | In-memory FHIR R4 Bundle generator conforming to ABDM HIP M3 | Hospital Information System (HIS) / ABDM Health Information Provider Bridge | Set `ABDM_HIP_ID` and dispatch URL in `abdmService.js` |
| **Optical OCR Engine** | High-accuracy entity extractor simulation for Rx and Labs | Cloud Vision Healthcare OCR / On-Premise Tesseract Medical Model | Swap `services/documentService.js` parser hook with live OCR model endpoint |
| **SMS Notification Gateway** | In-memory log output | CDAC / NIC SMS Gateway or Twilio | Set `SMS_GATEWAY_API_KEY` in environment variables |

---

## 2. Environment Configuration (`backend/.env`)

To switch MediKiosk to production mode, supply the following environment variables:

```env
# Server & Security
PORT=4000
NODE_ENV=production
JWT_SECRET=super_secure_enterprise_random_jwt_secret_key_2026
CORS_ORIGIN=https://kiosk.apexmed.in,https://workstation.apexmed.in

# Database (PostgreSQL Production)
DATABASE_URL=postgresql://medikiosk_user:secure_password@db.apexmed.internal:5432/medikiosk_prod
DB_SSL_ENABLED=true

# ABDM Production Credentials (NHA Gateway)
ABDM_ENV=production
ABDM_GATEWAY_URL=https://gateway.abdm.gov.in/v0.5
ABDM_CLIENT_ID=apex_healthcare_prod_client_id
ABDM_CLIENT_SECRET=apex_healthcare_prod_secret_token
ABDM_HIP_ID=IN2710001824

# Live OCR Service Endpoint (e.g., Azure Health Insights / Google Cloud Healthcare API)
OCR_SERVICE_ENDPOINT=https://healthcare-ocr.internal.apexmed.in/v1/extract
OCR_API_KEY=live_ocr_service_key

# DPDP Act 2023 Compliance & Retention
EPHEMERAL_KIOSK_CACHE_TTL_SECONDS=180
DATA_FIDUCIARY_LEGAL_NAME="Apex Healthcare Systems Ltd."
DPO_EMAIL="dpo-grievance@apexmed.in"
```

---

## 3. Production Deployment Architecture

```
Internet (Patients / Kiosks)
      │
   [ Cloudflare / WAF with Rate Limiting (100 req/min per Kiosk IP) ]
      │
   [ Hospital DMZ / NGINX Reverse Proxy (SSL Termination TLS 1.3) ]
      ├── /                 ──> Frontend Vite Production Build (NGINX Static)
      ├── /api              ──> Node.js Express Cluster (PM2 / Kubernetes)
      └── /ws               ──> WebSocket Gateway (Real-Time Queue & Triage Alerts)
            │
      [ Relational Database (PostgreSQL 16 Multi-AZ with WAL Archiving) ]
      [ Hospital Information System / EHR via HL7 FHIR R4 ]
```

---

## 4. NHA ABDM Production Certification Checklist

Before deploying to live outpatient departments:
1. **Security Audit:** Conduct VAPT (Vulnerability Assessment and Penetration Testing) on Kiosk terminals and API endpoints by a CERT-In empaneled auditor.
2. **NHA Integration Testing:** Complete the 3 sandbox testing milestones on the NHA Sandbox portal and obtain the Milestone 1, 2, and 3 compliance certificates.
3. **DPDP Compliance Sign-off:** Ensure the Data Protection Officer (DPO) and legal counsel approve the Data Privacy Impact Assessment (DPIA) and patient audio narration scripts.
