-- MediKiosk Database Schema (PostgreSQL Standard DDL)
-- Compliant with ABDM (Ayushman Bharat Digital Mission) & DPDP Act 2023

CREATE TABLE IF NOT EXISTS staff_accounts (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    email VARCHAR(128) UNIQUE NOT NULL,
    password_hash VARCHAR(256) NOT NULL,
    role VARCHAR(32) NOT NULL CHECK (role IN ('PHYSICIAN', 'ADMIN', 'TRIAGE_NURSE', 'AUDITOR')),
    specialty VARCHAR(64),
    department VARCHAR(64) DEFAULT 'General Medicine',
    nmc_registration_number VARCHAR(64),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS kiosk_devices (
    id VARCHAR(64) PRIMARY KEY,
    kiosk_code VARCHAR(32) UNIQUE NOT NULL,
    location_name VARCHAR(128) NOT NULL,
    department VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'IDLE' CHECK (status IN ('IDLE', 'ACTIVE_INTAKE', 'OFFLINE', 'MAINTENANCE')),
    battery_level INTEGER DEFAULT 100,
    firmware_version VARCHAR(32) DEFAULT 'v2.4.1',
    camera_health VARCHAR(16) DEFAULT 'OK',
    mic_health VARCHAR(16) DEFAULT 'OK',
    last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS patients (
    id VARCHAR(64) PRIMARY KEY,
    abha_number VARCHAR(32) UNIQUE,
    abha_address VARCHAR(64) UNIQUE,
    full_name VARCHAR(128) NOT NULL,
    gender VARCHAR(16) NOT NULL CHECK (gender IN ('MALE', 'FEMALE', 'OTHER')),
    dob DATE,
    age INTEGER,
    phone_number VARCHAR(16) NOT NULL,
    blood_group VARCHAR(8),
    emergency_contact VARCHAR(16),
    address_pincode VARCHAR(10),
    preferred_language VARCHAR(16) DEFAULT 'en',
    is_new_patient BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS encounters (
    id VARCHAR(64) PRIMARY KEY,
    patient_id VARCHAR(64) REFERENCES patients(id) ON DELETE CASCADE,
    token_number VARCHAR(32),
    kiosk_id VARCHAR(64) REFERENCES kiosk_devices(id),
    department VARCHAR(64) NOT NULL DEFAULT 'OPD General Medicine',
    intake_mode VARCHAR(32) DEFAULT 'STANDARD_SOCRATES' CHECK (intake_mode IN ('STANDARD_SOCRATES', 'AYUSH_DASHAVIDHA')),
    status VARCHAR(32) DEFAULT 'AWAITING_PHYSICIAN' CHECK (status IN ('INTAKE_IN_PROGRESS', 'AWAITING_PHYSICIAN', 'REVIEWED_CONFIRMED', 'AMENDED_CONFIRMED', 'TRIAGE_ESCALATED')),
    is_red_flagged BOOLEAN DEFAULT FALSE,
    red_flag_reason TEXT,
    red_flag_severity VARCHAR(16) CHECK (red_flag_severity IN ('CRITICAL', 'HIGH', 'MODERATE', 'NONE')),
    session_start TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    session_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS consent_records (
    id VARCHAR(64) PRIMARY KEY,
    encounter_id VARCHAR(64),
    patient_id VARCHAR(64) REFERENCES patients(id) ON DELETE CASCADE,
    consent_intake BOOLEAN NOT NULL DEFAULT TRUE,
    consent_ocr BOOLEAN NOT NULL DEFAULT TRUE,
    consent_abdm_sync BOOLEAN NOT NULL DEFAULT TRUE,
    consent_anonymized_research BOOLEAN NOT NULL DEFAULT FALSE,
    consent_language VARCHAR(16) NOT NULL,
    audio_narration_played BOOLEAN DEFAULT TRUE,
    captured_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    dpdp_hash VARCHAR(128) NOT NULL,
    ip_address VARCHAR(64),
    revoked_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS clinical_summaries (
    id VARCHAR(64) PRIMARY KEY,
    encounter_id VARCHAR(64) UNIQUE REFERENCES encounters(id) ON DELETE CASCADE,
    patient_id VARCHAR(64) REFERENCES patients(id) ON DELETE CASCADE,
    patient_demographics_summary TEXT,
    chief_complaint TEXT NOT NULL,
    history_of_present_illness TEXT,
    socrates_site VARCHAR(128),
    socrates_onset VARCHAR(128),
    socrates_character VARCHAR(128),
    socrates_radiation VARCHAR(128),
    socrates_associations TEXT,
    socrates_timing VARCHAR(128),
    socrates_exacerbating_relieving TEXT,
    socrates_severity INTEGER CHECK (socrates_severity BETWEEN 1 AND 10),
    past_medical_history TEXT,
    past_surgical_history TEXT,
    drug_allergies TEXT,
    food_allergies TEXT,
    current_medications TEXT,
    family_history TEXT,
    personal_history TEXT,
    review_of_systems TEXT,
    prior_investigations_summary TEXT,
    -- AYUSH Dashavidha Pariksha & Ahara-Vihara
    ayush_prakriti VARCHAR(64),
    ayush_vikriti VARCHAR(64),
    ayush_sara VARCHAR(64),
    ayush_samhanana VARCHAR(64),
    ayush_pramana VARCHAR(64),
    ayush_satmya VARCHAR(64),
    ayush_satva VARCHAR(64),
    ayush_ahara_shakti VARCHAR(64),
    ayush_vyayama_shakti VARCHAR(64),
    ayush_vaya VARCHAR(64),
    ayush_ahara_vihara TEXT,
    raw_transcript TEXT,
    confirmed_by_physician_id VARCHAR(64) REFERENCES staff_accounts(id),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS documents (
    id VARCHAR(64) PRIMARY KEY,
    encounter_id VARCHAR(64),
    patient_id VARCHAR(64) REFERENCES patients(id) ON DELETE CASCADE,
    document_type VARCHAR(32) NOT NULL CHECK (document_type IN ('PRESCRIPTION', 'LAB_REPORT', 'DISCHARGE_SUMMARY', 'IMAGING_REPORT', 'VACCINATION_RECORD')),
    file_name VARCHAR(256) NOT NULL,
    document_date DATE,
    issuing_facility VARCHAR(128),
    ocr_status VARCHAR(32) DEFAULT 'COMPLETED' CHECK (ocr_status IN ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED')),
    ocr_confidence_score NUMERIC(5,2) DEFAULT 96.50,
    extracted_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS extracted_entities (
    id VARCHAR(64) PRIMARY KEY,
    document_id VARCHAR(64) REFERENCES documents(id) ON DELETE CASCADE,
    encounter_id VARCHAR(64),
    category VARCHAR(32) NOT NULL CHECK (category IN ('MEDICATION', 'DIAGNOSIS', 'LAB_VALUE', 'ALLERGY', 'PROCEDURE')),
    entity_name VARCHAR(128) NOT NULL,
    entity_value VARCHAR(128),
    unit VARCHAR(32),
    reference_range VARCHAR(64),
    is_abnormal BOOLEAN DEFAULT FALSE,
    abnormal_flag VARCHAR(16),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    encounter_id VARCHAR(64) REFERENCES encounters(id) ON DELETE CASCADE,
    staff_id VARCHAR(64) REFERENCES staff_accounts(id),
    action_type VARCHAR(64) NOT NULL,
    field_modified VARCHAR(64),
    previous_value TEXT,
    new_value TEXT,
    reason TEXT,
    ip_address VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS emergency_triage_alerts (
    id VARCHAR(64) PRIMARY KEY,
    encounter_id VARCHAR(64),
    kiosk_id VARCHAR(64) REFERENCES kiosk_devices(id),
    patient_name VARCHAR(128) NOT NULL,
    severity VARCHAR(16) NOT NULL CHECK (severity IN ('CRITICAL', 'HIGH', 'MODERATE')),
    symptom_trigger VARCHAR(256) NOT NULL,
    kiosk_location VARCHAR(128) NOT NULL,
    acknowledged_by VARCHAR(64) REFERENCES staff_accounts(id),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    status VARCHAR(32) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ACKNOWLEDGED', 'DISPATCHED', 'RESOLVED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
