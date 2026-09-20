import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  UserCheck, 
  Volume2, 
  ArrowRight,
  HeartPulse,
  PhoneCall,
  Activity,
  Trash2
} from 'lucide-react';
import { api } from '../../services/api';

export default function TriageAlertSurface({ onExitTriage }) {
  const [alerts, setAlerts] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [alertToDelete, setAlertToDelete] = useState(null);
  const [isDeletingAlert, setIsDeletingAlert] = useState(false);

  // Responsive state for tablet & mobile
  const [isMobileScreen, setIsMobileScreen] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 1024);
  const [triageView, setTriageView] = useState('list'); // 'list' | 'detail'

  useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth <= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchAlerts = async () => {
    try {
      const res = await api.getTriageAlerts();
      setAlerts(res.alerts || []);
      if (!selectedAlert && res.alerts?.length > 0) {
        setSelectedAlert(res.alerts[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const unsubscribe = api.subscribe((msg) => {
      if (msg.type === 'TRIAGE_ALERT_TRIGGERED' || msg.type === 'TRIAGE_ALERT_UPDATED') {
        fetchAlerts();
      }
    });
    return () => unsubscribe();
  }, []);

  const handleAcknowledge = async (id) => {
    setIsProcessing(true);
    try {
      await api.acknowledgeAlert(id);
      fetchAlerts();
    } catch (e) {
      alert('Error acknowledging alert: ' + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResolve = async (id) => {
    setIsProcessing(true);
    try {
      await api.resolveAlert(id, resolutionNotes);
      setResolutionNotes('');
      fetchAlerts();
    } catch (e) {
      alert('Error resolving alert: ' + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmDeleteAlert = async () => {
    if (!alertToDelete) return;
    setIsDeletingAlert(true);
    try {
      await api.deleteTriageAlert(alertToDelete.id);
      setAlerts((prev) => {
        const next = prev.filter((a) => String(a.id) !== String(alertToDelete.id));
        if (selectedAlert && String(selectedAlert.id) === String(alertToDelete.id)) {
          setSelectedAlert(next.length > 0 ? next[0] : null);
        }
        return next;
      });
      setAlertToDelete(null);
      fetchAlerts();
    } catch (e) {
      alert('Error removing triage alert: ' + e.message);
    } finally {
      setIsDeletingAlert(false);
    }
  };

  const activeAlerts = alerts.filter(a => a.status === 'ACTIVE');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--ink-black)', color: '#fff' }}>
      {/* Triage Alarm HUD Header */}
      <header style={{
        padding: '12px 20px',
        backgroundColor: '#0d0e10',
        borderBottom: '1px solid #2a2e37',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            backgroundColor: activeAlerts.length > 0 ? 'var(--alert-red-bright)' : '#2a2e37',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            flexShrink: 0
          }}>
            <ShieldAlert size={20} className={activeAlerts.length > 0 ? 'animate-pulse-red' : ''} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '1.08rem', letterSpacing: '-0.01em' }}>
              Hospital Emergency & Parallel Triage HUD
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--slate-light)' }}>
              Sub-15ms Kiosk Clinical Red-Flag Stream • Rapid Response Station
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span className="badge-pill" style={{
            backgroundColor: activeAlerts.length > 0 ? 'var(--alert-red-bright)' : 'var(--success-green-bright)',
            color: '#fff',
            fontSize: '0.8rem',
            padding: '6px 12px'
          }}>
            {activeAlerts.length} Active Emergencies
          </span>
          <button
            onClick={onExitTriage}
            className="btn-pill btn-pill-outline btn-pill-sm"
            style={{ color: '#fff', borderColor: '#4a4f5c', minHeight: '38px' }}
          >
            Exit Triage HUD
          </button>
        </div>
      </header>

      {/* Main HUD Viewport */}
      <div className="split-workstation-layout">
        
        {/* Left List of Alerts (Adapts to stacked cards on tablet & mobile) */}
        {(!isMobileScreen || triageView === 'list') && (
          <div className="split-sidebar-panel" style={{ backgroundColor: '#121417', borderColor: '#2a2e37' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #2a2e37', fontSize: '0.88rem', fontWeight: 600, color: 'var(--slate-light)' }}>
              Real-Time Kiosk Red Flags ({alerts.length})
            </div>

            {isMobileScreen && alerts.length > 0 && (
              <div style={{ padding: '8px 14px', backgroundColor: 'rgba(220, 38, 38, 0.15)', color: '#fca5a5', fontSize: '0.78rem', fontWeight: 500, borderBottom: '1px solid #2a2e37' }}>
                Tap an emergency alert below to review vital clinical details.
              </div>
            )}

            <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
              {alerts.map((al) => {
                const isSelected = selectedAlert?.id === al.id;
                const isCritical = al.severity === 'CRITICAL';
                return (
                  <div
                    key={al.id}
                    onClick={() => {
                      setSelectedAlert(al);
                      if (isMobileScreen) setTriageView('detail');
                    }}
                    style={{
                      padding: '16px',
                      borderRadius: '16px',
                      marginBottom: '10px',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? '#22262f' : '#17191c',
                      border: `1px solid ${isSelected ? (isCritical ? 'var(--alert-red-bright)' : 'var(--border-light)') : '#2a2e37'}`,
                      boxShadow: isCritical && al.status === 'ACTIVE' ? 'var(--shadow-triage)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="badge-pill" style={{
                          backgroundColor: al.status === 'ACTIVE' ? 'var(--alert-red-bright)' : '#2a2e37',
                          color: '#fff',
                          fontSize: '0.68rem'
                        }}>
                          {al.status}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.74rem', color: 'var(--slate-light)' }}>
                          {new Date(al.created_at).toLocaleTimeString()}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setAlertToDelete(al);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: '3px 4px',
                            cursor: 'pointer',
                            color: 'var(--slate-light)',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'color 0.15s ease'
                          }}
                          title="Delete triage alert"
                          onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--slate-light)'}
                          aria-label="Delete triage alert"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div style={{ fontWeight: 600, fontSize: '0.96rem', marginBottom: '4px' }}>
                      {al.patient_name}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--blush-peach)', fontSize: '0.8rem', marginBottom: '6px' }}>
                      <MapPin size={13} />
                      <span>{al.kiosk_location}</span>
                    </div>

                    <div style={{ fontSize: '0.82rem', color: 'var(--slate-light)', lineHeight: 1.4 }}>
                      {al.symptom_trigger}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Right Detail Pane */}
        {(!isMobileScreen || triageView === 'detail') && (
          <div className="split-main-panel" style={{ padding: '24px 20px' }}>
            {isMobileScreen && (
              <button
                type="button"
                onClick={() => setTriageView('list')}
                className="btn-pill btn-pill-outline btn-pill-sm"
                style={{ alignSelf: 'flex-start', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px', color: '#fff', borderColor: '#4a4f5c', minHeight: '44px' }}
              >
                <ArrowLeft size={16} />
                <span>Back to Emergencies ({alerts.length})</span>
              </button>
            )}

            {selectedAlert ? (
              <div style={{ maxWidth: '840px', margin: '0 auto', width: '100%' }}>
                
                {/* Emergency Banner */}
                <div style={{
                  backgroundColor: selectedAlert.status === 'ACTIVE' ? 'rgba(220, 38, 38, 0.15)' : '#1a1d24',
                  border: `1px solid ${selectedAlert.status === 'ACTIVE' ? 'var(--alert-red-bright)' : '#2a2e37'}`,
                  borderRadius: '20px',
                  padding: '22px',
                  marginBottom: '24px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '14px'
                }}>
                  <div>
                    <span className="badge-pill badge-red" style={{ marginBottom: '12px' }}>
                      {selectedAlert.severity} PRIORITY TRIAGE EVENT
                    </span>
                    <h2 style={{ fontSize: '1.8rem', color: '#fff', marginBottom: '6px' }}>
                      {selectedAlert.patient_name}
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--blush-peach)', fontSize: '0.95rem' }}>
                      <MapPin size={16} />
                      <strong>Location:</strong> {selectedAlert.kiosk_location}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--slate-light)' }}>Trigger Time</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{new Date(selectedAlert.created_at).toLocaleTimeString()}</div>
                  </div>
                </div>

              {/* Symptom Breakdown */}
              <div style={{ backgroundColor: '#17191c', borderRadius: '20px', border: '1px solid #2a2e37', padding: '28px', marginBottom: '28px' }}>
                <h4 style={{ color: '#fff', marginBottom: '12px' }}>Triggering Clinical Manifestations</h4>
                <div style={{ backgroundColor: '#0d0e10', padding: '16px', borderRadius: '12px', color: '#fca5a5', fontSize: '0.95rem', lineHeight: 1.6, borderLeft: '4px solid var(--alert-red-bright)' }}>
                  {selectedAlert.symptom_trigger}
                </div>
              </div>

              {/* Action Workflow */}
              <div style={{ backgroundColor: '#17191c', borderRadius: '20px', border: '1px solid #2a2e37', padding: '28px' }}>
                <h4 style={{ color: '#fff', marginBottom: '16px' }}>Rapid Response Dispatch & Resolution</h4>

                {selectedAlert.status === 'ACTIVE' && (
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <button
                      onClick={() => handleAcknowledge(selectedAlert.id)}
                      disabled={isProcessing}
                      className="btn-pill btn-pill-danger btn-pill-lg"
                      style={{ flex: 1 }}
                    >
                      <PhoneCall size={18} />
                      <span>Acknowledge & Dispatch Stretcher Team</span>
                    </button>
                  </div>
                )}

                {selectedAlert.status === 'ACKNOWLEDGED' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ color: 'var(--blush-peach)', fontSize: '0.88rem' }}>
                      Status: Response team dispatched to {selectedAlert.kiosk_location}. Enter patient transfer notes to close alert:
                    </div>
                    <textarea
                      rows={3}
                      placeholder="e.g. Patient escorted to Resuscitation Bay 2, 12-lead ECG completed, Aspirin 325mg loaded..."
                      className="input-steep"
                      style={{ backgroundColor: '#0d0e10', color: '#fff', borderColor: '#2a2e37' }}
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                    />
                    <button
                      onClick={() => handleResolve(selectedAlert.id)}
                      disabled={isProcessing}
                      className="btn-pill btn-pill-peach btn-pill-lg"
                    >
                      <CheckCircle2 size={18} />
                      <span>Complete & Resolve Emergency</span>
                    </button>
                  </div>
                )}

                {selectedAlert.status === 'RESOLVED' && (
                  <div style={{ color: 'var(--success-green-bright)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={20} />
                    <span>This emergency triage event has been resolved and closed.</span>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--slate-light)' }}>
              No active red flags. The hospital kiosk network is continuously monitored.
            </div>
          )}
        </div>
        )}
      </div>

      {/* In-App Confirmation Modal for Triage Alert Removal */}
      {alertToDelete && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '16px'
        }}>
          <div className="card-steep" style={{ maxWidth: '480px', width: '100%', padding: '32px', textAlign: 'left', backgroundColor: '#17191c', border: '1px solid #2a2e37', color: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: 'rgba(220, 38, 38, 0.2)', color: 'var(--alert-red-bright)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Trash2 size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', margin: 0, color: '#fff' }}>Remove Triage Alert?</h3>
                <div style={{ fontSize: '0.84rem', color: 'var(--slate-light)', marginTop: '2px' }}>
                  {alertToDelete.severity} Priority • {alertToDelete.kiosk_location}
                </div>
              </div>
            </div>

            <p style={{ fontSize: '0.92rem', color: 'var(--slate-light)', lineHeight: 1.5, marginBottom: '24px' }}>
              Are you sure you want to permanently remove this emergency triage alert for <strong>{alertToDelete.patient_name}</strong>? This action cannot be undone.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setAlertToDelete(null)}
                disabled={isDeletingAlert}
                className="btn-pill btn-pill-outline"
                style={{ color: '#fff', borderColor: '#4a4f5c' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteAlert}
                disabled={isDeletingAlert}
                className="btn-pill"
                style={{
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: isDeletingAlert ? 'not-allowed' : 'pointer'
                }}
              >
                <Trash2 size={16} />
                <span>{isDeletingAlert ? 'Removing Alert...' : 'Delete Alert'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
