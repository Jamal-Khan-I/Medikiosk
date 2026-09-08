import React, { useState } from 'react';
import MarketingLayout from './surfaces/marketing/MarketingLayout';
import Home from './surfaces/marketing/Home';
import HowItWorks from './surfaces/marketing/HowItWorks';
import ForHospitals from './surfaces/marketing/ForHospitals';
import ForPatients from './surfaces/marketing/ForPatients';
import PrivacyPolicy from './surfaces/marketing/PrivacyPolicy';
import Contact from './surfaces/marketing/Contact';

import PatientKiosk from './surfaces/kiosk/PatientKiosk';
import PhysicianDashboard from './surfaces/physician/PhysicianDashboard';
import HospitalAdmin from './surfaces/admin/HospitalAdmin';
import TriageAlertSurface from './surfaces/triage/TriageAlertSurface';

import { 
  Globe, 
  Tablet, 
  Stethoscope, 
  Building2, 
  ShieldAlert,
  Sparkles
} from 'lucide-react';

export default function App() {
  // Surface Navigation: 'MARKETING' | 'KIOSK' | 'PHYSICIAN' | 'ADMIN' | 'TRIAGE'
  const [activeSurface, setActiveSurface] = useState('MARKETING');
  const [marketingTab, setMarketingTab] = useState('home');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Surface Switcher Banner */}
      <div style={{
        backgroundColor: '#17191c',
        color: '#fff',
        padding: '8px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.82rem',
        borderBottom: '1px solid #2a2e37',
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="badge-pill badge-peach" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
            MediKiosk OS
          </span>
          <span style={{ color: 'var(--slate-light)' }}>Connected Clinical Surfaces:</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>

          <button
            onClick={() => setActiveSurface('KIOSK')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '5px 12px',
              borderRadius: 'var(--radius-pill)',
              border: 'none',
              backgroundColor: activeSurface === 'KIOSK' ? 'var(--blush-peach)' : 'transparent',
              color: activeSurface === 'KIOSK' ? 'var(--sienna-brown)' : 'var(--slate-light)',
              cursor: 'pointer',
              fontWeight: activeSurface === 'KIOSK' ? 600 : 400
            }}
          >
            <Tablet size={13} />
            <span>A: Patient Kiosk</span>
          </button>

          <button
            onClick={() => setActiveSurface('PHYSICIAN')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '5px 12px',
              borderRadius: 'var(--radius-pill)',
              border: 'none',
              backgroundColor: activeSurface === 'PHYSICIAN' ? 'rgba(255,255,255,0.2)' : 'transparent',
              color: activeSurface === 'PHYSICIAN' ? '#fff' : 'var(--slate-light)',
              cursor: 'pointer',
              fontWeight: activeSurface === 'PHYSICIAN' ? 600 : 400
            }}
          >
            <Stethoscope size={13} />
            <span>B: Physician Workstation</span>
          </button>

          <button
            onClick={() => setActiveSurface('ADMIN')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '5px 12px',
              borderRadius: 'var(--radius-pill)',
              border: 'none',
              backgroundColor: activeSurface === 'ADMIN' ? 'rgba(255,255,255,0.2)' : 'transparent',
              color: activeSurface === 'ADMIN' ? '#fff' : 'var(--slate-light)',
              cursor: 'pointer',
              fontWeight: activeSurface === 'ADMIN' ? 600 : 400
            }}
          >
            <Building2 size={13} />
            <span>C: Hospital Admin</span>
          </button>

          <button
            onClick={() => setActiveSurface('TRIAGE')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '5px 12px',
              borderRadius: 'var(--radius-pill)',
              border: 'none',
              backgroundColor: activeSurface === 'TRIAGE' ? 'var(--alert-red-bg)' : 'transparent',
              color: activeSurface === 'TRIAGE' ? 'var(--alert-red-text)' : 'var(--slate-light)',
              cursor: 'pointer',
              fontWeight: activeSurface === 'TRIAGE' ? 600 : 400
            }}
          >
            <ShieldAlert size={13} />
            <span>D: Triage HUD</span>
          </button>
        </div>
      </div>

      {/* Surface Render Routing */}
      {activeSurface === 'MARKETING' && (
        <MarketingLayout
          activeTab={marketingTab}
          onSelectTab={setMarketingTab}
          onLaunchKiosk={() => setActiveSurface('KIOSK')}
        >
          {marketingTab === 'home' && (
            <Home
              onSelectTab={setMarketingTab}
              onLaunchKiosk={() => setActiveSurface('KIOSK')}
              onLaunchPhysician={() => setActiveSurface('PHYSICIAN')}
            />
          )}
          {marketingTab === 'how-it-works' && <HowItWorks onLaunchKiosk={() => setActiveSurface('KIOSK')} />}
          {marketingTab === 'for-hospitals' && (
            <ForHospitals
              onLaunchPhysician={() => setActiveSurface('PHYSICIAN')}
              onSelectTab={setMarketingTab}
            />
          )}
          {marketingTab === 'for-patients' && <ForPatients onLaunchKiosk={() => setActiveSurface('KIOSK')} />}
          {marketingTab === 'privacy-policy' && <PrivacyPolicy />}
          {marketingTab === 'contact' && <Contact />}
        </MarketingLayout>
      )}

      {activeSurface === 'KIOSK' && (
        <PatientKiosk onExitKiosk={() => setActiveSurface('MARKETING')} />
      )}

      {activeSurface === 'PHYSICIAN' && (
        <PhysicianDashboard onExitDashboard={() => setActiveSurface('MARKETING')} />
      )}

      {activeSurface === 'ADMIN' && (
        <HospitalAdmin onExitAdmin={() => setActiveSurface('MARKETING')} />
      )}

      {activeSurface === 'TRIAGE' && (
        <TriageAlertSurface onExitTriage={() => setActiveSurface('MARKETING')} />
      )}
    </div>
  );
}
