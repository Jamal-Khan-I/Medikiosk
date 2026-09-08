import React, { useState } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Clock, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Activity, 
  Layers, 
  Mic, 
  Languages, 
  Building, 
  Stethoscope, 
  ChevronRight,
  TrendingUp,
  Cpu
} from 'lucide-react';

export default function Home({ onSelectTab, onLaunchKiosk, onLaunchPhysician }) {
  const [activeTabFeature, setActiveTabFeature] = useState('socrates');

  return (
    <div>
      {/* Hero Section */}
      <section style={{
        padding: '80px 0 64px 0',
        backgroundColor: 'var(--paper-white)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div className="container-custom">
          <div style={{ maxWidth: '840px', margin: '0 auto', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
              <span className="badge-pill badge-peach">
                <Sparkles size={13} />
                <span>Next-Generation OPD History & Triage Platform</span>
              </span>
            </div>

            <h1 style={{ marginBottom: '24px', letterSpacing: '-0.03em', lineHeight: 1.12 }}>
              Clinical history taking, <br />
              <span style={{ fontStyle: 'italic' }}>reimagined for modern hospitals.</span>
            </h1>

            <p style={{
              fontSize: '1.25rem',
              color: 'var(--slate-gray)',
              lineHeight: 1.6,
              marginBottom: '36px',
              maxWidth: '720px',
              margin: '0 auto 36px auto'
            }}>
              Patients provide their medical history by voice and touch in their native language before entering the consultation room. Doctors receive a structured, AI-drafted clinical summary with real-time red-flag triage alerts.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <button
                onClick={onLaunchKiosk}
                className="btn-pill btn-pill-primary btn-pill-lg"
              >
                <span>Launch Patient Kiosk</span>
                <ArrowRight size={18} />
              </button>

              <button
                onClick={onLaunchPhysician}
                className="btn-pill btn-pill-outline btn-pill-lg"
              >
                <Stethoscope size={18} />
                <span>Open Physician Queue</span>
              </button>
            </div>

            {/* Quick Metrics Bar */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '20px',
              marginTop: '64px',
              padding: '24px',
              backgroundColor: 'var(--fog-white)',
              borderRadius: 'var(--radius-card)',
              border: '1px solid var(--border-light)'
            }}>
              <div>
                <div style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--ink-black)' }}>4.6 min</div>
                <div style={{ fontSize: '0.84rem', color: 'var(--slate-gray)' }}>Average Intake Duration</div>
              </div>
              <div>
                <div style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--ink-black)' }}>100%</div>
                <div style={{ fontSize: '0.84rem', color: 'var(--slate-gray)' }}>ABDM & DPDP Act 2023 Compliant</div>
              </div>
              <div>
                <div style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--alert-red-bright)' }}>&lt; 15 ms</div>
                <div style={{ fontSize: '0.84rem', color: 'var(--slate-gray)' }}>Red-Flag Triage Detection</div>
              </div>
              <div>
                <div style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--ink-black)' }}>10</div>
                <div style={{ fontSize: '0.84rem', color: 'var(--slate-gray)' }}>Languages Supported</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Two Core Audiences: Patients & Hospitals */}
      <section className="section-padding" style={{ backgroundColor: 'var(--fog-white)', borderTop: '1px solid var(--border-light)' }}>
        <div className="container-custom">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 48px auto' }}>
            <span className="badge-pill badge-gray" style={{ marginBottom: '12px' }}>Two Audiences, One Unified Platform</span>
            <h2>Designed for vulnerable patients. Engineered for clinical precision.</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '32px' }}>
            {/* For Patients Card */}
            <div className="card-steep" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '16px',
                  backgroundColor: 'var(--blush-peach)',
                  color: 'var(--sienna-brown)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '24px'
                }}>
                  <Languages size={24} />
                </div>
                <h3 style={{ marginBottom: '16px' }}>For Patients & Attendants</h3>
                <p style={{ color: 'var(--slate-gray)', marginBottom: '24px' }}>
                  A calm, dignified intake experience that removes language and digital literacy barriers:
                </p>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '32px' }}>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.92rem' }}>
                    <CheckCircle2 size={18} color="var(--success-green-bright)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span><strong>Voice-first natural conversation</strong> in English, Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam, and Punjabi.</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.92rem' }}>
                    <CheckCircle2 size={18} color="var(--success-green-bright)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span><strong>Granular audio consent</strong> fully compliant with India's DPDP Act 2023 with clear plain-language audio narration.</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.92rem' }}>
                    <CheckCircle2 size={18} color="var(--success-green-bright)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span><strong>Instant document digitizer</strong> for prior paper prescriptions, discharge cards, and lab reports.</span>
                  </li>
                </ul>
              </div>
              <button 
                onClick={() => onSelectTab('for-patients')}
                className="btn-pill btn-pill-outline"
                style={{ width: '100%' }}
              >
                <span>Read Patient Guide & FAQs</span>
                <ChevronRight size={16} />
              </button>
            </div>

            {/* For Hospitals Card */}
            <div className="card-steep" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '16px',
                  backgroundColor: 'var(--ink-black)',
                  color: 'var(--paper-white)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '24px'
                }}>
                  <Building size={24} />
                </div>
                <h3 style={{ marginBottom: '16px' }}>For Hospitals & OPDs</h3>
                <p style={{ color: 'var(--slate-gray)', marginBottom: '24px' }}>
                  Eliminates the 12-minute clerical bottleneck per consultation while improving clinical accuracy:
                </p>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '32px' }}>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.92rem' }}>
                    <CheckCircle2 size={18} color="var(--success-green-bright)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span><strong>Parallel Triage Alerting:</strong> Sub-15ms red flag detection dispatches staff to kiosk for chest pain or stroke signs.</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.92rem' }}>
                    <CheckCircle2 size={18} color="var(--success-green-bright)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span><strong>ABDM M1/M2/M3 Native:</strong> Generates FHIR R4 document bundles and links records to ABHA accounts.</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.92rem' }}>
                    <CheckCircle2 size={18} color="var(--success-green-bright)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span><strong>Dual Clinical Frameworks:</strong> Standard Allopathic SOCRATES + Dedicated AYUSH Dashavidha Pariksha.</span>
                  </li>
                </ul>
              </div>
              <button 
                onClick={() => onSelectTab('for-hospitals')}
                className="btn-pill btn-pill-primary"
                style={{ width: '100%' }}
              >
                <span>Explore Hospital Deployment & Architecture</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Deep Dive with Interactive Tabs */}
      <section className="section-padding" style={{ backgroundColor: 'var(--paper-white)' }}>
        <div className="container-custom">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 40px auto' }}>
            <span className="badge-pill badge-peach" style={{ marginBottom: '12px' }}>Clinical Architecture</span>
            <h2>Structured history taking built on gold-standard clinical models</h2>
          </div>

          {/* Selector Tabs */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '36px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveTabFeature('socrates')}
              className={`btn-pill ${activeTabFeature === 'socrates' ? 'btn-pill-primary' : 'btn-pill-secondary'}`}
            >
              <span>SOCRATES General Intake</span>
            </button>
            <button
              onClick={() => setActiveTabFeature('ayush')}
              className={`btn-pill ${activeTabFeature === 'ayush' ? 'btn-pill-peach' : 'btn-pill-secondary'}`}
            >
              <span>AYUSH Dashavidha Pariksha</span>
            </button>
            <button
              onClick={() => setActiveTabFeature('ocr')}
              className={`btn-pill ${activeTabFeature === 'ocr' ? 'btn-pill-primary' : 'btn-pill-secondary'}`}
            >
              <span>OCR & Entity Extraction</span>
            </button>
            <button
              onClick={() => setActiveTabFeature('triage')}
              className={`btn-pill ${activeTabFeature === 'triage' ? 'btn-pill-danger' : 'btn-pill-secondary'}`}
            >
              <span>Sub-15ms Triage Guardrails</span>
            </button>
          </div>

          {/* Feature Content */}
          <div className="card-steep-fog" style={{ padding: '40px' }}>
            {activeTabFeature === 'socrates' && (
              <div>
                <span className="badge-pill badge-gray" style={{ marginBottom: '12px' }}>Allopathic OPD Standard</span>
                <h3 style={{ marginBottom: '16px' }}>SOCRATES Clinical Interview Framework</h3>
                <p style={{ color: 'var(--slate-gray)', marginBottom: '20px', maxWidth: '720px', lineHeight: 1.6 }}>
                  MediKiosk structures the History of Present Illness (HPI) systematically through the internationally recognized SOCRATES protocol:
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', fontSize: '0.88rem' }}>
                  <div style={{ padding: '12px 16px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                    <strong>S</strong> — Site & Exact Anatomical Location
                  </div>
                  <div style={{ padding: '12px 16px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                    <strong>O</strong> — Onset & Progression
                  </div>
                  <div style={{ padding: '12px 16px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                    <strong>C</strong> — Character & Sensory Quality
                  </div>
                  <div style={{ padding: '12px 16px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                    <strong>R</strong> — Radiation Path
                  </div>
                  <div style={{ padding: '12px 16px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                    <strong>A</strong> — Associated Symptoms
                  </div>
                  <div style={{ padding: '12px 16px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                    <strong>T</strong> — Timing & Chronicity
                  </div>
                  <div style={{ padding: '12px 16px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                    <strong>E</strong> — Exacerbating / Relieving
                  </div>
                  <div style={{ padding: '12px 16px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                    <strong>S</strong> — Severity Rating (1–10)
                  </div>
                </div>
              </div>
            )}

            {activeTabFeature === 'ayush' && (
              <div>
                <span className="badge-pill badge-peach" style={{ marginBottom: '12px' }}>AYUSH Integrative Medicine</span>
                <h3 style={{ marginBottom: '16px' }}>Dashavidha Pariksha (10-Fold Ayurvedic Assessment)</h3>
                <p style={{ color: 'var(--slate-gray)', marginBottom: '20px', maxWidth: '720px', lineHeight: 1.6 }}>
                  A dedicated clinical pathway specifically structured for Ayurvedic and integrative outpatient departments:
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '0.86rem' }}>
                  <div style={{ padding: '12px 16px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid var(--border-light)' }}>1. Prakriti (Constitution)</div>
                  <div style={{ padding: '12px 16px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid var(--border-light)' }}>2. Vikriti (Pathology/Dosha)</div>
                  <div style={{ padding: '12px 16px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid var(--border-light)' }}>3. Sara (Tissue Vitality)</div>
                  <div style={{ padding: '12px 16px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid var(--border-light)' }}>4. Samhanana (Compactness)</div>
                  <div style={{ padding: '12px 16px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid var(--border-light)' }}>5. Pramana (Anthropometry)</div>
                  <div style={{ padding: '12px 16px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid var(--border-light)' }}>6. Satmya (Habituation)</div>
                  <div style={{ padding: '12px 16px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid var(--border-light)' }}>7. Satva (Mental Resilience)</div>
                  <div style={{ padding: '12px 16px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid var(--border-light)' }}>8. Ahara Shakti (Digestion/Agni)</div>
                  <div style={{ padding: '12px 16px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid var(--border-light)' }}>9. Vyayama (Physical Stamina)</div>
                  <div style={{ padding: '12px 16px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid var(--border-light)' }}>10. Vaya (Age/Chronological Phase)</div>
                </div>
              </div>
            )}

            {activeTabFeature === 'ocr' && (
              <div>
                <span className="badge-pill badge-gray" style={{ marginBottom: '12px' }}>Document Intelligence</span>
                <h3 style={{ marginBottom: '16px' }}>Real-Time Prescription & Lab Report Digitizer</h3>
                <p style={{ color: 'var(--slate-gray)', marginBottom: '20px', maxWidth: '720px', lineHeight: 1.6 }}>
                  Patients insert or scan physical prior prescriptions and lab reports directly at the kiosk. MediKiosk parses medications, lab values, and abnormal reference flags automatically.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                  <div style={{ padding: '16px 20px', backgroundColor: '#fff', borderRadius: '14px', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <CheckCircle2 size={18} color="var(--success-green-bright)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ fontSize: '0.92rem' }}><strong>Prescription Parsing:</strong> Extracts drug name, dosage, frequency, and duration.</span>
                  </div>
                  <div style={{ padding: '16px 20px', backgroundColor: '#fff', borderRadius: '14px', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <CheckCircle2 size={18} color="var(--success-green-bright)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ fontSize: '0.92rem' }}><strong>Lab Range Comparison:</strong> Identifies elevated values (e.g., HbA1c, Fasting Glucose, Lipid profiles).</span>
                  </div>
                  <div style={{ padding: '16px 20px', backgroundColor: '#fff', borderRadius: '14px', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <CheckCircle2 size={18} color="var(--success-green-bright)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ fontSize: '0.92rem' }}><strong>Chronological Timeline:</strong> Arranges years of fragmented papers into a clean unified record.</span>
                  </div>
                </div>
              </div>
            )}

            {activeTabFeature === 'triage' && (
              <div>
                <span className="badge-pill badge-red" style={{ marginBottom: '12px' }}>Patient Safety Guardrails</span>
                <h3 style={{ marginBottom: '16px' }}>Parallel Low-Latency Emergency Triage</h3>
                <p style={{ color: 'var(--slate-gray)', marginBottom: '20px', maxWidth: '720px', lineHeight: 1.6 }}>
                  Unlike traditional forms that wait for submission, MediKiosk runs a sub-15ms parallel NLP and rule evaluation on every voice utterance and touch response.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', fontSize: '0.92rem' }}>
                  <div style={{ padding: '18px 20px', backgroundColor: '#fff', borderRadius: '14px', borderLeft: '4px solid var(--alert-red-bright)', border: '1px solid var(--border-light)', borderLeftWidth: '4px' }}>
                    <strong style={{ display: 'block', marginBottom: '4px', color: 'var(--ink-black)' }}>Instant Triage Broadcast:</strong>
                    <span style={{ color: 'var(--ink-soft)', lineHeight: 1.55 }}>If a patient mentions chest crushing pain radiating to the jaw, a high-priority alert triggers on the emergency triage desk and physician queue instantly with the Kiosk station ID.</span>
                  </div>
                  <div style={{ padding: '18px 20px', backgroundColor: '#fff', borderRadius: '14px', borderLeft: '4px solid var(--alert-red-bright)', border: '1px solid var(--border-light)', borderLeftWidth: '4px' }}>
                    <strong style={{ display: 'block', marginBottom: '4px', color: 'var(--ink-black)' }}>Zero Waiting Room Deaths:</strong>
                    <span style={{ color: 'var(--ink-soft)', lineHeight: 1.55 }}>Converts passive waiting room time into active, safety-monitored clinical engagement with real-time escalation.</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Call to Action Bar */}
      <section style={{ padding: '80px 0', backgroundColor: 'var(--ink-black)', color: 'var(--paper-white)' }}>
        <div className="container-custom" style={{ textAlign: 'center', maxWidth: '720px' }}>
          <h2 style={{ color: 'var(--paper-white)', marginBottom: '20px' }}>
            Ready to deploy MediKiosk across your hospital OPD?
          </h2>
          <p style={{ color: 'var(--slate-light)', fontSize: '1.1rem', marginBottom: '36px', lineHeight: 1.6 }}>
            Connect with our clinical engineering team to configure institutional specifications, ABDM connectors, and on-site hardware deployment.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <button
              onClick={() => onSelectTab('contact')}
              className="btn-pill btn-pill-peach btn-pill-lg"
            >
              <span>Schedule Hospital Deployment</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
