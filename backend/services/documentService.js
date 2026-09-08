// Optical Character Recognition (OCR) & Clinical Entity Extraction Service
import { performOCR, autoDetectDocumentType } from './ocrService.js';
import { validateAndClassifyDocument, extractClinicalEntities, analyzeDocumentWithGeminiVision } from './llmService.js';

const CLINICAL_LAB_RANGES = {
  'hba1c': { name: 'HbA1c (Glycated Hemoglobin)', unit: '%', min: 4.0, max: 5.6, critHigh: 8.5 },
  'fasting blood sugar': { name: 'Fasting Blood Glucose', unit: 'mg/dL', min: 70, max: 100, critHigh: 200, critLow: 50 },
  'blood sugar': { name: 'Blood Glucose', unit: 'mg/dL', min: 70, max: 140, critHigh: 250 },
  'glucose': { name: 'Blood Glucose', unit: 'mg/dL', min: 70, max: 140, critHigh: 250 },
  'tsh': { name: 'Thyroid Stimulating Hormone (TSH)', unit: 'uIU/mL', min: 0.4, max: 4.5, critHigh: 10.0 },
  'creatinine': { name: 'Serum Creatinine', unit: 'mg/dL', min: 0.6, max: 1.2, critHigh: 2.5 },
  'hemoglobin': { name: 'Hemoglobin (Hb)', unit: 'g/dL', min: 12.0, max: 17.0, critLow: 7.0 },
  'hb': { name: 'Hemoglobin (Hb)', unit: 'g/dL', min: 12.0, max: 17.0, critLow: 7.0 },
  'ldl': { name: 'LDL Cholesterol', unit: 'mg/dL', min: 0, max: 100, critHigh: 160 },
  'cholesterol': { name: 'Total Cholesterol', unit: 'mg/dL', min: 100, max: 200, critHigh: 240 },
  'triglycerides': { name: 'Serum Triglycerides', unit: 'mg/dL', min: 50, max: 150, critHigh: 300 },
  'platelet': { name: 'Platelet Count', unit: 'x10^3/uL', min: 150, max: 450, critLow: 50 },
  'sgot': { name: 'AST / SGOT', unit: 'U/L', min: 5, max: 40, critHigh: 150 },
  'sgpt': { name: 'ALT / SGPT', unit: 'U/L', min: 7, max: 56, critHigh: 150 },
  'uric acid': { name: 'Serum Uric Acid', unit: 'mg/dL', min: 3.5, max: 7.2, critHigh: 9.0 }
};

const COMMON_DIAGNOSES = [
  { term: 'hypertension', name: 'Essential Hypertension', icd10: 'I10' },
  { term: 'high blood pressure', name: 'Hypertension', icd10: 'I10' },
  { term: 'htn', name: 'Hypertension', icd10: 'I10' },
  { term: 'type 2 diabetes', name: 'Type 2 Diabetes Mellitus', icd10: 'E11' },
  { term: 't2dm', name: 'Type 2 Diabetes Mellitus', icd10: 'E11' },
  { term: 'diabetes', name: 'Diabetes Mellitus', icd10: 'E11.9' },
  { term: 'asthma', name: 'Bronchial Asthma', icd10: 'J45' },
  { term: 'copd', name: 'Chronic Obstructive Pulmonary Disease', icd10: 'J44' },
  { term: 'hypothyroidism', name: 'Hypothyroidism', icd10: 'E03.9' },
  { term: 'dyslipidemia', name: 'Dyslipidemia / Hyperlipidemia', icd10: 'E78' },
  { term: 'angina', name: 'Angina Pectoris / Ischemic Heart Disease', icd10: 'I20' },
  { term: 'cad', name: 'Coronary Artery Disease', icd10: 'I25.1' },
  { term: 'gastritis', name: 'Acute / Chronic Gastritis', icd10: 'K29' },
  { term: 'gerd', name: 'Gastroesophageal Reflux Disease', icd10: 'K21' },
  { term: 'fever', name: 'Pyrexia / Acute Febrile Illness', icd10: 'R50.9' }
];

