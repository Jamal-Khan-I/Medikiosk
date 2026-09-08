import React, { useState } from 'react';
import { CheckCircle2, Send } from 'lucide-react';

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    hospitalName: '',
    contactName: '',
    email: '',
    phone: '',
    opdVolume: '',
    departments: '',
    message: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div style={{ padding: '64px 0', backgroundColor: 'var(--paper-white)' }}>
      <div className="container-custom" style={{ maxWidth: '680px' }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <span className="badge-pill badge-peach" style={{ marginBottom: '16px' }}>Enterprise Deployment & Support</span>
          <h1 style={{ marginBottom: '16px' }}>Connect with Clinical Engineering</h1>
          <p style={{ color: 'var(--slate-gray)', fontSize: '1.05rem', maxWidth: '600px', margin: '0 auto' }}>
            Request an on-site hospital trial, review ABDM integration architecture, or reach our technical support team.
          </p>
        </div>

        {/* Form Only */}
        <div className="card-steep-fog" style={{ padding: '36px' }}>
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--success-green-bg)', color: 'var(--success-green-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
                <CheckCircle2 size={32} />
              </div>
              <h3 style={{ marginBottom: '12px' }}>Inquiry Received</h3>
              <p style={{ color: 'var(--slate-gray)', fontSize: '0.94rem', lineHeight: 1.6 }}>
                Our hospital integration team will contact you within 4 business hours with technical specifications and deployment timelines.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, marginBottom: '6px' }}>Hospital / Healthcare Institution</label>
                <input
                  type="text"
                  required
                  placeholder=""
                  className="input-steep"
                  value={formData.hospitalName}
                  onChange={(e) => setFormData({ ...formData, hospitalName: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, marginBottom: '6px' }}>Contact Person</label>
                  <input
                    type="text"
                    required
                    placeholder=""
                    className="input-steep"
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, marginBottom: '6px' }}>Official Email</label>
                  <input
                    type="email"
                    required
                    placeholder=""
                    className="input-steep"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, marginBottom: '6px' }}>Target OPD Daily Volume</label>
                <select
                  className="input-steep"
                  value={formData.opdVolume}
                  onChange={(e) => setFormData({ ...formData, opdVolume: e.target.value })}
                >
                  <option value="">Select Daily OPD Volume</option>
                  <option value="100-500">100 – 500 patients/day (Polyclinic / Mid-size)</option>
                  <option value="500-1000">500 – 1,000 patients/day (Tertiary Hospital)</option>
                  <option value="1000+">1,000+ patients/day (Apex Medical Institute)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, marginBottom: '6px' }}>Clinical Requirements / Notes</label>
                <textarea
                  rows={3}
                  placeholder=""
                  className="input-steep"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                />
              </div>

              <button type="submit" className="btn-pill btn-pill-primary" style={{ marginTop: '8px', padding: '14px 28px' }}>
                <Send size={16} />
                <span>Submit Institutional Request</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
