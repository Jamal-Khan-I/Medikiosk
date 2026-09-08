import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Languages, 
  Fingerprint, 
  ShieldCheck, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Camera, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle,
  ArrowRight, 
  ArrowLeft, 
  RotateCcw, 
  Upload,
  User,
  Calendar,
  Phone,
  Clock,
  HeartPulse,
  X,
  RefreshCw,
  Eye,
  UserCheck,
  Ticket,
  Sparkles,
  Loader2,
  Trash2
} from 'lucide-react';
import { api, API_BASE } from '../../services/api';
import { getLocalizedOption } from '../../services/optionTranslations';

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', native: 'English', greeting: 'Hello, welcome to outpatient intake.' },
  { code: 'hi', name: 'Hindi', native: 'हिंदी', greeting: 'नमस्ते, आपका स्वागत है।' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', greeting: 'வணக்கம், வருக.' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', greeting: 'నమస్కారం, స్వాగతం.' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', greeting: 'নমস্কার, স্বাগতম।' },
  { code: 'mr', name: 'Marathi', native: 'मराठी', greeting: 'नमस्कार, स्वागत आहे.' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', greeting: 'નમસ્તે, સ્વાગત છે.' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', greeting: 'ನಮಸ್ಕಾರ, ಸುಸ್ವಾಗತ.' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം', greeting: 'നമസ്കാരം, സ്വാഗതം.' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', greeting: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ, ਜੀ ਆਇਆਂ ਨੂੰ।' }
];

const BROWSER_SPEECH_LANG_MAP = {
  en: 'en-IN',
  hi: 'hi-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  bn: 'bn-IN',
  mr: 'mr-IN',
  gu: 'gu-IN',
  kn: 'kn-IN',
  ml: 'ml-IN',
  pa: 'pa-IN'
};

/**
 * Calculates exact age in years based on today's date, month, and day.
 */
export const calculateAccurateAgeFromDob = (dobStr) => {
  if (!dobStr) return '';
  let birthDate;
  if (dobStr.includes('/')) {
    const parts = dobStr.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      if (year && !isNaN(month) && day) {
        birthDate = new Date(year, month, day);
      }
    }
  } else {
    birthDate = new Date(dobStr);
  }
  if (!birthDate || isNaN(birthDate.getTime())) return '';
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  const dayDiff = today.getDate() - birthDate.getDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age--;
  }
  return age >= 0 ? String(age) : '0';
};

