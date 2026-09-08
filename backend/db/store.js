// In-Memory & File-Backed Relational Store for MediKiosk
// Supports ACID-like in-memory lookups, relational joins, and persistent state

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'medikiosk_data.json');

const INITIAL_DATA = {
  staff_accounts: [
    {
      id: 'doc_101',
      name: 'Dr. Ajmal Khan, MD',
      email: 'ajmalkhan@med.in',
      role: 'PHYSICIAN',
      specialty: 'Internal Medicine & Diabetology',
      department: 'OPD General Medicine',
      nmc_registration_number: 'NMC-2024-88419',
      password: 'Medikiosk',
      password_hash: 'Medikiosk',
      is_active: true
    },
    {
      id: 'doc_102',
      name: 'Dr. Anand Kulkarni, BAMS, MD (Ayu)',
      email: 'anand.kulkarni@apexmed.in',
      role: 'PHYSICIAN',
      specialty: 'Ayurvedic Medicine & Kayachikitsa',
      department: 'AYUSH Integrated OPD',
      nmc_registration_number: 'NCISM-2016-44312',
      password: 'doctor123',
      password_hash: 'doctor123',
      is_active: true
    },
    {
      id: 'admin_01',
      name: 'Vikramaditya Sengupta',
      email: 'v.sengupta@apexmed.in',
      role: 'ADMIN',
      specialty: 'Hospital Operations Director',
      department: 'Hospital Administration',
      nmc_registration_number: 'N/A',
      password: 'admin123',
      password_hash: 'admin123',
      is_active: true
    },
    {
      id: 'triage_01',
      name: 'Sister Mary Fernandez, RN',
      email: 'mary.fernandez@apexmed.in',
      role: 'TRIAGE_NURSE',
      specialty: 'Emergency Triage & Rapid Response',
      department: 'Emergency / Triage OPD',
      nmc_registration_number: 'INC-2018-99012',
      is_active: true
    }
  ],
  kiosk_devices: [
    {
      id: 'kiosk_01',
      kiosk_code: 'KIOSK-OPD-101',
      location_name: 'Ground Floor OPD Atrium — East Wing',
      department: 'OPD General Medicine',
      status: 'IDLE',
      battery_level: 98,
      firmware_version: 'v2.4.1',
      camera_health: 'OK',
      mic_health: 'OK',
      current_encounter_id: null,
      last_heartbeat: new Date().toISOString()
    },
    {
      id: 'kiosk_02',
      kiosk_code: 'KIOSK-OPD-102',
      location_name: 'Ground Floor OPD Atrium — West Wing',
      department: 'OPD General Medicine',
      status: 'IDLE',
      battery_level: 100,
      firmware_version: 'v2.4.1',
      camera_health: 'OK',
      mic_health: 'OK',
      current_encounter_id: null,
      last_heartbeat: new Date().toISOString()
    },
    {
      id: 'kiosk_03',
      kiosk_code: 'KIOSK-AYUSH-201',
      location_name: '2nd Floor AYUSH Integrative Care Wing',
      department: 'AYUSH Integrated OPD',
      status: 'IDLE',
      battery_level: 92,
      firmware_version: 'v2.4.1',
      camera_health: 'OK',
      mic_health: 'OK',
      current_encounter_id: null,
      last_heartbeat: new Date().toISOString()
    },
    {
      id: 'kiosk_04',
      kiosk_code: 'KIOSK-CAR-301',
      location_name: 'Cardiology OPD Annex — Room 12',
      department: 'Cardiology OPD',
      status: 'IDLE',
      battery_level: 89,
      firmware_version: 'v2.4.1',
      camera_health: 'OK',
      mic_health: 'OK',
      current_encounter_id: null,
      last_heartbeat: new Date().toISOString()
    }
  ],
  patients: [],
  encounters: [],
  consent_records: [],
  clinical_summaries: [],
  documents: [],
  extracted_entities: [],
  emergency_triage_alerts: [],
  audit_logs: []
};

// Store container with helper getters/setters
class MediKioskStore {
  constructor() {
    this.data = this.loadData();
  }

  loadData() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        // Ensure clean structure
        return {
          staff_accounts: parsed.staff_accounts || INITIAL_DATA.staff_accounts,
          kiosk_devices: parsed.kiosk_devices || INITIAL_DATA.kiosk_devices,
          patients: parsed.patients || [],
          encounters: parsed.encounters || [],
          consent_records: parsed.consent_records || [],
          clinical_summaries: parsed.clinical_summaries || [],
          documents: parsed.documents || [],
          extracted_entities: parsed.extracted_entities || [],
          emergency_triage_alerts: parsed.emergency_triage_alerts || [],
          audit_logs: parsed.audit_logs || []
        };
      }
    } catch (e) {
      console.warn('Using fresh in-memory data store:', e.message);
    }
    return JSON.parse(JSON.stringify(INITIAL_DATA));
  }

  saveData() {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (e) {
      console.error('Failed to write store file:', e.message);
    }
  }

  get(table) {
    return this.data[table] || [];
  }

  findById(table, id) {
    if (id === undefined || id === null) return null;
    return (this.data[table] || []).find(item => String(item.id) === String(id));
  }

  insert(table, record) {
    if (!this.data[table]) this.data[table] = [];
    if (!record.id) record.id = `${table.slice(0, 3)}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    if (!record.created_at) record.created_at = new Date().toISOString();
    this.data[table].push(record);
    this.saveData();
    return record;
  }

  update(table, id, updates) {
    if (!this.data[table] || id === undefined || id === null) return null;
    const idx = this.data[table].findIndex(item => String(item.id) === String(id));
    if (idx === -1) return null;
    this.data[table][idx] = {
      ...this.data[table][idx],
      ...updates,
      updated_at: new Date().toISOString()
    };
    this.saveData();
    return this.data[table][idx];
  }

  delete(table, id) {
    if (!this.data[table] || id === undefined || id === null) return false;
    const initialLen = this.data[table].length;
    this.data[table] = this.data[table].filter(item => String(item.id) !== String(id));
    this.saveData();
    return this.data[table].length < initialLen;
  }
}

export const store = new MediKioskStore();
