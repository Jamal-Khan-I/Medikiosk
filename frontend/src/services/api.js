const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL)
  || (isLocal ? 'http://localhost:4000/api' : `${typeof window !== 'undefined' ? window.location.origin : ''}/api`);

export const WS_BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_WS_URL)
  || (isLocal ? 'ws://localhost:4000' : `${typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${typeof window !== 'undefined' ? window.location.host : 'localhost:4000'}`);

class ApiClient {
  constructor() {
    this.baseUrl = API_BASE;
    this.token = localStorage.getItem('medikiosk_token') || null;
    this.ws = null;
    this.wsListeners = new Set();
    this.initWebSocket();
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('medikiosk_token', token);
    } else {
      localStorage.removeItem('medikiosk_token');
    }
  }

  getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...(options.headers || {})
      }
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Network request failed');
    }
    return data;
  }

  // Auth
  login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  getMe() {
    return this.request('/auth/me');
  }

  // Kiosk
  getNextToken() {
    return this.request('/kiosk/token/next');
  }

  startKioskSession(payload) {
    return this.request('/kiosk/session/start', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  verifyAbha(abhaInput) {
    return this.request('/kiosk/abha/verify', {
      method: 'POST',
      body: JSON.stringify({ abha_input: abhaInput })
    });
  }

  // ABDM Milestone 1 + Fast2SMS Auth (Challenge + OTP confirmation)
  initAbhaAuth(abhaNumber, authMode = 'AADHAAR_OTP', mobileNumber = null) {
    return this.request('/abdm/m1/auth/init', {
      method: 'POST',
      body: JSON.stringify({ abha_number: abhaNumber, auth_mode: authMode, mobile_number: mobileNumber })
    });
  }

  sendSmsOtp(mobile, otp) {
    return this.request('/sms/send-otp', {
      method: 'POST',
      body: JSON.stringify({ mobile, otp })
    });
  }

  getSmsWallet() {
    return this.request('/sms/wallet');
  }

  confirmAbhaAuth(txnId, otp) {
    return this.request('/abdm/m1/auth/confirm', {
      method: 'POST',
      body: JSON.stringify({ txnId, otp })
    });
  }

  // ABDM Milestone 2 HIP Data Push
  pushFhirBundle(bundle) {
    return this.request('/mock-abdm/push', {
      method: 'POST',
      body: JSON.stringify(bundle)
    });
  }

  createAbha(payload) {
    return this.request('/kiosk/abha/create', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  registerPatient(payload) {
    return this.request('/kiosk/patient/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  recordConsent(payload) {
    return this.request('/kiosk/consent', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  getIntakeQuestions(mode = 'STANDARD_SOCRATES', complaint = '') {
    return this.request(`/kiosk/intake/questions?mode=${encodeURIComponent(mode)}&complaint=${encodeURIComponent(complaint)}`);
  }

  analyzeStep(payload) {
    return this.request('/kiosk/intake/analyze-step', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  // Feature 1: Dynamic Gemini Adaptive Dialogue
  getAdaptiveQuestion(payload) {
    return this.request('/intake/adaptive-question', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  // Feature 5: Emergency Triage Check (Fast Keyword + Nuanced Gemini)
  checkRedFlags(payload) {
    return this.request('/triage/check-red-flags', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  uploadDocument(payload) {
    return this.request('/kiosk/documents/upload', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  submitKioskSession(payload) {
    return this.request('/kiosk/session/submit', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  // Google Gemini Speech-to-Text (ASR) Audio Transcription Client
  async transcribeAudio(audioBlob, language = 'en', timeoutMs = 12000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const base64Data = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const res = reader.result;
        const b64 = typeof res === 'string' ? (res.split(',')[1] || res) : '';
        resolve(b64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(audioBlob);
    });

    try {
      const res = await fetch(`${this.baseUrl}/voice/transcribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audio_data: base64Data,
          mime_type: audioBlob.type || 'audio/webm',
          language: language
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || `Voice transcription returned HTTP ${res.status}`);
      }

      return data;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error('Voice transcription timed out. Please tap your answer or retry.');
      }
      throw err;
    }
  }

  getVoiceTTSUrl(text, lang = 'hi', voice = 'Kore') {
    return `${this.baseUrl}/voice/tts?text=${encodeURIComponent(text.trim())}&lang=${encodeURIComponent(lang)}&voice=${encodeURIComponent(voice)}`;
  }

  // Physician
  getPhysicianQueue() {
    return this.request('/physician/queue');
  }

  getEncounterDetails(id) {
    return this.request(`/physician/encounters/${id}`);
  }

  updateSummaryField(encounterId, field, value, reason) {
    return this.request(`/physician/encounters/${encounterId}/summary`, {
      method: 'PUT',
      body: JSON.stringify({ field, value, reason })
    });
  }

  confirmEncounter(encounterId) {
    return this.request(`/physician/encounters/${encounterId}/confirm`, {
      method: 'POST'
    });
  }

  deleteEncounter(encounterId) {
    return this.request(`/physician/encounters/${encounterId}`, {
      method: 'DELETE'
    });
  }

  getPatientHistory(patientId) {
    return this.request(`/physician/patients/${patientId}/history`);
  }

  // Admin
  getStaff() {
    return this.request('/admin/staff');
  }

  createStaff(payload) {
    return this.request('/admin/staff', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  updateStaff(id, payload) {
    return this.request(`/admin/staff/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  }

  updateStaffStatus(id, isActive) {
    return this.request(`/admin/staff/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: isActive })
    });
  }

  removeStaff(id) {
    return this.request(`/admin/staff/${id}`, {
      method: 'DELETE'
    });
  }

  getKiosks() {
    return this.request('/admin/kiosks');
  }

  resetKiosk(id) {
    return this.request(`/admin/kiosks/${id}/reset`, {
      method: 'POST'
    });
  }

  getConsentAudits() {
    return this.request('/admin/consent-audit');
  }

  getAdminPatients() {
    return this.request('/admin/patients');
  }

  getAnalytics() {
    return this.request('/admin/analytics');
  }

  // Triage
  getTriageAlerts() {
    return this.request('/triage/alerts');
  }

  acknowledgeAlert(id) {
    return this.request(`/triage/alerts/${id}/acknowledge`, {
      method: 'POST'
    });
  }

  resolveAlert(id, notes) {
    return this.request(`/triage/alerts/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ resolution_notes: notes })
    });
  }

  deleteTriageAlert(id) {
    return this.request(`/triage/alerts/${id}`, {
      method: 'DELETE'
    });
  }

  loginPhysician(email, password) {
    return this.request('/auth/physician/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  // Real-time WebSocket
  initWebSocket() {
    try {
      this.ws = new WebSocket(WS_BASE);
      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          this.wsListeners.forEach(listener => listener(msg));
        } catch (e) {
          console.error('WS parse error:', e);
        }
      };
      this.ws.onclose = () => {
        setTimeout(() => this.initWebSocket(), 3000);
      };
    } catch (e) {
      console.warn('WebSocket connection not ready:', e);
    }
  }

  subscribe(listener) {
    this.wsListeners.add(listener);
    return () => this.wsListeners.delete(listener);
  }
}

export const api = new ApiClient();
