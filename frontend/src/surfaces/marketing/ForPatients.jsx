import React, { useState } from 'react';
import { 
  HeartHandshake, 
  Lock, 
  HelpCircle, 
  Volume2, 
  Sparkles, 
  Languages, 
  ChevronDown, 
  ChevronUp,
  FileCheck2,
  Smile,
  ArrowRight
} from 'lucide-react';

export default function ForPatients({ onLaunchKiosk }) {
  const [openFaq, setOpenFaq] = useState(0);

  const faqs = [
    {
      q: "What is MediKiosk and why am I using it before seeing my doctor?",
      a: "MediKiosk is a secure tablet or kiosk provided by the hospital so you can comfortably explain your symptoms, history, and prior medicines in your own language. When you walk into the doctor's room, the doctor has already read your history and can spend the consultation focusing entirely on examining you and planning your treatment."
    },
    {
      q: "What if I cannot read or write easily?",
      a: "MediKiosk is designed specifically for voice conversation and touch. An audio narrator speaks clearly in your chosen language (such as Hindi, Tamil, Bengali, Telugu, Marathi, Gujarati, or English), and you can answer simply by talking into the microphone or pressing large touch buttons."
    },
    {
      q: "Is my personal health data private and protected?",
      a: "Yes, completely. MediKiosk strictly follows India's Digital Personal Data Protection (DPDP) Act, 2023. You have full control over what information you share through separate consent toggles. Your data is only shared with your treating doctor and hospital. The kiosk immediately erases all personal details from its local screen the moment your session ends."
    },
    {
      q: "What documents should I bring to the kiosk?",
      a: "You can bring any prior doctor prescriptions, lab blood reports, X-ray reports, or hospital discharge summaries. The kiosk camera will scan and organize them so your doctor can see your past test results and medicines immediately."
    },
    {
      q: "Can my family member or attendant help me at the kiosk?",
      a: "Yes. Family members, caregivers, or hospital patient attendants can assist you in selecting your language, holding your documents for scanning, or confirming your answers."
    }
  ];

  return (
    <div style={{ padding: '64px 0', backgroundColor: 'var(--paper-white)' }}>
      <div className="container-custom">
        {/* Header */}
        <div style={{ maxWidth: '780px', margin: '0 auto', textAlign: 'center', marginBottom: '64px' }}>
          <span className="badge-pill badge-peach" style={{ marginBottom: '16px' }}>Patient Guide</span>
          <h1 style={{ marginBottom: '20px' }}>Your Health Story, Told in Your Own Words</h1>
          <p style={{ fontSize: '1.2rem', color: 'var(--slate-gray)', lineHeight: 1.6 }}>
            Everything you need to know about using the MediKiosk before your doctor's appointment.
          </p>
        </div>

        {/* 3 Patient Benefits */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', marginBottom: '64px' }}>
          <div className="card-steep">
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'var(--blush-peach)', color: 'var(--sienna-brown)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <Languages size={24} />
            </div>
            <h3 style={{ marginBottom: '12px' }}>Speak in Your Own Language</h3>
            <p style={{ color: 'var(--slate-gray)', fontSize: '0.94rem', lineHeight: 1.6 }}>
              No need to struggle with medical terms or English. Talk naturally in Hindi, Tamil, Telugu, Marathi, Bengali, Gujarati, or English.
            </p>
          </div>

          <div className="card-steep">
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'var(--mist-gray)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <FileCheck2 size={24} color="var(--ink-black)" />
            </div>
            <h3 style={{ marginBottom: '12px' }}>Never Forget a Past Medicine</h3>
            <p style={{ color: 'var(--slate-gray)', fontSize: '0.94rem', lineHeight: 1.6 }}>
              Scan your old prescription papers at the kiosk. Your doctor will instantly see your previous dosages and lab trends.
            </p>
          </div>

          <div className="card-steep">
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'var(--success-green-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <Lock size={24} color="var(--success-green-text)" />
            </div>
            <h3 style={{ marginBottom: '12px' }}>Your Data is Safe & Private</h3>
            <p style={{ color: 'var(--slate-gray)', fontSize: '0.94rem', lineHeight: 1.6 }}>
              Protected by statutory DPDP 2023 consent standards. Kiosk memory clears automatically after you submit.
            </p>
          </div>
        </div>

        {/* Interactive FAQ Section */}
        <div style={{ maxWidth: '800px', margin: '0 auto 64px auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <span className="badge-pill badge-gray" style={{ marginBottom: '12px' }}>Frequently Asked Questions</span>
            <h2>Common Questions from Patients & Families</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {faqs.map((faq, idx) => (
              <div 
                key={idx}
                className="card-steep"
                style={{ padding: '24px', cursor: 'pointer' }}
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--ink-black)' }}>{faq.q}</h4>
                  {openFaq === idx ? <ChevronUp size={20} color="var(--slate-gray)" /> : <ChevronDown size={20} color="var(--slate-gray)" />}
                </div>
                {openFaq === idx && (
                  <p style={{ marginTop: '16px', color: 'var(--slate-gray)', fontSize: '0.94rem', lineHeight: 1.6, borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
