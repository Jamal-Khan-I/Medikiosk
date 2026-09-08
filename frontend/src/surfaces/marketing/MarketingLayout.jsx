import React from 'react';
import { Shield, Sparkles, Building2, UserCheck, PhoneCall, ArrowRight, HeartPulse } from 'lucide-react';

export default function MarketingLayout({ activeTab, onSelectTab, onLaunchKiosk, children }) {
  const navItems = [
    { id: 'for-hospitals', label: 'For Hospitals' },
    { id: 'for-patients', label: 'For Patients' },
    { id: 'privacy-policy', label: 'Privacy & DPDP' },
    { id: 'contact', label: 'Contact' }
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--paper-white)' }}>
      {/* Top Header */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.94)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-light)',
        padding: '16px 0'
      }}>
        <div className="container-custom" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Brand */}
          <div 
            onClick={() => onSelectTab('home')}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          >
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: 'var(--ink-black)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--paper-white)'
            }}>
              <HeartPulse size={18} />
            </div>
            <div>
              <span style={{ fontSize: '1.25rem', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--ink-black)' }}>MediKiosk</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--slate-gray)', display: 'block', marginTop: '-3px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Clinical Intake OS</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-pill)',
                  border: 'none',
                  backgroundColor: activeTab === item.id ? 'var(--mist-gray)' : 'transparent',
                  color: activeTab === item.id ? 'var(--ink-black)' : 'var(--slate-gray)',
                  fontWeight: activeTab === item.id ? 600 : 400,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Surface Content */}
      <main style={{ flex: 1 }}>
        {children}
      </main>

      {/* Enterprise Footer */}
      <footer style={{
        backgroundColor: 'var(--fog-white)',
        borderTop: '1px solid var(--border-light)',
        padding: '64px 0 32px 0',
        marginTop: 'auto'
      }}>
        <div className="container-custom">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '40px', marginBottom: '48px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--ink-black)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <HeartPulse size={14} />
                </div>
                <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>MediKiosk</span>
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--slate-gray)', marginBottom: '16px', lineHeight: 1.6 }}>
                AI-powered clinical intake and parallel triage platform deployed in hospital outpatient departments. ABDM M1/M2/M3 & DPDP Act 2023 compliant.
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span className="badge-pill badge-peach">ABDM Certified</span>
                <span className="badge-pill badge-gray">DPDP Compliant</span>
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--ink-black)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>Platform</h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem', color: 'var(--slate-gray)' }}>
                <li style={{ cursor: 'pointer' }} onClick={() => onSelectTab('how-it-works')}>SOCRATES Intake Engine</li>
                <li style={{ cursor: 'pointer' }} onClick={() => onSelectTab('how-it-works')}>AYUSH Dashavidha Pariksha</li>
                <li style={{ cursor: 'pointer' }} onClick={() => onSelectTab('how-it-works')}>Optical Medical OCR & Entity Extraction</li>
                <li style={{ cursor: 'pointer' }} onClick={() => onSelectTab('how-it-works')}>Sub-15ms Triage Red-Flag Engine</li>
              </ul>
            </div>

            <div>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--ink-black)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>Compliance & Trust</h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem', color: 'var(--slate-gray)' }}>
                <li style={{ cursor: 'pointer' }} onClick={() => onSelectTab('privacy-policy')}>Digital Personal Data Protection Act 2023</li>
                <li style={{ cursor: 'pointer' }} onClick={() => onSelectTab('for-hospitals')}>Ayushman Bharat Digital Mission (ABDM)</li>
                <li style={{ cursor: 'pointer' }} onClick={() => onSelectTab('privacy-policy')}>Granular Consent Ledger</li>
                <li style={{ cursor: 'pointer' }} onClick={() => onSelectTab('for-patients')}>Patient Rights & Data Erasure</li>
              </ul>
            </div>

            <div>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--ink-black)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>Clinical Support</h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--slate-gray)', marginBottom: '12px' }}>
                Apex Healthcare Systems & National Health Network deployment team.
              </p>
              <button 
                onClick={() => onSelectTab('contact')}
                className="btn-pill btn-pill-outline btn-pill-sm"
              >
                Contact Clinical Engineering
              </button>
            </div>
          </div>

          <div style={{
            borderTop: '1px solid var(--border-light)',
            paddingTop: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            fontSize: '0.82rem',
            color: 'var(--slate-gray)'
          }}>
            <div>© {new Date().getFullYear()} MediKiosk Clinical Intelligence Systems.</div>
            <div style={{ display: 'flex', gap: '20px' }}>
              <span style={{ cursor: 'pointer' }} onClick={() => onSelectTab('privacy-policy')}>Privacy Policy</span>
              <span style={{ cursor: 'pointer' }} onClick={() => onSelectTab('for-hospitals')}>Enterprise SLA</span>
              <span style={{ cursor: 'pointer' }} onClick={() => onSelectTab('contact')}>DPO Office</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
