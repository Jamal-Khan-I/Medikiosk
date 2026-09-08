import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  BarChart3, 
  Plus, 
  CheckCircle2, 
  AlertTriangle,
  Server,
  Lock,
  Download,
  Trash2,
  Edit3,
  Search,
  Clock,
  User,
  Activity,
  FileText,
  ShieldAlert,
  Calendar,
  Phone,
  RefreshCw
} from 'lucide-react';
import { api } from '../../services/api';

export default function HospitalAdmin({ onExitAdmin }) {
  const [activeTab, setActiveTab] = useState('patients'); // 'patients' | 'staff' | 'analytics'
  const [adminPatients, setAdminPatients] = useState([]);
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [staff, setStaff] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [isUpdatingStaff, setIsUpdatingStaff] = useState(false);
  const [staffToRemove, setStaffToRemove] = useState(null);
  const [isRemovingStaff, setIsRemovingStaff] = useState(false);
  
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    password: '',
    role: 'PHYSICIAN',
    specialty: '',
    nmc_registration_number: ''
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [pRes, sRes, aRes] = await Promise.all([
        api.getAdminPatients(),
        api.getStaff(),
        api.getAnalytics()
      ]);
      setAdminPatients(pRes.patients || []);
      setStaff(sRes.staff || []);
      setAnalytics(aRes);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = api.subscribe((msg) => {
      if (
        msg.type === 'PATIENT_QUEUE_UPDATE' || 
        msg.type === 'TRIAGE_ALERT_TRIGGERED' || 
        msg.type === 'TRIAGE_ALERT_UPDATED'
      ) {
        api.getAdminPatients().then(res => setAdminPatients(res.patients || []));
      }
    });
    return () => unsubscribe();
  }, []);

  const handleAddStaff = async (e) => {
    e.preventDefault();
    try {
      await api.createStaff(newStaff);
      setNewStaff({
        name: '',
        email: '',
        password: '',
        role: 'PHYSICIAN',
        specialty: '',
        nmc_registration_number: ''
      });
      setShowAddStaffModal(false);
      loadData();
    } catch (e) {
      alert('Error creating staff: ' + e.message);
    }
  };

  const handleUpdateStaff = async (e) => {
    e.preventDefault();
    if (!editingStaff) return;
    setIsUpdatingStaff(true);
    try {
      await api.updateStaff(editingStaff.id, editingStaff);
      setEditingStaff(null);
      loadData();
    } catch (e) {
      alert('Error updating staff account: ' + e.message);
    } finally {
      setIsUpdatingStaff(false);
    }
  };

  const handleToggleStaffStatus = async (staffId, currentStatus) => {
    try {
      await api.updateStaffStatus(staffId, !currentStatus);
      loadData();
    } catch (e) {
      alert('Error updating staff account status: ' + e.message);
    }
  };

  const handleConfirmRemoveStaff = async () => {
    if (!staffToRemove) return;
    setIsRemovingStaff(true);
    try {
      await api.removeStaff(staffToRemove.id);
      setStaff((prev) => prev.filter((s) => String(s.id) !== String(staffToRemove.id)));
      setStaffToRemove(null);
      loadData();
    } catch (e) {
      alert('Error removing staff account: ' + e.message);
    } finally {
      setIsRemovingStaff(false);
    }
  };

  const filteredPatients = adminPatients.filter(p => {
    if (!patientSearchQuery.trim()) return true;
    const q = patientSearchQuery.toLowerCase();
    return (
      (p.patient_name && p.patient_name.toLowerCase().includes(q)) ||
      (p.token_number && p.token_number.toLowerCase().includes(q)) ||
      (p.abha_number && p.abha_number.toLowerCase().includes(q)) ||
      (p.phone_number && p.phone_number.includes(q)) ||
      (p.chief_complaint && p.chief_complaint.toLowerCase().includes(q))
    );
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--fog-white)' }}>
      {/* Admin Top Header */}
      <header style={{
        padding: '16px 32px',
        backgroundColor: 'var(--paper-white)',
        borderBottom: '1px solid var(--border-light)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--ink-black)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '1.05rem' }}>Hospital Operations & Administrative Console</div>
            <div style={{ fontSize: '0.76rem', color: 'var(--slate-gray)' }}>Apex Healthcare Systems • Multi-Kiosk Fleet ID: APX-MUM-01</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="badge-pill badge-peach">Hospital Admin</span>
          <button onClick={onExitAdmin} className="btn-pill btn-pill-outline btn-pill-sm">
            Exit Admin
          </button>
        </div>
      </header>

      {/* Navigation Sub-bar */}
      <div style={{ padding: '12px 32px', backgroundColor: '#fff', borderBottom: '1px solid var(--border-light)', display: 'flex', gap: '10px' }}>
        <button
          onClick={() => setActiveTab('patients')}
          className={`btn-pill ${activeTab === 'patients' ? 'btn-pill-primary' : 'btn-pill-secondary'}`}
          style={{ padding: '8px 20px', fontSize: '0.86rem' }}
        >
          <Activity size={16} />
          <span>Live Patient OPD Inflow ({adminPatients.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('staff')}
          className={`btn-pill ${activeTab === 'staff' ? 'btn-pill-primary' : 'btn-pill-secondary'}`}
          style={{ padding: '8px 20px', fontSize: '0.86rem' }}
        >
          <Users size={16} />
          <span>Staff & Physician Access ({staff.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`btn-pill ${activeTab === 'analytics' ? 'btn-pill-primary' : 'btn-pill-secondary'}`}
          style={{ padding: '8px 20px', fontSize: '0.86rem' }}
        >
          <BarChart3 size={16} />
          <span>Operational Throughput</span>
        </button>
      </div>

      {/* Content Viewport */}
      <main style={{ flex: 1, padding: '32px', maxWidth: '1280px', margin: '0 auto', width: '100%' }}>
        
        {/* TAB 1: LIVE PATIENT INFLOW & REGISTRY */}
        {activeTab === 'patients' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h2>Live OPD Patient Inflow & Registry</h2>
                <p style={{ color: 'var(--slate-gray)', fontSize: '0.92rem' }}>
                  Real-time monitoring of patients checked in via OPD kiosks, check-in timestamps, triage priority, and clinical complaints.
                </p>
              </div>

              <button onClick={loadData} className="btn-pill btn-pill-outline btn-pill-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                <span>Refresh Live Inflow</span>
              </button>
            </div>

            {/* Summary KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div className="card-steep" style={{ padding: '20px' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--slate-gray)', textTransform: 'uppercase', marginBottom: '4px' }}>Total Registered Today</div>
                <div style={{ fontSize: '1.9rem', fontWeight: 700, color: 'var(--ink-black)' }}>{adminPatients.length}</div>
                <div style={{ fontSize: '0.76rem', color: 'var(--success-green-bright)', marginTop: '2px' }}>Live OPD Kiosk Check-ins</div>
              </div>

              <div className="card-steep" style={{ padding: '20px' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--slate-gray)', textTransform: 'uppercase', marginBottom: '4px' }}>Red Flag Emergencies</div>
                <div style={{ fontSize: '1.9rem', fontWeight: 700, color: 'var(--alert-red-bright)' }}>
                  {adminPatients.filter(p => p.is_red_flagged).length}
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--slate-gray)', marginTop: '2px' }}>Instant Clinical Triaged</div>
              </div>

              <div className="card-steep" style={{ padding: '20px' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--slate-gray)', textTransform: 'uppercase', marginBottom: '4px' }}>Prescriptions & Labs Digitized</div>
                <div style={{ fontSize: '1.9rem', fontWeight: 700, color: 'var(--sienna-brown)' }}>
                  {adminPatients.reduce((acc, p) => acc + (p.documents_count || 0), 0)}
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--slate-gray)', marginTop: '2px' }}>Multimodal Vision OCR</div>
              </div>

              <div className="card-steep" style={{ padding: '20px' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--slate-gray)', textTransform: 'uppercase', marginBottom: '4px' }}>Awaiting Doctor Consultation</div>
                <div style={{ fontSize: '1.9rem', fontWeight: 700, color: 'var(--ink-black)' }}>
                  {adminPatients.filter(p => p.status !== 'CONFIRMED').length}
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--slate-gray)', marginTop: '2px' }}>Active Outpatient Queue</div>
              </div>
            </div>

            {/* Search Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px', backgroundColor: '#fff', padding: '10px 18px', borderRadius: '14px', border: '1px solid var(--border-light)' }}>
              <Search size={18} color="var(--slate-gray)" />
              <input
                type="text"
                placeholder="Search patient by Name, Token # (e.g. TK-101), Phone Number, ABHA, or Chief Complaint..."
                value={patientSearchQuery}
                onChange={(e) => setPatientSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  fontSize: '0.92rem',
                  backgroundColor: 'transparent'
                }}
              />
              {patientSearchQuery && (
                <button
                  type="button"
                  onClick={() => setPatientSearchQuery('')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--slate-gray)' }}
                >
                  Clear
                </button>
              )}
            </div>

            {/* Patients Table */}
            <div className="card-steep" style={{ padding: '0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem', textAlign: 'left' }}>
                <thead style={{ backgroundColor: 'var(--fog-white)', borderBottom: '1px solid var(--border-light)' }}>
                  <tr>
                    <th style={{ padding: '14px 18px', fontWeight: 600 }}>Token</th>
                    <th style={{ padding: '14px 18px', fontWeight: 600 }}>Check-in Entry Time</th>
                    <th style={{ padding: '14px 18px', fontWeight: 600 }}>Patient Demographics</th>
                    <th style={{ padding: '14px 18px', fontWeight: 600 }}>ABHA ID</th>
                    <th style={{ padding: '14px 18px', fontWeight: 600 }}>Chief Complaint & Triage</th>
                    <th style={{ padding: '14px 18px', fontWeight: 600 }}>Intake Stream</th>
                    <th style={{ padding: '14px 18px', fontWeight: 600 }}>Docs</th>
                    <th style={{ padding: '14px 18px', fontWeight: 600 }}>Queue Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--slate-gray)' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--fog-white)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
                          <User size={22} color="var(--slate-gray)" />
                        </div>
                        <div style={{ fontWeight: 600, color: 'var(--ink-black)', marginBottom: '4px' }}>
                          {patientSearchQuery ? 'No matching patient records found' : 'No patients checked in yet'}
                        </div>
                        <p style={{ fontSize: '0.82rem', margin: 0 }}>
                          {patientSearchQuery ? 'Try searching with a different name, token, or mobile number.' : 'Patients registered at the OPD Kiosks will appear here live in real-time.'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredPatients.map((p, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-light)', backgroundColor: p.is_red_flagged ? 'rgba(239, 68, 68, 0.04)' : '#fff' }}>
                        <td style={{ padding: '14px 18px' }}>
                          <span className="badge-pill badge-peach" style={{ fontWeight: 700, fontSize: '0.8rem' }}>
                            {p.token_number || 'TK-101'}
                          </span>
                        </td>

                        <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: 600, color: 'var(--ink-black)' }}>
                            {p.entry_time ? new Date(p.entry_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--slate-gray)' }}>
                            {p.entry_time ? new Date(p.entry_time).toLocaleDateString() : 'Today'}
                          </div>
                        </td>

                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--ink-black)' }}>{p.patient_name}</div>
                          <div style={{ fontSize: '0.76rem', color: 'var(--slate-gray)' }}>
                            {p.gender} • {p.age} yrs • Phone: {p.phone_number || 'N/A'}
                          </div>
                        </td>

                        <td style={{ padding: '14px 18px', fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--slate-gray)' }}>
                          {p.abha_number || 'Walk-in Direct'}
                        </td>

                        <td style={{ padding: '14px 18px', maxWidth: '240px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                            {p.is_red_flagged ? (
                              <span className="badge-pill badge-red" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                                <AlertTriangle size={10} />
                                <span>RED FLAG</span>
                              </span>
                            ) : (
                              <span className="badge-pill badge-gray" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                                Routine OPD
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.82rem', color: 'var(--ink-soft)', lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.chief_complaint}>
                            {p.chief_complaint || 'General Consultation'}
                          </div>
                        </td>

                        <td style={{ padding: '14px 18px', fontSize: '0.8rem' }}>
                          <span className="badge-pill badge-gray">
                            {p.intake_mode === 'AYUSH_DASHAVIDHA' ? 'AYUSH' : 'SOCRATES'}
                          </span>
                        </td>

                        <td style={{ padding: '14px 18px' }}>
                          {p.documents_count > 0 ? (
                            <span className="badge-pill badge-peach" style={{ fontSize: '0.74rem' }}>
                              <FileText size={11} />
                              <span>{p.documents_count} Files</span>
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.76rem', color: 'var(--slate-gray)' }}>0</span>
                          )}
                        </td>

                        <td style={{ padding: '14px 18px' }}>
                          <span className={`badge-pill ${p.status === 'CONFIRMED' ? 'badge-green' : 'badge-gray'}`} style={{ fontSize: '0.74rem' }}>
                            {p.status === 'CONFIRMED' ? 'Signed Off' : 'In OPD Queue'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: STAFF & PHYSICIAN ACCESS */}
        {activeTab === 'staff' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2>Clinical & Administrative Accounts</h2>
                <p style={{ color: 'var(--slate-gray)', fontSize: '0.92rem' }}>
                  Manage doctor credentials, clinical specialty assignments, and account active statuses.
                </p>
              </div>
              <button onClick={() => setShowAddStaffModal(true)} className="btn-pill btn-pill-primary">
                <Plus size={16} />
                <span>Add Clinical User</span>
              </button>
            </div>

            <div className="card-steep" style={{ padding: '0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', textAlign: 'left' }}>
                <thead style={{ backgroundColor: 'var(--fog-white)', borderBottom: '1px solid var(--border-light)' }}>
                  <tr>
                    <th style={{ padding: '14px 20px', fontWeight: 600 }}>Staff Name</th>
                    <th style={{ padding: '14px 20px', fontWeight: 600 }}>Role</th>
                    <th style={{ padding: '14px 20px', fontWeight: 600 }}>Clinical Specialty</th>
                    <th style={{ padding: '14px 20px', fontWeight: 600 }}>NMC / Reg Number</th>
                    <th style={{ padding: '14px 20px', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '14px 20px', fontWeight: 600 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map((s, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '14px 20px', fontWeight: 500 }}>
                        {s.name}
                        <div style={{ fontSize: '0.76rem', color: 'var(--slate-gray)' }}>{s.email}</div>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span className="badge-pill badge-peach">{s.role}</span>
                      </td>
                      <td style={{ padding: '14px 20px', color: 'var(--slate-gray)' }}>
                        {s.specialty || s.department || 'General Medicine'}
                      </td>
                      <td style={{ padding: '14px 20px', fontFamily: 'monospace' }}>{s.nmc_registration_number || 'N/A'}</td>
                      <td style={{ padding: '14px 20px' }}>
                        <span className={`badge-pill ${s.is_active !== false ? 'badge-green' : 'badge-red'}`}>
                          {s.is_active !== false ? 'Active' : 'Inactive (Deactivated)'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', flexWrap: 'nowrap' }}>
                          <button
                            type="button"
                            onClick={() => setEditingStaff({
                              ...s,
                              password: ''
                            })}
                            className="btn-pill btn-pill-sm btn-pill-outline"
                            style={{
                              fontSize: '0.78rem',
                              color: 'var(--ink-black)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                              whiteSpace: 'nowrap',
                              flexShrink: 0
                            }}
                            title="Edit user details"
                          >
                            <Edit3 size={12} />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleToggleStaffStatus(s.id, s.is_active !== false)}
                            className={`btn-pill btn-pill-sm ${s.is_active !== false ? 'btn-pill-outline' : 'btn-pill-peach'}`}
                            style={{ fontSize: '0.78rem', whiteSpace: 'nowrap', flexShrink: 0, minWidth: '92px', justifyContent: 'center' }}
                          >
                            {s.is_active !== false ? 'Deactivate' : 'Reactivate'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setStaffToRemove(s)}
                            className="btn-pill btn-pill-sm btn-pill-outline"
                            style={{
                              fontSize: '0.78rem',
                              color: '#dc2626',
                              borderColor: '#fca5a5',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                              whiteSpace: 'nowrap',
                              flexShrink: 0
                            }}
                            title="Permanently remove physician from hospital roster"
                          >
                            <Trash2 size={12} />
                            <span>Remove</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: OPERATIONAL ANALYTICS */}
        {activeTab === 'analytics' && analytics && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h2>Outpatient Throughput & Operational Metrics</h2>
              <p style={{ color: 'var(--slate-gray)', fontSize: '0.92rem' }}>
                Operational metrics aggregated across hospital kiosk terminals and clinical sign-offs.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
              <div className="card-steep" style={{ padding: '24px' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--slate-gray)', textTransform: 'uppercase', marginBottom: '4px' }}>Total Patients Intake</div>
                <div style={{ fontSize: '2.2rem', fontWeight: 600, color: 'var(--ink-black)' }}>{analytics.total_patients_processed}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--success-green-bright)', marginTop: '4px' }}>+34% vs Manual Paper Triage</div>
              </div>

              <div className="card-steep" style={{ padding: '24px' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--slate-gray)', textTransform: 'uppercase', marginBottom: '4px' }}>Avg Intake Duration</div>
                <div style={{ fontSize: '2.2rem', fontWeight: 600, color: 'var(--ink-black)' }}>{analytics.average_intake_time_minutes} min</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--slate-gray)', marginTop: '4px' }}>Target: &lt; 5.0 mins</div>
              </div>

              <div className="card-steep" style={{ padding: '24px' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--slate-gray)', textTransform: 'uppercase', marginBottom: '4px' }}>Prior Records Digitized</div>
                <div style={{ fontSize: '2.2rem', fontWeight: 600, color: 'var(--ink-black)' }}>{analytics.documents_digitized}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--slate-gray)', marginTop: '4px' }}>OCR Accuracy: 97.4%</div>
              </div>

              <div className="card-steep" style={{ padding: '24px' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--slate-gray)', textTransform: 'uppercase', marginBottom: '4px' }}>Red Flag Triage Rate</div>
                <div style={{ fontSize: '2.2rem', fontWeight: 600, color: 'var(--alert-red-bright)' }}>{analytics.red_flag_triage_rate_percentage}%</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--slate-gray)', marginTop: '4px' }}>Emergency alerts routed</div>
              </div>
            </div>

            {/* Language Breakdown */}
            <div className="card-steep" style={{ padding: '28px' }}>
              <h4 style={{ marginBottom: '16px' }}>Linguistic Intake Distribution</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {analytics.language_breakdown?.map((l, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '6px' }}>
                      <span>{l.language}</span>
                      <span style={{ fontWeight: 600 }}>{l.percentage}%</span>
                    </div>
                    <div style={{ height: '8px', backgroundColor: 'var(--fog-white)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${l.percentage}%`, height: '100%', backgroundColor: 'var(--ink-black)', borderRadius: '4px' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Add Staff Modal */}
      {showAddStaffModal && (
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
          zIndex: 60,
          padding: '16px'
        }}>
          <div className="card-steep" style={{ maxWidth: '520px', width: '100%', padding: '32px' }}>
            <h3 style={{ marginBottom: '16px' }}>Add New Clinical Staff Account</h3>
            <form onSubmit={handleAddStaff} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>Full Name & Honorific</label>
                <input
                  type="text"
                  required
                  placeholder="Enter full name and medical qualification"
                  className="input-steep"
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>Hospital Email</label>
                <input
                  type="email"
                  required
                  placeholder="Enter official hospital email address"
                  className="input-steep"
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
                  Clinical Login Password <span style={{ color: 'var(--alert-red-bright)' }}>*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter password for physician sign-in"
                  className="input-steep"
                  value={newStaff.password}
                  onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>Role</label>
                  <select
                    className="input-steep"
                    value={newStaff.role}
                    onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                  >
                    <option value="PHYSICIAN">Physician</option>
                    <option value="TRIAGE_NURSE">Triage Nurse</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>NMC Registration #</label>
                  <input
                    type="text"
                    placeholder="Enter NMC / State Council registration #"
                    className="input-steep"
                    value={newStaff.nmc_registration_number}
                    onChange={(e) => setNewStaff({ ...newStaff, nmc_registration_number: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>Clinical Specialty</label>
                <input
                  type="text"
                  placeholder="e.g. Internal Medicine & Diabetology, Cardiology"
                  className="input-steep"
                  value={newStaff.specialty}
                  onChange={(e) => setNewStaff({ ...newStaff, specialty: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowAddStaffModal(false)} className="btn-pill btn-pill-outline">
                  Cancel
                </button>
                <button type="submit" className="btn-pill btn-pill-primary">
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Clinical User Modal */}
      {editingStaff && (
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
          zIndex: 60,
          padding: '16px'
        }}>
          <div className="card-steep" style={{ maxWidth: '520px', width: '100%', padding: '32px' }}>
            <h3 style={{ marginBottom: '16px' }}>Edit Clinical User Details</h3>
            <form onSubmit={handleUpdateStaff} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>Full Name & Honorific</label>
                <input
                  type="text"
                  required
                  className="input-steep"
                  value={editingStaff.name || ''}
                  onChange={(e) => setEditingStaff({ ...editingStaff, name: e.target.value })}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>Hospital Email</label>
                <input
                  type="email"
                  required
                  className="input-steep"
                  value={editingStaff.email || ''}
                  onChange={(e) => setEditingStaff({ ...editingStaff, email: e.target.value })}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
                  Update Password / PIN <span style={{ fontSize: '0.74rem', color: 'var(--slate-gray)', fontWeight: 400 }}>(Leave blank to keep existing)</span>
                </label>
                <input
                  type="password"
                  placeholder="Enter new password to change"
                  className="input-steep"
                  value={editingStaff.password || ''}
                  onChange={(e) => setEditingStaff({ ...editingStaff, password: e.target.value })}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>Role</label>
                  <select
                    className="input-steep"
                    value={editingStaff.role || 'PHYSICIAN'}
                    onChange={(e) => setEditingStaff({ ...editingStaff, role: e.target.value })}
                  >
                    <option value="PHYSICIAN">Physician</option>
                    <option value="TRIAGE_NURSE">Triage Nurse</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>NMC Registration #</label>
                  <input
                    type="text"
                    placeholder="e.g. MCI-2014-78921"
                    className="input-steep"
                    value={editingStaff.nmc_registration_number || ''}
                    onChange={(e) => setEditingStaff({ ...editingStaff, nmc_registration_number: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>Clinical Specialty</label>
                <input
                  type="text"
                  placeholder="e.g. Internal Medicine & Diabetology, Cardiology"
                  className="input-steep"
                  value={editingStaff.specialty || ''}
                  onChange={(e) => setEditingStaff({ ...editingStaff, specialty: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button type="button" onClick={() => setEditingStaff(null)} className="btn-pill btn-pill-outline">
                  Cancel
                </button>
                <button type="submit" disabled={isUpdatingStaff} className="btn-pill btn-pill-primary">
                  {isUpdatingStaff ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-App Staff Remove Confirmation Modal */}
      {staffToRemove && (
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
                <h3 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--ink-black)' }}>Remove Staff Account?</h3>
                <div style={{ fontSize: '0.84rem', color: 'var(--slate-gray)', marginTop: '2px' }}>
                  {staffToRemove.role} • {staffToRemove.specialty || staffToRemove.department || 'Clinical Staff'}
                </div>
              </div>
            </div>

            <p style={{ fontSize: '0.92rem', color: 'var(--ink-soft)', lineHeight: 1.5, marginBottom: '24px' }}>
              Are you sure you want to permanently remove <strong>{staffToRemove.name}</strong> ({staffToRemove.email}) from the hospital staff registry? This action cannot be undone.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setStaffToRemove(null)}
                disabled={isRemovingStaff}
                className="btn-pill btn-pill-outline"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRemoveStaff}
                disabled={isRemovingStaff}
                className="btn-pill"
                style={{
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: isRemovingStaff ? 'not-allowed' : 'pointer'
                }}
              >
                <Trash2 size={16} />
                <span>{isRemovingStaff ? 'Removing...' : 'Remove Staff'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