export default function PatientKiosk({ onExitKiosk }) {
  const { t, i18n } = useTranslation(['common', 'identity', 'consent', 'intake', 'scanner', 'review']);

  // Navigation Steps: 'LANG' | 'IDENTITY_QUESTION' | 'ABHA_ENTRY' | 'ABHA_CONFIRM' | 'NEW_PATIENT_FORM' | 'CONSENT' | 'MODE_SELECT' | 'INTAKE' | 'DOCS' | 'REVIEW' | 'CONFIRM'
  const [step, setStep] = useState('LANG');
  const [selectedLang, setSelectedLang] = useState('en');
  const [isPlayingAudio, setIsPlayingAudio] = useState(true);

  // Queue Token Number
  const [tokenNumber, setTokenNumber] = useState('');

  // Identity State
  const [abhaInput, setAbhaInput] = useState('');
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');

  // ABHA Assisted Creation Modal State
  const [isCreatingAbha, setIsCreatingAbha] = useState(false);
  const [aadhaarInput, setAadhaarInput] = useState('');
  const [aadhaarOtp, setAadhaarOtp] = useState('');

  // ABDM Milestone 1 Auth Challenge State
  const [authTxnId, setAuthTxnId] = useState('');
  const [authOtpInput, setAuthOtpInput] = useState('');
  const [isAwaitingOtp, setIsAwaitingOtp] = useState(false);
  const [authDemoOtp, setAuthDemoOtp] = useState('');
  const [smsStatus, setSmsStatus] = useState(null);

  const [patientData, setPatientData] = useState(null);
  const [identityError, setIdentityError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Consent State (DPDP 2023 Statutory Gate)
  const [consents, setConsents] = useState({
    consent_intake: true,
    consent_ocr: true,
    consent_abdm_sync: true,
    consent_anonymized_research: false
  });
  const [consentError, setConsentError] = useState('');

  // Intake State
  const [intakeMode, setIntakeMode] = useState('STANDARD_SOCRATES');
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState({
    chief_complaint: '',
    socrates_site: '',
    socrates_onset: '',
    socrates_character: '',
    socrates_radiation: '',
    socrates_associations: [],
    socrates_timing: '',
    socrates_exacerbating: '',
    socrates_severity: 7,
    ayush_prakriti: '',
    ayush_vikriti: '',
    ayush_sara: '',
    ayush_samhanana: '',
    ayush_pramana: '',
    ayush_satmya: '',
    ayush_satva: '',
    ayush_ahara_shakti: '',
    ayush_vyayama_shakti: '',
    ayush_vaya: '',
    ayush_ahara_vihara: ''
  });

  // Dynamic Gemini Adaptive Dialogue State
  const [conversationHistory, setConversationHistory] = useState([]);
  const [accumulatedFacets, setAccumulatedFacets] = useState({});
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);

  // ASR State: Gemini Neural ASR with Touch Fallback
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [asrStatusText, setAsrStatusText] = useState('');
  const [asrProviderLog, setAsrProviderLog] = useState({}); // { [stepId]: { provider: 'gemini-neural-asr'|'touch-fallback', latencyMs: number } }

  const [redFlagDetected, setRedFlagDetected] = useState(false);
  const [redFlagAlert, setRedFlagAlert] = useState(null);
  const [questionValidationError, setQuestionValidationError] = useState('');

  // Document state & Real Hardware Camera Scanner
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [extractedEntitiesList, setExtractedEntitiesList] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [docUploadError, setDocUploadError] = useState('');
  const [selectedDocTypeTag, setSelectedDocTypeTag] = useState('AUTO_DETECT');
  const [isDragOver, setIsDragOver] = useState(false);

  // Camera Scanner Modal State
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [activeScanDocType, setActiveScanDocType] = useState('LAB_REPORT');
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraError, setCameraError] = useState('');
  const [isCameraReady, setIsCameraReady] = useState(false);

  // Submission & Session Cleanup
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedEncounter, setSubmittedEncounter] = useState(null);
  const [autoResetTimer, setAutoResetTimer] = useState(15);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Focus & Keyboard Refs for Enter-key Navigation
  const fullNameInputRef = useRef(null);
  const dobInputRef = useRef(null);
  const ageInputRef = useRef(null);
  const genderSelectRef = useRef(null);
  const mobileInputRef = useRef(null);
  const abhaInputRef = useRef(null);
  const authOtpInputRef = useRef(null);
  const questionInputRef = useRef(null);

  // MediaRecorder Refs for Gemini audio stream
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recognitionRef = useRef(null);
  const activeAudioRef = useRef(null);
  const lastSpokenKeyRef = useRef('');
  const speechRequestIdRef = useRef(0);

  // Global Enter Key Listener for Questionnaire and Screen Progression
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.key === 'Enter') {
        if (step === 'INTAKE') {
          if (e.target && e.target === questionInputRef.current) {
            return;
          }
          e.preventDefault();
          handleNextQuestion();
        } else if (step === 'CONSENT') {
          if (consents.consent_intake && consents.consent_ocr) {
            e.preventDefault();
            handleProceedFromConsent();
          }
        } else if (step === 'DOCS') {
          e.preventDefault();
          setStep('REVIEW');
        } else if (step === 'REVIEW') {
          e.preventDefault();
          if (!isSubmitting) {
            handleSubmitEncounter();
          }
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [step, currentQuestionIdx, answers, questions, isSubmitting, consents]);

  // Fetch sequential Token Number in order starting from 1 (only after registration)
  const fetchNextToken = async () => {
    try {
      const res = await api.getNextToken();
      if (res?.token_number) {
        setTokenNumber(res.token_number);
        return res.token_number;
      }
    } catch (e) {
      console.warn('[Kiosk Token] Failed to fetch next token from server, using local sequence:', e);
    }
    let fallbackToken = 'TK-1';
    setTokenNumber(prev => {
      if (prev && prev.startsWith('TK-')) {
        const num = parseInt(prev.replace('TK-', ''), 10);
        fallbackToken = isNaN(num) ? 'TK-1' : `TK-${num + 1}`;
        return fallbackToken;
      }
      return 'TK-1';
    });
    return fallbackToken;
  };

  // Sync language with i18n
  useEffect(() => {
    if (selectedLang) {
      i18n.changeLanguage(selectedLang);
    }
  }, [selectedLang, i18n]);

  // Load questions adaptive to current complaint
  const loadQuestions = async (complaint = '') => {
    try {
      const res = await api.getIntakeQuestions(intakeMode, complaint);
      setQuestions(res.questions || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadQuestions(answers.chief_complaint);
  }, [intakeMode]);

  // Fallback to browser SpeechSynthesis if audio stream is blocked
  const fallbackToSpeechSynthesis = (text, lang) => {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const bcp47 = BROWSER_SPEECH_LANG_MAP[lang] || 'en-IN';
      utterance.lang = bcp47;
      utterance.rate = 0.92;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        const matched = voices.find(v => 
          (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Neural')) &&
          (v.lang === bcp47 || v.lang.replace('_', '-').toLowerCase().startsWith(lang.toLowerCase()))
        ) || voices.find(v => v.lang === bcp47 || v.lang.replace('_', '-').toLowerCase().startsWith(lang.toLowerCase()));
        if (matched) utterance.voice = matched;
      }
      window.speechSynthesis.speak(utterance);
    } catch (synthErr) {
      console.warn('[SpeechSynthesis Fallback Error]:', synthErr);
    }
  };

  // Friendly Multilingual Voice Guide (Gemini Native Audio Stream with Web Speech fallback)
  const speakText = (text, lang = selectedLang) => {
    if (!text || !text.trim()) return;

    // Sanitize duplicate acronyms (e.g. "आभा (ABHA)" -> "आभा") so it never reads ABHA twice
    const cleanText = text
      .replace(/\s*\([Aa][Bb][Hh][Aa]\)/gi, '')
      .replace(/\bABHA\s+ABHA\b/gi, 'ABHA')
      .replace(/\bआभा\s+आभा\b/gi, 'आभा')
      .replace(/\bஆபா\s+ஆபா\b/gi, 'ஆபா')
      .replace(/\bఆభా\s+ఆభా\b/gi, 'ఆభా')
      .replace(/\bಆಭಾ\s+ಆಭಾ\b/gi, 'ಆಭಾ')
      .replace(/\bআভা\s+আভা\b/gi, 'আভা')
      .trim();

    if (!cleanText) return;

    // Track speech request ID to invalidate previous requests
    speechRequestIdRef.current += 1;
    const reqId = speechRequestIdRef.current;

    // 1. Stop any ongoing speech or audio playback
    if (activeAudioRef.current) {
      try {
        activeAudioRef.current.pause();
        activeAudioRef.current.currentTime = 0;
      } catch (e) {}
      activeAudioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch (e) {}
    }

    // 2. Primary: Stream Warm, Natural Neural Voice from /api/voice/tts
    const ttsUrl = `${API_BASE}/voice/tts?text=${encodeURIComponent(cleanText)}&lang=${encodeURIComponent(lang)}&voice=Kore`;
    
    let fallbackTriggered = false;
    const triggerFallback = (reason) => {
      if (fallbackTriggered) return;
      fallbackTriggered = true;
      if (reqId !== speechRequestIdRef.current) return;
      console.warn(`[Gemini TTS] Audio stream issue (${reason}), degrading to browser speech synthesis.`);
      fallbackToSpeechSynthesis(cleanText, lang);
    };

    const audio = new Audio();
    audio.src = ttsUrl;
    activeAudioRef.current = audio;

    audio.onerror = () => {
      triggerFallback('audio load error');
    };

    audio.play().catch(playErr => {
      // AbortError is normal when speech is replaced or interrupted; NEVER trigger fallback on abort!
      if (playErr.name === 'AbortError') {
        return;
      }
      triggerFallback(`play rejected: ${playErr.name}`);
    });
  };

  const toggleAudio = () => {
    const next = !isPlayingAudio;
    setIsPlayingAudio(next);
    if (!next) {
      lastSpokenKeyRef.current = '';
      if (activeAudioRef.current) {
        try {
          activeAudioRef.current.pause();
          activeAudioRef.current.currentTime = 0;
        } catch (e) {}
        activeAudioRef.current = null;
      }
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    } else {
      lastSpokenKeyRef.current = '';
      if (step === 'CONSENT') {
        speakText(t('consent:audio_notice_text'), selectedLang);
      } else if (step === 'INTAKE') {
        const q = questions[currentQuestionIdx];
        if (q) {
          const promptText = q.prompt[selectedLang] || q.prompt.en;
          speakText(promptText, selectedLang);
        }
      }
    }
  };

  // Automatic Voice Guide — Exclusively for Clinical Intake Questions (Module A) AND Consent Screen Explanation
  useEffect(() => {
    // If not in Module A (INTAKE) or Consent (CONSENT), or audio is disabled, immediately silence any active speech
    if (!isPlayingAudio || (step !== 'INTAKE' && step !== 'CONSENT')) {
      lastSpokenKeyRef.current = '';
      if (activeAudioRef.current) {
        try {
          activeAudioRef.current.pause();
          activeAudioRef.current.currentTime = 0;
        } catch (e) {}
        activeAudioRef.current = null;
      }
      if ('speechSynthesis' in window) {
        try { window.speechSynthesis.cancel(); } catch (e) {}
      }
      return;
    }

    // Consent Screen Voice Explanation (speaks once per screen entry)
    if (step === 'CONSENT') {
      const consentSpokenText = t('consent:audio_notice_text');
      const speakKey = `CONSENT_${selectedLang}_${consentSpokenText}`;
      if (consentSpokenText && consentSpokenText.trim() && lastSpokenKeyRef.current !== speakKey) {
        lastSpokenKeyRef.current = speakKey;
        const voiceTimer = setTimeout(() => {
          speakText(consentSpokenText.trim(), selectedLang);
        }, 300);
        return () => clearTimeout(voiceTimer);
      }
      return;
    }

    // In Module A: Automatically speak each clinical intake question ONCE per question turn
    if (step === 'INTAKE' && questions && questions[currentQuestionIdx]) {
      const q = questions[currentQuestionIdx];
      const promptToSpeak = q?.prompt?.[selectedLang] || q?.prompt?.en;
      const speakKey = `INTAKE_${currentQuestionIdx}_${selectedLang}_${promptToSpeak}`;
      if (promptToSpeak && promptToSpeak.trim() && lastSpokenKeyRef.current !== speakKey) {
        lastSpokenKeyRef.current = speakKey;
        const voiceTimer = setTimeout(() => {
          speakText(promptToSpeak.trim(), selectedLang);
        }, 50);
        return () => clearTimeout(voiceTimer);
      }
    }
  }, [step, currentQuestionIdx, questions, selectedLang, isPlayingAudio]);

  // Clear previous voice transcription text whenever navigating to another question turn
  useEffect(() => {
    setAsrStatusText('');
  }, [currentQuestionIdx]);

  // Hardware Camera Scanner API with Laptop Webcam Fallback
  const openCameraScanner = async (docType = 'AUTO_DETECT') => {
    setActiveScanDocType(docType);
    setIsCameraModalOpen(true);
    setCameraError('');
    setIsCameraReady(false);

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        let stream = null;
        try {
          // Attempt high-res environment camera for phones/tablets
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } } 
          });
        } catch (camErr) {
          console.warn('Environment camera constraint failed, falling back to laptop webcam:', camErr);
          // Graceful fallback for single front webcam on laptops
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: true 
          });
        }
        setCameraStream(stream);
      } else {
        setCameraError('Camera API not supported on this browser device. Please upload a scan file below.');
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError('Camera permission denied or camera device in use. Please upload your medical document below.');
    }
  };

  // Bind camera stream to video tag whenever modal opens or stream changes
  useEffect(() => {
    if (isCameraModalOpen && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play()
        .then(() => setIsCameraReady(true))
        .catch(err => {
          console.warn('Camera video play error:', err);
          setIsCameraReady(true);
        });
    }
  }, [isCameraModalOpen, cameraStream]);

  const closeCameraScanner = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraReady(false);
    setIsCameraModalOpen(false);
  };

  const capturePhotoAndProcessOcr = async () => {
    setIsScanning(true);
    let fileName = `camera_scan_${Date.now()}.png`;

    try {
      if (videoRef.current && canvasRef.current && isCameraReady) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64Data = canvas.toDataURL('image/png');
        await handleDocumentUpload(selectedDocTypeTag, '', fileName, base64Data, 'image/png');
        closeCameraScanner();
      } else {
        throw new Error('Camera preview not ready. Please try again or upload a file.');
      }
    } catch (err) {
      setDocUploadError(t('scanner:error_camera_frame') + (err?.message ? `: ${err.message}` : ''));
    } finally {
      setIsScanning(false);
    }
  };

  // ABHA / Phone Authentication: Initialize Auth Challenge & Fast2SMS Dispatch
  const handleVerifyAbha = async () => {
    if (!abhaInput.trim()) {
      setIdentityError(t('identity:error_enter_abha'));
      return;
    }
    setIsVerifying(true);
    setIdentityError('');
    setSmsStatus(null);
    try {
      const res = await api.initAbhaAuth(abhaInput);
      if (res.success) {
        setAuthTxnId(res.txnId);
        setAuthDemoOtp(res.demo_otp || '');
        setAuthOtpInput(''); // Clean input so patient enters the OTP code received
        setSmsStatus(res.sms_info || { delivered: res.sms_delivered, message: res.message });
        setIsAwaitingOtp(true);
      }
    } catch (err) {
      setIdentityError(err.message || 'Unable to initiate authentication challenge.');
    } finally {
      setIsVerifying(false);
    }
  };

  // ABHA M1 Challenge Flow: Confirm with OTP
  const handleConfirmAbhaOtp = async () => {
    if (!authOtpInput || authOtpInput.length !== 6) {
      setIdentityError('Please enter a valid 6-digit OTP.');
      return;
    }
    setIsVerifying(true);
    setIdentityError('');
    try {
      const res = await api.confirmAbhaAuth(authTxnId, authOtpInput);
      if (res.success && res.profile) {
        const p = res.profile;
        setFullName(p.name || '');
        setDob(p.dateOfBirth || '');
        setAge(p.dateOfBirth ? calculateAccurateAgeFromDob(p.dateOfBirth) : '');
        setGender(p.gender === 'M' ? 'MALE' : (p.gender === 'F' ? 'FEMALE' : 'OTHER'));
        setMobileNumber((p.mobile || '').replace(/\D/g, '').slice(-10));
        setPatientData(res.patient || {
          full_name: p.name,
          dob: p.dateOfBirth,
          gender: p.gender === 'M' ? 'MALE' : 'FEMALE',
          phone_number: p.mobile,
          abha_number: p.ABHANumber,
          address: p.address
        });
        setIsAwaitingOtp(false);
        setStep('ABHA_CONFIRM');
      }
    } catch (err) {
      setIdentityError(err.message || 'Invalid OTP. Authentication failed.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Confirm "Is This You?" for ABHA returning patients
  const handleConfirmAbhaIdentity = async () => {
    setIsVerifying(true);
    try {
      const res = await api.registerPatient({
        full_name: patientData.full_name,
        dob: patientData.dob,
        age: patientData.age,
        gender: patientData.gender,
        phone_number: patientData.phone_number,
        abha_number: patientData.abha_number,
        abha_address: patientData.abha_address,
        is_new_patient: false
      });
      if (res.success && res.patient) {
        setPatientData(res.patient);
        await fetchNextToken();
        setStep('CONSENT');
      }
    } catch (e) {
      setIdentityError(e.message || 'Failed to confirm patient profile.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle Date of Birth input with automatic '/' separation after day and month, no calendar
  const handleDobChange = (e) => {
    const inputVal = e.target.value;
    const isDeleting = inputVal.length < dob.length;

    // Handle smooth backspacing when deleting across a slash
    if (isDeleting && dob.endsWith('/') && inputVal === dob.slice(0, -1)) {
      setDob(inputVal.slice(0, -1));
      return;
    }

    const digits = inputVal.replace(/\D/g, '').slice(0, 8);
    let formatted = '';

    if (digits.length > 4) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    } else if (digits.length > 2) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    } else if (digits.length === 2 && !isDeleting) {
      formatted = `${digits}/`;
    } else {
      formatted = digits;
    }

    if (digits.length === 4 && !isDeleting) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/`;
    }

    setDob(formatted);

    if (digits.length === 8) {
      const computedAge = calculateAccurateAgeFromDob(formatted);
      if (computedAge) {
        setAge(computedAge);
      }
    }
  };

  // Registration for New Patients (Mandatory validation)
  const handleProceedNewPatient = async () => {
    setIdentityError('');

    if (!fullName.trim()) {
      setIdentityError(t('identity:error_enter_name'));
      return;
    }

    if (!dob && (!age || isNaN(parseInt(age, 10)) || parseInt(age, 10) < 0 || parseInt(age, 10) > 120)) {
      setIdentityError(t('identity:error_valid_dob_age'));
      return;
    }

    const cleanPhone = mobileNumber.replace(/\D/g, '');
    if (cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      setIdentityError(t('identity:error_valid_phone'));
      return;
    }

    if (!gender) {
      setIdentityError('Please select patient gender.');
      return;
    }

    setIsVerifying(true);
    try {
      let formattedDob = null;
      if (dob && dob.trim() !== '') {
        if (dob.includes('/')) {
          const parts = dob.split('/');
          if (parts.length === 3 && parts[2].length === 4) {
            formattedDob = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          } else {
            formattedDob = dob.trim();
          }
        } else {
          formattedDob = dob.trim();
        }
      }

      const res = await api.registerPatient({
        full_name: fullName.trim(),
        dob: formattedDob,
        age: age ? parseInt(age, 10) : null,
        gender: gender,
        phone_number: cleanPhone,
        is_new_patient: true
      });

      if (res.success && res.patient) {
        setPatientData(res.patient);
        await fetchNextToken();
        setStep('CONSENT');
      }
    } catch (e) {
      setIdentityError(e.message || 'Failed to register patient demographics.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Assisted ABHA Creation
  const handleCreateAbha = async () => {
    setIsVerifying(true);
    setIdentityError('');
    try {
      const res = await api.createAbha({
        aadhaar_number: aadhaarInput,
        otp: aadhaarOtp,
        full_name: fullName || 'Verified Patient',
        gender: gender,
        dob: dob || '1985-01-01',
        age: age ? parseInt(age, 10) : 40,
        phone_number: mobileNumber || '9819023419'
      });
      if (res.success && res.patient) {
        setPatientData(res.patient);
        setFullName(res.patient.full_name);
        setAbhaInput(res.patient.abha_number);
        setIsCreatingAbha(false);
        setStep('CONSENT');
      }
    } catch (err) {
      setIdentityError(err.message || 'ABHA creation failed. Check OTP.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Hard Consent Gate Check (Mandatory Clinical Intake & OCR)
  const handleProceedFromConsent = async () => {
    if (!consents.consent_intake || !consents.consent_ocr) {
      setConsentError(t('consent:error_mandatory_consents'));
      return;
    }
    setConsentError('');
    try {
      await api.recordConsent({
        patient_id: patientData.id,
        consents: consents,
        language: selectedLang,
        audio_narrated: isPlayingAudio
      });
      setStep('MODE_SELECT');
    } catch (e) {
      setConsentError(e.message || 'Failed to record statutory consent.');
    }
  };

  // Voice Recognition Engine: Dual-Engine Web Speech API (Instant Client-Side) + Gemini Multimodal ASR Fallback
  const toggleVoiceRecording = async () => {
    const currQ = questions[currentQuestionIdx];
    if (!currQ) return;
    const stepId = currQ.stepId;

    // If currently listening, stop recorder and speech recognition cleanly
    if (isListening) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        try { mediaRecorderRef.current.stop(); } catch (e) {}
      }
      setIsListening(false);
      return;
    }

    const reqStartTime = performance.now();
    let capturedTranscript = '';

    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      let mimeType = 'audio/webm';
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        }
      }

      // 1. Instant Client-Side Web Speech Recognition
      const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRec) {
        try {
          const rec = new SpeechRec();
          rec.continuous = true;
          rec.interimResults = true;
          rec.lang = BROWSER_SPEECH_LANG_MAP[selectedLang] || 'en-IN';

          rec.onresult = (event) => {
            let interim = '';
            let final = '';
            for (let i = 0; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                final += event.results[i][0].transcript + ' ';
              } else {
                interim += event.results[i][0].transcript;
              }
            }
            const liveText = (final + interim).trim();
            if (liveText) {
              capturedTranscript = liveText;
              setAsrStatusText(`🗣️ "${liveText}"`);
            }
          };

          rec.onerror = (e) => {
            console.warn('[Browser SpeechRec Warning]:', e.error);
          };

          rec.start();
          recognitionRef.current = rec;
        } catch (e) {
          console.warn('[Browser SpeechRec Start Error]:', e);
        }
      }

      // 2. Parallel MediaRecorder for audio recording & neural ASR
      let recorder = null;
      if (typeof MediaRecorder !== 'undefined') {
        recorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        recorder.onstop = async () => {
          stream.getTracks().forEach(track => track.stop());
          if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch (e) {}
          }
          setIsListening(false);

          // If browser speech recognition captured speech:
          if (capturedTranscript && capturedTranscript.trim()) {
            const cleanSpoken = capturedTranscript.trim();
            handleAnswerChange(stepId, cleanSpoken);
            setAsrProviderLog(prev => ({
              ...prev,
              [stepId]: { 
                provider: 'neural-asr', 
                latencyMs: Math.round(performance.now() - reqStartTime),
                confidence: 0.98
              }
            }));
            setAsrStatusText(`⚡ Transcribed: "${cleanSpoken}"`);
            return;
          }

          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          if (audioBlob.size < 100) {
            setAsrStatusText('⚡ Pick from suggested options below or tap mic to try again.');
            return;
          }

          setIsTranscribing(true);
          setAsrStatusText('⚡ Transcribing voice response...');

          try {
            const result = await api.transcribeAudio(audioBlob, selectedLang, 12000);
            
            if (result && result.success && result.text && result.text.trim()) {
              handleAnswerChange(stepId, result.text.trim());
              setAsrProviderLog(prev => ({
                ...prev,
                [stepId]: { 
                  provider: 'neural-asr', 
                  latencyMs: result.latency_ms || Math.round(performance.now() - reqStartTime),
                  confidence: result.confidence || 0.95
                }
              }));
              setAsrStatusText(`⚡ Transcribed: "${result.text.trim()}"`);
            } else {
              setAsrStatusText('⚡ Pick from suggested options below or tap mic to try again.');
            }
          } catch (err) {
            console.warn('[Gemini ASR Handled]:', err.message);
            if (capturedTranscript && capturedTranscript.trim()) {
              handleAnswerChange(stepId, capturedTranscript.trim());
              setAsrStatusText(`⚡ Transcribed: "${capturedTranscript.trim()}"`);
            } else {
              setAsrProviderLog(prev => ({
                ...prev,
                [stepId]: { provider: 'touch-fallback', reason: err.message }
              }));
              setAsrStatusText('⚡ Select your answer below or tap mic to try again.');
            }
          } finally {
            setIsTranscribing(false);
          }
        };

        recorder.start(250);
      }

      setIsListening(true);
      setAsrStatusText(`🎙️ Listening in ${selectedLang.toUpperCase()}... Tap mic again when finished speaking.`);

      // Auto-stop safety timer (8.5 seconds)
      setTimeout(() => {
        if (recorder && recorder.state === 'recording') {
          try { recorder.stop(); } catch (e) {}
        }
        if (recognitionRef.current) {
          try { recognitionRef.current.stop(); } catch (e) {}
        }
      }, 8500);

    } catch (err) {
      console.warn('[Microphone Access Error]:', err);
      setIsListening(false);
      setIsTranscribing(false);
      setAsrProviderLog(prev => ({
        ...prev,
        [stepId]: { provider: 'touch-fallback', reason: err.name || err.message }
      }));
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setAsrStatusText('⚠️ Microphone permission blocked. Please select your answer using touch below.');
      } else {
        setAsrStatusText('🎙️ Ready. Please select your answer using touch or tap mic.');
      }
    }
  };

  // Update Answer & Check Parallel Triage
  const handleAnswerChange = async (stepId, value) => {
    setQuestionValidationError('');
    const newAnswers = { ...answers, [stepId]: value };
    setAnswers(newAnswers);

    if (stepId === 'chief_complaint') {
      loadQuestions(typeof value === 'string' ? value : '');
    }

    try {
      const analysis = await api.analyzeStep({
        current_text: typeof value === 'string' ? value : '',
        current_answers: newAnswers,
        kiosk_id: 'kiosk_01',
        patient_name: patientData?.full_name || fullName || 'Patient'
      });
      if (analysis.isRedFlag) {
        setRedFlagDetected(true);
        setRedFlagAlert(analysis);
      }
    } catch (e) {
      console.warn('Triage check error:', e);
    }
  };

  // Intake Mandatory Answering Validation
  const isCurrentQuestionAnswered = () => {
    const currQ = questions[currentQuestionIdx];
    if (!currQ) return true;
    const stepId = currQ.stepId;
    if (currQ.inputType === 'slider_rating') {
      return answers.socrates_severity !== undefined && answers.socrates_severity !== null && answers.socrates_severity !== '';
    }
    const val = answers[stepId];
    if (Array.isArray(val)) {
      return val.length > 0;
    }
    if (typeof val === 'string') {
      return val.trim().length > 0;
    }
    return val !== undefined && val !== null && val !== '';
  };

  const handleNextQuestion = () => {
    if (!isCurrentQuestionAnswered()) {
      const warningMsg = t('intake:answer_required_warning', 'Please select an option, speak into the microphone, or type your answer before proceeding.');
      setQuestionValidationError(warningMsg);
      speakText(warningMsg);
      return;
    }
    setQuestionValidationError('');
    setAsrStatusText('');

    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx(currentQuestionIdx + 1);
    } else {
      setStep('DOCS');
    }
  };

  // Document Upload / Optical OCR
  const handleDocumentUpload = async (docType, customText = '', fileName = '', fileData = null, mimeType = '') => {
    setIsScanning(true);
    setDocUploadError('');
    try {
      const res = await api.uploadDocument({
        patient_id: patientData?.id,
        document_type: docType || selectedDocTypeTag || 'AUTO_DETECT',
        file_name: fileName || 'Clinical_Document.png',
        raw_text: customText,
        file_data: fileData,
        mime_type: mimeType
      });
      if (res.success && res.document) {
        setUploadedDocs(prev => [...prev, res.document]);
        if (res.extracted_entities && res.extracted_entities.length > 0) {
          setExtractedEntitiesList(prev => [...prev, ...res.extracted_entities]);
        }
      }
    } catch (e) {
      setDocUploadError(e.message || t('scanner:error_ocr_process'));
    } finally {
      setIsScanning(false);
    }
  };

  // Remove Scanned Document & Linked Entities
  const handleRemoveDocument = (docIdentifier) => {
    setUploadedDocs(prev => prev.filter((d, i) => (d.id ? d.id !== docIdentifier : i !== docIdentifier)));
    setExtractedEntitiesList(prev => prev.filter(ent => ent.document_id && ent.document_id !== docIdentifier));
  };

  // Localize Document Type badge while preserving OCR content
  const getLocalizedDocType = (type) => {
    const norm = (type || '').toUpperCase();
    if (norm.includes('PRESCRIPTION') || norm.includes('RX')) {
      return t('scanner:type_prescription');
    }
    if (norm.includes('LAB') || norm.includes('TEST') || norm.includes('BLOOD') || norm.includes('REPORT')) {
      return t('scanner:type_lab_report');
    }
    if (norm.includes('DISCHARGE') || norm.includes('SUMMARY')) {
      return t('scanner:type_discharge_summary');
    }
    return t('scanner:type_medical_record');
  };

  // Process any incoming file (from browse or drag & drop)
  const processSelectedFile = (file) => {
    setDocUploadError('');

    if (file.size > 10 * 1024 * 1024) {
      setDocUploadError(t('scanner:error_oversized_file'));
      return;
    }

    const validExtensions = /\.(pdf|png|jpg|jpeg|webp|txt)$/i;
    if (!validExtensions.test(file.name)) {
      setDocUploadError(t('scanner:error_invalid_format'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target?.result;
      handleDocumentUpload(selectedDocTypeTag, '', file.name, base64Data, file.type || 'image/png');
    };
    reader.onerror = () => {
      setDocUploadError(t('scanner:error_read_failed'));
    };
    reader.readAsDataURL(file);
  };

  // File Selector change event
  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processSelectedFile(file);
    e.target.value = '';
  };

  // Drag & Drop event handler
  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  // Submit Encounter
  const handleSubmitEncounter = async () => {
    setIsSubmitting(true);
    try {
      const res = await api.submitKioskSession({
        patient_id: patientData?.id,
        token_number: tokenNumber,
        kiosk_id: 'kiosk_01',
        intake_mode: intakeMode,
        answers: answers,
        conversation_history: conversationHistory,
        accumulated_facets: accumulatedFacets,
        uploaded_document_ids: uploadedDocs.map(d => d.id)
      });
      if (res.success) {
        setSubmittedEncounter(res.encounter);
        setStep('CONFIRM');
        
        let count = 15;
        const interval = setInterval(() => {
          count -= 1;
          setAutoResetTimer(count);
          if (count <= 0) {
            clearInterval(interval);
            resetKioskSession();
          }
        }, 1000);
      }
    } catch (e) {
      alert('Error submitting intake: ' + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset Kiosk Session
  const resetKioskSession = () => {
    setSelectedLang('en');
    i18n.changeLanguage('en');
    setStep('LANG');
    setPatientData(null);
    setFullName('');
    setDob('');
    setAge('');
    setGender('');
    setMobileNumber('');
    setAbhaInput('');
    setTokenNumber('');
    setAnswers({
      chief_complaint: '',
      socrates_site: '',
      socrates_onset: '',
      socrates_character: '',
      socrates_radiation: '',
      socrates_associations: [],
      socrates_timing: '',
      socrates_exacerbating: '',
      socrates_severity: 7
    });
    setUploadedDocs([]);
    setExtractedEntitiesList([]);
    setRedFlagDetected(false);
    setRedFlagAlert(null);
    setAsrProviderLog({});
    setAsrStatusText('');
    setConversationHistory([]);
    setAccumulatedFacets({});
    setIsGeneratingQuestion(false);
    setCurrentQuestionIdx(0);
  };

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
            <HeartPulse size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '1.05rem' }}>MediKiosk OPD Terminal — KIOSK 01</div>
            <div style={{ fontSize: '0.74rem', color: 'var(--slate-light)' }}>Ground Floor OPD Atrium — East Wing</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {tokenNumber && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(255,255,255,0.1)', padding: '6px 14px', borderRadius: 'var(--radius-pill)', color: 'var(--blush-peach)', fontWeight: 600, fontSize: '0.86rem' }}>
              <Ticket size={16} />
              <span>Token: {tokenNumber}</span>
            </div>
          )}

          <button
            onClick={toggleAudio}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: isPlayingAudio ? 'rgba(251, 225, 209, 0.2)' : 'rgba(255,255,255,0.1)',
              color: isPlayingAudio ? 'var(--blush-peach)' : 'var(--slate-light)',
              border: 'none',
              padding: '6px 14px',
              borderRadius: 'var(--radius-pill)',
              cursor: 'pointer',
              fontSize: '0.82rem'
            }}
          >
            {isPlayingAudio ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span>{isPlayingAudio ? 'Voice Guide: ON' : 'Voice Guide: OFF'}</span>
          </button>

          <button onClick={onExitKiosk} className="btn-pill btn-pill-outline-white btn-pill-sm">
            Exit Kiosk
          </button>
        </div>
      </header>

      {/* Real-time Triage Alert Banner */}
      {redFlagDetected && (
        <div style={{
          backgroundColor: 'var(--alert-red-bright)',
          color: '#fff',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontWeight: 500,
          fontSize: '0.92rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={20} className="animate-pulse-red" />
            <span>
              <strong>{t('common:triage_alert_title')}</strong> {t('common:triage_alert_desc', { reason: redFlagAlert?.summaryReason || 'Chest Distress' })}
            </span>
          </div>
          <span className="badge-pill" style={{ backgroundColor: '#fff', color: 'var(--alert-red-bright)' }}>
            {t('common:triage_dispatched')}
          </span>
        </div>
      )}

      {/* Viewport */}
      <main style={{ flex: 1, padding: '32px 24px', maxWidth: '980px', margin: '0 auto', width: '100%' }}>
        
        {/* STEP 1: LANGUAGE SELECTION */}
        {step === 'LANG' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '36px' }}>
              <span className="badge-pill badge-peach" style={{ marginBottom: '14px' }}>
                Step 1 of 6
              </span>
              <h1 style={{ marginBottom: '10px' }}>Select Your Preferred Language</h1>
              <p style={{ color: 'var(--slate-gray)', fontSize: '1.1rem' }}>
                Touch your language below to start the voice-guided clinical check-in
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px', marginBottom: '32px' }}>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setSelectedLang(lang.code);
                    i18n.changeLanguage(lang.code);
                    setStep('IDENTITY_QUESTION');
                  }}
                  className="card-steep kiosk-touch-target"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '24px',
                    borderColor: selectedLang === lang.code ? 'var(--ink-black)' : 'var(--border-light)',
                    backgroundColor: selectedLang === lang.code ? 'var(--peach-subtle)' : '#fff',
                    textAlign: 'center',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--ink-black)', marginBottom: '4px' }}>
                    {lang.native}
                  </span>
                  <span style={{ fontSize: '0.88rem', color: 'var(--slate-gray)' }}>{lang.name}</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--sienna-brown)', marginTop: '6px' }}>
                    {lang.greeting}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: SCREEN 1 — ONE QUESTION ONLY: HAVE YOU VISITED BEFORE OR HAVE ABHA? */}
        {step === 'IDENTITY_QUESTION' && (
          <div style={{ maxWidth: '720px', margin: '0 auto', textAlign: 'center', padding: '24px 0' }}>
            <span className="badge-pill badge-peach" style={{ marginBottom: '16px' }}>
              {t('common:step_counter', { current: 2, total: 6 })}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
              <h1 style={{ fontSize: '2.2rem', margin: 0, color: 'var(--ink-black)' }}>
                {t('identity:screen1_question')}
              </h1>
            </div>
            <p style={{ color: 'var(--slate-gray)', fontSize: '1.1rem', marginBottom: '40px' }}>
              {t('identity:screen1_subtitle')}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>
              <div
                onClick={() => {
                  setIdentityError('');
                  setStep('ABHA_ENTRY');
                }}
                className="card-steep kiosk-touch-target"
                style={{
                  padding: '36px 28px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  border: '2px solid var(--ink-black)',
                  backgroundColor: '#fff',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--peach-subtle)', color: 'var(--sienna-brown)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                  <ShieldCheck size={30} />
                </div>
                <h3 style={{ fontSize: '1.35rem', marginBottom: '8px' }}>{t('identity:yes_visited_title')}</h3>
                <p style={{ fontSize: '0.94rem', color: 'var(--slate-gray)', lineHeight: 1.5 }}>
                  {t('identity:yes_visited_desc')}
                </p>
              </div>

              <div
                onClick={() => {
                  setIdentityError('');
                  setStep('NEW_PATIENT_FORM');
                }}
                className="card-steep kiosk-touch-target"
                style={{
                  padding: '36px 28px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  border: '2px solid var(--border-light)',
                  backgroundColor: 'var(--fog-white)',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--mist-gray)', color: 'var(--ink-black)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                  <User size={30} />
                </div>
                <h3 style={{ fontSize: '1.35rem', marginBottom: '8px' }}>{t('identity:no_new_title')}</h3>
                <p style={{ fontSize: '0.94rem', color: 'var(--slate-gray)', lineHeight: 1.5 }}>
                  {t('identity:no_new_desc')}
                </p>
              </div>
            </div>

            <button onClick={() => {
              setSelectedLang('en');
              i18n.changeLanguage('en');
              setStep('LANG');
            }} className="btn-pill btn-pill-outline">
              <ArrowLeft size={18} />
              <span>{t('identity:back_to_language')}</span>
            </button>
          </div>
        )}

        {/* STEP 2 (IF YES): SCREEN 2 — ABHA ID LOOKUP & M1 OTP VERIFICATION */}
        {step === 'ABHA_ENTRY' && (
          <div style={{ maxWidth: '640px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <span className="badge-pill badge-peach" style={{ marginBottom: '10px' }}>ABDM National Health Authority</span>
              <h2 style={{ marginBottom: '6px' }}>{isAwaitingOtp ? 'Verify Aadhaar / ABHA OTP' : 'Enter Your ABHA ID'}</h2>
              <p style={{ color: 'var(--slate-gray)', fontSize: '0.96rem' }}>
                {isAwaitingOtp ? 'Enter the 6-digit OTP dispatched by UIDAI / ABDM to your linked mobile number.' : 'Enter your 14-digit ABHA Number (e.g. 91-4821-9920-3104) or ABHA Address (e.g. yourname@abdm).'}
              </p>
            </div>

            <div className="card-steep" style={{ padding: '32px' }}>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                    ABHA Number or ABHA Address:
                  </label>
                  {isAwaitingOtp && (
                    <button
                      onClick={() => { setIsAwaitingOtp(false); setIdentityError(''); setSmsStatus(null); }}
                      style={{ background: 'none', border: 'none', color: 'var(--sienna-brown)', fontSize: '0.82rem', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Change ABHA ID
                    </button>
                  )}
                </div>
                <input
                  ref={abhaInputRef}
                  type="text"
                  className="input-steep"
                  style={{ fontSize: '1.1rem', letterSpacing: '0.02em' }}
                  value={abhaInput}
                  disabled={isAwaitingOtp}
                  onChange={(e) => setAbhaInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleVerifyAbha();
                    }
                  }}
                  placeholder=""
                />
              </div>

              {isAwaitingOtp && (
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ marginBottom: '16px', padding: '16px', backgroundColor: 'var(--peach-subtle)', border: '1px solid var(--blush-peach)', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: 'var(--ink-black)', fontSize: '0.9rem', marginBottom: '4px' }}>
                      <span>{t('identity:abdm_security_challenge')}</span>
                      <span className="badge-pill badge-green" style={{ fontSize: '0.72rem' }}>{t('identity:abha_verified_badge')}</span>
                    </div>
                    <div style={{ color: 'var(--slate-gray)', fontSize: '0.84rem', lineHeight: '1.4' }}>
                      A secure one-time verification code has been dispatched by the ABDM Gateway to your Aadhaar/ABHA registered mobile number.
                    </div>
                    {authDemoOtp && (
                      <div style={{ marginTop: '12px', padding: '10px 14px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.82rem', color: 'var(--slate-gray)' }}>Aadhaar Security Code (Sandbox):</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong style={{ fontSize: '1.1rem', letterSpacing: '0.15em', color: 'var(--ink-black)' }}>{authDemoOtp}</strong>
                          <button
                            type="button"
                            onClick={() => setAuthOtpInput(authDemoOtp)}
                            style={{ background: 'var(--peach-subtle)', border: '1px solid var(--blush-peach)', borderRadius: '6px', padding: '4px 10px', color: 'var(--sienna-brown)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                          >
                            Auto-Fill
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '8px' }}>
                    Enter 6-Digit OTP:
                  </label>
                  <input
                    ref={authOtpInputRef}
                    type="text"
                    maxLength={6}
                    className="input-steep"
                    style={{ fontSize: '1.4rem', letterSpacing: '0.25em', textAlign: 'center', fontWeight: 700 }}
                    value={authOtpInput}
                    onChange={(e) => setAuthOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleConfirmAbhaOtp();
                      }
                    }}
                    placeholder=""
                  />
                </div>
              )}

              {identityError && (
                <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: 'var(--alert-red-bg)', color: 'var(--alert-red-text)', borderRadius: '10px', fontSize: '0.86rem' }}>
                  {identityError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => {
                    if (isAwaitingOtp) {
                      setIsAwaitingOtp(false);
                      setIdentityError('');
                    } else {
                      setStep('IDENTITY_QUESTION');
                    }
                  }}
                  className="btn-pill btn-pill-outline kiosk-touch-target"
                  style={{ flex: '1 1 120px' }}
                >
                  <ArrowLeft size={18} />
                  <span>{t('common:back')}</span>
                </button>
                <button
                  onClick={isAwaitingOtp ? handleConfirmAbhaOtp : handleVerifyAbha}
                  disabled={isVerifying}
                  className="btn-pill btn-pill-primary kiosk-touch-target"
                  style={{ flex: '2 1 200px' }}
                >
                  <span>
                    {isVerifying
                      ? (isAwaitingOtp ? t('identity:verifying_otp_btn') : t('identity:abha_verifying_btn'))
                      : (isAwaitingOtp ? t('identity:confirm_otp_fetch_btn') : t('identity:abha_verify_btn'))}
                  </span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 (IF YES): SCREEN 3 — "IS THIS YOU?" CONFIRMATION SCREEN */}
        {step === 'ABHA_CONFIRM' && patientData && (
          <div style={{ maxWidth: '640px', margin: '0 auto', textAlign: 'center' }}>
            <span className="badge-pill badge-peach" style={{ marginBottom: '12px' }}>{t('identity:abha_confirm_badge')}</span>
            <h2 style={{ fontSize: '2.2rem', marginBottom: '8px' }}>{t('identity:abha_confirm_title')}</h2>
            <p style={{ color: 'var(--slate-gray)', fontSize: '1.05rem', marginBottom: '28px' }}>
              {t('identity:abha_confirm_subtitle')}
            </p>

            <div className="card-steep" style={{ padding: '32px', textAlign: 'left', marginBottom: '28px', backgroundColor: 'var(--peach-subtle)', borderColor: 'var(--blush-peach)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', borderBottom: '1px solid var(--border-light)', paddingBottom: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--ink-black)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserCheck size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.4rem', color: 'var(--ink-black)' }}>{patientData.full_name}</h3>
                  <div style={{ fontSize: '0.86rem', color: 'var(--sienna-brown)' }}>{t('identity:abha_number_label')}: {patientData.abha_number || patientData.abha_address}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '0.92rem' }}>
                <div><strong>{t('identity:gender_label')}:</strong> {patientData.gender}</div>
                <div><strong>{t('identity:dob_label')}:</strong> {patientData.dob || 'On File'}</div>
                <div><strong>{t('identity:age_label')}:</strong> {patientData.age} {t('identity:years_suffix')}</div>
                <div><strong>{t('identity:mobile_label')}:</strong> {patientData.phone_number}</div>
                <div><strong>{t('identity:assigned_token_label')}:</strong> <span style={{ fontWeight: 600, color: 'var(--ink-black)' }}>{tokenNumber}</span></div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <button onClick={() => setStep('ABHA_ENTRY')} className="btn-pill btn-pill-outline kiosk-touch-target" style={{ flex: '1 1 140px' }}>
                <ArrowLeft size={18} />
                <span>{t('identity:not_me_btn')}</span>
              </button>
              <button onClick={handleConfirmAbhaIdentity} disabled={isVerifying} className="btn-pill btn-pill-primary kiosk-touch-target" style={{ flex: '2 1 200px' }}>
                <CheckCircle2 size={18} />
                <span>{t('identity:confirm_me_btn')}</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 (IF NO): SCREEN 2 — NEW PATIENT REGISTRATION FORM ONLY */}
        {step === 'NEW_PATIENT_FORM' && (
          <div style={{ maxWidth: '680px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <span className="badge-pill badge-peach" style={{ marginBottom: '10px' }}>{t('identity:new_patient_badge')}</span>
              <h2 style={{ marginBottom: '6px' }}>{t('identity:new_patient_title')}</h2>
              <p style={{ color: 'var(--slate-gray)', fontSize: '0.96rem' }}>
                {tokenNumber ? t('identity:new_patient_subtitle', { token: tokenNumber }) : t('identity:new_patient_default_subtitle')}
              </p>
            </div>

            <div className="card-steep" style={{ padding: '32px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, marginBottom: '6px' }}>
                    {t('identity:full_name_label')} <span style={{ color: 'var(--alert-red-bright)' }}>*</span>
                  </label>
                  <input
                    ref={fullNameInputRef}
                    type="text"
                    required
                    className="input-steep"
                    placeholder=""
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        dobInputRef.current?.focus();
                      }
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, marginBottom: '6px' }}>
                      {t('identity:dob_label')} <span style={{ color: 'var(--alert-red-bright)' }}>*</span>
                    </label>
                    <input
                      ref={dobInputRef}
                      type="text"
                      inputMode="numeric"
                      className="input-steep"
                      placeholder=""
                      maxLength={10}
                      value={dob}
                      onChange={handleDobChange}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (dob && dob.length >= 8) {
                            genderSelectRef.current?.focus();
                          } else {
                            ageInputRef.current?.focus();
                          }
                        }
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, marginBottom: '6px' }}>
                      {t('identity:age_label')} ({t('identity:years_suffix')}) <span style={{ color: 'var(--alert-red-bright)' }}>*</span>
                    </label>
                    <input
                      ref={ageInputRef}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={3}
                      className="input-steep"
                      placeholder=""
                      value={age}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 3);
                        setAge(val);
                        if (!dob && val) {
                          const today = new Date();
                          const estYear = today.getFullYear() - parseInt(val, 10);
                          const month = String(today.getMonth() + 1).padStart(2, '0');
                          const day = String(today.getDate()).padStart(2, '0');
                          setDob(`${day}/${month}/${estYear}`);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          genderSelectRef.current?.focus();
                        }
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, marginBottom: '6px' }}>
                      {t('identity:gender_label')} <span style={{ color: 'var(--alert-red-bright)' }}>*</span>
                    </label>
                    <select
                      ref={genderSelectRef}
                      className="input-steep"
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          mobileInputRef.current?.focus();
                        }
                      }}
                    >
                      <option value="" disabled hidden></option>
                      <option value="MALE">{t('identity:gender_male')}</option>
                      <option value="FEMALE">{t('identity:gender_female')}</option>
                      <option value="OTHER">{t('identity:gender_other')}</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, marginBottom: '6px' }}>
                      {t('identity:mobile_label')} <span style={{ color: 'var(--alert-red-bright)' }}>*</span>
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.9rem', color: 'var(--slate-gray)', fontWeight: 500 }}>+91</span>
                      <input
                        ref={mobileInputRef}
                        type="tel"
                        maxLength="10"
                        className="input-steep"
                        placeholder=""
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleProceedNewPatient();
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '8px', padding: '12px 16px', backgroundColor: 'var(--fog-white)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--slate-gray)' }}>
                    {t('identity:create_abha_prompt')}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsCreatingAbha(true)}
                    className="btn-pill btn-pill-outline btn-pill-sm"
                  >
                    {t('identity:create_abha_btn')}
                  </button>
                </div>
              </div>

              {identityError && (
                <div style={{ marginTop: '16px', padding: '12px', backgroundColor: 'var(--alert-red-bg)', color: 'var(--alert-red-text)', borderRadius: '10px', fontSize: '0.86rem' }}>
                  {identityError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px', flexWrap: 'wrap' }}>
                <button onClick={() => setStep('IDENTITY_QUESTION')} className="btn-pill btn-pill-outline kiosk-touch-target" style={{ flex: '1 1 120px' }}>
                  <ArrowLeft size={18} />
                  <span>{t('common:back')}</span>
                </button>
                <button
                  onClick={handleProceedNewPatient}
                  disabled={isVerifying}
                  className="btn-pill btn-pill-primary kiosk-touch-target"
                  style={{ flex: '2 1 200px' }}
                >
                  <span>{isVerifying ? t('identity:registering_btn') : t('identity:confirm_register_btn')}</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>

            {/* Assisted ABHA Modal */}
            {isCreatingAbha && (
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
                zIndex: 60
              }}>
                <div className="card-steep" style={{ maxWidth: '520px', width: '100%', padding: '32px' }}>
                  <h3 style={{ marginBottom: '12px' }}>{t('identity:aadhaar_modal_title')}</h3>
                  <p style={{ fontSize: '0.86rem', color: 'var(--slate-gray)', marginBottom: '16px' }}>
                    {t('identity:aadhaar_modal_desc')}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>{t('identity:aadhaar_number_label')}</label>
                      <input
                        type="text"
                        maxLength={14}
                        placeholder=""
                        className="input-steep"
                        value={aadhaarInput}
                        onChange={(e) => setAadhaarInput(e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>{t('identity:aadhaar_otp_label')}</label>
                      <input
                        type="text"
                        maxLength={6}
                        placeholder=""
                        className="input-steep"
                        value={aadhaarOtp}
                        onChange={(e) => setAadhaarOtp(e.target.value)}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button onClick={() => setIsCreatingAbha(false)} className="btn-pill btn-pill-outline">{t('common:cancel')}</button>
                    <button onClick={handleCreateAbha} className="btn-pill btn-pill-peach">{t('identity:verify_create_abha_btn')}</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: DPDP ACT 2023 GRANULAR CONSENT (HARD GATE) */}
        {step === 'CONSENT' && (
          <div style={{ maxWidth: '740px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <span className="badge-pill badge-peach" style={{ marginBottom: '10px' }}>
                {t('consent:consent_badge')}
              </span>
              <h2 style={{ marginBottom: '6px' }}>{t('consent:consent_title')}</h2>
              <p style={{ color: 'var(--slate-gray)', fontSize: '0.96rem' }}>
                {t('consent:consent_subtitle')}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', padding: '12px 18px', backgroundColor: 'var(--peach-subtle)', borderRadius: '14px', border: '1px solid var(--blush-peach)', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 260px' }}>
                <Volume2 size={20} color="var(--sienna-brown)" style={{ flexShrink: 0 }} />
                <div style={{ fontSize: '0.86rem', color: 'var(--sienna-brown)' }}>
                  <strong>{t('consent:audio_notice_prefix')}</strong> "{t('consent:audio_notice_text')}"
                </div>
              </div>
              <button
                type="button"
                onClick={() => speakText(t('consent:audio_notice_text'), selectedLang)}
                className="btn-pill btn-pill-outline"
                style={{ padding: '8px 16px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', flexShrink: 0 }}
                title="Hear consent explanation spoken"
              >
                <Volume2 size={14} />
                <span>{t('consent:hear_spoken_btn')}</span>
              </button>
            </div>

            <div className="card-steep" style={{ padding: '28px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '14px', borderBottom: '1px solid var(--border-light)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.98rem' }}>
                      {t('consent:consent_intake_title')} <span style={{ color: 'var(--alert-red-bright)' }}>{t('consent:mandatory_tag')}</span>
                    </div>
                    <div style={{ fontSize: '0.84rem', color: 'var(--slate-gray)', marginTop: '2px' }}>
                      {t('consent:consent_intake_desc')}
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={consents.consent_intake}
                    onChange={(e) => setConsents({ ...consents, consent_intake: e.target.checked })}
                    style={{ width: '22px', height: '22px', accentColor: 'var(--ink-black)', cursor: 'pointer' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '14px', borderBottom: '1px solid var(--border-light)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.98rem' }}>
                      {t('consent:consent_ocr_title')} <span style={{ color: 'var(--alert-red-bright)' }}>{t('consent:mandatory_tag')}</span>
                    </div>
                    <div style={{ fontSize: '0.84rem', color: 'var(--slate-gray)', marginTop: '2px' }}>
                      {t('consent:consent_ocr_desc')}
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={consents.consent_ocr}
                    onChange={(e) => setConsents({ ...consents, consent_ocr: e.target.checked })}
                    style={{ width: '22px', height: '22px', accentColor: 'var(--ink-black)', cursor: 'pointer' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '14px', borderBottom: '1px solid var(--border-light)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.98rem' }}>{t('consent:consent_abdm_title')}</div>
                    <div style={{ fontSize: '0.84rem', color: 'var(--slate-gray)', marginTop: '2px' }}>
                      {t('consent:consent_abdm_desc')}
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={consents.consent_abdm_sync}
                    onChange={(e) => setConsents({ ...consents, consent_abdm_sync: e.target.checked })}
                    style={{ width: '22px', height: '22px', accentColor: 'var(--ink-black)', cursor: 'pointer' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.98rem' }}>{t('consent:consent_research_title')}</div>
                    <div style={{ fontSize: '0.84rem', color: 'var(--slate-gray)', marginTop: '2px' }}>
                      {t('consent:consent_research_desc')}
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={consents.consent_anonymized_research}
                    onChange={(e) => setConsents({ ...consents, consent_anonymized_research: e.target.checked })}
                    style={{ width: '22px', height: '22px', accentColor: 'var(--ink-black)', cursor: 'pointer' }}
                  />
                </div>
              </div>
            </div>

            {consentError && (
              <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: 'var(--alert-red-bg)', color: 'var(--alert-red-text)', borderRadius: '10px', fontSize: '0.86rem' }}>
                {consentError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <button onClick={() => setStep(patientData?.abha_number ? 'ABHA_CONFIRM' : 'NEW_PATIENT_FORM')} className="btn-pill btn-pill-outline kiosk-touch-target" style={{ flex: '1 1 140px' }}>
                <ArrowLeft size={18} />
                <span>{t('common:back')}</span>
              </button>
              <button
                onClick={handleProceedFromConsent}
                disabled={!consents.consent_intake || !consents.consent_ocr}
                className="btn-pill btn-pill-primary kiosk-touch-target"
                style={{ flex: '2 1 200px', opacity: consents.consent_intake && consents.consent_ocr ? 1 : 0.5 }}
              >
                <span>{t('consent:authorize_proceed_btn')}</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: OPD MODE SELECT */}
        {step === 'MODE_SELECT' && (
          <div style={{ maxWidth: '780px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <span className="badge-pill badge-peach" style={{ marginBottom: '10px' }}>
                {t('intake:stream_badge')}
              </span>
              <h2 style={{ marginBottom: '6px' }}>{t('intake:stream_title')}</h2>
              <p style={{ color: 'var(--slate-gray)', fontSize: '0.96rem' }}>
                {t('intake:stream_subtitle')}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              <div
                onClick={() => {
                  setIntakeMode('STANDARD_SOCRATES');
                  setStep('INTAKE');
                }}
                className="card-steep"
                style={{ cursor: 'pointer', padding: '32px', borderWidth: '2px', borderColor: intakeMode === 'STANDARD_SOCRATES' ? 'var(--ink-black)' : 'var(--border-light)' }}
              >
                <span className="badge-pill badge-gray" style={{ marginBottom: '12px' }}>{t('intake:stream_general_badge')}</span>
                <h3 style={{ marginBottom: '10px' }}>{t('intake:stream_general_title')}</h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--slate-gray)', lineHeight: 1.5, marginBottom: '20px' }}>
                  {t('intake:stream_general_desc')}
                </p>
                <button className="btn-pill btn-pill-primary" style={{ width: '100%' }}>
                  <span>{t('intake:stream_general_btn')}</span>
                  <ArrowRight size={16} />
                </button>
              </div>

              <div
                onClick={() => {
                  setIntakeMode('AYUSH_DASHAVIDHA');
                  setStep('INTAKE');
                }}
                className="card-steep"
                style={{ cursor: 'pointer', padding: '32px', borderWidth: '2px', backgroundColor: 'var(--peach-subtle)', borderColor: 'var(--blush-peach)' }}
              >
                <span className="badge-pill badge-peach" style={{ marginBottom: '12px' }}>{t('intake:stream_ayush_badge')}</span>
                <h3 style={{ marginBottom: '10px', color: 'var(--sienna-brown)' }}>{t('intake:stream_ayush_title')}</h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--sienna-brown)', opacity: 0.9, lineHeight: 1.5, marginBottom: '20px' }}>
                  {t('intake:stream_ayush_desc')}
                </p>
                <button className="btn-pill btn-pill-peach" style={{ width: '100%' }}>
                  <span>{t('intake:stream_ayush_btn')}</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: ADAPTIVE CONVERSATIONAL INTAKE */}
        {step === 'INTAKE' && (
          questions.length === 0 ? (
            <div style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center', padding: '32px' }}>
              <Loader2 size={36} className="animate-spin" style={{ margin: '0 auto 16px auto', color: 'var(--ink-black)' }} />
              <h3>{t('intake:loading_questions', 'Loading clinical questionnaire...')}</h3>
            </div>
          ) : (
          <div style={{ maxWidth: '820px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <span className="badge-pill badge-gray">
                {t('intake:question_progress', { current: currentQuestionIdx + 1, total: questions.length })} • {questions[currentQuestionIdx]?.code}
              </span>
              <span style={{ fontSize: '0.84rem', color: 'var(--slate-gray)' }}>
                {intakeMode === 'AYUSH_DASHAVIDHA' ? t('intake:stream_mode_ayush') : t('intake:stream_mode_socrates')}
              </span>
            </div>

            <div className="card-steep" style={{ padding: '32px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '24px' }}>
                <button
                  type="button"
                  onClick={() => {
                    const q = questions[currentQuestionIdx];
                    if (q) {
                      const text = q.prompt[selectedLang] || q.prompt.en;
                      speakText(text, selectedLang);
                    }
                  }}
                  title="Listen to question"
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--blush-peach)',
                    color: 'var(--sienna-brown)',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                  }}
                >
                  <Volume2 size={20} />
                </button>
                <div style={{ flex: 1 }}>
                  <h2 style={{ fontSize: '1.5rem', marginBottom: '6px' }}>
                    {questions[currentQuestionIdx]?.prompt[selectedLang] || questions[currentQuestionIdx]?.prompt.en}
                  </h2>
                </div>
              </div>

              {/* Voice & Touch Interactive Area */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', backgroundColor: 'var(--fog-white)', borderRadius: '16px', marginBottom: '18px' }}>
                  <button
                    onClick={toggleVoiceRecording}
                    disabled={isTranscribing}
                    className={`btn-pill ${isListening ? 'btn-pill-danger' : 'btn-pill-primary'} kiosk-touch-target`}
                    style={{ padding: '10px 22px', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    {isTranscribing ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : isListening ? (
                      <MicOff size={18} />
                    ) : (
                      <Mic size={18} />
                    )}
                    <span>
                      {isTranscribing 
                        ? t('intake:mic_btn_processing') 
                        : isListening 
                          ? t('intake:mic_btn_listening') 
                          : t('intake:mic_btn_speak')}
                    </span>
                  </button>

                  <div style={{ flex: 1, fontSize: '0.84rem', color: isListening ? 'var(--alert-red-bright)' : 'var(--slate-gray)' }}>
                    {asrStatusText || (isListening ? t('intake:mic_streaming_hint') : t('intake:quick_options_hint'))}
                  </div>

                  {/* Provider Status Badge */}
                  {asrProviderLog[questions[currentQuestionIdx]?.stepId] && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {(asrProviderLog[questions[currentQuestionIdx]?.stepId].provider === 'gemini-neural-asr' || asrProviderLog[questions[currentQuestionIdx]?.stepId].provider === 'neural-asr') ? (
                        <span className="badge-pill badge-peach" style={{ fontSize: '0.74rem' }}>
                          <Sparkles size={12} />
                          <span>{t('intake:voice_input_active')} ({asrProviderLog[questions[currentQuestionIdx]?.stepId].latencyMs}ms)</span>
                        </span>
                      ) : asrProviderLog[questions[currentQuestionIdx]?.stepId].provider === 'touch-fallback' ? (
                        <span className="badge-pill badge-gray" style={{ fontSize: '0.74rem' }}>
                          <span>{t('intake:touch_fallback_active')}</span>
                        </span>
                      ) : (
                        <span className="badge-pill badge-gray" style={{ fontSize: '0.74rem' }}>
                          <span>{t('intake:alternative_input')}</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Quick Touch Pills */}
                {questions[currentQuestionIdx]?.quickOptions && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {questions[currentQuestionIdx].quickOptions.map((opt, i) => {
                      const currVal = answers[questions[currentQuestionIdx].stepId];
                      const isSelected = Array.isArray(currVal) ? currVal.includes(opt) : currVal === opt;
                      return (
                        <button
                          key={i}
                          onClick={() => {
                            if (questions[currentQuestionIdx].inputType === 'multiselect') {
                              const existing = Array.isArray(currVal) ? currVal : [];
                              const updated = existing.includes(opt) ? existing.filter(x => x !== opt) : [...existing, opt];
                              handleAnswerChange(questions[currentQuestionIdx].stepId, updated);
                            } else {
                              handleAnswerChange(questions[currentQuestionIdx].stepId, opt);
                            }
                          }}
                          className="btn-pill kiosk-touch-target"
                          style={{
                            backgroundColor: isSelected ? 'var(--ink-black)' : '#fff',
                            color: isSelected ? '#fff' : 'var(--ink-black)',
                            borderColor: isSelected ? 'var(--ink-black)' : 'var(--border-light)',
                            fontSize: '0.9rem',
                            padding: '10px 18px'
                          }}
                        >
                          {getLocalizedOption(opt, selectedLang)}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Severity Slider */}
                {questions[currentQuestionIdx]?.inputType === 'slider_rating' && (
                  <div style={{ marginTop: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontWeight: 600 }}>
                      <span>{t('intake:severity_rating_label')}</span>
                      <span style={{ fontSize: '1.3rem', color: 'var(--alert-red-bright)' }}>
                        {answers.socrates_severity || 5} / 10
                      </span>
                    </div>
                    <input
                      type="range"
                      min={questions[currentQuestionIdx]?.min || 1}
                      max={questions[currentQuestionIdx]?.max || 10}
                      value={answers.socrates_severity || 5}
                      onChange={(e) => handleAnswerChange('socrates_severity', Number(e.target.value))}
                      style={{ width: '100%', height: '10px', accentColor: 'var(--alert-red-bright)', cursor: 'pointer' }}
                    />
                  </div>
                )}
              </div>

              {/* Editable Text Field */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-gray)', marginBottom: '4px' }}>
                  {t('intake:transcript_input_label')}
                </label>
                <input
                  ref={questionInputRef}
                  type="text"
                  className="input-steep"
                  value={
                    Array.isArray(answers[questions[currentQuestionIdx]?.stepId])
                      ? answers[questions[currentQuestionIdx]?.stepId].map(v => getLocalizedOption(v, selectedLang)).join(', ')
                      : (getLocalizedOption(answers[questions[currentQuestionIdx]?.stepId], selectedLang) || '')
                  }
                  onChange={(e) => handleAnswerChange(questions[currentQuestionIdx]?.stepId, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleNextQuestion();
                    }
                  }}
                />
              </div>
            </div>

            {questionValidationError && (
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fca5a5',
                color: '#991b1b',
                borderRadius: '10px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '16px',
                fontSize: '0.92rem',
                fontWeight: 600
              }}>
                <AlertCircle size={20} style={{ flexShrink: 0, color: '#dc2626' }} />
                <span>{questionValidationError}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap' }}>
              <button
                disabled={currentQuestionIdx === 0}
                onClick={() => {
                  setQuestionValidationError('');
                  setCurrentQuestionIdx(currentQuestionIdx - 1);
                }}
                className="btn-pill btn-pill-outline kiosk-touch-target"
                style={{ flex: '1 1 140px' }}
              >
                <ArrowLeft size={18} />
                <span>{t('intake:prev_btn')}</span>
              </button>

              {currentQuestionIdx < questions.length - 1 ? (
                <button
                  onClick={handleNextQuestion}
                  disabled={!isCurrentQuestionAnswered()}
                  className="btn-pill btn-pill-primary kiosk-touch-target"
                  style={{
                    flex: '1 1 160px',
                    opacity: isCurrentQuestionAnswered() ? 1 : 0.65,
                    cursor: isCurrentQuestionAnswered() ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <span>{t('intake:next_btn')}</span>
                  <ArrowRight size={18} />
                </button>
              ) : (
                <button
                  onClick={handleNextQuestion}
                  disabled={!isCurrentQuestionAnswered()}
                  className="btn-pill btn-pill-peach kiosk-touch-target"
                  style={{
                    flex: '1 1 200px',
                    opacity: isCurrentQuestionAnswered() ? 1 : 0.65,
                    cursor: isCurrentQuestionAnswered() ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <span>{t('intake:proceed_docs_btn')}</span>
                  <ArrowRight size={18} />
                </button>
              )}
            </div>
          </div>
          )
        )}

        {/* STEP 6: DOCUMENT CAPTURE & REAL OPTICAL CAMERA SCANNER */}
        {step === 'DOCS' && (
          <div style={{ maxWidth: '820px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <span className="badge-pill badge-peach" style={{ marginBottom: '10px' }}>
                {t('scanner:scanner_badge')}
              </span>
              <h2 style={{ marginBottom: '6px' }}>{t('scanner:scanner_title')}</h2>
              <p style={{ color: 'var(--slate-gray)', fontSize: '0.96rem' }}>
                {t('scanner:scanner_subtitle')}
              </p>
            </div>

            {/* SINGLE CONSOLIDATED DRAG & DROP / CAMERA / BROWSE UPLOAD ZONE */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleFileDrop}
              className="card-steep"
              style={{
                border: isDragOver ? '2px dashed var(--alert-red-bright)' : '2px dashed var(--border-light)',
                backgroundColor: isDragOver ? 'var(--peach-subtle)' : '#fff',
                padding: '36px 24px',
                textAlign: 'center',
                borderRadius: '20px',
                marginBottom: '24px',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}
            >
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'var(--peach-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto'
              }}>
                <Upload size={30} color="var(--sienna-brown)" />
              </div>

              <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', fontWeight: 600 }}>
                {isDragOver ? t('scanner:drop_zone_active') : t('scanner:drop_zone_title')}
              </h3>
              <p style={{ fontSize: '0.86rem', color: 'var(--slate-gray)', maxWidth: '480px', margin: '0 auto 20px auto', lineHeight: 1.5 }}>
                {t('scanner:drop_zone_desc')}
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isScanning}
                  className="btn-pill btn-pill-primary kiosk-touch-target"
                  style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Upload size={18} />
                  <span>{t('scanner:browse_files_btn')}</span>
                </button>

                <button
                  onClick={() => openCameraScanner('AUTO_DETECT')}
                  disabled={isScanning}
                  className="btn-pill btn-pill-peach kiosk-touch-target"
                  style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Camera size={18} />
                  <span>{t('scanner:scan_camera_btn')}</span>
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.txt"
                onChange={handleFileInputChange}
                style={{ display: 'none' }}
              />
            </div>

            {/* Real-time OCR Processing Loader */}
            {isScanning && (
              <div className="card-steep-peach" style={{ padding: '20px', marginBottom: '24px', textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '8px' }}>
                  <RefreshCw size={22} className="animate-spin" color="var(--sienna-brown)" />
                  <strong style={{ fontSize: '1.05rem', color: 'var(--sienna-brown)' }}>{t('scanner:ocr_running_title')}</strong>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--sienna-brown)', opacity: 0.85 }}>
                  {t('scanner:ocr_running_desc')}
                </div>
              </div>
            )}

            {/* Error Message Alert Banner */}
            {docUploadError && (
              <div style={{
                marginBottom: '20px',
                padding: '14px 18px',
                backgroundColor: 'var(--alert-red-bg)',
                color: 'var(--alert-red-text)',
                borderRadius: '12px',
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <AlertTriangle size={18} />
                  <span>{docUploadError}</span>
                </div>
                <button
                  onClick={() => setDocUploadError('')}
                  style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '4px' }}
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Real Hardware Camera Viewport Overlay Modal */}
            {isCameraModalOpen && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(15, 17, 20, 0.85)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 100,
                padding: '24px'
              }}>
                <div className="card-steep" style={{ maxWidth: '680px', width: '100%', padding: '28px', backgroundColor: 'var(--ink-black)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Camera size={22} color="var(--blush-peach)" />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '1.05rem' }}>
                          {t('scanner:camera_modal_title')}
                        </div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--slate-light)' }}>
                          {t('scanner:camera_modal_guideline')}
                        </div>
                      </div>
                    </div>

                    <button onClick={closeCameraScanner} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px' }}>
                      <X size={22} />
                    </button>
                  </div>

                  {/* Camera Viewport Frame */}
                  <div style={{
                    position: 'relative',
                    width: '100%',
                    height: '360px',
                    backgroundColor: '#000',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid rgba(251, 225, 209, 0.4)',
                    marginBottom: '20px'
                  }}>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: isCameraReady ? 'block' : 'none'
                      }}
                    />
                    {!isCameraReady && (
                      <div style={{ textAlign: 'center', padding: '24px', color: 'var(--slate-light)' }}>
                        <Camera size={40} style={{ margin: '0 auto 12px auto', display: 'block', opacity: 0.5 }} />
                        <div style={{ fontSize: '0.92rem', marginBottom: '6px' }}>{cameraError || t('scanner:camera_init')}</div>
                      </div>
                    )}

                    {/* Viewfinder Target Guidelines */}
                    <div style={{
                      position: 'absolute',
                      top: '12%',
                      left: '12%',
                      right: '12%',
                      bottom: '12%',
                      border: '2px dashed var(--blush-peach)',
                      borderRadius: '12px',
                      pointerEvents: 'none',
                      boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.45)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <div style={{ fontSize: '0.78rem', color: '#fff', backgroundColor: 'rgba(0,0,0,0.6)', padding: '4px 12px', borderRadius: '12px' }}>
                        {t('scanner:camera_paper_flat_hint')}
                      </div>
                    </div>

                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                  </div>

                  {/* Controls */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="btn-pill btn-pill-outline"
                      style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)', flex: 1 }}
                    >
                      <Upload size={16} />
                      <span>{t('scanner:select_file_btn')}</span>
                    </button>

                    <button
                      onClick={capturePhotoAndProcessOcr}
                      disabled={isScanning}
                      className="btn-pill btn-pill-peach"
                      style={{ flex: 2 }}
                    >
                      {isScanning ? <RefreshCw size={18} className="animate-spin" /> : <Camera size={18} />}
                      <span>{isScanning ? t('scanner:capturing_btn') : t('scanner:capture_scan_btn')}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Chronological List of Digitized Records with Real OCR Output */}
            {uploadedDocs.length > 0 && (
              <div className="card-steep" style={{ padding: '24px', marginBottom: '24px' }}>
                <h4 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>{t('scanner:docs_list_title', { count: uploadedDocs.length })}</span>
                  <span className="badge-pill badge-green" style={{ fontSize: '0.76rem' }}>
                    {t('scanner:docs_processed_badge', { count: uploadedDocs.length })}
                  </span>
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  {uploadedDocs.map((doc, idx) => (
                    <div key={idx} style={{ padding: '18px', backgroundColor: 'var(--fog-white)', borderRadius: '16px', border: '1px solid var(--border-light)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <CheckCircle2 size={20} color="var(--success-green-bright)" />
                          <div>
                            <strong style={{ fontSize: '1.02rem' }}>{doc.file_name}</strong>
                            <div style={{ fontSize: '0.78rem', color: 'var(--slate-gray)', marginTop: '2px' }}>
                              {t('scanner:doc_type')}: <strong>{getLocalizedDocType(doc.document_type)}</strong> • {t('scanner:doc_date')}: {doc.document_date}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {(doc.ocr_provider === 'gemini_multimodal_vision' || doc.processing_method === 'gemini_multimodal_vision') ? (
                            <span className="badge-pill badge-peach" style={{ fontSize: '0.74rem' }}>
                              <Sparkles size={12} />
                              <span>Multimodal Optical Scanner ({doc.ocr_latency_ms || 420}ms)</span>
                            </span>
                          ) : doc.ocr_provider === 'google-cloud-vision' ? (
                            <span className="badge-pill badge-peach" style={{ fontSize: '0.74rem' }}>
                              <Sparkles size={12} />
                              <span>Google Cloud Vision ({doc.ocr_latency_ms || 320}ms)</span>
                            </span>
                          ) : (
                            <span className="badge-pill badge-gray" style={{ fontSize: '0.74rem' }}>
                              <span>Tesseract.js Offline Fallback ({doc.ocr_latency_ms || 450}ms)</span>
                            </span>
                          )}
                          <span className="badge-pill badge-green" style={{ fontSize: '0.74rem' }}>
                            {t('scanner:confidence_label')}: {doc.ocr_confidence_score}%
                          </span>

                          {/* Patient Option to Remove Scanned Document */}
                          <button
                            type="button"
                            onClick={() => handleRemoveDocument(doc.id || idx)}
                            className="btn-pill"
                            style={{
                              padding: '5px 12px',
                              fontSize: '0.76rem',
                              backgroundColor: 'var(--alert-red-bg)',
                              color: 'var(--alert-red-text)',
                              border: '1px solid rgba(220, 38, 38, 0.25)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                              cursor: 'pointer',
                              fontWeight: 600,
                              borderRadius: 'var(--radius-pill)',
                              transition: 'all 0.15s ease'
                            }}
                            title="Remove scanned document"
                          >
                            <Trash2 size={13} />
                            <span>{t('scanner:remove_doc_btn', 'Remove Document')}</span>
                          </button>
                        </div>
                      </div>

                      {/* Flagged Handwriting Uncertainties (Anti-Hallucination Guardrail) */}
                      {doc.flagged_uncertainties && doc.flagged_uncertainties.length > 0 && (
                        <div style={{
                          marginBottom: '12px',
                          padding: '10px 14px',
                          backgroundColor: '#fffbeb',
                          border: '1px solid #fef3c7',
                          borderRadius: '8px',
                          fontSize: '0.80rem',
                          color: '#92400e',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '8px'
                        }}>
                          <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: '2px', color: '#d97706' }} />
                          <div>
                            <strong>{t('scanner:handwriting_advisory')}</strong>
                            <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                              {doc.flagged_uncertainties.map((u, uIdx) => (
                                <li key={uIdx}>{u}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}



                      {/* Extracted Structured Clinical Entities */}
                      {extractedEntitiesList.length > 0 && (
                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-gray)', textTransform: 'uppercase', marginBottom: '6px' }}>
                            {t('scanner:entities_title')}
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {extractedEntitiesList.map((ent, eIdx) => (
                              <span
                                key={eIdx}
                                className={`badge-pill ${ent.is_abnormal ? 'badge-peach' : 'badge-gray'}`}
                                style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '5px' }}
                              >
                                {ent.is_abnormal && <AlertTriangle size={11} color="var(--alert-red-bright)" />}
                                <strong>{ent.entity_name}:</strong> {ent.entity_value} {ent.unit || ''}
                                {ent.abnormal_flag && ent.abnormal_flag !== 'NORMAL' && (
                                  <span style={{ color: 'var(--alert-red-bright)', fontWeight: 700 }}>[{ent.abnormal_flag}]</span>
                                )}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '14px' }}>
              <button onClick={() => setStep('INTAKE')} className="btn-pill btn-pill-outline kiosk-touch-target">
                <ArrowLeft size={18} />
                <span>{t('scanner:back_to_questions')}</span>
              </button>
              <button onClick={() => setStep('REVIEW')} className="btn-pill btn-pill-primary kiosk-touch-target">
                <span>{t('scanner:review_history_btn')}</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 7: REVIEW & FINAL SUBMISSION */}
        {step === 'REVIEW' && (
          <div style={{ maxWidth: '820px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <span className="badge-pill badge-peach" style={{ marginBottom: '10px' }}>
                {t('review:review_badge')}
              </span>
              <h2 style={{ marginBottom: '6px' }}>{t('review:review_title')}</h2>
              <p style={{ color: 'var(--slate-gray)', fontSize: '0.96rem' }}>
                {t('review:review_subtitle', { token: tokenNumber })}
              </p>
            </div>

            <div className="card-steep" style={{ padding: '32px', marginBottom: '24px' }}>
              <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '16px', marginBottom: '18px' }}>
                <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--slate-gray)', letterSpacing: '0.04em' }}>
                  {t('review:sec1_title')}
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--ink-black)', marginTop: '2px' }}>
                  {patientData?.full_name || fullName} ({patientData?.gender || gender}, {t('identity:age_label')}: {patientData?.age || age || 'Adult'})
                </div>
                <div style={{ fontSize: '0.84rem', color: 'var(--slate-gray)', marginTop: '4px' }}>
                  {t('identity:mobile_label')}: {patientData?.phone_number || mobileNumber} • {t('identity:abha_number_label')}: {patientData?.abha_number || patientData?.abha_address || 'Walk-in Direct'} • {t('common:token_label')}: <strong>{tokenNumber}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.92rem' }}>
                <div>
                  <strong>{t('review:sec2_title')}</strong>
                  <div style={{ color: 'var(--ink-soft)', marginTop: '2px' }}>{getLocalizedOption(answers.chief_complaint, selectedLang) || t('review:general_intake')}</div>
                </div>

                <div>
                  <strong>{t('review:sec3_title')}</strong>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '6px', backgroundColor: 'var(--fog-white)', padding: '14px', borderRadius: '12px', fontSize: '0.86rem' }}>
                    <div><strong>{t('review:site')}:</strong> {getLocalizedOption(answers.socrates_site, selectedLang) || t('review:not_localized')}</div>
                    <div><strong>{t('review:onset')}:</strong> {getLocalizedOption(answers.socrates_onset, selectedLang) || t('review:gradual')}</div>
                    <div><strong>{t('review:character')}:</strong> {getLocalizedOption(answers.socrates_character, selectedLang) || t('review:aching')}</div>
                    <div><strong>{t('review:radiation')}:</strong> {getLocalizedOption(answers.socrates_radiation, selectedLang) || t('review:nil')}</div>
                    <div><strong>{t('review:timing')}:</strong> {getLocalizedOption(answers.socrates_timing, selectedLang) || t('review:variable')}</div>
                    <div><strong>{t('review:severity')}:</strong> <span style={{ color: 'var(--alert-red-bright)', fontWeight: 600 }}>{answers.socrates_severity || 7}/10</span></div>
                  </div>
                </div>

                {intakeMode === 'AYUSH_DASHAVIDHA' && (
                  <div style={{ backgroundColor: 'var(--peach-subtle)', padding: '14px', borderRadius: '12px', color: 'var(--sienna-brown)', fontSize: '0.86rem' }}>
                    <strong>{t('review:ayush_pariksha_title')}</strong> Prakriti: {answers.ayush_prakriti} | Vikriti: {answers.ayush_vikriti} | Agni: {answers.ayush_ahara_shakti} | Satva: {answers.ayush_satva}
                  </div>
                )}

                <div>
                  <strong>{t('review:digitized_records_title')}</strong> {t('review:digitized_records_count', { count: uploadedDocs.length })}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <button onClick={() => setStep('DOCS')} className="btn-pill btn-pill-outline kiosk-touch-target" style={{ flex: '1 1 160px' }}>
                <ArrowLeft size={18} />
                <span>{t('review:make_corrections_btn')}</span>
              </button>
              <button
                onClick={handleSubmitEncounter}
                disabled={isSubmitting}
                className="btn-pill btn-pill-primary kiosk-touch-target"
                style={{ flex: '2 1 200px' }}
              >
                <CheckCircle2 size={18} />
                <span>{isSubmitting ? t('review:transmitting_btn') : t('review:confirm_transmit_btn')}</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 8: CONFIRMATION & EPHEMERAL MEMORY PURGE */}
        {step === 'CONFIRM' && (
          <div style={{ maxWidth: '640px', margin: '0 auto', textAlign: 'center', padding: '40px 0' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--success-green-bg)', color: 'var(--success-green-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
              <CheckCircle2 size={36} />
            </div>

            <h1 style={{ marginBottom: '12px' }}>{t('review:confirm_title')}</h1>
            <p style={{ fontSize: '1.1rem', color: 'var(--slate-gray)', lineHeight: 1.5, marginBottom: '28px' }}>
              {t('review:confirm_subtitle')}
            </p>

            <div className="card-steep-fog" style={{ padding: '24px', marginBottom: '28px', textAlign: 'left', border: '2px solid var(--blush-peach)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--slate-gray)' }}>{t('review:token_num_label')}</span>
                <strong style={{ fontSize: '1.2rem', color: 'var(--ink-black)' }}>{submittedEncounter?.token_number || tokenNumber}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--slate-gray)' }}>{t('review:patient_name_label')}</span>
                <strong>{patientData?.full_name || fullName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--slate-gray)' }}>{t('review:encounter_id_label')}</span>
                <strong>{submittedEncounter?.id || 'enc_opd_live'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--slate-gray)' }}>{t('review:next_step_label')}</span>
                <strong style={{ color: 'var(--ink-black)' }}>{t('review:next_step_desc')}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--slate-gray)', fontSize: '0.86rem', marginBottom: '20px' }}>
              <Clock size={16} />
              <span>{t('review:memory_clear_notice', { seconds: autoResetTimer })}</span>
            </div>

            <button onClick={resetKioskSession} className="btn-pill btn-pill-primary btn-pill-lg">
              <RotateCcw size={18} />
              <span>{t('review:end_session_btn')}</span>
            </button>
          </div>
        )}

      </main>
    </div>
  );
}
