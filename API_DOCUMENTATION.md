# MediKiosk — API & Integration Documentation

This document describes the REST endpoints, WebSocket event channels, and FHIR R4 document bundle schemas for MediKiosk.

---

## 1. Authentication Endpoints

### `POST /api/auth/login`
Authenticates clinical staff (Physician, Triage Nurse, Hospital Administrator).

**Request Body:**
```json
{
  "email": "ajmalkhan@med.in",
  "password": "Medikiosk"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "doc_101",
    "name": "Dr. Ajmal Khan, MD",
    "email": "ajmalkhan@med.in",
    "role": "PHYSICIAN",
    "department": "OPD General Medicine",
    "specialty": "Internal Medicine & Diabetology",
    "nmc_registration_number": "NMC-2024-88419"
  }
}
```

---

## 2. Kiosk Patient Intake Endpoints

### `POST /api/kiosk/session/start`
Initializes a new ephemeral kiosk session and registers the device heartbeat.

**Request Body:**
```json
{
  "kiosk_id": "kiosk_01",
  "preferred_language": "en",
  "intake_mode": "STANDARD_SOCRATES"
}
```

### `POST /api/kiosk/abha/verify`
Verifies an existing 14-digit ABHA ID or ABHA Address against the ABDM registry.

**Request Body:**
```json
{
  "abha_input": "91-8812-3904-5519"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "patient": {
    "id": "pat_001",
    "abha_number": "91-8812-3904-5519",
    "abha_address": "rajesh.verma78@abdm",
    "full_name": "Rajesh Verma",
    "gender": "MALE",
    "dob": "1966-11-23",
    "phone_number": "+91 98190 23419"
  },
  "abha_details": {
    "auth_method": "ABHA_HIP_OTP_VERIFIED",
    "verification_timestamp": "2026-09-08T10:00:00.000Z",
    "kyc_status": "VERIFIED"
  }
}
```

### `POST /api/kiosk/consent`
Records granular, audio-narrated patient consent pursuant to the DPDP Act, 2023.

**Request Body:**
```json
{
  "patient_id": "pat_001",
  "consents": {
    "consent_intake": true,
    "consent_ocr": true,
    "consent_abdm_sync": true,
    "consent_anonymized_research": false
  },
  "language": "en",
  "audio_narrated": true
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "consent": {
    "id": "cns_1788107291_a83f",
    "encounter_id": "enc_pre_1788107291",
    "patient_id": "pat_001",
    "consent_intake": true,
    "consent_ocr": true,
    "consent_abdm_sync": true,
    "consent_anonymized_research": false,
    "dpdp_hash": "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "captured_at": "2026-09-08T10:01:10.000Z"
  }
}
```

### `POST /api/kiosk/intake/analyze-step`
Low-latency (<15ms) parallel triage analyzer that scans patient answers for emergency red-flag symptoms.

**Request Body:**
```json
{
  "current_text": "Severe crushing chest pain spreading down my left arm and jaw",
  "current_answers": {
    "chief_complaint": "Chest pain",
    "socrates_radiation": "Left arm and jaw"
  },
  "kiosk_id": "kiosk_01",
  "patient_name": "Rajesh Verma"
}
```

**Response (200 OK):**
```json
{
  "isRedFlag": true,
  "severity": "CRITICAL",
  "alerts": [
    {
      "ruleId": "ACS_CARDIO",
      "severity": "CRITICAL",
      "title": "Suspected Acute Coronary Syndrome / Myocardial Infarction",
      "matchedKeywords": ["chest pain", "crushing", "left arm"],
      "recommendedAction": "Immediate ECG in Room 104, Stretcher dispatch to Kiosk, alert On-Duty Cardiologist."
    }
  ],
  "summaryReason": "Suspected Acute Coronary Syndrome / Myocardial Infarction (chest pain, crushing, left arm)"
}
```

### `POST /api/kiosk/documents/upload`
Uploads and digitizes prior paper prescriptions, laboratory reports, or discharge summaries using optical OCR.

**Request Body:**
```json
{
  "patient_id": "pat_001",
  "document_type": "LAB_REPORT",
  "file_name": "Lipid_Profile_and_HbA1c.pdf"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "document": {
    "id": "doc_1788107300_b921",
    "document_type": "LAB_REPORT",
    "file_name": "Lipid_Profile_and_HbA1c.pdf",
    "ocr_confidence_score": 98.2,
    "ocr_status": "COMPLETED"
  },
  "extracted_entities": [
    {
      "category": "LAB_VALUE",
      "entity_name": "HbA1c",
      "entity_value": "9.4",
      "unit": "%",
      "reference_range": "< 5.7 %",
      "is_abnormal": true,
      "abnormal_flag": "HIGH CRITICAL"
    }
  ]
}
```

---

## 3. Physician Dashboard Endpoints

### `GET /api/physician/queue`
Fetches active OPD encounters sorted with red-flagged emergencies visually prioritized.

### `PUT /api/physician/encounters/:id/summary`
Performs an inline edit on the clinical summary and logs an immutable audit trail entry.

**Request Body:**
```json
{
  "field": "chief_complaint",
  "value": "Retrosternal crushing chest pressure radiating to left arm and jaw (3 hours) with acute diaphoresis.",
  "reason": "Physician clinical clarification following bedside auscultation."
}
```

### `POST /api/physician/encounters/:id/confirm`
Confirms the encounter, changes status to `REVIEWED_CONFIRMED`, and generates the official ABDM FHIR R4 Bundle.

**Response Structure (FHIR R4 Bundle):**
```json
{
  "success": true,
  "encounter": {
    "id": "enc_001",
    "status": "REVIEWED_CONFIRMED"
  },
  "fhir_bundle": {
    "resourceType": "Bundle",
    "type": "document",
    "id": "bundle-enc_001",
    "entry": [
      {
        "resource": {
          "resourceType": "Composition",
          "status": "final",
          "title": "OPD Clinical Intake & SOCRATES History Summary",
          "section": [
            { "title": "Chief Complaint", "text": { "status": "generated", "div": "<div>...</div>" } },
            { "title": "History of Present Illness (SOCRATES)", "text": { "status": "generated", "div": "<div>...</div>" } }
          ]
        }
      },
      {
        "resource": {
          "resourceType": "Patient",
          "id": "pat_001",
          "name": [{ "text": "Rajesh Verma" }]
        }
      }
    ]
  }
}
```

---

## 4. WebSocket Real-Time Event Specifications

Connect to `ws://localhost:4000` (or the configured backend host). MediKiosk broadcasts the following event types:

| Event Type | Payload Data | Triggering Condition |
|---|---|---|
| `PATIENT_QUEUE_UPDATE` | `{ encounter_id, patient_id }` | New kiosk submission, physician inline edit, or confirmation |
| `TRIAGE_ALERT_TRIGGERED`| `{ id, severity, kiosk_id, symptom_trigger }` | Sub-15ms red flag detected during active patient intake |
| `TRIAGE_ALERT_UPDATED`  | `{ id, status, resolution_notes }` | Triage nurse acknowledges or resolves an emergency |
| `KIOSK_STATUS_CHANGE`   | `{ kiosk_id, status }` | Kiosk transitions between `IDLE`, `ACTIVE_INTAKE`, or `MAINTENANCE` |
