import React from 'react';
import { 
  Building2, 
  Clock, 
  ShieldAlert, 
  Database, 
  Server, 
  CheckCircle2, 
  Cpu, 
  ArrowRight,
  TrendingUp,
  FileCode2,
  Lock
} from 'lucide-react';

export default function ForHospitals({ onLaunchPhysician, onSelectTab }) {
  return (
    <div style={{ padding: '64px 0', backgroundColor: 'var(--paper-white)' }}>
      <div className="container-custom">
        {/* Header */}
        <div style={{ maxWidth: '820px', margin: '0 auto', textAlign: 'center', marginBottom: '64px' }}>
          <span className="badge-pill badge-peach" style={{ marginBottom: '16px' }}>Hospital Enterprise Platform</span>
          <h1 style={{ marginBottom: '20px' }}>Transform Outpatient Operations with Clinical-Grade AI</h1>
          <p style={{ fontSize: '1.2rem', color: 'var(--slate-gray)', lineHeight: 1.6 }}>
            Designed for Chief Medical Officers, Hospital Administrators, and IT Directors seeking to eliminate OPD congestion, reduce physician burnout, and achieve ABDM M1/M2/M3 compliance.
          </p>
        </div>

        {/* 3 Core Value Pillars */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', marginBottom: '64px' }}>
          <div className="card-steep">
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'var(--mist-gray)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <Clock size={24} color="var(--ink-black)" />
            </div>
            <h3 style={{ marginBottom: '12px' }}>70% Reduction in Clerical Scribing</h3>
            <p style={{ color: 'var(--slate-gray)', fontSize: '0.94rem', lineHeight: 1.6, marginBottom: '16px' }}>
              Doctors spend up to 60% of a 15-minute consultation typing notes. MediKiosk delivers a pre-structured, comprehensive clinical history before the patient enters, expanding consultation capacity by over 40%.
            </p>
            <div style={{ fontSize: '0.85rem', color: 'var(--ink-black)', fontWeight: 600 }}>
              Average doctor documentation time reduced from 8.5 mins to under 1.5 mins per encounter.
            </div>
          </div>

          <div className="card-steep">
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'var(--alert-red-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <ShieldAlert size={24} color="var(--alert-red-bright)" />
            </div>
            <h3 style={{ marginBottom: '12px' }}>Zero Missed Triage Emergencies</h3>
            <p style={{ color: 'var(--slate-gray)', fontSize: '0.94rem', lineHeight: 1.6, marginBottom: '16px' }}>
              Sub-15ms parallel NLP scans every intake response for acute symptoms (e.g. STEMI, stroke signs, anaphylaxis, severe dyspnea). If triggered, the emergency desk and physician queue are instantly alerted with the kiosk station location.
            </p>
            <div style={{ fontSize: '0.85rem', color: 'var(--alert-red-text)', fontWeight: 600 }}>
              Converts passive waiting areas into a continuous clinical safety zone.
            </div>
          </div>

          <div className="card-steep">
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'var(--peach-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <Lock size={24} color="var(--sienna-brown)" />
            </div>
            <h3 style={{ marginBottom: '12px' }}>DPDP Act 2023 & ABDM Native</h3>
            <p style={{ color: 'var(--slate-gray)', fontSize: '0.94rem', lineHeight: 1.6, marginBottom: '16px' }}>
              Full compliance with India's Digital Personal Data Protection Act 2023. Granular, revocable consent logging with SHA-256 cryptographic signatures and automated 72-hour ephemeral kiosk client storage purging.
            </p>
            <div style={{ fontSize: '0.85rem', color: 'var(--sienna-brown)', fontWeight: 600 }}>
              Generates ABDM Milestones 1, 2 & 3 compliant FHIR R4 document bundles automatically.
            </div>
          </div>
        </div>

        {/* Technical Architecture Deep-Dive */}
        <div className="card-steep-fog" style={{ padding: '48px', marginBottom: '64px' }}>
          <div style={{ maxWidth: '640px', marginBottom: '32px' }}>
            <span className="badge-pill badge-gray" style={{ marginBottom: '12px' }}>System Architecture</span>
            <h2>Enterprise Integration & Interoperability</h2>
            <p style={{ color: 'var(--slate-gray)', marginTop: '8px' }}>
              MediKiosk acts as an intelligent edge layer that integrates seamlessly with your existing Hospital Information System (HIS) / Electronic Health Record (EHR).
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontWeight: 600 }}>
                <FileCode2 size={18} />
                <span>FHIR R4 Diagnostic Bundles</span>
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--slate-gray)', lineHeight: 1.6 }}>
                Transmits structured SNOMED CT and LOINC-coded encounters directly to EHR systems via REST / HL7 FHIR APIs.
              </p>
            </div>

            <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontWeight: 600 }}>
                <Server size={18} />
                <span>On-Premise or Private Cloud</span>
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--slate-gray)', lineHeight: 1.6 }}>
                Deployable in high-availability on-premise data centers or sovereign cloud environments with zero egress of un-anonymized clinical data.
              </p>
            </div>

            <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontWeight: 600 }}>
                <Database size={18} />
                <span>Audit Trail & Tamper Proofing</span>
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--slate-gray)', lineHeight: 1.6 }}>
                Immutable change logs capture every physician edit, timestamp, and justification for medical-legal compliance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
