import React from 'react';
import { Shield, Lock, FileText, CheckCircle2, UserCheck, AlertCircle } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div style={{ padding: '64px 0', backgroundColor: 'var(--paper-white)' }}>
      <div className="container-custom" style={{ maxWidth: '880px' }}>
        {/* Header */}
        <div style={{ marginBottom: '48px', borderBottom: '1px solid var(--border-light)', paddingBottom: '32px' }}>
          <span className="badge-pill badge-peach" style={{ marginBottom: '16px' }}>Statutory Compliance</span>
          <h1 style={{ marginBottom: '16px' }}>Privacy & Data Protection Policy</h1>
          <p style={{ color: 'var(--slate-gray)', fontSize: '1.05rem', lineHeight: 1.6 }}>
            Formal policy formulated in strict compliance with the <strong>Digital Personal Data Protection (DPDP) Act, 2023</strong> (Act No. 22 of 2023) and the <strong>Ayushman Bharat Digital Mission (ABDM) Health Data Management Policy</strong>.
          </p>
          <div style={{ display: 'flex', gap: '20px', marginTop: '20px', fontSize: '0.82rem', color: 'var(--slate-gray)' }}>
            <span><strong>Effective Date:</strong> January 1, 2026</span>
            <span><strong>Version:</strong> 2.4 (Enterprise Production)</span>
            <span><strong>Data Fiduciary:</strong> Apex Healthcare Systems Ltd.</span>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '36px', lineHeight: 1.7, color: 'var(--ink-soft)' }}>
          <section>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '12px', color: 'var(--ink-black)' }}>1. Data Fiduciary & Scope</h2>
            <p>
              MediKiosk operates as a clinical data intake and triage platform deployed within hospital outpatient departments. The deploying hospital entity acts as the <strong>Data Fiduciary</strong>, and MediKiosk acts as the <strong>Data Processor</strong> under Section 2(i) and Section 2(k) of the DPDP Act, 2023. This policy governs all personal data, biometric voice inputs, optical document scans, and clinical history collected via physical kiosk terminals or tablet interfaces.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '12px', color: 'var(--ink-black)' }}>2. Grounds for Processing: Granular, Informed Consent (Section 6)</h2>
            <p style={{ marginBottom: '12px' }}>
              In accordance with Section 6 of the DPDP Act 2023, data processing is carried out solely on the basis of free, specific, informed, unconditional, and unambiguous consent given by the Data Principal (patient or authorized guardian). Consent is captured granularly across discrete processing activities:
            </p>
            <ul style={{ listStyle: 'disc', paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><strong>Clinical History Intake:</strong> Processing voice and touch inputs to compile a structured clinical history for the treating physician.</li>
              <li><strong>Optical Character Recognition (OCR):</strong> Scanning prior paper prescriptions and laboratory reports to extract medications and test values.</li>
              <li><strong>ABDM Health Locker Sync:</strong> Linking consultation summaries to the patient’s Ayushman Bharat Health Account (ABHA) address.</li>
              <li><strong>Anonymized Statistical Analytics:</strong> Optional, independently toggleable consent for de-identified aggregate research (disabled by default).</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '12px', color: 'var(--ink-black)' }}>3. Audio Narration & Multi-Lingual Notice (Section 5)</h2>
            <p>
              To ensure accessibility for elderly and low-literacy patients across India, every consent notice is accompanied by an itemized, clear voice narration in the patient’s selected language (Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, English). The Data Principal may accept or decline each purpose individually before any data processing commences.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '12px', color: 'var(--ink-black)' }}>4. Data Minimization, Purpose Limitation & Ephemeral Kiosk Storage</h2>
            <p>
              Data collected is strictly limited to information necessary for clinical evaluation during the scheduled encounter. 
              <strong> Kiosk Client Ephemeral Storage:</strong> The physical kiosk terminal operates in a secure, sandboxed client mode. All locally cached audio buffers, camera frames, and intermediate transcription texts are permanently purged from kiosk RAM immediately upon session submission, session timeout (after 3 minutes of inactivity), or manual session cancellation.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '12px', color: 'var(--ink-black)' }}>5. Rights of the Data Principal (Section 11, 12, 13)</h2>
            <p style={{ marginBottom: '12px' }}>Under the DPDP Act 2023, you have the following enforceable statutory rights:</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <div style={{ padding: '16px', backgroundColor: 'var(--fog-white)', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                <strong>Right to Access Information:</strong> Request a summary of personal data processed and identities of healthcare staff who accessed it.
              </div>
              <div style={{ padding: '16px', backgroundColor: 'var(--fog-white)', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                <strong>Right to Correction & Erasure:</strong> Correct inaccuracies or request erasure of personal data that is no longer necessary.
              </div>
              <div style={{ padding: '16px', backgroundColor: 'var(--fog-white)', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                <strong>Right to Withdraw Consent:</strong> Revoke previously granted consent with the same ease with which it was given.
              </div>
              <div style={{ padding: '16px', backgroundColor: 'var(--fog-white)', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                <strong>Right of Grievance Redressal:</strong> Direct escalation to the Hospital Data Protection Officer (DPO) and the Data Protection Board of India.
              </div>
            </div>
          </section>

          <section>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '12px', color: 'var(--ink-black)' }}>6. Security Safeguards & Encryption Standards</h2>
            <p>
              All patient data is encrypted in transit using TLS 1.3 with forward secrecy, and encrypted at rest using AES-256 GCM. Access by clinical staff is governed by strict Role-Based Access Control (RBAC) and logged in an immutable, append-only audit trail.
            </p>
          </section>

          <section style={{ backgroundColor: 'var(--peach-subtle)', padding: '24px', borderRadius: '16px', border: '1px solid var(--blush-peach)' }}>
            <h3 style={{ color: 'var(--sienna-brown)', marginBottom: '8px' }}>Data Protection Officer (DPO) & Grievance Contact</h3>
            <p style={{ color: 'var(--sienna-brown)', fontSize: '0.92rem', marginBottom: '12px' }}>
              For any inquiries, consent revocation, or grievances regarding your personal health data under the DPDP Act 2023:
            </p>
            <div style={{ color: 'var(--sienna-brown)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              <div><strong>Name:</strong> Advocate Arvind Swaminathan, Lead Privacy Counsel & DPO</div>
              <div><strong>Email:</strong> dpo-grievance@apexmed.in</div>
              <div><strong>Postal Address:</strong> Office of Data Governance, Apex Healthcare Tower, Bandra Kurla Complex, Mumbai 400051</div>
              <div><strong>Statutory Grievance Response Window:</strong> 72 business hours</div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
