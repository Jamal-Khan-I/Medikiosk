import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Edit3, 
  Save, 
  User, 
  ShieldCheck, 
  Activity, 
  Search, 
  ChevronRight, 
  Lock, 
  History, 
  Sparkles, 
  Layers, 
  Check, 
  FileCode2, 
  Download, 
  Trash2,
  LogOut, 
  LogIn, 
  KeyRound, 
  Mail, 
  ArrowRight, 
  ArrowLeft, 
  Shield, 
  HeartPulse,
  Eye,
  EyeOff
} from 'lucide-react';
import { api } from '../../services/api';

export default function PhysicianDashboard({ onExitDashboard }) {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('medikiosk_physician_token');
  });
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [physicianUser, setPhysicianUser] = useState(() => {
    const saved = localStorage.getItem('medikiosk_physician_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      name: 'Dr. Ajmal Khan, MD',
      email: 'ajmalkhan@med.in',
      specialty: 'Internal Medicine & Diabetology',
      nmcNumber: 'NMC-2024-88419',
      department: 'OPD General Medicine'
    };
  });

  const [queue, setQueue] = useState([]);
  const [selectedEncounterId, setSelectedEncounterId] = useState(null);
  const [encounterDetails, setEncounterDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [editReason, setEditReason] = useState('Physician Clinical Verification');
  const [isSigningOff, setIsSigningOff] = useState(false);
  const [generatedFhirBundle, setGeneratedFhirBundle] = useState(null);
  const [abdmAck, setAbdmAck] = useState(null);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'past_visits' | 'documents' | 'audit' | 'fhir'
  const [patientToDelete, setPatientToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Handle Login
  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginError('Please enter both Doctor Email / ID and Password / PIN.');
      return;
    }

    setIsLoggingIn(true);
    setLoginError('');

    try {
      const res = await api.loginPhysician(loginEmail.trim(), loginPassword.trim());
      if (res && res.success && res.user) {
        localStorage.setItem('medikiosk_physician_token', res.token || ('physician_session_token_' + Date.now()));
        localStorage.setItem('medikiosk_physician_user', JSON.stringify(res.user));
        setPhysicianUser(res.user);
        setIsAuthenticated(true);
      } else {
        setLoginError(res.error || 'Authentication failed. Please check your credentials.');
      }
    } catch (err) {
      setLoginError(err.message || 'Invalid Doctor Email or Password. Please ensure this user is created in Hospital Admin.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('medikiosk_physician_token');
    localStorage.removeItem('medikiosk_physician_user');
    setIsAuthenticated(false);
  };

  const handleDownloadDoc = (doc) => {
    try {
      if (doc.file_data && typeof doc.file_data === 'string' && doc.file_data.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = doc.file_data;
        link.download = doc.file_name || `patient_document_${doc.id || 'file'}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (doc.file_data && typeof doc.file_data === 'string' && doc.file_data.length > 50) {
        const mime = doc.mime_type || (doc.file_name?.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');
        const link = document.createElement('a');
        link.href = `data:${mime};base64,${doc.file_data}`;
        link.download = doc.file_name || `patient_document_${doc.id || 'file'}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (doc.file_url) {
        const link = document.createElement('a');
        link.href = doc.file_url;
        link.download = doc.file_name || 'patient_document';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const content = doc.extracted_text || `--- MediKiosk Digitized Clinical Record ---\nDocument Name: ${doc.file_name}\nType: ${doc.document_type}\nDate: ${doc.document_date}\nFacility: ${doc.issuing_facility || 'Clinic'}\nPatient: ${encounterDetails?.patient?.full_name || encounterDetails?.summary?.full_name || 'Patient'}`;
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const name = doc.file_name || 'patient_record.txt';
        link.download = name.includes('.') ? name : `${name}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Error downloading document:', err);
    }
  };

  const fetchQueue = async () => {
    try {
      const res = await api.getPhysicianQueue();
      setQueue(res.queue || []);
      if (!selectedEncounterId && res.queue?.length > 0) {
        setSelectedEncounterId(res.queue[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirmDelete = async () => {
    if (!patientToDelete) return;
    const encId = patientToDelete.id;
    setIsDeleting(true);

    try {
      await api.deleteEncounter(encId);
      setQueue((prev) => {
        const nextQueue = prev.filter((item) => String(item.id) !== String(encId));
        if (String(selectedEncounterId) === String(encId)) {
          if (nextQueue.length > 0) {
            setSelectedEncounterId(nextQueue[0].id);
          } else {
            setSelectedEncounterId(null);
            setEncounterDetails(null);
          }
        }
        return nextQueue;
      });
      setPatientToDelete(null);
      fetchQueue();
    } catch (err) {
      alert('Error removing patient encounter: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchQueue();
    const unsubscribe = api.subscribe((msg) => {
      if (msg.type === 'PATIENT_QUEUE_UPDATE' || msg.type === 'TRIAGE_ALERT_TRIGGERED') {
        fetchQueue();
        if (selectedEncounterId) {
          fetchDetails(selectedEncounterId);
        }
      }
    });
    return () => unsubscribe();
  }, [selectedEncounterId, isAuthenticated]);

  const fetchDetails = async (id) => {
    if (!id) return;
    setIsLoading(true);
    try {
      const res = await api.getEncounterDetails(id);
      setEncounterDetails(res);
      setGeneratedFhirBundle(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && selectedEncounterId) {
      fetchDetails(selectedEncounterId);
    }
  }, [selectedEncounterId, isAuthenticated]);

  // Handle Inline Summary Edit (Persisted in DB & Logged in Audit Trail)
  const handleSaveFieldEdit = async () => {
    if (!editingField || !selectedEncounterId) return;
    try {
      await api.updateSummaryField(selectedEncounterId, editingField, editValue, editReason);
      setEditingField(null);
      fetchDetails(selectedEncounterId);
      fetchQueue();
    } catch (e) {
      alert('Error updating clinical field: ' + e.message);
    }
  };

  // Official Sign-off and ABDM FHIR R4 Bundle Generation
  const handleConfirmEncounter = async () => {
    if (!selectedEncounterId) return;
    setIsSigningOff(true);
    try {
      const res = await api.confirmEncounter(selectedEncounterId);
      if (res.success) {
        setGeneratedFhirBundle(res.fhir_bundle);
        setAbdmAck(res.abdm_ack);
        setActiveTab('fhir');
        fetchDetails(selectedEncounterId);
        fetchQueue();
      }
    } catch (e) {
      alert('Error signing off encounter: ' + e.message);
    } finally {
      setIsSigningOff(false);
    }
  };

  const currentPatient = encounterDetails?.patient;
  const currentSummary = encounterDetails?.summary;
  const currentDocs = encounterDetails?.documents || [];
  const currentEntities = encounterDetails?.extracted_entities || [];
  const currentAudits = encounterDetails?.audit_logs || [];

  // Age display calculation
  const getAccurateAge = (patient) => {
    if (patient?.age) return patient.age;
    if (!patient?.dob) return 'Adult';
    const birthDate = new Date(patient.dob);
    if (isNaN(birthDate.getTime())) return 'Adult';
    const today = new Date();
    let years = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      years--;
    }
    return years >= 0 ? years : 'Adult';
  };

  const currentAge = getAccurateAge(currentPatient);

  // -------------------------------------------------------------
  // 1. LOGIN SCREEN (MATCHING PATIENT KIOSK DESIGN AESTHETICS)
  // -------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: 'var(--paper-white)',
        display: 'flex',
        flexDirection: 'column',
        userSelect: 'none'
      }}>
        {/* Header */}
        <header style={{
          padding: '16px 24px',
          backgroundColor: 'var(--ink-black)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--blush-peach)', color: 'var(--sienna-brown)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Stethoscope size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '1.05rem' }}>MediKiosk Physician Workstation</div>
              <div style={{ fontSize: '0.74rem', color: 'var(--slate-light)' }}>Secure OPD Clinical Decision Support &amp; EMR Sign-Off</div>
            </div>
          </div>

          {onExitDashboard && (
            <button
              onClick={onExitDashboard}
              className="btn-pill btn-pill-outline btn-pill-sm"
              style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.25)' }}
            >
              Exit to Kiosk
            </button>
          )}
        </header>

        {/* Content */}
        <main style={{
          flex: 1,
          padding: '40px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--fog-white)'
        }}>
          <div style={{ maxWidth: '540px', width: '100%', margin: '0 auto' }}>
            
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <span className="badge-pill badge-peach" style={{ marginBottom: '10px' }}>
                Clinical Consultation Access
              </span>
              <h2 style={{ fontSize: '2.2rem', marginBottom: '8px', color: 'var(--ink-black)' }}>
                Physician Sign In
              </h2>
              <p style={{ color: 'var(--slate-gray)', fontSize: '0.96rem', lineHeight: 1.5, margin: 0 }}>
                Enter your medical credentials to access the outpatient queue, review patient histories, and sign off FHIR encounters.
              </p>
            </div>

            <div className="card-steep" style={{ padding: '36px' }}>
              {loginError && (
                <div style={{
                  marginBottom: '20px',
                  padding: '12px 16px',
                  backgroundColor: 'var(--alert-red-bg)',
                  color: 'var(--alert-red-text)',
                  borderRadius: '12px',
                  fontSize: '0.88rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertTriangle size={16} />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--ink-black)', marginBottom: '8px' }}>
                    Doctor Email / Medical Council Reg ID:
                  </label>
                  <input
                    type="email"
                    className="input-steep"
                    style={{ fontSize: '1.05rem' }}
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder=""
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--ink-black)', marginBottom: '8px' }}>
                    Clinical Password / OPD PIN:
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="input-steep"
                      style={{ fontSize: '1.05rem', paddingRight: '46px' }}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder=""
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--slate-gray)',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '6px',
                        transition: 'color 0.15s ease'
                      }}
                      title={showPassword ? 'Hide PIN' : 'Show PIN'}
                      aria-label={showPassword ? 'Hide PIN' : 'Show PIN'}
                      onMouseEnter={(e) => e.currentTarget.style.color = 'var(--ink-black)'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--slate-gray)'}
                    >
                      {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
                  {onExitDashboard && (
                    <button
                      type="button"
                      onClick={onExitDashboard}
                      className="btn-pill btn-pill-outline kiosk-touch-target"
                      style={{ flex: '1 1 120px' }}
                    >
                      <ArrowLeft size={18} />
                      <span>Back</span>
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="btn-pill btn-pill-primary kiosk-touch-target"
                    style={{ flex: '2 1 200px' }}
                  >
                    <span>{isLoggingIn ? 'Verifying...' : 'Sign In to Workstation'}</span>
                    <ArrowRight size={18} />
                  </button>
                </div>
              </form>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', fontSize: '0.78rem', color: 'var(--slate-gray)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={14} color="var(--success-green-text)" /> ABDM HIP M1/M2 Certified
              </span>
              <span>•</span>
              <span>DPDP Act 2023 Compliant</span>
              <span>•</span>
              <span>256-Bit TLS</span>
            </div>

          </div>
        </main>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 2. MAIN PHYSICIAN DASHBOARD WORKSTATION
  // -------------------------------------------------------------
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--fog-white)' }}>
      {/* Top Bar */}
      <header style={{
        padding: '14px 28px',
        backgroundColor: 'var(--paper-white)',
        borderBottom: '1px solid var(--border-light)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 30
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--ink-black)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Stethoscope size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '1.05rem', color: 'var(--ink-black)' }}>MediKiosk Physician Workstation</div>
            <div style={{ fontSize: '0.76rem', color: 'var(--slate-gray)' }}>
              {physicianUser.name}
              {physicianUser.specialty ? ` • ${physicianUser.specialty}` : ''}
              {physicianUser.nmcNumber ? ` • NMC Reg: ${physicianUser.nmcNumber}` : ''}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="badge-pill badge-peach">{physicianUser.specialty || physicianUser.department || 'OPD Clinical Unit'}</span>
          
          <button
            onClick={handleSignOut}
            className="btn-pill btn-pill-outline btn-pill-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Sign out of doctor session"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>

          {onExitDashboard && (
            <button onClick={onExitDashboard} className="btn-pill btn-pill-secondary btn-pill-sm">
              Exit Workstation
            </button>
          )}
        </div>
      </header>

      {/* Main Layout */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* Left: Patient Queue */}
        <div style={{
          width: '360px',
          backgroundColor: 'var(--paper-white)',
          borderRight: '1px solid var(--border-light)',
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 65px)'
        }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Active Outpatient Queue</div>
              <div style={{ fontSize: '0.76rem', color: 'var(--slate-gray)' }}>{queue.length} Patients Ready</div>
            </div>
            <span className="badge-pill badge-gray">Live WebSocket</span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
            {queue.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--slate-gray)' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--fog-white)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px auto', border: '1px solid var(--border-light)' }}>
                  <User size={22} color="var(--slate-gray)" />
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.94rem', color: 'var(--ink-black)', marginBottom: '4px' }}>
                  No Patients in Queue
                </div>
                <p style={{ fontSize: '0.82rem', lineHeight: 1.5, margin: 0 }}>
                  Awaiting patient check-ins from OPD Kiosks. Only live patient registrations will appear here.
                </p>
              </div>
            ) : (
              queue.map((enc) => {
                const isSelected = enc.id === selectedEncounterId;
                const pAge = getAccurateAge(enc.patient);
                return (
                  <div
                    key={enc.id}
                    onClick={() => setSelectedEncounterId(enc.id)}
                    style={{
                      padding: '16px',
                      borderRadius: '16px',
                      marginBottom: '10px',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? 'var(--peach-subtle)' : '#fff',
                      border: `1px solid ${isSelected ? 'var(--blush-peach)' : 'var(--border-light)'}`,
                      boxShadow: enc.is_red_flagged ? 'var(--shadow-triage)' : 'none',
                      transition: 'all 0.15s ease',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.96rem', color: 'var(--ink-black)' }}>
                        {enc.patient?.full_name || 'Patient'}
                      </div>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span className="badge-pill badge-peach" style={{ fontSize: '0.72rem' }}>
                          {enc.token_number || 'TK-101'}
                        </span>
                        {enc.is_red_flagged && (
                          <span className="badge-pill badge-red" style={{ fontSize: '0.68rem' }}>
                            <AlertTriangle size={11} />
                            <span>RED FLAG</span>
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setPatientToDelete(enc);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: '3px 4px',
                            cursor: 'pointer',
                            color: 'var(--slate-gray)',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'color 0.15s ease'
                          }}
                          title="Delete patient encounter from queue"
                          onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--slate-gray)'}
                          aria-label="Delete patient"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--slate-gray)', marginBottom: '8px' }}>
                      {enc.patient?.gender} • {pAge} yrs • Phone: {enc.patient?.phone_number || 'N/A'}
                    </div>

                    <div style={{ fontSize: '0.84rem', color: 'var(--ink-soft)', lineHeight: 1.4, marginBottom: '8px' }}>
                      {enc.summary?.chief_complaint || 'Intake completed'}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem', color: 'var(--slate-gray)' }}>
                      <span>{enc.kiosk?.kiosk_code || 'KIOSK 01'}</span>
                      <span className="badge-pill" style={{
                        backgroundColor: enc.status === 'REVIEWED_CONFIRMED' ? 'var(--success-green-bg)' : 'var(--mist-gray)',
                        color: enc.status === 'REVIEWED_CONFIRMED' ? 'var(--success-green-text)' : 'var(--ink-soft)'
                      }}>
                        {enc.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Detailed Structured Summary */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 65px)', overflowY: 'auto', padding: '24px 32px' }}>
          
          {encounterDetails ? (
            <div style={{ maxWidth: '1080px', margin: '0 auto', width: '100%' }}>
              
              {/* Red-Flag Urgent Banner */}
              {encounterDetails.encounter.is_red_flagged && (
                <div style={{
                  backgroundColor: 'var(--alert-red-bg)',
                  border: '1px solid var(--alert-red-border)',
                  borderRadius: '16px',
                  padding: '16px 20px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <AlertTriangle size={24} color="var(--alert-red-bright)" className="animate-pulse-red" />
                  <div style={{ flex: 1 }}>
                    <div style={{ color: 'var(--alert-red-text)', fontWeight: 600, fontSize: '0.96rem' }}>
                      CRITICAL CLINICAL TRIAGE RED FLAG
                    </div>
                    <div style={{ color: 'var(--alert-red-text)', fontSize: '0.88rem', marginTop: '2px' }}>
                      {encounterDetails.encounter.red_flag_reason}
                    </div>
                  </div>
                  <span className="badge-pill badge-red">Emergency Priority</span>
                </div>
              )}

              {/* Patient Demographics Banner (Section 1) */}
              <div className="card-steep" style={{ padding: '24px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h2 style={{ fontSize: '1.6rem', color: 'var(--ink-black)' }}>{currentPatient?.full_name}</h2>
                    <span className="badge-pill badge-peach">Token: {encounterDetails.encounter.token_number || 'TK-101'}</span>
                    <span className="badge-pill badge-gray">{currentPatient?.gender}</span>
                    <span className="badge-pill badge-peach">Age: {currentAge} yrs</span>
                  </div>
                  <div style={{ display: 'flex', gap: '20px', marginTop: '8px', fontSize: '0.85rem', color: 'var(--slate-gray)' }}>
                    <span><strong>DOB:</strong> {currentPatient?.dob || 'Estimated from age'}</span>
                    <span><strong>Mobile:</strong> {currentPatient?.phone_number}</span>
                    <span><strong>ABHA:</strong> {currentPatient?.abha_number || currentPatient?.abha_address || 'Walk-in Direct'}</span>
                    <span><strong>Department:</strong> {encounterDetails.encounter.department}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  {encounterDetails.encounter.status === 'REVIEWED_CONFIRMED' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: 'var(--success-green-bg)', color: 'var(--success-green-text)', borderRadius: 'var(--radius-pill)', fontWeight: 600, fontSize: '0.9rem' }}>
                      <CheckCircle2 size={18} />
                      <span>EHR Confirmed & Signed</span>
                    </div>
                  ) : (
                    <button
                      onClick={handleConfirmEncounter}
                      disabled={isSigningOff}
                      className="btn-pill btn-pill-primary"
                    >
                      <CheckCircle2 size={18} />
                      <span>{isSigningOff ? 'Generating FHIR Bundle...' : 'Confirm & Sign Off History'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Navigation Tabs */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setActiveTab('summary')}
                  className={`btn-pill ${activeTab === 'summary' ? 'btn-pill-primary' : 'btn-pill-secondary'}`}
                  style={{ padding: '8px 20px', fontSize: '0.86rem' }}
                >
                  <span>Current Clinical Summary (Ordered 1–10)</span>
                </button>
                <button
                  onClick={() => setActiveTab('past_visits')}
                  className={`btn-pill ${activeTab === 'past_visits' ? 'btn-pill-primary' : 'btn-pill-secondary'}`}
                  style={{ padding: '8px 20px', fontSize: '0.86rem' }}
                >
                  <History size={15} />
                  <span>Past Visit History ({(encounterDetails.past_visits || []).length})</span>
                </button>
                <button
                  onClick={() => setActiveTab('documents')}
                  className={`btn-pill ${activeTab === 'documents' ? 'btn-pill-primary' : 'btn-pill-secondary'}`}
                  style={{ padding: '8px 20px', fontSize: '0.86rem' }}
                >
                  <span>Prior Documents & Labs ({currentDocs.length})</span>
                </button>
                <button
                  onClick={() => setActiveTab('audit')}
                  className={`btn-pill ${activeTab === 'audit' ? 'btn-pill-primary' : 'btn-pill-secondary'}`}
                  style={{ padding: '8px 20px', fontSize: '0.86rem' }}
                >
                  <History size={15} />
                  <span>Audit Trail ({currentAudits.length})</span>
                </button>
                {generatedFhirBundle && (
                  <button
                    onClick={() => setActiveTab('fhir')}
                    className={`btn-pill ${activeTab === 'fhir' ? 'btn-pill-peach' : 'btn-pill-secondary'}`}
                    style={{ padding: '8px 20px', fontSize: '0.86rem' }}
                  >
                    <FileCode2 size={15} />
                    <span>ABDM FHIR R4 Bundle</span>
                  </button>
                )}
              </div>

              {/* TAB 1: ORDERED STRUCTURED CLINICAL SUMMARY (INLINE EDITABLE) */}
              {activeTab === 'summary' && currentSummary && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* 1. Patient Demographics Section */}
                  <div className="card-steep" style={{ padding: '20px' }}>
                    <h4 style={{ color: 'var(--slate-gray)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '6px' }}>
                      1. Patient Identification
                    </h4>
                    <p style={{ fontSize: '0.94rem', color: 'var(--ink-black)', fontWeight: 500 }}>
                      {currentSummary.patient_demographics_summary || `${currentPatient?.full_name}, ${currentPatient?.gender}, Age: ${currentAge} years, Mobile: ${currentPatient?.phone_number}`}
                    </p>
                  </div>

                  {/* 2. Chief Complaint */}
                  <div className="card-steep" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <h4 style={{ color: 'var(--slate-gray)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                        2. Chief Complaint
                      </h4>
                      <button
                        onClick={() => {
                          setEditingField('chief_complaint');
                          setEditValue(currentSummary.chief_complaint || '');
                        }}
                        className="btn-pill btn-pill-outline btn-pill-sm"
                      >
                        <Edit3 size={13} />
                        <span>Edit</span>
                      </button>
                    </div>
                    <p style={{ fontSize: '1.05rem', color: 'var(--ink-black)', fontWeight: 600 }}>
                      {currentSummary.chief_complaint}
                    </p>
                  </div>

                  {/* 3. History of Present Illness (SOCRATES) */}
                  <div className="card-steep" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <h4 style={{ color: 'var(--slate-gray)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                        3. History of Present Illness (SOCRATES Framework)
                      </h4>
                      <button
                        onClick={() => {
                          setEditingField('history_of_present_illness');
                          setEditValue(currentSummary.history_of_present_illness || '');
                        }}
                        className="btn-pill btn-pill-outline btn-pill-sm"
                      >
                        <Edit3 size={13} />
                        <span>Edit</span>
                      </button>
                    </div>
                    <p style={{ fontSize: '0.92rem', color: 'var(--ink-black)', lineHeight: 1.6 }}>
                      {currentSummary.history_of_present_illness}
                    </p>
                  </div>

                  {/* 4. Past Medical & Surgical History */}
                  <div className="card-steep" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <h4 style={{ color: 'var(--slate-gray)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                        4. Past Medical & Surgical History
                      </h4>
                      <button
                        onClick={() => {
                          setEditingField('past_medical_history');
                          setEditValue(currentSummary.past_medical_history || '');
                        }}
                        className="btn-pill btn-pill-outline btn-pill-sm"
                      >
                        <Edit3 size={13} />
                        <span>Edit</span>
                      </button>
                    </div>
                    <p style={{ fontSize: '0.92rem', color: 'var(--ink-black)', lineHeight: 1.5 }}>
                      {currentSummary.past_medical_history}
                    </p>
                  </div>

                  {/* 5. Medication History */}
                  <div className="card-steep" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <h4 style={{ color: 'var(--slate-gray)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                        5. Medication History (Dosage & Compliance)
                      </h4>
                      <button
                        onClick={() => {
                          setEditingField('medication_history');
                          setEditValue(currentSummary.medication_history || '');
                        }}
                        className="btn-pill btn-pill-outline btn-pill-sm"
                      >
                        <Edit3 size={13} />
                        <span>Edit</span>
                      </button>
                    </div>
                    <p style={{ fontSize: '0.92rem', color: 'var(--ink-black)', lineHeight: 1.5 }}>
                      {currentSummary.medication_history}
                    </p>
                  </div>

                  {/* 6. Allergies (Prominently Highlighted) */}
                  <div className="card-steep" style={{ padding: '20px', borderLeft: '4px solid var(--alert-red-bright)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <h4 style={{ color: 'var(--alert-red-text)', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600 }}>
                        6. Allergies & Adverse Drug Reactions
                      </h4>
                      <button
                        onClick={() => {
                          setEditingField('allergies');
                          setEditValue(currentSummary.allergies || '');
                        }}
                        className="btn-pill btn-pill-outline btn-pill-sm"
                      >
                        <Edit3 size={13} />
                        <span>Edit</span>
                      </button>
                    </div>
                    <p style={{ fontSize: '0.92rem', color: 'var(--ink-black)', fontWeight: 500 }}>
                      {currentSummary.allergies}
                    </p>
                  </div>

                  {/* 7. Family & Social History */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="card-steep" style={{ padding: '20px' }}>
                      <h4 style={{ color: 'var(--slate-gray)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '6px' }}>
                        7a. Family History
                      </h4>
                      <p style={{ fontSize: '0.88rem', color: 'var(--ink-black)', lineHeight: 1.5 }}>
                        {currentSummary.family_history}
                      </p>
                    </div>
                    <div className="card-steep" style={{ padding: '20px' }}>
                      <h4 style={{ color: 'var(--slate-gray)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '6px' }}>
                        7b. Personal & Social History
                      </h4>
                      <p style={{ fontSize: '0.88rem', color: 'var(--ink-black)', lineHeight: 1.5 }}>
                        {currentSummary.personal_social_history}
                      </p>
                    </div>
                  </div>

                  {/* 8. Review of Systems */}
                  <div className="card-steep" style={{ padding: '20px' }}>
                    <h4 style={{ color: 'var(--slate-gray)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '6px' }}>
                      8. Systematic Review of Systems (ROS)
                    </h4>
                    <p style={{ fontSize: '0.88rem', color: 'var(--ink-black)', lineHeight: 1.5 }}>
                      {currentSummary.review_of_systems}
                    </p>
                  </div>

                  {/* 9. Prior Investigations Summary */}
                  <div className="card-steep" style={{ padding: '20px' }}>
                    <h4 style={{ color: 'var(--slate-gray)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '6px' }}>
                      9. Prior Investigations & Scanned Documents Summary
                    </h4>
                    <p style={{ fontSize: '0.88rem', color: 'var(--ink-black)', lineHeight: 1.5 }}>
                      {currentSummary.prior_investigations_summary}
                    </p>
                  </div>

                  {/* 10. AYUSH Dashavidha Pariksha (If applicable) */}
                  {currentSummary.ayush_prakriti && (
                    <div className="card-steep-peach" style={{ padding: '24px' }}>
                      <h4 style={{ color: 'var(--sienna-brown)', marginBottom: '12px' }}>
                        10. AYUSH Dashavidha Pariksha & Ahara-Vihara
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '0.84rem', color: 'var(--sienna-brown)' }}>
                        <div><strong>Prakriti:</strong> {currentSummary.ayush_prakriti}</div>
                        <div><strong>Vikriti:</strong> {currentSummary.ayush_vikriti}</div>
                        <div><strong>Sara:</strong> {currentSummary.ayush_sara}</div>
                        <div><strong>Samhanana:</strong> {currentSummary.ayush_samhanana}</div>
                        <div><strong>Pramana:</strong> {currentSummary.ayush_pramana}</div>
                        <div><strong>Satmya:</strong> {currentSummary.ayush_satmya}</div>
                        <div><strong>Satva:</strong> {currentSummary.ayush_satva}</div>
                        <div><strong>Ahara Shakti:</strong> {currentSummary.ayush_ahara_shakti}</div>
                        <div><strong>Vyayama:</strong> {currentSummary.ayush_vyayama_shakti}</div>
                        <div><strong>Vaya:</strong> {currentSummary.ayush_vaya}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB: PAST VISIT HISTORY */}
              {activeTab === 'past_visits' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="card-steep" style={{ padding: '24px' }}>
                    <h3 style={{ marginBottom: '6px' }}>Patient Consultation History</h3>
                    <p style={{ fontSize: '0.86rem', color: 'var(--slate-gray)', marginBottom: '18px' }}>
                      All previous clinical intakes for {currentPatient?.full_name} stored permanently in hospital EHR.
                    </p>

                    {(encounterDetails.past_visits || []).length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {(encounterDetails.past_visits || []).map((past, idx) => (
                          <div key={idx} className="card-steep-fog" style={{ padding: '20px', border: '1px solid var(--border-light)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <div>
                                <strong>Visit #{past.encounter.id}</strong> • Token: <span className="badge-pill badge-peach">{past.encounter.token_number || 'TK-101'}</span>
                                <div style={{ fontSize: '0.78rem', color: 'var(--slate-gray)', marginTop: '2px' }}>
                                  Date: {new Date(past.encounter.created_at).toLocaleString()} • Dept: {past.encounter.department}
                                </div>
                              </div>
                              <span className="badge-pill badge-green">{past.encounter.status}</span>
                            </div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--ink-black)', fontWeight: 600, marginBottom: '6px' }}>
                              Chief Complaint: {past.summary?.chief_complaint || 'General Intake'}
                            </div>
                            <div style={{ fontSize: '0.84rem', color: 'var(--ink-soft)', lineHeight: 1.5 }}>
                              {past.summary?.history_of_present_illness || 'Clinical intake completed'}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--slate-gray)', backgroundColor: 'var(--fog-white)', borderRadius: '12px' }}>
                        No prior hospital visits on record. This is the patient's initial consultation.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: PRIOR DOCUMENTS & LABS (CHRONOLOGICAL) */}
              {activeTab === 'documents' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* Extracted Lab Values with Flags */}
                  <div className="card-steep" style={{ padding: '24px' }}>
                    <h4 style={{ marginBottom: '14px' }}>Extracted Laboratory Parameters & Abnormal Flags</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                      {currentEntities.map((ent, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: '12px 16px',
                            borderRadius: '12px',
                            backgroundColor: ent.is_abnormal ? 'var(--alert-red-bg)' : 'var(--fog-white)',
                            border: `1px solid ${ent.is_abnormal ? 'var(--alert-red-border)' : 'var(--border-light)'}`,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{ent.entity_name}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--slate-gray)' }}>
                              Val: {ent.entity_value} {ent.unit} (Ref: {ent.reference_range})
                            </div>
                          </div>
                          {ent.is_abnormal && (
                            <span className="badge-pill badge-red" style={{ fontSize: '0.7rem' }}>
                              {ent.abnormal_flag}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Chronological Documents */}
                  {currentDocs.map((doc, idx) => (
                    <div key={idx} className="card-steep" style={{ padding: '20px 24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'var(--fog-white)', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--ink-black)' }}>
                            <FileText size={22} />
                          </div>
                          <div>
                            <span className="badge-pill badge-gray" style={{ marginBottom: '4px', fontSize: '0.74rem' }}>{doc.document_type}</span>
                            <h4 style={{ fontSize: '1.02rem', margin: '2px 0' }}>{doc.file_name}</h4>
                            <div style={{ fontSize: '0.78rem', color: 'var(--slate-gray)' }}>
                              Date: {doc.document_date} • Facility: {doc.issuing_facility || 'Outpatient Clinic'}
                            </div>
                          </div>
                        </div>

                        {/* ONLY Download symbol icon button */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <button
                            type="button"
                            onClick={() => handleDownloadDoc(doc)}
                            className="btn-pill btn-pill-outline"
                            style={{
                              padding: '8px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              minWidth: '38px',
                              height: '38px',
                              borderRadius: '50%',
                              cursor: 'pointer',
                              backgroundColor: 'var(--paper-white)',
                              border: '1px solid var(--border-light)',
                              color: 'var(--ink-black)',
                              transition: 'all 0.15s ease'
                            }}
                            title="Download document"
                            aria-label="Download document"
                          >
                            <Download size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 3: AUDIT TRAIL */}
              {activeTab === 'audit' && (
                <div className="card-steep" style={{ padding: '28px' }}>
                  <h4 style={{ marginBottom: '16px' }}>Immutable Clinical Audit Log</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {currentAudits.map((aud, idx) => (
                      <div key={idx} style={{ padding: '12px 16px', backgroundColor: 'var(--fog-white)', borderRadius: '12px', fontSize: '0.86rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <strong>{aud.action_type}</strong>
                          <span style={{ fontSize: '0.76rem', color: 'var(--slate-gray)' }}>{new Date(aud.created_at).toLocaleString()}</span>
                        </div>
                        <div style={{ color: 'var(--slate-gray)' }}>
                          Field: {aud.field_modified} • Reason: {aud.reason}
                        </div>
                        <div style={{ marginTop: '4px', fontSize: '0.82rem', color: 'var(--ink-black)' }}>
                          Value: {aud.new_value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: ABDM FHIR R4 BUNDLE */}
              {activeTab === 'fhir' && generatedFhirBundle && (
                <div className="card-steep" style={{ padding: '28px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div>
                      <h4 style={{ marginBottom: '4px' }}>ABDM FHIR R4 Diagnostic Document Bundle</h4>
                      <span style={{ fontSize: '0.82rem', color: 'var(--slate-gray)' }}>
                        Conforms to NRCeS India / NDHM DocumentBundle &amp; OPConsultRecord specifications.
                      </span>
                    </div>
                    <span className="badge-pill badge-green">ABDM HIP Certified</span>
                  </div>

                  {abdmAck && (
                    <div style={{
                      marginBottom: '20px',
                      padding: '16px 20px',
                      backgroundColor: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#166534', fontWeight: 600, fontSize: '0.94rem', marginBottom: '4px' }}>
                          <CheckCircle2 size={18} />
                          <span>ABDM HIP Data Ingestion Acknowledged</span>
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#15803d' }}>
                          Reference: <strong>{abdmAck.referenceNumber}</strong> • Txn ID: <code>{abdmAck.transactionId}</code>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', fontSize: '0.78rem', color: '#166534' }}>
                        Timestamp: {new Date(abdmAck.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  )}

                  <pre style={{ backgroundColor: 'var(--ink-black)', color: '#a7f3d0', padding: '20px', borderRadius: '14px', fontSize: '0.82rem', overflowX: 'auto', lineHeight: 1.5 }}>
                    {JSON.stringify(generatedFhirBundle, null, 2)}
                  </pre>
                </div>
              )}

            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '420px', textAlign: 'center', padding: '48px 24px' }}>
              <div style={{ width: '68px', height: '68px', borderRadius: '50%', backgroundColor: '#fff', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
                <Stethoscope size={32} color="var(--ink-soft)" />
              </div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 600, color: 'var(--ink-black)', marginBottom: '8px' }}>
                Physician Consultation Station Ready
              </h3>
              <p style={{ maxWidth: '480px', fontSize: '0.9rem', color: 'var(--slate-gray)', lineHeight: 1.6, marginBottom: '24px' }}>
                Connected to hospital outpatient department kiosks. When patients complete their history and document intake, their structured summaries will appear in the queue on the left.
              </p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <span className="badge-pill badge-green" style={{ fontSize: '0.8rem', padding: '6px 14px' }}>
                  <Activity size={14} />
                  <span>Real-time Triage Alert HUD Active</span>
                </span>
                <span className="badge-pill badge-gray" style={{ fontSize: '0.8rem', padding: '6px 14px' }}>
                  <ShieldCheck size={14} />
                  <span>ABDM M2 & FHIR R4 Ingestion Node Online</span>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Inline Field Edit Modal */}
      {editingField && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(23, 25, 28, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50
        }}>
          <div className="card-steep" style={{ maxWidth: '560px', width: '100%', padding: '32px' }}>
            <h3 style={{ marginBottom: '16px' }}>Edit Clinical Field: {editingField}</h3>
            <textarea
              rows={4}
              className="input-steep"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              style={{ marginBottom: '16px' }}
            />
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: '6px' }}>
                Audit Justification / Clinical Reason:
              </label>
              <input
                type="text"
                className="input-steep"
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setEditingField(null)} className="btn-pill btn-pill-outline">
                Cancel
              </button>
              <button onClick={handleSaveFieldEdit} className="btn-pill btn-pill-primary">
                Save & Persist in Audit Trail
              </button>
            </div>
          </div>
        </div>
      )}
      {/* In-App Patient Delete Confirmation Modal */}
      {patientToDelete && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(23, 25, 28, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '16px'
        }}>
          <div className="card-steep" style={{ maxWidth: '480px', width: '100%', padding: '32px', textAlign: 'left', border: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: 'var(--alert-red-bg)', color: 'var(--alert-red-bright)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Trash2 size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--ink-black)' }}>Remove Patient from Queue?</h3>
                <div style={{ fontSize: '0.84rem', color: 'var(--slate-gray)', marginTop: '2px' }}>
                  Token: {patientToDelete.token_number || 'TK-101'} • Encounter #{patientToDelete.id}
                </div>
              </div>
            </div>

            <p style={{ fontSize: '0.92rem', color: 'var(--ink-soft)', lineHeight: 1.5, marginBottom: '24px' }}>
              Are you sure you want to remove <strong>{patientToDelete.patient?.full_name || 'this patient'}</strong> from the outpatient queue? This will permanently delete their clinical intake session.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setPatientToDelete(null)}
                disabled={isDeleting}
                className="btn-pill btn-pill-outline"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="btn-pill"
                style={{
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: isDeleting ? 'not-allowed' : 'pointer'
                }}
              >
                <Trash2 size={16} />
                <span>{isDeleting ? 'Removing Patient...' : 'Delete Patient'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
