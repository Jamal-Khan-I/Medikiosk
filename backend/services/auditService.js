// DPDP Act 2023 Consent Ledger & Physician Modification Audit Service

import crypto from 'crypto';
import { store } from '../db/store.js';

export function recordConsent({ encounterId, patientId, consents, language = 'en', audioNarrated = true, ipAddress = '127.0.0.1' }) {
  const hashPayload = JSON.stringify({
    encounterId,
    patientId,
    consents,
    timestamp: new Date().toISOString(),
    ipAddress
  });
  
  const dpdpHash = `sha256:${crypto.createHash('sha256').update(hashPayload).digest('hex')}`;

  const consentRecord = store.insert('consent_records', {
    encounter_id: encounterId,
    patient_id: patientId,
    consent_intake: !!consents.consent_intake,
    consent_ocr: !!consents.consent_ocr,
    consent_abdm_sync: !!consents.consent_abdm_sync,
    consent_anonymized_research: !!consents.consent_anonymized_research,
    consent_language: language,
    audio_narration_played: audioNarrated,
    dpdp_hash: dpdpHash,
    ip_address: ipAddress
  });

  return consentRecord;
}

export function logPhysicianAudit({ encounterId, staffId, actionType, fieldModified, previousValue, newValue, reason = 'Clinical Correction', ipAddress = '127.0.0.1' }) {
  return store.insert('audit_logs', {
    encounter_id: encounterId,
    staff_id: staffId,
    action_type: actionType,
    field_modified: fieldModified,
    previous_value: previousValue !== undefined ? String(previousValue) : null,
    new_value: String(newValue),
    reason: reason,
    ip_address: ipAddress
  });
}
