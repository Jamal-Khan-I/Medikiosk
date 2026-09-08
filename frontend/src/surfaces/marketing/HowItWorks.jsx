import React from 'react';
import { 
  Languages, 
  Fingerprint, 
  ShieldCheck, 
  Mic, 
  Camera, 
  FileCheck2, 
  Stethoscope, 
  ArrowRight,
  Database,
  Lock,
  Sparkles,
  Zap,
  Activity,
  FileText
} from 'lucide-react';

export default function HowItWorks({ onLaunchKiosk }) {
  const steps = [
    {
      num: '01',
      title: 'Language Selection & Accessibility',
      desc: 'Patients or their attendants choose their preferred language (Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, English). The entire interface switches both its visual display and high-fidelity spoken audio narrator.',
      icon: <Languages size={24} />,
      badge: 'Multilingual Voice & Audio'
    },
    {
      num: '02',
      title: 'Identity Verification via ABHA',
      desc: 'Patients input their 14-digit ABHA ID or ABHA Address. For new patients without an ABHA, a guided 60-second creation pathway connects to the official ABDM sandbox using Aadhaar OTP verification.',
      icon: <Fingerprint size={24} />,
      badge: 'ABDM Native Integration'
    },
    {
      num: '03',
      title: 'Granular DPDP Act 2023 Consent',
      desc: 'Every data processing purpose (clinical intake, document OCR, EHR sync, research) is presented as an independent toggle with plain-language audio narration. Consent records are cryptographically hashed and logged.',
      icon: <ShieldCheck size={24} />,
      badge: 'Statutory DPDP Compliance'
    },
    {
      num: '04',
      title: 'Adaptive Conversational Intake (SOCRATES / AYUSH)',
      desc: 'An interactive voice and touch interview adapts dynamically to the patient’s primary complaint. For allopathic OPDs, it executes the SOCRATES protocol. For AYUSH departments, it guides through Dashavidha Pariksha.',
      icon: <Mic size={24} />,
      badge: 'Dual Clinical Engine'
    },
    {
      num: '05',
      title: 'Document Digitization & OCR Extraction',
      desc: 'Patients hold prior prescriptions, lab reports, and discharge summaries up to the high-resolution scanner. MediKiosk parses medications, abnormal lab values, and diagnoses into a structured chronological timeline.',
      icon: <FileSearch size={24} />,
      badge: 'Optical Entity Extraction'
    },
    {
      num: '06',
      title: 'Doctor Summary Handover & Sign-Off',
      desc: 'Before the patient even walks into the consultation cabin, the physician sees the AI-drafted structured history with highlighted abnormal labs and red-flags. Every physician amendment is tracked in an audit ledger.',
      icon: <Stethoscope size={24} />,
      badge: 'FHIR M3 Document Bundle'
    }
  ];

  return (
    <div style={{ padding: '64px 0', backgroundColor: 'var(--paper-white)' }}>
      <div className="container-custom">
        <div style={{ maxWidth: '780px', margin: '0 auto', textAlign: 'center', marginBottom: '64px' }}>
          <span className="badge-pill badge-peach" style={{ marginBottom: '16px' }}>The Patient Journey</span>
          <h1 style={{ marginBottom: '20px' }}>From Waiting Room to Doctor's Cabin in 6 Streamlined Steps</h1>
          <p style={{ fontSize: '1.15rem', color: 'var(--slate-gray)', lineHeight: 1.6 }}>
            MediKiosk transforms passive waiting room minutes into structured clinical data, ensuring doctors spend consultations discussing treatment rather than typing notes.
          </p>
        </div>

        {/* Steps Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '32px', marginBottom: '64px' }}>
          {steps.map((step) => (
            <div key={step.num} className="card-steep" style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--mist-gray)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--ink-black)'
                  }}>
                    {step.icon}
                  </div>
                  <span style={{ fontSize: '1.8rem', fontFamily: 'var(--font-serif)', color: 'var(--slate-light)' }}>
                    {step.num}
                  </span>
                </div>

                <span className="badge-pill badge-gray" style={{ marginBottom: '12px' }}>{step.badge}</span>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '12px' }}>{step.title}</h3>
                <p style={{ fontSize: '0.92rem', color: 'var(--slate-gray)', lineHeight: 1.6 }}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Live Kiosk CTA */}
        <div className="card-steep-peach" style={{ textAlign: 'center', padding: '48px', maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ color: 'var(--sienna-brown)', marginBottom: '16px' }}>Experience the Kiosk Flow in Action</h2>
          <p style={{ color: 'var(--sienna-brown)', opacity: 0.9, maxWidth: '600px', margin: '0 auto 28px auto', fontSize: '1.05rem' }}>
            Walk through the full multilingual intake experience, use speech input, and view real-time document OCR extraction.
          </p>
          <button
            onClick={onLaunchKiosk}
            className="btn-pill btn-pill-primary btn-pill-lg"
          >
            <span>Start Interactive Kiosk Session</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
