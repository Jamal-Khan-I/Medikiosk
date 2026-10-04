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
  ArrowLeft, 
  Shield, 
  HeartPulse,
  ChevronDown,
  ChevronUp,
  Plus,
  Pill,
  ClipboardList,
  Printer,
  X,
  Copy
} from 'lucide-react';
import { api } from '../../services/api';

// Feature 4 — Transparent AI Reasoning ("Why This?" Layer)
export function WhyThisTag({ explanation, label = "Why this?", defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  if (!explanation) return null;

  return (
    <div style={{ marginTop: '8px' }}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          padding: '4px 11px',
          fontSize: '0.74rem',
          fontWeight: 600,
          borderRadius: '999px',
          border: `1px solid ${isOpen ? '#a5b4fc' : '#e0e7ff'}`,
          backgroundColor: isOpen ? '#eef2ff' : '#f8faff',
          color: isOpen ? '#3730a3' : '#4f46e5',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          lineHeight: '16px'
        }}
        title="View clinical evidence trace and reasoning for this AI output"
      >
        <Sparkles size={12} color="#6366f1" />
        <span>{isOpen ? 'Hide AI Evidence' : label}</span>
        {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {isOpen && (
        <div style={{
          marginTop: '8px',
          padding: '12px 16px',
          backgroundColor: '#f5f7ff',
          border: '1px solid #c7d2fe',
          borderRadius: '12px',
          fontSize: '0.83rem',
          color: '#1e293b',
          lineHeight: 1.55,
          boxShadow: '0 2px 8px rgba(99, 102, 241, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: '#4338ca', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
            <ShieldCheck size={14} color="#4f46e5" />
            <span>AI Evidence &amp; Clinical Data Trace</span>
          </div>
          <div style={{ color: '#334155' }}>
            {explanation}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PhysicianDashboard({ onExitDashboard }) {
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

  // Sign-Off & FHIR Presentation States
  const [signOffSuccess, setSignOffSuccess] = useState(false);
  const [showRawFhirJson, setShowRawFhirJson] = useState(false);
  const [jsonCopied, setJsonCopied] = useState(false);

  // Treatment Plan, Prescriptions & Clinical Notes States
  const [treatmentNotes, setTreatmentNotes] = useState('');
  const [prescriptions, setPrescriptions] = useState([]);
  const [investigationsOrdered, setInvestigationsOrdered] = useState('');
  const [lifestyleAdvice, setLifestyleAdvice] = useState('');
  const [followUpInstructions, setFollowUpInstructions] = useState('');
  const [isSavingTreatment, setIsSavingTreatment] = useState(false);
  const [treatmentSaveSuccess, setTreatmentSaveSuccess] = useState(false);

  // New Prescription item entry row
  const [newMedName, setNewMedName] = useState('');
  const [newMedDosage, setNewMedDosage] = useState('');
  const [newMedFrequency, setNewMedFrequency] = useState('1-0-1');
  const [newMedDuration, setNewMedDuration] = useState('5 days');
  const [newMedInstructions, setNewMedInstructions] = useState('After food');

  // Responsive View State for Tablet & Mobile (Stacked cards vs details)
  const [isMobileScreen, setIsMobileScreen] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 1024);
  const [mobileView, setMobileView] = useState('queue'); // 'queue' | 'details'

  useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth <= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
  }, [selectedEncounterId]);

  const fetchDetails = async (id) => {
    if (!id) return;
    setIsLoading(true);
    try {
      const res = await api.getEncounterDetails(id);
      setEncounterDetails(res);
      if (res?.encounter?.fhir_bundle) {
        setGeneratedFhirBundle(res.encounter.fhir_bundle);
      }
      if (res?.encounter?.abdm_ack) {
        setAbdmAck(res.encounter.abdm_ack);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedEncounterId) {
      fetchDetails(selectedEncounterId);
    }
  }, [selectedEncounterId]);

  // Sync treatment fields whenever active encounter summary changes
  useEffect(() => {
    if (encounterDetails?.summary) {
      const s = encounterDetails.summary;
      setTreatmentNotes(s.clinical_notes || s.treatment_notes || '');
      setPrescriptions(Array.isArray(s.prescriptions) ? s.prescriptions : (s.prescriptions ? [s.prescriptions] : []));
      setInvestigationsOrdered(s.investigations_ordered || '');
      setLifestyleAdvice(s.dietary_lifestyle_advice || '');
      setFollowUpInstructions(s.follow_up_instructions || '');
    } else {
      setTreatmentNotes('');
      setPrescriptions([]);
      setInvestigationsOrdered('');
      setLifestyleAdvice('');
      setFollowUpInstructions('');
    }
    if (encounterDetails?.encounter?.fhir_bundle) {
      setGeneratedFhirBundle(encounterDetails.encounter.fhir_bundle);
    }
    if (encounterDetails?.encounter?.abdm_ack) {
      setAbdmAck(encounterDetails.encounter.abdm_ack);
    }
  }, [encounterDetails]);

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

  // Save Treatment Plan, Prescriptions, and Doctor Notes
  const handleSaveTreatmentPlan = async () => {
    if (!selectedEncounterId) return;
    setIsSavingTreatment(true);
    setTreatmentSaveSuccess(false);
    try {
      await api.saveTreatmentPlan(selectedEncounterId, {
        clinical_notes: treatmentNotes,
        prescriptions: prescriptions,
        investigations_ordered: investigationsOrdered,
        dietary_lifestyle_advice: lifestyleAdvice,
        follow_up_instructions: followUpInstructions
      });
      setTreatmentSaveSuccess(true);
      fetchDetails(selectedEncounterId);
      setTimeout(() => setTreatmentSaveSuccess(false), 3500);
    } catch (e) {
      alert('Error saving treatment plan: ' + e.message);
    } finally {
      setIsSavingTreatment(false);
    }
  };

  const handleAddPrescription = () => {
    if (!newMedName.trim()) return;
    const newRx = {
      id: `rx_${Date.now()}`,
      name: newMedName.trim(),
      dosage: newMedDosage.trim() || '1 tablet',
      frequency: newMedFrequency || '1-0-1',
      duration: newMedDuration || '5 days',
      instructions: newMedInstructions || 'After food'
    };
    setPrescriptions(prev => [...prev, newRx]);
    setNewMedName('');
    setNewMedDosage('');
  };

  const handleRemovePrescription = (id) => {
    setPrescriptions(prev => prev.filter(p => p.id !== id));
  };

  const handleAddTemplateMed = (name, dosage, frequency, duration, instructions) => {
    const newRx = {
      id: `rx_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name,
      dosage,
      frequency,
      duration,
      instructions
    };
    setPrescriptions(prev => [...prev, newRx]);
  };

  const handlePrintPrescription = () => {
    window.print();
  };

  // Official Sign-off and ABDM FHIR R4 Bundle Generation
  const handleConfirmEncounter = async () => {
    if (!selectedEncounterId) return;
    setIsSigningOff(true);
    try {
      // Auto-save treatment plan & prescriptions if drafted
      if (treatmentNotes || prescriptions.length > 0 || investigationsOrdered || lifestyleAdvice || followUpInstructions) {
        await api.saveTreatmentPlan(selectedEncounterId, {
          clinical_notes: treatmentNotes,
          prescriptions: prescriptions,
          investigations_ordered: investigationsOrdered,
          dietary_lifestyle_advice: lifestyleAdvice,
          follow_up_instructions: followUpInstructions
        });
      }

      const res = await api.confirmEncounter(selectedEncounterId);
      if (res.success) {
        setGeneratedFhirBundle(res.fhir_bundle);
        setAbdmAck(res.abdm_ack);
        setSignOffSuccess(true);
        // CRITICAL: Keep physician on summary view; do NOT switch to raw code view!
        setActiveTab('summary');
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

  // Dynamic clinical summary section numbering (handles conditional AYUSH and Diff Diag sections seamlessly)
  const hasAyush = Boolean(currentSummary?.ayush_prakriti);
  const hasDiffDiag = Boolean(currentSummary?.suggested_differential_diagnoses && currentSummary.suggested_differential_diagnoses.length > 0);
  const ayushSecNum = 10;
  const diffDiagSecNum = hasAyush ? 11 : 10;
  const treatmentSecNum = (hasAyush ? 1 : 0) + (hasDiffDiag ? 1 : 0) + 10;

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
  // MAIN PHYSICIAN DASHBOARD WORKSTATION
  // -------------------------------------------------------------
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--fog-white)' }}>
      {/* Top Bar */}
      <header style={{
        padding: '12px 20px',
        backgroundColor: 'var(--paper-white)',
        borderBottom: '1px solid var(--border-light)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 30,
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--ink-black)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Stethoscope size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '1.02rem', color: 'var(--ink-black)' }}>MediKiosk Physician Workstation</div>
            <div style={{ fontSize: '0.74rem', color: 'var(--slate-gray)' }}>
              {physicianUser.name}
              {physicianUser.specialty ? ` • ${physicianUser.specialty}` : ''}
              {physicianUser.nmcNumber ? ` • NMC Reg: ${physicianUser.nmcNumber}` : ''}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span className="badge-pill badge-peach">{physicianUser.specialty || physicianUser.department || 'OPD Clinical Unit'}</span>

          {onExitDashboard && (
            <button onClick={onExitDashboard} className="btn-pill btn-pill-secondary btn-pill-sm" style={{ minHeight: '38px' }}>
              Exit Workstation
            </button>
          )}
        </div>
      </header>

      {/* Main Layout */}
      <div className="split-workstation-layout">
        
        {/* Left: Patient Queue (Adapts to stacked cards on tablet & mobile) */}
        {(!isMobileScreen || mobileView === 'queue') && (
          <div className="split-sidebar-panel">
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Active Outpatient Queue</div>
                <div style={{ fontSize: '0.76rem', color: 'var(--slate-gray)' }}>{queue.length} Patients Ready</div>
              </div>
              <span className="badge-pill badge-gray">Live WebSocket</span>
            </div>

            {isMobileScreen && queue.length > 0 && (
              <div style={{ padding: '8px 14px', backgroundColor: 'var(--peach-subtle)', color: 'var(--sienna-brown)', fontSize: '0.78rem', fontWeight: 500, borderBottom: '1px solid var(--blush-peach)' }}>
                Tap any patient card below to review clinical summary & sign off EHR.
              </div>
            )}

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
                      onClick={() => {
                        setSelectedEncounterId(enc.id);
                        if (isMobileScreen) setMobileView('details');
                      }}
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
        )}

        {/* Right: Detailed Structured Summary */}
        {(!isMobileScreen || mobileView === 'details') && (
          <div className="split-main-panel">
            {isMobileScreen && (
              <button
                type="button"
                onClick={() => setMobileView('queue')}
                className="btn-pill btn-pill-outline btn-pill-sm"
                style={{ alignSelf: 'flex-start', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px', minHeight: '44px' }}
              >
                <ArrowLeft size={16} />
                <span>Back to Patient Queue ({queue.length})</span>
              </button>
            )}
            
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
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                    {encounterDetails.encounter.red_flag_why_this && (
                      <div style={{ paddingLeft: '36px' }}>
                        <WhyThisTag 
                          explanation={encounterDetails.encounter.red_flag_why_this} 
                          label="Why this red-flag alert?" 
                          defaultOpen={true}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Patient Demographics Banner (Section 1) */}
                <div className="card-steep" style={{ padding: '20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <h2 style={{ fontSize: 'clamp(1.3rem, 3.5vw, 1.6rem)', color: 'var(--ink-black)' }}>{currentPatient?.full_name}</h2>
                      <span className="badge-pill badge-peach">Token: {encounterDetails.encounter.token_number || 'TK-101'}</span>
                      <span className="badge-pill badge-gray">{currentPatient?.gender}</span>
                      <span className="badge-pill badge-peach">Age: {currentAge} yrs</span>
                    </div>
                    <div style={{ display: 'flex', gap: '14px', marginTop: '8px', fontSize: '0.85rem', color: 'var(--slate-gray)', flexWrap: 'wrap' }}>
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
                        style={{ minHeight: '44px' }}
                      >
                        <CheckCircle2 size={18} />
                        <span>{isSigningOff ? 'Generating FHIR Bundle...' : 'Confirm & Sign Off History'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Official Clinical Sign-off Success Certificate Banner */}
                {signOffSuccess && abdmAck && (
                  <div style={{
                    margin: '16px 0',
                    padding: '16px 20px',
                    backgroundColor: '#f0fdf4',
                    border: '1.5px solid #22c55e',
                    borderRadius: '16px',
                    boxShadow: '0 4px 16px rgba(34, 197, 94, 0.12)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          backgroundColor: '#dcfce7',
                          color: '#15803d',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <CheckCircle2 size={20} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '1rem', color: '#166534' }}>
                            Clinical Encounter Successfully Confirmed &amp; Signed Off
                          </div>
                          <div style={{ fontSize: '0.82rem', color: '#15803d', marginTop: '2px' }}>
                            ABDM Gateway Ref: <strong>{abdmAck.referenceNumber}</strong> • Txn ID: <code>{abdmAck.transactionId}</code>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          onClick={() => setActiveTab('fhir')}
                          className="btn-pill btn-pill-outline btn-pill-sm"
                          style={{ borderColor: '#86efac', color: '#166534', backgroundColor: '#fff', fontSize: '0.78rem' }}
                        >
                          <FileCode2 size={13} />
                          <span>View ABDM FHIR R4 Bundle</span>
                        </button>
                        <button
                          onClick={() => setSignOffSuccess(false)}
                          style={{ background: 'none', border: 'none', color: '#166534', cursor: 'pointer', padding: '4px' }}
                          title="Dismiss"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Tabs */}
                <div className="tabs-scrollable" style={{ padding: '8px 12px', marginBottom: '16px' }}>
                <button
                  onClick={() => setActiveTab('summary')}
                  className={`tab-btn-pill ${activeTab === 'summary' ? 'active' : 'inactive'}`}
                >
                  <span>Current Clinical Summary</span>
                </button>
                <button
                  onClick={() => setActiveTab('past_visits')}
                  className={`tab-btn-pill ${activeTab === 'past_visits' ? 'active' : 'inactive'}`}
                >
                  <History size={14} />
                  <span>Past Visits ({(encounterDetails.past_visits || []).length})</span>
                </button>
                <button
                  onClick={() => setActiveTab('documents')}
                  className={`tab-btn-pill ${activeTab === 'documents' ? 'active' : 'inactive'}`}
                >
                  <span>Prior Docs ({currentDocs.length})</span>
                </button>
                <button
                  onClick={() => setActiveTab('audit')}
                  className={`tab-btn-pill ${activeTab === 'audit' ? 'active' : 'inactive'}`}
                >
                  <History size={14} />
                  <span>Audit Trail ({currentAudits.length})</span>
                </button>
                {generatedFhirBundle && (
                  <button
                    onClick={() => setActiveTab('fhir')}
                    className={`tab-btn-pill ${activeTab === 'fhir' ? 'active' : 'inactive'}`}
                  >
                    <FileCode2 size={14} />
                    <span>ABDM FHIR R4</span>
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

                  {/* FEATURE 1: AYUSH-Allopathy Cross-System Safety Note (Appears ONLY when both allopathic prescription and AYUSH assessment exist) */}
                  {currentSummary.cross_system_safety_note && currentSummary.cross_system_safety_note.has_concern && (
                    <div style={{
                      padding: '20px 24px',
                      backgroundColor: '#fffdf5',
                      border: '1.5px solid #f59e0b',
                      borderRadius: '16px',
                      boxShadow: '0 4px 16px rgba(245, 158, 11, 0.08)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            backgroundColor: '#fef3c7',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#b45309'
                          }}>
                            <Shield size={18} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.96rem', color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                              Cross-System Note: AYUSH-Allopathy Safety Review
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#b45309' }}>
                              Physician Advisory Prompt • Integrative Cross-Reference Check
                            </div>
                          </div>
                        </div>
                        <span className="badge-pill" style={{ backgroundColor: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', fontWeight: 600 }}>
                          For Clinical Review
                        </span>
                      </div>

                      <div style={{ fontSize: '0.92rem', color: '#78350f', lineHeight: 1.6, fontWeight: 500, marginBottom: '12px' }}>
                        {currentSummary.cross_system_safety_note.advisory_text}
                      </div>

                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                        {currentSummary.cross_system_safety_note.medications_involved?.map((med, mIdx) => (
                          <span key={mIdx} className="badge-pill" style={{ backgroundColor: '#ede9fe', color: '#5b21b6', fontSize: '0.74rem' }}>
                            Allopathic: {med}
                          </span>
                        ))}
                        {currentSummary.cross_system_safety_note.ayush_parameters_involved?.map((param, pIdx) => (
                          <span key={pIdx} className="badge-pill" style={{ backgroundColor: '#ffedd5', color: '#c2410c', fontSize: '0.74rem' }}>
                            AYUSH: {param}
                          </span>
                        ))}
                      </div>

                      <WhyThisTag
                        explanation={currentSummary.cross_system_safety_note.why_this || currentSummary.why_this_explanations?.cross_system}
                        label="Why this cross-system note?"
                        defaultOpen={false}
                      />
                    </div>
                  )}

                  {/* FEATURE 2: Longitudinal Contradiction Detection ("Discrepancy Noted") */}
                  {currentSummary.longitudinal_discrepancies && currentSummary.longitudinal_discrepancies.length > 0 && (
                    <div style={{
                      padding: '20px 24px',
                      backgroundColor: '#fff7ed',
                      border: '1.5px solid #ea580c',
                      borderRadius: '16px',
                      boxShadow: '0 4px 16px rgba(234, 88, 12, 0.08)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            backgroundColor: '#ffedd5',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#c2410c'
                          }}>
                            <History size={18} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.96rem', color: '#9a3412', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                              Discrepancy Noted: Longitudinal Record Reconciliation
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#c2410c' }}>
                              Factual variation detected against prior consultation record. Prior record preserved.
                            </div>
                          </div>
                        </div>
                        <span className="badge-pill" style={{ backgroundColor: '#ffedd5', color: '#9a3412', border: '1px solid #fdba74', fontWeight: 600 }}>
                          {currentSummary.longitudinal_discrepancies.length} Discrepanc{currentSummary.longitudinal_discrepancies.length === 1 ? 'y' : 'ies'} Noted
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {currentSummary.longitudinal_discrepancies.map((disc, dIdx) => (
                          <div key={dIdx} style={{
                            padding: '14px 16px',
                            backgroundColor: '#fff',
                            border: '1px solid #fed7aa',
                            borderRadius: '12px'
                          }}>
                            <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#9a3412', marginBottom: '8px' }}>
                              Field: {disc.field}
                            </div>

                            {/* Side-by-Side Comparison */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginBottom: '10px' }}>
                              <div style={{ padding: '10px 12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <div style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--slate-gray)', textTransform: 'uppercase', marginBottom: '4px' }}>
                                  Previously Recorded (Visit #{disc.prior_visit_token || 'Prior'})
                                </div>
                                <div style={{ fontSize: '0.86rem', color: 'var(--ink-black)', fontWeight: 500 }}>
                                  {disc.prior_statement}
                                </div>
                              </div>

                              <div style={{ padding: '10px 12px', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
                                <div style={{ fontSize: '0.74rem', fontWeight: 600, color: '#b91c1c', textTransform: 'uppercase', marginBottom: '4px' }}>
                                  Current Visit Statement
                                </div>
                                <div style={{ fontSize: '0.86rem', color: '#991b1b', fontWeight: 500 }}>
                                  {disc.current_statement}
                                </div>
                              </div>
                            </div>

                            <div style={{ fontSize: '0.82rem', color: 'var(--ink-soft)', fontStyle: 'italic', marginBottom: '4px' }}>
                              {disc.neutral_note}
                            </div>

                            <WhyThisTag explanation={disc.why_this} label="Why this discrepancy?" />
                          </div>
                        ))}
                      </div>

                      {currentSummary.why_this_explanations?.discrepancies && (
                        <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #fed7aa' }}>
                          <WhyThisTag explanation={currentSummary.why_this_explanations.discrepancies} label="Why these discrepancies overall?" />
                        </div>
                      )}
                    </div>
                  )}

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
                    <WhyThisTag explanation={currentSummary.why_this_explanations?.chief_complaint} />
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
                    <WhyThisTag explanation={currentSummary.why_this_explanations?.history_of_present_illness} />
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
                      {currentSummary.past_medical_history || 'No prior chronic medical conditions recorded.'}
                    </p>
                    <WhyThisTag explanation={currentSummary.why_this_explanations?.past_medical_history} />
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
                          setEditValue(currentSummary.medication_history || currentSummary.current_medications || '');
                        }}
                        className="btn-pill btn-pill-outline btn-pill-sm"
                      >
                        <Edit3 size={13} />
                        <span>Edit</span>
                      </button>
                    </div>
                    <p style={{ fontSize: '0.92rem', color: 'var(--ink-black)', lineHeight: 1.5 }}>
                      {currentSummary.current_medications || currentSummary.medication_history || 'No active medications recorded.'}
                    </p>
                    <WhyThisTag explanation={currentSummary.why_this_explanations?.current_medications} />
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
                          setEditValue(currentSummary.allergies || currentSummary.drug_allergies || '');
                        }}
                        className="btn-pill btn-pill-outline btn-pill-sm"
                      >
                        <Edit3 size={13} />
                        <span>Edit</span>
                      </button>
                    </div>
                    <p style={{ fontSize: '0.92rem', color: 'var(--ink-black)', fontWeight: 500 }}>
                      {currentSummary.allergies || currentSummary.drug_allergies || 'No known drug allergies reported.'}
                    </p>
                    <WhyThisTag explanation={currentSummary.why_this_explanations?.drug_allergies} />
                  </div>

                  {/* 7. Family & Social History */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="card-steep" style={{ padding: '20px' }}>
                      <h4 style={{ color: 'var(--slate-gray)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '6px' }}>
                        7a. Family History
                      </h4>
                      <p style={{ fontSize: '0.88rem', color: 'var(--ink-black)', lineHeight: 1.5 }}>
                        {currentSummary.family_history || 'No notable family history recorded.'}
                      </p>
                      <WhyThisTag explanation={currentSummary.why_this_explanations?.family_history} />
                    </div>
                    <div className="card-steep" style={{ padding: '20px' }}>
                      <h4 style={{ color: 'var(--slate-gray)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '6px' }}>
                        7b. Personal & Social History
                      </h4>
                      <p style={{ fontSize: '0.88rem', color: 'var(--ink-black)', lineHeight: 1.5 }}>
                        {currentSummary.personal_social_history || currentSummary.personal_history || 'Standard lifestyle; no specific risk factors.'}
                      </p>
                      <WhyThisTag explanation={currentSummary.why_this_explanations?.personal_history} />
                    </div>
                  </div>

                  {/* 8. Review of Systems */}
                  <div className="card-steep" style={{ padding: '20px' }}>
                    <h4 style={{ color: 'var(--slate-gray)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '6px' }}>
                      8. Systematic Review of Systems (ROS)
                    </h4>
                    <p style={{ fontSize: '0.88rem', color: 'var(--ink-black)', lineHeight: 1.5 }}>
                      {currentSummary.review_of_systems || 'Review of systems completed with no secondary systemic complaints flagged.'}
                    </p>
                    <WhyThisTag explanation={currentSummary.why_this_explanations?.review_of_systems} />
                  </div>

                  {/* 9. Prior Investigations Summary */}
                  <div className="card-steep" style={{ padding: '20px' }}>
                    <h4 style={{ color: 'var(--slate-gray)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '6px' }}>
                      9. Prior Investigations & Scanned Documents Summary
                    </h4>
                    <p style={{ fontSize: '0.88rem', color: 'var(--ink-black)', lineHeight: 1.5 }}>
                      {currentSummary.prior_investigations_summary || 'No prior investigations or scanned records uploaded in this session.'}
                    </p>
                    <WhyThisTag explanation={currentSummary.why_this_explanations?.prior_investigations_summary} />
                  </div>

                  {/* AYUSH Dashavidha Pariksha (If applicable) */}
                  {currentSummary.ayush_prakriti && (
                    <div className="card-steep-peach" style={{ padding: '24px' }}>
                      <h4 style={{ color: 'var(--sienna-brown)', marginBottom: '12px' }}>
                        {ayushSecNum}. AYUSH Dashavidha Pariksha &amp; Ahara-Vihara
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
                      <WhyThisTag explanation={currentSummary.why_this_explanations?.ayush_pariksha_summary} label="Why this AYUSH assessment?" />
                    </div>
                  )}

                  {/* AI Clinical Decision Support: Suggested Differential Diagnoses */}
                  {currentSummary.suggested_differential_diagnoses && currentSummary.suggested_differential_diagnoses.length > 0 && (
                    <div className="card-steep" style={{ padding: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          <h4 style={{ color: 'var(--slate-gray)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Sparkles size={14} color="var(--slate-gray)" />
                            <span>{diffDiagSecNum}. AI Suggested Differential Diagnoses (Decision Support)</span>
                          </h4>
                          <p style={{ fontSize: '0.82rem', color: 'var(--ink-soft)', margin: 0 }}>
                            AI-generated differential candidates for attending physician clinical verification.
                          </p>
                        </div>
                        <span className="badge-pill badge-gray" style={{ fontSize: '0.72rem' }}>
                          Clinical Decision Support
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {currentSummary.suggested_differential_diagnoses.map((diff, dIdx) => (
                          <div key={dIdx} style={{
                            padding: '14px 16px',
                            backgroundColor: 'var(--fog-white)',
                            border: '1px solid var(--border-light)',
                            borderRadius: 'var(--radius-card, 12px)'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '6px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--ink-black)' }}>
                                  {diff.condition}
                                </span>
                                {diff.icd10 && (
                                  <span className="badge-pill badge-gray" style={{ fontSize: '0.72rem' }}>
                                    ICD-10: {diff.icd10}
                                  </span>
                                )}
                              </div>
                              <span className="badge-pill" style={{
                                fontSize: '0.72rem',
                                backgroundColor: diff.probability === 'HIGH' ? '#fef2f2' : (diff.probability === 'MODERATE' ? '#fffbeb' : '#f0fdf4'),
                                color: diff.probability === 'HIGH' ? '#b91c1c' : (diff.probability === 'MODERATE' ? '#b45309' : '#15803d'),
                                border: `1px solid ${diff.probability === 'HIGH' ? '#fecaca' : (diff.probability === 'MODERATE' ? '#fde68a' : '#bbf7d0')}`
                              }}>
                                {diff.probability} Probability
                              </span>
                            </div>

                            <div style={{ fontSize: '0.84rem', color: 'var(--ink-soft)', lineHeight: 1.5 }}>
                              {diff.clinical_rationale}
                            </div>

                            <WhyThisTag explanation={diff.why_this || diff.clinical_rationale} label="Why this differential?" />
                          </div>
                        ))}
                      </div>

                      {currentSummary.why_this_explanations?.suggested_differential_diagnoses && (
                        <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-light)' }}>
                          <WhyThisTag explanation={currentSummary.why_this_explanations.suggested_differential_diagnoses} label="Why these differentials overall?" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* PHYSICIAN TREATMENT PLAN, PRESCRIPTIONS & CONSULTATION NOTES */}
                  <div className="card-steep" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <h4 style={{ color: 'var(--slate-gray)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <ClipboardList size={15} color="var(--slate-gray)" />
                          <span>{treatmentSecNum}. Physician Treatment Plan &amp; Rx Orders</span>
                          <span className="badge-pill badge-gray" style={{ fontSize: '0.7rem' }}>
                            Official OPD Consultation
                          </span>
                        </h4>
                        <p style={{ fontSize: '0.82rem', color: 'var(--ink-soft)', margin: 0 }}>
                          Document physical findings, issue new prescription medications, and specify follow-up care.
                        </p>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={handlePrintPrescription}
                          className="btn-pill btn-pill-outline btn-pill-sm"
                          title="Print / Save OPD Prescription"
                        >
                          <Printer size={14} />
                          <span>Print Rx Slip</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveTreatmentPlan}
                          disabled={isSavingTreatment}
                          className="btn-pill btn-pill-primary btn-pill-sm"
                        >
                          <Save size={14} />
                          <span>{isSavingTreatment ? 'Saving...' : 'Save Treatment Plan'}</span>
                        </button>
                      </div>
                    </div>

                    {treatmentSaveSuccess && (
                      <div style={{
                        padding: '10px 16px',
                        backgroundColor: '#f0fdf4',
                        color: '#15803d',
                        borderRadius: '10px',
                        fontSize: '0.84rem',
                        fontWeight: 600,
                        marginBottom: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <CheckCircle2 size={16} />
                        <span>Treatment Plan, Rx orders, and Clinical notes saved to EHR successfully.</span>
                      </div>
                    )}

                    {/* Part A: Clinical Examination Findings & Doctor's Notes */}
                    <div style={{ marginBottom: '18px' }}>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--ink-black)', marginBottom: '6px' }}>
                        Clinical Notes &amp; Physical Examination Findings:
                      </label>
                      <textarea
                        rows={3}
                        className="input-steep"
                        placeholder="e.g. Vitals: BP 124/82 mmHg, PR 76 bpm, SpO2 99%. Chest clear, S1/S2 heard. Advised low glycemic diet and regular exercise. Confirmed Type 2 Diabetes Mellitus with mild fatigue."
                        value={treatmentNotes}
                        onChange={(e) => setTreatmentNotes(e.target.value)}
                        style={{ width: '100%', resize: 'vertical' }}
                      />
                    </div>

                    {/* Part B: Rx Prescriptions Builder */}
                    <div style={{ marginBottom: '18px', padding: '16px', backgroundColor: 'var(--fog-white)', borderRadius: 'var(--radius-card, 12px)', border: '1px solid var(--border-light)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Pill size={16} color="var(--ink-soft)" />
                          <strong style={{ fontSize: '0.88rem', color: 'var(--ink-black)' }}>
                            New Prescription Medications (Rx)
                          </strong>
                          <span className="badge-pill badge-gray" style={{ fontSize: '0.72rem' }}>
                            {prescriptions.length} Med{prescriptions.length === 1 ? '' : 's'}
                          </span>
                        </div>
                        {/* Quick Add Templates */}
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.74rem', color: 'var(--slate-gray)', alignSelf: 'center' }}>Quick add:</span>
                          <button
                            type="button"
                            onClick={() => handleAddTemplateMed('Paracetamol 650mg', '1 tab', '1-0-1 (SOS)', '3 days', 'After food')}
                            className="btn-pill btn-pill-outline btn-pill-sm"
                            style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                          >
                            + Paracetamol 650mg
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddTemplateMed('Pantoprazole 40mg', '1 tab', '1-0-0 (OD)', '14 days', 'Before breakfast')}
                            className="btn-pill btn-pill-outline btn-pill-sm"
                            style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                          >
                            + Pantoprazole 40mg
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddTemplateMed('Cetirizine 10mg', '1 tab', '0-0-1 (HS)', '5 days', 'At bedtime')}
                            className="btn-pill btn-pill-outline btn-pill-sm"
                            style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                          >
                            + Cetirizine 10mg
                          </button>
                        </div>
                      </div>

                      {/* Prescribed Medications Table/List */}
                      {prescriptions.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                          {prescriptions.map((rx, idx) => (
                            <div key={rx.id || idx} style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '10px 14px',
                              backgroundColor: 'var(--paper-white)',
                              border: '1px solid var(--border-light)',
                              borderRadius: '10px',
                              flexWrap: 'wrap',
                              gap: '8px'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontWeight: 700, color: 'var(--ink-soft)', fontSize: '0.85rem' }}>#{idx + 1}</span>
                                <div>
                                  <strong style={{ fontSize: '0.9rem', color: 'var(--ink-black)' }}>{rx.name}</strong>
                                  <span style={{ fontSize: '0.82rem', color: 'var(--slate-gray)', marginLeft: '8px' }}>
                                    ({rx.dosage}) • <strong>{rx.frequency}</strong> • {rx.duration}
                                  </span>
                                  {rx.instructions && (
                                    <span className="badge-pill badge-gray" style={{ fontSize: '0.74rem', marginLeft: '8px' }}>
                                      {rx.instructions}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemovePrescription(rx.id || idx)}
                                style={{ background: 'none', border: 'none', color: 'var(--alert-red-bright)', cursor: 'pointer', padding: '4px' }}
                                title="Remove medication"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ padding: '14px', textAlign: 'center', fontSize: '0.82rem', color: 'var(--slate-gray)', fontStyle: 'italic', marginBottom: '14px' }}>
                          No new medications prescribed yet. Add medications below or click one of the quick-add buttons above.
                        </div>
                      )}

                      {/* Add Medicine Inline Form */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr)) 80px',
                        gap: '8px',
                        alignItems: 'end',
                        padding: '12px',
                        backgroundColor: 'var(--paper-white)',
                        borderRadius: '10px',
                        border: '1px solid var(--border-light)'
                      }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: 'var(--slate-gray)', marginBottom: '4px' }}>
                            Medicine Name
                          </label>
                          <input
                            type="text"
                            className="input-steep"
                            placeholder="e.g. Metformin 500mg"
                            value={newMedName}
                            onChange={(e) => setNewMedName(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleAddPrescription(); }}
                            style={{ fontSize: '0.82rem', padding: '8px 10px' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: 'var(--slate-gray)', marginBottom: '4px' }}>
                            Dosage / Form
                          </label>
                          <input
                            type="text"
                            className="input-steep"
                            placeholder="e.g. 1 tab / 500mg"
                            value={newMedDosage}
                            onChange={(e) => setNewMedDosage(e.target.value)}
                            style={{ fontSize: '0.82rem', padding: '8px 10px' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: 'var(--slate-gray)', marginBottom: '4px' }}>
                            Frequency
                          </label>
                          <select
                            className="input-steep"
                            value={newMedFrequency}
                            onChange={(e) => setNewMedFrequency(e.target.value)}
                            style={{ fontSize: '0.82rem', padding: '8px 6px' }}
                          >
                            <option value="1-0-0">1-0-0 (Morning only)</option>
                            <option value="0-1-0">0-1-0 (Afternoon only)</option>
                            <option value="0-0-1">0-0-1 (Night only)</option>
                            <option value="1-0-1">1-0-1 (Morning &amp; Night)</option>
                            <option value="1-1-1">1-1-1 (Thrice daily)</option>
                            <option value="SOS">SOS (As needed)</option>
                            <option value="Once a week">Once a week</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: 'var(--slate-gray)', marginBottom: '4px' }}>
                            Duration
                          </label>
                          <input
                            type="text"
                            className="input-steep"
                            placeholder="e.g. 5 days / 1 mo"
                            value={newMedDuration}
                            onChange={(e) => setNewMedDuration(e.target.value)}
                            style={{ fontSize: '0.82rem', padding: '8px 10px' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: 'var(--slate-gray)', marginBottom: '4px' }}>
                            Instructions
                          </label>
                          <select
                            className="input-steep"
                            value={newMedInstructions}
                            onChange={(e) => setNewMedInstructions(e.target.value)}
                            style={{ fontSize: '0.82rem', padding: '8px 6px' }}
                          >
                            <option value="After food">After food</option>
                            <option value="Before food">Before food</option>
                            <option value="With food">With food</option>
                            <option value="Empty stomach">Empty stomach</option>
                            <option value="At bedtime">At bedtime</option>
                          </select>
                        </div>
                        <button
                          type="button"
                          onClick={handleAddPrescription}
                          className="btn-pill btn-pill-primary"
                          style={{ minHeight: '36px', padding: '0 12px', fontSize: '0.82rem' }}
                        >
                          <Plus size={14} />
                          <span>Add</span>
                        </button>
                      </div>
                    </div>

                    {/* Part C: Diagnostic Lab Orders & Lifestyle Advice */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--ink-black)', marginBottom: '4px' }}>
                          Diagnostic Lab Orders / Investigations:
                        </label>
                        <input
                          type="text"
                          className="input-steep"
                          placeholder="e.g. CBC, Serum Creatinine, Fasting Blood Sugar, Lipid Profile, ECG"
                          value={investigationsOrdered}
                          onChange={(e) => setInvestigationsOrdered(e.target.value)}
                          style={{ fontSize: '0.86rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--ink-black)', marginBottom: '4px' }}>
                          Dietary &amp; Lifestyle Advice:
                        </label>
                        <input
                          type="text"
                          className="input-steep"
                          placeholder="e.g. Low salt diet, 30 min brisk walk daily, avoid cold beverages"
                          value={lifestyleAdvice}
                          onChange={(e) => setLifestyleAdvice(e.target.value)}
                          style={{ fontSize: '0.86rem' }}
                        />
                      </div>
                    </div>

                    {/* Part D: Follow-up & Review Instructions */}
                    <div style={{ marginBottom: '18px' }}>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--ink-black)', marginBottom: '4px' }}>
                        Follow-up &amp; Review Instructions:
                      </label>
                      <input
                        type="text"
                        className="input-steep"
                        placeholder="e.g. Review in General Medicine OPD after 7 days with lab reports, or SOS if fever/chest pain recurs"
                        value={followUpInstructions}
                        onChange={(e) => setFollowUpInstructions(e.target.value)}
                        style={{ fontSize: '0.86rem' }}
                      />
                    </div>

                    {/* Save Button Row */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={handleSaveTreatmentPlan}
                        disabled={isSavingTreatment}
                        className="btn-pill btn-pill-primary"
                        style={{ padding: '10px 24px' }}
                      >
                        <Save size={16} />
                        <span>{isSavingTreatment ? 'Saving Treatment Plan...' : 'Save & Update Patient Record'}</span>
                      </button>
                    </div>
                  </div>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <h4 style={{ marginBottom: '4px', fontSize: '1.15rem' }}>ABDM FHIR R4 Diagnostic Document Bundle</h4>
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
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '10px'
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

                  {/* Clean Human-Readable FHIR Resource Summary Card */}
                  <div style={{
                    padding: '18px 20px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    marginBottom: '20px'
                  }}>
                    <h5 style={{ fontSize: '0.88rem', color: '#334155', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.03em' }}>
                      FHIR Document Metadata &amp; Clinical Composition
                    </h5>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '0.84rem' }}>
                      <div>
                        <span style={{ color: '#64748b' }}>Bundle ID:</span> <strong>{generatedFhirBundle.id}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b' }}>Resource Type:</span> <strong>{generatedFhirBundle.resourceType} ({generatedFhirBundle.type})</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b' }}>Total Resources:</span> <strong>{generatedFhirBundle.entry?.length || 0} Entries</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b' }}>Subject:</span> <strong>{currentPatient?.full_name} ({currentPatient?.abha_number || 'ABHA Linked'})</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b' }}>Practitioner:</span> <strong>{physicianUser?.name} ({physicianUser?.nmcNumber})</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b' }}>Composition Title:</span> <strong>{generatedFhirBundle.entry?.[0]?.resource?.title || 'Outpatient Consultation Record'}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Collapsible Technical JSON Inspection Section */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <button
                      type="button"
                      onClick={() => setShowRawFhirJson(!showRawFhirJson)}
                      className="btn-pill btn-pill-outline btn-pill-sm"
                      style={{ fontSize: '0.82rem' }}
                    >
                      <FileCode2 size={14} />
                      <span>{showRawFhirJson ? 'Hide Technical JSON Code' : 'Show Technical FHIR JSON Code'}</span>
                    </button>

                    {showRawFhirJson && (
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(JSON.stringify(generatedFhirBundle, null, 2));
                          setJsonCopied(true);
                          setTimeout(() => setJsonCopied(false), 2500);
                        }}
                        className="btn-pill btn-pill-outline btn-pill-sm"
                        style={{ fontSize: '0.78rem' }}
                      >
                        <Copy size={13} />
                        <span>{jsonCopied ? 'Copied to Clipboard!' : 'Copy JSON'}</span>
                      </button>
                    )}
                  </div>

                  {showRawFhirJson && (
                    <pre style={{
                      backgroundColor: 'var(--ink-black)',
                      color: '#a7f3d0',
                      padding: '20px',
                      borderRadius: '14px',
                      fontSize: '0.82rem',
                      overflowX: 'auto',
                      lineHeight: 1.5,
                      maxHeight: '480px'
                    }}>
                      {JSON.stringify(generatedFhirBundle, null, 2)}
                    </pre>
                  )}
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
        )}
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