/**
 * Process a document through real OCR and clinical entity extraction
 */
export async function processDocumentOCR(fileMeta, rawText = '', fileData = null) {
  const fileName = fileMeta.file_name || 'Medical_Record.png';
  let extractedText = (rawText || '').trim();
  let ocrProvider = 'direct-input';
  let processingMethod = 'direct-input';
  let confidenceScore = 95.0;
  let ocrLatencyMs = 0;

  // 1. PRIMARY PIPELINE: Direct Gemini Multimodal Vision Analysis (Single-Step OCR + Clinical Extraction)
  if (fileData) {
    try {
      console.log(`[DocumentService] Invoking Gemini Multimodal Vision for: ${fileName}`);
      const visionResult = await analyzeDocumentWithGeminiVision({
        base64: typeof fileData === 'string' ? fileData : null,
        buffer: Buffer.isBuffer(fileData) ? fileData : null,
        mimeType: fileMeta.mime_type || 'image/png',
        fileName
      });

      // Confirm medical document validation
      if (!visionResult.is_medical_document || visionResult.document_type === 'NON_MEDICAL') {
        const reason = visionResult.rejection_reason || 'Uploaded document is not recognized as a valid medical record (prescription, lab report, or discharge summary).';
        throw new Error(`[Document Validation Rejected] ${reason}`);
      }

      console.log(`[DocumentService] Document processed via Gemini Multimodal Vision in ${visionResult.latencyMs}ms (DocType: ${visionResult.document_type})`);

      // Assemble structured clinical entities
      const entities = [];

      // Medications
      if (Array.isArray(visionResult.medications)) {
        for (const med of visionResult.medications) {
          if (med.name) {
            const doseDesc = [med.dose, med.frequency, med.duration, med.route].filter(Boolean).join(' ') || 'As prescribed';
            const isUnclear = Boolean(med.is_unclear) || /unclear/i.test(doseDesc) || /unclear/i.test(med.name);
            entities.push({
              category: 'MEDICATION',
              entity_name: med.name,
              entity_value: doseDesc,
              unit: 'dosage',
              reference_range: isUnclear ? 'Unclear handwriting - please verify with patient' : 'Prescription Entry',
              is_abnormal: isUnclear,
              abnormal_flag: isUnclear ? 'VERIFY_WITH_PATIENT' : null,
              is_unclear: isUnclear
            });
          }
        }
      }

      // Lab values
      if (Array.isArray(visionResult.lab_values)) {
        for (const lv of visionResult.lab_values) {
          if (lv.test_name && lv.value) {
            const isUnclear = Boolean(lv.is_unclear) || /unclear/i.test(String(lv.value));
            entities.push({
              category: 'LAB_VALUE',
              entity_name: lv.test_name,
              entity_value: String(lv.value),
              unit: lv.unit || '',
              reference_range: lv.reference_range || '',
              is_abnormal: isUnclear || Boolean(lv.is_abnormal),
              abnormal_flag: isUnclear ? 'VERIFY_WITH_PATIENT' : (lv.abnormal_flag || (lv.is_abnormal ? 'HIGH' : 'NORMAL')),
              is_unclear: isUnclear
            });
          }
        }
      }

      // Diagnoses
      if (Array.isArray(visionResult.diagnoses)) {
        for (const diag of visionResult.diagnoses) {
          if (diag.name) {
            const isUnclear = Boolean(diag.is_unclear) || /unclear/i.test(diag.name);
            entities.push({
              category: 'DIAGNOSIS',
              entity_name: diag.name,
              entity_value: diag.status || 'Active',
              unit: '',
              reference_range: isUnclear ? 'Unclear handwriting - please verify with patient' : (diag.icd10 ? `ICD-10 ${diag.icd10}` : 'Clinical Diagnosis'),
              is_abnormal: isUnclear,
              abnormal_flag: isUnclear ? 'VERIFY_WITH_PATIENT' : null,
              is_unclear: isUnclear
            });
          }
        }
      }

      return {
        file_name: fileName,
        document_type: visionResult.document_type || fileMeta.document_type || 'MEDICAL_RECORD',
        document_date: visionResult.document_date || fileMeta.document_date || null,
        issuing_facility: visionResult.issuing_facility || fileMeta.issuing_facility || null,
        doctor_name: visionResult.doctor_name || null,
        patient_name: visionResult.patient_name || null,
        ocr_status: 'COMPLETED',
        ocr_provider: 'gemini_multimodal_vision',
        processing_method: 'gemini_multimodal_vision',
        ocr_latency_ms: visionResult.latencyMs,
        ocr_confidence_score: Math.round((visionResult.confidence || 0.95) * 100),
        extracted_text: visionResult.extracted_text || '',
        entities: entities,
        flagged_uncertainties: visionResult.flagged_uncertainties || [],
        llm_validation: {
          is_medical: visionResult.is_medical_document,
          document_type: visionResult.document_type,
          confidence: visionResult.confidence,
          summary: `Direct Multimodal Vision processing (${visionResult.document_type})`
        },
        llm_extraction: {
          document_date: visionResult.document_date,
          issuing_facility: visionResult.issuing_facility,
          diagnoses: visionResult.diagnoses,
          medications: visionResult.medications,
          lab_values: visionResult.lab_values,
          flagged_uncertainties: visionResult.flagged_uncertainties
        }
      };
    } catch (visionErr) {
      if (visionErr.message && visionErr.message.includes('[Document Validation Rejected]')) {
        throw visionErr;
      }
      console.warn(`[DocumentService] Gemini Multimodal Vision unavailable (${visionErr.message}). Falling back to Tesseract OCR pipeline...`);
    }

    // 2. FALLBACK PIPELINE: Tesseract OCR + 2-Step Extraction
    const ocrStartTime = Date.now();
    const ocrResult = await performOCR({
      base64: typeof fileData === 'string' ? fileData : null,
      buffer: Buffer.isBuffer(fileData) ? fileData : null,
      mimeType: fileMeta.mime_type || 'image/png',
      fileName
    });

    extractedText = ocrResult.text;
    ocrProvider = 'tesseract.js (fallback)';
    processingMethod = 'tesseract_fallback';
    confidenceScore = ocrResult.confidence;
    ocrLatencyMs = Date.now() - ocrStartTime;
    console.log(`[DocumentService] Document processed via Tesseract fallback in ${ocrLatencyMs}ms`);
  }

  if (!extractedText || extractedText.length === 0) {
    throw new Error('No legible text recognized in document. Please upload a clear medical scan.');
  }

  // 2. Validate & Classify document with Gemini LLM (Feature 2)
  let docType = autoDetectDocumentType(extractedText, fileMeta.document_type);
  let validationResult = null;
  let geminiEntities = null;

  try {
    validationResult = await validateAndClassifyDocument(extractedText, fileName);
    if (validationResult && (!validationResult.is_medical || validationResult.document_type === 'NON_MEDICAL')) {
      const reason = validationResult.rejection_reason || 'Uploaded document is not recognized as a valid medical record (prescription, lab report, or discharge summary).';
      throw new Error(`[Document Validation Rejected] ${reason}`);
    }
    if (validationResult && validationResult.document_type && validationResult.document_type !== 'NON_MEDICAL') {
      docType = validationResult.document_type;
    }
  } catch (valErr) {
    if (valErr.message.includes('[Document Validation Rejected]')) {
      throw valErr;
    }
    console.warn('[DocumentService] Gemini validation warning, falling back to rule-based classification:', valErr.message);
  }

  // 3. Extract Structured Clinical Entities with Gemini LLM (Feature 3)
  try {
    geminiEntities = await extractClinicalEntities(extractedText, docType);
  } catch (gemErr) {
    console.warn('[DocumentService] Gemini entity extraction warning, falling back to regex:', gemErr.message);
  }

  // 4. Extract Document Date (e.g. 12/08/2026, 12-08-2026, 2026-08-15)
  const dateMatch = extractedText.match(/\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}-\d{2}-\d{2})\b/);
  const documentDate = (geminiEntities && geminiEntities.document_date) 
    ? geminiEntities.document_date 
    : (dateMatch ? dateMatch[1] : (fileMeta.document_date || null));

  // Extract issuing facility
  let detectedFacility = (geminiEntities && geminiEntities.issuing_facility) ? geminiEntities.issuing_facility : null;
  if (!detectedFacility) {
    const facilityMatch = extractedText.match(/\b([A-Z][A-Za-z0-9\s&,.]{2,45}(?:Hospital|Clinic|Diagnostics|Pathology|Laboratory|Lab|Center|Centre|Care|Health|Nursing Home|Institute))\b/i);
    if (facilityMatch) {
      detectedFacility = facilityMatch[1].trim();
    }
  }

  // 5. Clinical Entity Assembly (Combines Gemini LLM Extractions + Regex Parser)
  const entities = [];
  const lower = extractedText.toLowerCase();

  // Add Gemini Lab Values
  if (geminiEntities && Array.isArray(geminiEntities.lab_values)) {
    for (const lv of geminiEntities.lab_values) {
      if (lv.test_name && lv.value) {
        entities.push({
          category: 'LAB_VALUE',
          entity_name: lv.test_name,
          entity_value: String(lv.value),
          unit: lv.unit || '',
          reference_range: lv.reference_range || '',
          is_abnormal: Boolean(lv.is_abnormal),
          abnormal_flag: lv.abnormal_flag || (lv.is_abnormal ? 'HIGH' : 'NORMAL')
        });
      }
    }
  }

  // Add Gemini Medications
  if (geminiEntities && Array.isArray(geminiEntities.medications)) {
    for (const med of geminiEntities.medications) {
      if (med.name && !entities.some(e => e.entity_name.toLowerCase() === med.name.toLowerCase())) {
        entities.push({
          category: 'MEDICATION',
          entity_name: med.name,
          entity_value: [med.dose, med.frequency, med.route].filter(Boolean).join(' ') || 'As prescribed',
          unit: 'dosage',
          reference_range: 'Prescription Entry',
          is_abnormal: false,
          abnormal_flag: null
        });
      }
    }
  }

  // Add Gemini Diagnoses
  if (geminiEntities && Array.isArray(geminiEntities.diagnoses)) {
    for (const d of geminiEntities.diagnoses) {
      if (d.name && !entities.some(e => e.entity_name.toLowerCase() === d.name.toLowerCase())) {
        entities.push({
          category: 'DIAGNOSIS',
          entity_name: d.name,
          entity_value: d.status || 'Documented in record',
          unit: '',
          reference_range: d.icd10 ? `ICD-10 ${d.icd10}` : 'Clinical Diagnosis',
          is_abnormal: false,
          abnormal_flag: null
        });
      }
    }
  }

  // Regex Fallback / Supplement: Lab Values with ranges & flags
  for (const [key, range] of Object.entries(CLINICAL_LAB_RANGES)) {
    const keyPattern = key.length <= 4 ? `\\b${key}\\b` : key;
    const testRegex = new RegExp(keyPattern, 'i');
    
    if (testRegex.test(extractedText)) {
      const regex = new RegExp(`(?:${keyPattern})[^0-9\\r\\n]{0,30}[:=]?\\s*([0-9]+(?:\\.[0-9]+)?)`, 'i');
      const match = extractedText.match(regex);
      if (match && match[1]) {
        const val = parseFloat(match[1]);
        let isAbnormal = false;
        let flag = 'NORMAL';

        if (range.critHigh && val >= range.critHigh) {
          isAbnormal = true;
          flag = 'CRITICAL HIGH';
        } else if (range.critLow && val <= range.critLow) {
          isAbnormal = true;
          flag = 'CRITICAL LOW';
        } else if (range.max && val > range.max) {
          isAbnormal = true;
          flag = 'HIGH';
        } else if (range.min && val < range.min) {
          isAbnormal = true;
          flag = 'LOW';
        }

        if (!entities.some(e => e.entity_name === range.name)) {
          entities.push({
            category: 'LAB_VALUE',
            entity_name: range.name,
            entity_value: String(val),
            unit: range.unit,
            reference_range: `${range.min || 0} - ${range.max} ${range.unit}`,
            is_abnormal: isAbnormal,
            abnormal_flag: isAbnormal ? flag : 'NORMAL'
          });
        }
      }
    }
  }

  // Regex Supplement: Medications
  const lines = extractedText.split(/\r?\n/);
  const NON_MED_TERMS = new RegExp('^(hospital|clinic|diagnostics|patient|doctor|consultant|department|dr|date|time|age|gender|sex|phone|contact|address|report|specimen|investigation|prescription|notes|diagnosis|history|summary|signature|registration|lab|test|page)$', 'i');

  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length < 5) return;

    const hasMedKeyword = /\b(?:tab|tablet|cap|capsule|syr|syrup|inj|injection|oint|ointment|drops|susp|suspension)\b/i.test(trimmed);
    const doseMatch = trimmed.match(/\b(\d+(?:\.\d+)?\s*(?:mg|mcg|ml|iu|gm)\b|\b\d+-\d+-\d+\b|\b(?:OD|BD|TDS|QID|HS|PRN|SOS)\b)/i);

    if (hasMedKeyword || (doseMatch && /\b(?:take|oral|daily|times|after meals?|before meals?|tabs?|caps?)\b/i.test(trimmed))) {
      let namePart = trimmed;
      if (doseMatch) {
        const parts = trimmed.split(doseMatch[0]);
        namePart = parts[0];
      }

      const cleanName = namePart
        .replace(/^[^a-zA-Z0-9]+/, '')
        .replace(/\b(?:tab|tablet|cap|capsule|syr|syrup|inj|injection|rx)\b\.?\s*/gi, '')
        .replace(/[0-9]+\.\s*/g, '')
        .trim();

      if (
        cleanName.length >= 3 && 
        cleanName.length <= 40 && 
        !NON_MED_TERMS.test(cleanName) &&
        !entities.some(e => e.entity_name.toLowerCase() === cleanName.toLowerCase())
      ) {
        entities.push({
          category: 'MEDICATION',
          entity_name: cleanName,
          entity_value: doseMatch ? doseMatch[0].trim() : 'As prescribed',
          unit: 'dosage',
          reference_range: 'Prescription Entry',
          is_abnormal: false,
          abnormal_flag: null
        });
      }
    }
  });

  // Regex Supplement: Common Diagnoses
  for (const diag of COMMON_DIAGNOSES) {
    const diagRegex = new RegExp(`\\b${diag.term}\\b`, 'i');
    if (diagRegex.test(extractedText)) {
      if (!entities.some(e => e.entity_name === diag.name)) {
        entities.push({
          category: 'DIAGNOSIS',
          entity_name: diag.name,
          entity_value: 'Documented in record',
          unit: '',
          reference_range: `ICD-10 ${diag.icd10}`,
          is_abnormal: false,
          abnormal_flag: null
        });
      }
    }
  }

  return {
    file_name: fileName,
    document_type: docType,
    document_date: documentDate,
    issuing_facility: detectedFacility || fileMeta.issuing_facility || null,
    ocr_status: 'COMPLETED',
    ocr_provider: ocrProvider,
    processing_method: processingMethod,
    ocr_latency_ms: ocrLatencyMs,
    ocr_confidence_score: confidenceScore,
    extracted_text: extractedText,
    entities: entities,
    flagged_uncertainties: (geminiEntities && geminiEntities.low_confidence_flags) || [],
    llm_validation: validationResult,
    llm_extraction: geminiEntities
  };
}
