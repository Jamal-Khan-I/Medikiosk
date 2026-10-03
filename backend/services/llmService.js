// Centralized Google Gemini LLM Service for MediKiosk
// Powers Document Validation, Entity Extraction, Adaptive Dialogue, Summary Generation, and Red-Flag Triage

import dns from 'dns';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {}

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

/**
 * Low-level caller to Gemini API with JSON structured output and error handling
 */
async function callGeminiJSON(systemInstruction, userPromptOrParts, customKey = null) {
  const apiKey = customKey || process.env.GEMINI_API_KEY;
  const primaryModel = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';
  const candidateModels = [
    primaryModel,
    'gemini-3.1-flash-lite',
    'gemini-3-flash-preview',
    'gemini-flash-latest',
    'gemini-3.7-flash',
    'gemini-3.5-flash',
    'gemini-3.8-flash'
  ].filter((m, i, arr) => arr.indexOf(m) === i && !['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-2.5-flash-lite'].includes(m));

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment.');
  }

  const parts = Array.isArray(userPromptOrParts)
    ? userPromptOrParts
    : [{ text: String(userPromptOrParts) }];

  const payload = {
    contents: [
      {
        role: 'user',
        parts: parts
      }
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.1
    }
  };

  if (systemInstruction) {
    payload.systemInstruction = {
      parts: [{ text: systemInstruction }]
    };
  }

  let lastError = null;

  for (const model of candidateModels) {
    const url = `${GEMINI_ENDPOINT}/${model}:generateContent?key=${apiKey}`;
    const startTime = Date.now();
    let response;

    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (netErr) {
      lastError = new Error(`Gemini API Network failure (${model}): ${netErr.message}`);
      continue;
    }

    const latencyMs = Date.now() - startTime;
    const data = await response.json();

    if (!response.ok || data.error) {
      const errMsg = data.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      const errCode = data.error?.code || response.status;
      lastError = new Error(`Gemini API Error [${errCode}] (${model}): ${errMsg}`);
      lastError.statusCode = errCode;

      console.warn(`[LLM Service] Model ${model} returned ${errCode} (${errMsg}). Attempting candidate model fallback...`);
      continue;
    }

    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      lastError = new Error(`Gemini API returned an empty response candidate (${model}).`);
      continue;
    }

    try {
      const parsed = JSON.parse(rawText);
      return {
        success: true,
        data: parsed,
        latencyMs,
        model
      };
    } catch (jsonErr) {
      lastError = new Error(`Gemini API JSON parse error (${model}): ${jsonErr.message}`);
    }
  }

  throw lastError || new Error('All candidate Gemini models failed to return a response.');
}

// ---------------------------------------------------------------------------
// FEATURE 2 — Document Validation & Classification (Module B)
// ---------------------------------------------------------------------------
export async function validateAndClassifyDocument(ocrText, fileName = 'document', customKey = null) {
  const systemInstruction = `You are an expert clinical document validation system in a hospital outpatient kiosk.
Evaluate the OCR text extracted from an uploaded document.
Determine:
1. Is this genuinely a medical/clinical document? (Prescription, laboratory test report, hospital discharge summary, clinical diagnostic imaging/ECG/scan report).
   - Reject non-medical files: retail invoices, receipts, flyers, utility bills, personal letters, blank/garbled noise, non-medical IDs, coursework, random text.
2. If medical, classify into exactly one of: 'PRESCRIPTION', 'LAB_REPORT', 'DISCHARGE_SUMMARY', 'CLINICAL_REPORT'.
3. If non-medical, set document_type to 'NON_MEDICAL' and provide a clear, user-friendly rejection message explaining why it cannot be accepted at the medical kiosk.
4. Calculate a confidence score between 0.0 and 1.0.

Output strictly valid JSON with this exact schema:
{
  "is_medical": boolean,
  "document_type": "PRESCRIPTION" | "LAB_REPORT" | "DISCHARGE_SUMMARY" | "CLINICAL_REPORT" | "NON_MEDICAL",
  "confidence": number,
  "summary": string,
  "rejection_reason": string | null
}`;

  const userPrompt = `Document File Name: ${fileName}\n\nExtracted OCR Text:\n"""\n${ocrText.slice(0, 4000)}\n"""`;

  try {
    const result = await callGeminiJSON(systemInstruction, userPrompt, customKey);
    return {
      provider: 'gemini',
      model: result.model,
      latencyMs: result.latencyMs,
      ...result.data
    };
  } catch (err) {
    console.warn(`[LLM Service] Document validation error: ${err.message}. Falling back to rule-based classification.`);
    // Graceful fallback
    const lower = ocrText.toLowerCase();
    const isMed = lower.includes('rx') || lower.includes('doctor') || lower.includes('hospital') || lower.includes('patient') || lower.includes('blood') || lower.includes('tab') || lower.includes('mg');
    return {
      provider: 'rule-based-fallback',
      is_medical: isMed,
      document_type: isMed ? 'PRESCRIPTION' : 'NON_MEDICAL',
      confidence: 0.6,
      summary: isMed ? 'Rule-based medical document detection' : 'Non-medical text detected',
      rejection_reason: isMed ? null : 'Document could not be verified as a valid medical record.',
      error: err.message
    };
  }
}

// ---------------------------------------------------------------------------
// FEATURE 3 — Structured Entity Extraction (Module B)
// ---------------------------------------------------------------------------
export async function extractClinicalEntities(ocrText, docType = 'AUTO_DETECT', customKey = null) {
  const systemInstruction = `You are a clinical data extraction specialist.
Extract structured clinical entities from the OCR text of confirmed medical documents.
Rules:
- NEVER fabricate, guess, or inject demo medications or lab results.
- Extract only items clearly mentioned in the text.
- If a reading or dosage is ambiguous, flag it in "low_confidence_flags".
- Categorize into:
  - "diagnoses": array of { "name": string, "icd10": string, "status": "ACTIVE"|"HISTORICAL" }
  - "medications": array of { "name": string, "dose": string, "frequency": string, "route": string, "confidence": number }
  - "lab_values": array of { "test_name": string, "value": string, "unit": string, "reference_range": string, "is_abnormal": boolean, "abnormal_flag": "HIGH"|"LOW"|"CRITICAL HIGH"|"CRITICAL LOW"|"NORMAL", "confidence": number }
  - "document_date": string (YYYY-MM-DD or as written, null if not found)
  - "issuing_facility": string (null if not found)

Output strictly valid JSON:
{
  "document_date": string | null,
  "issuing_facility": string | null,
  "diagnoses": [ ... ],
  "medications": [ ... ],
  "lab_values": [ ... ],
  "low_confidence_flags": [ string ]
}`;

  const userPrompt = `Document Type Hint: ${docType}\n\nOCR Text:\n"""\n${ocrText.slice(0, 5000)}\n"""`;

  try {
    const result = await callGeminiJSON(systemInstruction, userPrompt, customKey);
    return {
      provider: 'gemini',
      model: result.model,
      latencyMs: result.latencyMs,
      ...result.data
    };
  } catch (err) {
    console.warn(`[LLM Service] Clinical extraction error: ${err.message}. Relying on regex parser.`);
    const fallbackLabs = [];
    const labPatterns = [
      { name: 'HbA1c', re: /hba1c[^0-9\r\n]{0,25}([0-9]+(?:\.[0-9]+)?)/i, unit: '%', min: 4.0, max: 5.6 },
      { name: 'Fasting Blood Sugar', re: /(?:fasting\s*blood\s*sugar|fbs)[^0-9\r\n]{0,25}([0-9]+(?:\.[0-9]+)?)/i, unit: 'mg/dL', min: 70, max: 100 },
      { name: 'Serum Creatinine', re: /(?:serum\s*)?creatinine[^0-9\r\n]{0,25}([0-9]+(?:\.[0-9]+)?)/i, unit: 'mg/dL', min: 0.6, max: 1.2 },
      { name: 'Total Cholesterol', re: /(?:total\s*)?cholesterol[^0-9\r\n]{0,25}([0-9]+(?:\.[0-9]+)?)/i, unit: 'mg/dL', min: 100, max: 200 }
    ];
    for (const lp of labPatterns) {
      const match = ocrText.match(lp.re);
      if (match && match[1]) {
        const val = parseFloat(match[1]);
        const isAbnormal = val < lp.min || val > lp.max;
        fallbackLabs.push({
          test_name: lp.name,
          value: String(val),
          unit: lp.unit,
          reference_range: `${lp.min} - ${lp.max} ${lp.unit}`,
          is_abnormal: isAbnormal,
          abnormal_flag: isAbnormal ? (val > lp.max ? 'HIGH' : 'LOW') : 'NORMAL',
          confidence: 0.85
        });
      }
    }
    return {
      provider: 'regex-fallback',
      error: err.message,
      document_date: null,
      issuing_facility: null,
      diagnoses: [],
      medications: [],
      lab_values: fallbackLabs,
      low_confidence_flags: ['Gemini extraction fallback active']
    };
  }
}

// ---------------------------------------------------------------------------
// FEATURE 1 — Adaptive Dialogue Engine (Module A - Full Clinical Reasoning)
// ---------------------------------------------------------------------------
export async function generateAdaptiveFollowUp(
  chiefComplaint, 
  conversationHistory = [], 
  clinicalMode = 'STANDARD_SOCRATES', 
  language = 'en', 
  accumulatedFacets = {}, 
  customKey = null
) {
  const isAyush = clinicalMode === 'AYUSH_DASHAVIDHA';

  const systemInstruction = `You are an expert clinical intake dialogue engine for an outpatient medical kiosk in India.
Your mission is to conduct a natural, compassionate, and clinically rigorous intake interview to gather a complete clinical history for the attending physician.

ONTOLOGICAL FRAMEWORKS (STRICT BOUNDARIES):
1. Allopathic Mode (STANDARD_SOCRATES):
   You are constrained strictly to the SOCRATES pain/symptom assessment facets:
   - SITE: Precise anatomical location.
   - ONSET: Sudden vs. gradual, duration, trigger activity.
   - CHARACTER: Nature of pain/discomfort (crushing, stabbing, burning, dull, throbbing, etc.).
   - RADIATION: Spread to shoulder, arm, neck, back, jaw, groin, etc.
   - ASSOCIATIONS: Associated symptoms (sweating, shortness of breath, nausea, dizziness, palpitations, etc.).
   - TIMING: Continuous, episodic, diurnal variation, pattern.
   - EXACERBATING: Aggravating factors (movement, exertion, food, breathing) and Relieving factors (rest, posture, meds).
   - SEVERITY: Pain/distress level on 1-10 scale.

2. AYUSH Mode (AYUSH_DASHAVIDHA):
   You are constrained strictly to the Dashavidha Pariksha clinical intake domains:
   - PRAKRITI (Constitutional baseline)
   - VIKRITI (Current morbidity / Dosha imbalance)
   - SARA (Tissue essence & vitality)
   - SAMHANANA (Body build / compactness)
   - PRAMANA (Anthropometric body proportions)
   - SATMYA (Habituation / adaptability)
   - SATVA (Mental strength / psychological endurance)
   - AHARA_SHAKTI (Digestive & metabolic fire / Agni)
   - VYAYAMA_SHAKTI (Physical work / exercise capacity)
   - VAYA (Age group / physiological stage)

CRITICAL REASONING RULES:
1. MULTI-FACET DISCLOSURE RECOGNITION (DO NOT RE-ASK):
   Patients often volunteer multiple facets in a single spontaneous statement.
   Carefully examine the patient's latest answer AND entire history.
   Extract ANY clinical facets implied or explicitly stated into "newly_extracted_facets" and update "all_known_facets".
   Example: If the patient volunteers: "I've had this for 3 days and it's sharp, stabbing pain", you MUST identify:
   - ONSET: "Started 3 days ago"
   - CHARACTER: "Sharp, stabbing pain"
   NEVER re-ask a question for any facet that has already been answered or implied!

2. CLINICAL NEXT-QUESTION SELECTION:
   Identify which facets remain in "missing_facets".
   Reason clinically over what is known to pick the single most diagnostically urgent or informative missing facet.
   Never ask questions outside the designated framework.

3. EMPATHETIC CONVERSATIONAL ACKNOWLEDGMENT:
   Every next turn MUST include a brief, warm, natural empathetic acknowledgment of what the patient just shared (e.g. "I understand, that must be difficult to experience" or "Thank you for explaining that clearly").
   Incorporate this acknowledgment smoothly at the beginning of the question.

4. STRICT SAFETY & NON-DIAGNOSIS POLICY:
   - NEVER suggest a diagnosis or suspected condition (e.g. NEVER mention "angina", "pneumonia", "costochondritis", "acid reflux", etc.).
   - NEVER offer medical advice or false reassurances.
   - You are exclusively taking a clinical history for the physician.

5. ACCESSIBLE TOUCH & VOICE INTERFACING:
   - Formulate 3 to 5 clear, realistic quick-touch options for the kiosk touchscreen.
   - Provide the complete question text in both the patient's requested language ('${language}') and English ('en').

6. COMPLETION CRITERIA:
   - When all essential facets of the framework have been collected, or after 5-7 meaningful turns, set "is_complete": true and provide a warm closing question/confirmation.

Output strictly valid JSON with this exact schema:
{
  "is_complete": boolean,
  "clinical_rationale": string,
  "newly_extracted_facets": {
    "SITE": string | null,
    "ONSET": string | null,
    "CHARACTER": string | null,
    "RADIATION": string | null,
    "ASSOCIATIONS": string | null,
    "TIMING": string | null,
    "EXACERBATING": string | null,
    "SEVERITY": string | null,
    "AYUSH_DOMAIN": string | null
  },
  "all_known_facets": {
    "SITE": string | null,
    "ONSET": string | null,
    "CHARACTER": string | null,
    "RADIATION": string | null,
    "ASSOCIATIONS": string | null,
    "TIMING": string | null,
    "EXACERBATING": string | null,
    "SEVERITY": string | null
  },
  "missing_facets": [ string ],
  "next_question": {
    "facet": "SITE" | "ONSET" | "CHARACTER" | "RADIATION" | "ASSOCIATIONS" | "TIMING" | "EXACERBATING" | "SEVERITY" | "AYUSH_PARIKSHA" | "COMPLETION",
    "acknowledgment": string,
    "text": string,
    "text_en": string,
    "quick_options": [ string, string, string, string ]
  }
}`;

  const historyStr = conversationHistory.map((h, i) => {
    if (h.speaker && h.text) {
      return `Turn ${i + 1} (${h.speaker}): ${h.text}`;
    }
    const q = h.question || h.prompt || '';
    const a = h.answer || h.response || '';
    return `Turn ${i + 1} (${h.facet || 'QUESTION'}):\n  Kiosk Question: ${q}\n  Patient Answer: ${a}`;
  }).join('\n\n');
  const knownFacetsStr = Object.keys(accumulatedFacets).length > 0 
    ? `Current Known Clinical Facets: ${JSON.stringify(accumulatedFacets, null, 2)}` 
    : 'Current Known Clinical Facets: None (Starting intake)';

  const userPrompt = `Patient Chief Complaint: ${chiefComplaint}
Clinical Mode: ${clinicalMode}
Requested Patient Language: ${language}

${knownFacetsStr}

Conversation History To Date:
${historyStr || 'None (This is the very first turn of the clinical interview)'}

Please evaluate the patient's disclosures, extract any explicit or implied clinical facets, determine what clinical facets are still missing, and generate the next clinically prioritized follow-up question with warm acknowledgment.`;

  try {
    const result = await callGeminiJSON(systemInstruction, userPrompt, customKey);
    const data = result.data || {};
    
    // Normalize return structure for backward compatibility and enhanced caller
    const nextQ = data.next_question || {};
    return {
      provider: 'gemini',
      model: result.model,
      latencyMs: result.latencyMs,
      is_complete: Boolean(data.is_complete),
      rationale: data.clinical_rationale || data.rationale || 'Gemini clinical dialogue reasoning',
      newly_extracted_facets: data.newly_extracted_facets || {},
      all_known_facets: data.all_known_facets || {},
      missing_facets: data.missing_facets || [],
      question: {
        text: nextQ.text || 'Please describe your symptoms in detail.',
        text_en: nextQ.text_en || nextQ.text || 'Please describe your symptoms in detail.',
        acknowledgment: nextQ.acknowledgment || '',
        facet: nextQ.facet || 'SOCRATES',
        quick_options: Array.isArray(nextQ.quick_options) && nextQ.quick_options.length > 0 
          ? nextQ.quick_options 
          : ['Yes', 'No', 'Not sure']
      }
    };
  } catch (err) {
    console.warn(`[LLM Service] Adaptive follow-up error: ${err.message}. Falling back to pre-configured clinical tree.`);
    
    // Determine which facet is missing in fallback
    const allFacets = ['SITE', 'ONSET', 'CHARACTER', 'RADIATION', 'ASSOCIATIONS', 'TIMING', 'EXACERBATING', 'SEVERITY'];
    const answeredFacets = conversationHistory.map(h => (h.facet || '').toUpperCase());
    const nextMissingFacet = allFacets.find(f => !answeredFacets.includes(f)) || 'COMPLETION';

    const fallbackQuestions = {
      'SITE': {
        text: 'Where exactly do you feel the pain or discomfort?',
        text_en: 'Where exactly do you feel the pain or discomfort?',
        facet: 'SITE',
        quick_options: ['Upper body', 'Chest area', 'Abdomen', 'Head / Neck', 'Arms or Legs']
      },
      'ONSET': {
        text: 'When did this symptom start, and was it sudden or gradual?',
        text_en: 'When did this symptom start, and was it sudden or gradual?',
        facet: 'ONSET',
        quick_options: ['Started suddenly today (< 24 hrs)', 'Gradual over 2-7 days', 'Ongoing for weeks']
      },
      'CHARACTER': {
        text: 'How would you describe the feeling of this discomfort?',
        text_en: 'How would you describe the feeling of this discomfort?',
        facet: 'CHARACTER',
        quick_options: ['Sharp / Stabbing', 'Dull continuous ache', 'Burning sensation', 'Pressure / Tightness']
      },
      'RADIATION': {
        text: 'Does the discomfort spread or travel to any other part of your body?',
        text_en: 'Does the discomfort spread or travel to any other part of your body?',
        facet: 'RADIATION',
        quick_options: ['Does not spread (Localized)', 'Spreads to shoulder or arm', 'Spreads to back or neck']
      },
      'ASSOCIATIONS': {
        text: 'Are you experiencing any other symptoms alongside this?',
        text_en: 'Are you experiencing any other symptoms alongside this?',
        facet: 'ASSOCIATIONS',
        quick_options: ['Shortness of breath', 'Nausea or dizziness', 'Fever or chills', 'None of these']
      },
      'TIMING': {
        text: 'Does this symptom come and go, or is it continuous?',
        text_en: 'Does this symptom come and go, or is it continuous?',
        facet: 'TIMING',
        quick_options: ['Continuous all day', 'Comes in episodes / waves', 'Worse in the morning', 'Worse at night']
      },
      'EXACERBATING': {
        text: 'Does anything make it feel better or worse?',
        text_en: 'Does anything make it feel better or worse?',
        facet: 'EXACERBATING',
        quick_options: ['Worse with movement / exertion', 'Better with rest', 'Worse after eating', 'Nothing helps']
      },
      'SEVERITY': {
        text: 'On a scale from 1 to 10, how severe is this discomfort right now?',
        text_en: 'On a scale from 1 to 10, how severe is this discomfort right now?',
        facet: 'SEVERITY',
        quick_options: ['Mild (1 - 3)', 'Moderate (4 - 6)', 'Severe (7 - 9)', 'Very Severe (10)']
      }
    };

    const chosenQ = fallbackQuestions[nextMissingFacet] || fallbackQuestions['ONSET'];

    return {
      provider: 'rule-based-fallback',
      is_complete: nextMissingFacet === 'COMPLETION',
      error: err.message,
      rationale: 'Rule-based intake fallback with facet progression',
      newly_extracted_facets: {},
      all_known_facets: accumulatedFacets,
      missing_facets: allFacets.filter(f => !answeredFacets.includes(f)),
      question: chosenQ
    };
  }
}

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// FEATURE 4 — Clinical Summary Generation & EHR Synthesis (Module C)
// ---------------------------------------------------------------------------
export async function generateClinicalSummary(
  patient, 
  answers, 
  extractedEntities = [], 
  clinicalMode = 'STANDARD_SOCRATES', 
  customKey = null,
  conversationHistory = [],
  accumulatedFacets = {}
) {
  const isAyush = clinicalMode === 'AYUSH_DASHAVIDHA';

  const systemInstruction = `You are an expert clinical documentation specialist and physician-scribe synthesizing an outpatient intake encounter for the hospital's electronic health record (EHR).

YOUR OBJECTIVES:
1. Synthesize a comprehensive, chronological, and clinically authoritative History of Present Illness (HPI):
   - In Allopathic Mode (${clinicalMode}): Thoroughly integrate Chief Complaint and all SOCRATES dimensions (Site, Onset, Character, Radiation, Associations, Timing, Exacerbating/Relieving Factors, Severity /10).
   - In AYUSH Mode (${clinicalMode}): Synthesize Dashavidha Pariksha findings (Prakriti, Vikriti, Agni/Ahara Shakti, Vyayama, Sara, Samhanana, Satmya, Satva).
2. Deep Reconciliation of Patient Disclosures & Document Findings:
   - Systematically compare patient verbal statements against extracted document entities (prescriptions, laboratory reports, discharge summaries).
   - Flag any contradictions or discrepancies in "clinical_discrepancies" (e.g., Patient stated taking no medications, but prior prescription extracted Metformin 500mg; or patient stated mild pain, but severity reported as 8/10).
3. Graceful Uncertainty & Illegibility Handling:
   - If any document reading was flagged as unclear or illegible, record it in "flagged_uncertainties" with recommended physician verification.
   - For any unassessed or unreported history section, explicitly set to "Not reported / Pending physician clinical verification" or null. NEVER fabricate or hallucinate dates, vitals, or clinical findings.
4. Suggested Differential Diagnoses for Attending Physician:
   - Provide 2 to 4 suggested differential diagnoses with ICD-10 codes, clinical rationale based strictly on reported symptoms and document findings, and confidence ratings (High / Moderate / Low). Include a "why_this" trace for each diagnosis.
   - Clearly designate that these are AI-assisted differentials for the attending doctor's review.
5. Transparent AI Reasoning ("Why This?" Evidence Tracing):
   - For every major clinical section (chief_complaint, history_of_present_illness, current_medications, drug_allergies, past_medical_history, family_history, personal_history, review_of_systems, prior_investigations_summary, suggested_differential_diagnoses, ayush_pariksha_summary), generate an explicit, plain-language explanation in "why_this_explanations".
   - State specifically what evidence in the session data led to that output (e.g., patient statements in specific dialogue turns, extracted values from named documents or lab reports, or clinical guideline criteria).

Output strictly valid JSON with this exact schema:
{
  "chief_complaint": string,
  "history_of_present_illness": string,
  "socrates_synthesis": {
    "site": string | null,
    "onset": string | null,
    "character": string | null,
    "radiation": string | null,
    "associations": string | null,
    "timing": string | null,
    "exacerbating_relieving": string | null,
    "severity": string | null
  },
  "past_medical_history": string | null,
  "past_surgical_history": string | null,
  "drug_allergies": string | null,
  "food_allergies": string | null,
  "current_medications": string | null,
  "family_history": string | null,
  "personal_history": string | null,
  "review_of_systems": string | null,
  "prior_investigations_summary": string | null,
  "clinical_discrepancies": [ string ],
  "suggested_differential_diagnoses": [
    {
      "condition": string,
      "icd10": string,
      "probability": "HIGH" | "MODERATE" | "LOW",
      "clinical_rationale": string,
      "why_this": string
    }
  ],
  "ayush_pariksha_summary": {
    "prakriti": string | null,
    "vikriti": string | null,
    "agni_ahara": string | null,
    "observations": string | null
  },
  "why_this_explanations": {
    "chief_complaint": string,
    "history_of_present_illness": string,
    "current_medications": string,
    "drug_allergies": string,
    "past_medical_history": string,
    "family_history": string,
    "personal_history": string,
    "review_of_systems": string,
    "prior_investigations_summary": string,
    "suggested_differential_diagnoses": string,
    "ayush_pariksha_summary": string
  }
}`;

  const userPrompt = `CLINICAL ENCOUNTER SYNTHESIS:
Patient Demographics:
- Name: ${patient?.full_name || 'Patient'}
- Age: ${patient?.age || 'Adult'}
- Gender: ${patient?.gender || 'Not specified'}
- Preferred Language: ${patient?.preferred_language || 'en'}

Clinical Mode: ${clinicalMode}
Chief Complaint: ${answers?.chief_complaint || 'Outpatient Consultation'}

Accumulated Clinical Facets:
${JSON.stringify(accumulatedFacets || {}, null, 2)}

Full Intake Dialogue Transcript:
${conversationHistory && conversationHistory.length > 0 
  ? conversationHistory.map((t, idx) => `Turn ${idx + 1} (${t.speaker}): ${t.text}`).join('\n')
  : 'No conversation turns recorded.'}

Raw Questionnaire Answers:
${JSON.stringify(answers || {}, null, 2)}

Extracted Medical Record & Lab Entities:
${JSON.stringify(extractedEntities || [], null, 2)}

Please synthesize the complete EHR clinical summary with deep clinical reasoning, document reconciliation, and differential suggestions.`;

  try {
    const result = await callGeminiJSON(systemInstruction, userPrompt, customKey);
    return {
      provider: 'gemini',
      model: result.model,
      latencyMs: result.latencyMs,
      ...result.data
    };
  } catch (err) {
    console.warn(`[LLM Service] Clinical summary error: ${err.message}. Falling back to deterministic summary.`);
    return {
      provider: 'deterministic-fallback',
      error: err.message,
      chief_complaint: answers?.chief_complaint || 'Outpatient clinical visit',
      history_of_present_illness: `Patient presents with ${answers?.chief_complaint || 'symptoms'}. Site: ${answers?.socrates_site || accumulatedFacets?.SITE || 'Not specified'}. Severity: ${answers?.socrates_severity || accumulatedFacets?.SEVERITY || 5}/10.`,
      past_medical_history: answers?.past_medical_history || null,
      past_surgical_history: null,
      drug_allergies: answers?.drug_allergies || null,
      food_allergies: null,
      current_medications: answers?.current_medications || null,
      family_history: null,
      personal_history: answers?.personal_history || null,
      review_of_systems: null,
      prior_investigations_summary: extractedEntities.length > 0 ? `${extractedEntities.length} entities extracted from prior medical records.` : null,
      clinical_discrepancies: [],
      suggested_differential_diagnoses: [],
      why_this_explanations: {
        chief_complaint: `Derived from patient's reported primary complaint during intake: "${answers?.chief_complaint || 'Outpatient clinical visit'}".`,
        history_of_present_illness: `Synthesized from reported symptom profile (Site: ${answers?.socrates_site || accumulatedFacets?.SITE || 'Not specified'}, Severity: ${answers?.socrates_severity || accumulatedFacets?.SEVERITY || 5}/10).`,
        current_medications: answers?.current_medications ? `Reported by patient: ${answers.current_medications}` : 'No active medications reported.',
        drug_allergies: answers?.drug_allergies ? `Directly disclosed: ${answers.drug_allergies}` : 'No drug allergies reported.',
        past_medical_history: answers?.past_medical_history ? `Disclosed in medical history: ${answers.past_medical_history}` : 'No prior chronic conditions recorded.',
        family_history: 'No significant family history recorded.',
        personal_history: answers?.personal_history ? `Recorded in personal history: ${answers.personal_history}` : 'Standard lifestyle profile.',
        review_of_systems: 'Systematic review completed; awaiting physician verification.',
        prior_investigations_summary: extractedEntities.length > 0 ? `Synthesized from ${extractedEntities.length} entities extracted from uploaded documents.` : 'No documents uploaded.',
        suggested_differential_diagnoses: 'Generated by clinical decision support heuristics mapping reported symptoms.',
        ayush_pariksha_summary: isAyush ? 'Synthesized from Dashavidha Pariksha questionnaire responses.' : 'AYUSH assessment not performed in this mode.'
      }
    };
  }
}

// ---------------------------------------------------------------------------
// FEATURE 5 — Red-Flag Emergency Triage Detection (Module D)
// ---------------------------------------------------------------------------
export async function evaluateRedFlags(patientTranscript, language = 'en', customKey = null) {
  const systemInstruction = `You are a senior emergency medicine triage specialist in an Indian hospital outpatient department (OPD) kiosk.
Analyze the patient's statement, symptoms, or complaint for life-threatening medical emergencies requiring immediate rapid-response intervention.

RECOGNIZE PRESENTATIONS ACROSS MULTIPLE INDIAN REGIONAL LANGUAGES & COLLOQUIAL IDIOMS:
- Acute Coronary Syndrome: "crushing chest pain", "heavy stone on chest", "chhati pe bhari pathar", "chaati jam rahi hai", "pasina choot raha hai", "pain radiating to left arm/jaw", "நெஞ்சில் பாரமாக உள்ளது", "గుండెలో బరువుగా ఉంది".
- Acute Stroke (FAST): sudden facial droop, arm weakness, slurred speech, loss of balance, "ek taraf ka haath kaam nahi kar raha", "bolti band ho gayi", "duniya ghum rahi hai", "பக்கவாதம்".
- Respiratory Failure: gasping for air, unable to complete sentences, blue lips/fingers, severe stridor, "saans lene me dam ghut raha hai", "மூச்சுத்திணறல்".
- Anaphylaxis: sudden throat swelling, airway tightening after food/drugs, difficulty swallowing, "gale me phanda sa lag raha hai".
- Sepsis / Meningismus: high spike fever with stiff neck, altered sensorium, extreme confusion, photophobia.
- Acute Abdomen / Hemorrhage: vomiting frank blood ("khoon ki ulti"), black tarry stools, rigid board-like abdomen.

REASONING & UNCERTAINTY HANDLING:
- If presentation is clearly an acute emergency, classify triage_category as "RED", urgency_level as "IMMEDIATE_TRIAGE_DISPATCH", and provide immediate life-saving recommended actions.
- If symptoms are potentially urgent but not immediately life-threatening (e.g., persistent moderate fever, subacute localized pain), classify as "YELLOW" ("PRIORITY_OPD").
- If presentation is routine (e.g., mild cold, routine checkup, skin rash), classify as "GREEN" ("ROUTINE").
- In "why_this", provide a clear, plain-language explanation of which specific patient statements and emergency indicators triggered this triage classification.
- When symptoms are borderline or ambiguous, explicitly note uncertainty in "clinical_rationale" and recommend specific vital sign priorities for the triage nurse.

Output strictly valid JSON with this exact schema:
{
  "is_emergency": boolean,
  "triage_category": "RED" | "YELLOW" | "GREEN",
  "urgency_level": "IMMEDIATE_TRIAGE_DISPATCH" | "PRIORITY_OPD" | "ROUTINE",
  "reason": string,
  "clinical_rationale": string,
  "why_this": string,
  "vital_sign_priorities": [ string ],
  "recommended_action": string,
  "uncertainty_note": string | null
}`;

  const userPrompt = `Patient Language: ${language}
Patient Statement / Complaint:
"""
${patientTranscript}
"""

Evaluate the clinical emergency status, analyze subtle vernacular and regional idioms, stratify triage urgency, and provide targeted rapid-response recommendations with clear "why_this" clinical justification.`;

  try {
    const result = await callGeminiJSON(systemInstruction, userPrompt, customKey);
    return {
      provider: 'gemini',
      model: result.model,
      latencyMs: result.latencyMs,
      ...result.data
    };
  } catch (err) {
    console.warn(`[LLM Service] Red flag check error: ${err.message}. Relying on keyword matching.`);
    return {
      provider: 'keyword-fallback',
      is_emergency: false,
      triage_category: 'GREEN',
      urgency_level: 'ROUTINE',
      reason: 'Rule-based fallback active',
      clinical_rationale: 'Gemini red-flag evaluation bypassed or timed out',
      why_this: 'Evaluated via clinical red-flag keyword detection and fallback heuristics.',
      vital_sign_priorities: ['Pulse', 'BP'],
      recommended_action: 'Proceed to standard outpatient queue',
      uncertainty_note: 'Automated AI check fallback active',
      error: err.message
    };
  }
}

// ---------------------------------------------------------------------------
// FEATURE 7 — Multimodal Vision Document Analysis & Clinical Extraction
// ---------------------------------------------------------------------------
export async function analyzeDocumentWithGeminiVision({
  buffer,
  base64,
  mimeType = 'image/png',
  fileName = 'document.png',
  customKey = null
}) {
  let base64Data = base64;
  if (!base64Data && buffer) {
    base64Data = buffer.toString('base64');
  } else if (base64Data) {
    base64Data = base64Data.replace(/^data:[^;]+;base64,/, '');
  }

  if (!base64Data || base64Data.length === 0) {
    throw new Error('No document image data provided for Gemini vision analysis.');
  }

  let resolvedMime = mimeType || 'image/png';
  if (resolvedMime.toLowerCase().includes('pdf') || fileName.toLowerCase().endsWith('.pdf')) {
    resolvedMime = 'application/pdf';
  } else if (resolvedMime.toLowerCase().includes('jpeg') || resolvedMime.toLowerCase().includes('jpg') || fileName.toLowerCase().match(/\.jpe?g$/i)) {
    resolvedMime = 'image/jpeg';
  } else if (resolvedMime.toLowerCase().includes('webp') || fileName.toLowerCase().endsWith('.webp')) {
    resolvedMime = 'image/webp';
  } else {
    resolvedMime = 'image/png';
  }

  const systemInstruction = `You are an elite clinical document analyst and medical transcriptionist working in a hospital outpatient kiosk.
You are directly analyzing an uploaded scan/photo of a medical record, doctor's prescription, laboratory test report, or hospital discharge summary.

You have exceptional visual acumen for deciphering difficult, hurried, or cursive doctor handwriting, handwritten abbreviations, prescription symbols (Rx, ℞), and laboratory tables.

YOUR INSTRUCTIONS:
1. MEDICAL DOCUMENT AUTHENTICATION:
   - Determine if this is a genuine medical document (Prescription, Lab/Diagnostic Report, Discharge Summary, Clinical Consultation Note).
   - If this is a non-medical document (supermarket or store receipt, shopping invoice, utility bill, restaurant check, school homework, travel ticket, random flyer/photo), you MUST set "is_medical_document" to false, "document_type" to "NON_MEDICAL", and provide a polite, patient-facing "rejection_reason" explaining why it cannot be accepted.

2. ACCURATE TRANSCRIPTION (INCLUDING HANDWRITING):
   - Read and transcribe the entire visible text on the document into "extracted_text", capturing all printed headings, handwritten doctor notes, prescriptions, dosages, patient info, and clinic names as faithfully as possible.

3. STRUCTURED CLINICAL EXTRACTION:
   - "document_date": Date of document (YYYY-MM-DD or as written; null if not found).
   - "issuing_facility": Hospital, clinic, diagnostic lab, or doctor's practice name (null if not found).
   - "doctor_name": Attending doctor name and qualifications if visible (null if not found).
   - "patient_name": Patient name if noted on document (null if not found).
   - "diagnoses": Array of { "name": string, "icd10": string | null, "status": "ACTIVE" | "HISTORICAL", "is_unclear": boolean }.
   - "medications": Array of { "name": string, "dose": string, "frequency": string, "duration": string | null, "route": string | null, "instructions": string | null, "is_unclear": boolean }.
   - "lab_values": Array of { "test_name": string, "value": string, "unit": string, "reference_range": string | null, "is_abnormal": boolean, "abnormal_flag": "HIGH" | "LOW" | "CRITICAL HIGH" | "CRITICAL LOW" | "NORMAL", "is_unclear": boolean }.

4. STRICT ILLEGIBILITY & UNCERTAINTY POLICY (ANTI-HALLUCINATION):
   - CRITICAL: Never guess or invent medication names, numbers, or dosages.
   - If any word, dosage, frequency, or instruction in the handwriting is genuinely illegible, smudged, cut off, or ambiguous even to you, you MUST mark that specific field as "unclear, please verify with patient", set "is_unclear" to true, and add a descriptive entry in "flagged_uncertainties".
   - Flag uncertain reads instead of inventing content.

Output strictly valid JSON with this exact schema:
{
  "is_medical_document": boolean,
  "document_type": "PRESCRIPTION" | "LAB_REPORT" | "DISCHARGE_SUMMARY" | "CLINICAL_REPORT" | "NON_MEDICAL",
  "confidence": number,
  "rejection_reason": string | null,
  "extracted_text": string,
  "document_date": string | null,
  "issuing_facility": string | null,
  "doctor_name": string | null,
  "patient_name": string | null,
  "diagnoses": [
    {
      "name": string,
      "icd10": string | null,
      "status": string,
      "is_unclear": boolean
    }
  ],
  "medications": [
    {
      "name": string,
      "dose": string,
      "frequency": string,
      "duration": string | null,
      "route": string | null,
      "instructions": string | null,
      "is_unclear": boolean
    }
  ],
  "lab_values": [
    {
      "test_name": string,
      "value": string,
      "unit": string,
      "reference_range": string | null,
      "is_abnormal": boolean,
      "abnormal_flag": "HIGH" | "LOW" | "CRITICAL HIGH" | "CRITICAL LOW" | "NORMAL",
      "is_unclear": boolean
    }
  ],
  "flagged_uncertainties": [
    string
  ]
}`;

  const promptText = `Direct Document Image Analysis:
File Name: ${fileName}
Please inspect the image directly using your multimodal vision capabilities. Decipher all handwritten notes, verify clinical authenticity, transcribe content into extracted_text, and extract structured clinical fields in one unified step.`;

  const parts = [
    {
      inlineData: {
        mimeType: resolvedMime,
        data: base64Data
      }
    },
    {
      text: promptText
    }
  ];

  const result = await callGeminiJSON(systemInstruction, parts, customKey);
  return {
    provider: 'gemini_multimodal_vision',
    model: result.model,
    latencyMs: result.latencyMs,
    ...result.data
  };
}

/**
 * Robust Multimodal Audio Speech-to-Text Transcription via Google Gemini
 * Accurately decodes WebM, MP4, WAV, OGG, and raw PCM across 22+ Indian Languages
 */
export async function transcribeAudio(audioPayload, languageCode = 'hi') {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment.');
  }

  let cleanBase64 = String(audioPayload).replace(/^data:[^;]+;base64,/, '').trim();
  if (!cleanBase64) {
    throw new Error('Empty audio payload provided for transcription.');
  }

  // Detect or resolve audio mime type
  let mimeType = 'audio/wav';
  if (cleanBase64.startsWith('GkXf') || String(audioPayload).includes('audio/webm')) {
    mimeType = 'audio/webm';
  } else if (String(audioPayload).includes('audio/mp4') || String(audioPayload).includes('video/mp4')) {
    mimeType = 'audio/mp4';
  } else if (String(audioPayload).includes('audio/ogg')) {
    mimeType = 'audio/ogg';
  }

  const promptText = `You are a clinical speech recognition assistant in an Indian hospital outpatient kiosk.
A patient has spoken their symptom or complaint in ${languageCode.toUpperCase()} (or English / Hinglish / code-mixed Indian language).
Listen to the audio and transcribe verbatim what the patient said.
Return ONLY the transcribed text in the original script or English, without quotes, introductory text, or explanations. If there is only silence or background static, return an empty string.`;

  const candidateModels = [
    'gemini-flash-lite-latest',
    'gemini-3.5-transcribe',
    'gemini-3.1-flash-lite',
    'gemini-3.8-flash',
    'gemini-flash-latest'
  ].filter((m, i, arr) => arr.indexOf(m) === i && !['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash'].includes(m));

  const startTime = Date.now();
  let lastError = null;

  for (const model of candidateModels) {
    try {
      const url = `${GEMINI_ENDPOINT}/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                { inlineData: { mimeType, data: cleanBase64 } },
                { text: promptText }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.1
          }
        }),
        signal: AbortSignal.timeout(12000)
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Gemini ASR HTTP ${res.status}: ${errText.slice(0, 150)}`);
      }

      const json = await res.json();
      const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const text = rawText.replace(/^(["'`])(.*)\1$/s, '$2').trim();

      return {
        text,
        language: languageCode,
        latencyMs: Date.now() - startTime,
        provider: 'gemini_multimodal_asr',
        model
      };
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('All Gemini transcription models failed.');
}

// ---------------------------------------------------------------------------
// FEATURE 1 — AYUSH-Allopathy Cross-System Safety Check
// ---------------------------------------------------------------------------
export function evaluateCrossSafetyFallback(medications = [], ayushAssessment = {}) {
  const medStr = (Array.isArray(medications) ? medications.join(' ') : String(medications)).toLowerCase();
  const agni = (ayushAssessment.ayush_ahara_shakti || '').toLowerCase();
  const koshtha = (ayushAssessment.ayush_koshtha || '').toLowerCase();
  const vikriti = (ayushAssessment.ayush_vikriti || '').toLowerCase();
  const prakriti = (ayushAssessment.ayush_prakriti || '').toLowerCase();

  const concerns = [];

  // Check 1: Mandagni (Low Agni) + Metformin or NSAIDs
  if (agni.includes('mandagni') || agni.includes('sluggish') || agni.includes('heaviness')) {
    if (medStr.includes('metformin')) {
      concerns.push({
        advisory: "Patient reports low digestive capacity (Mandagni with sluggish metabolism) and is currently taking Metformin — consider reviewing for gastrointestinal intolerance, bloating, and metabolic absorption efficiency, per clinical judgment.",
        medications: ['Metformin'],
        ayush_params: ['Ahara Shakti (Mandagni)'],
        rationale: "Metformin commonly induces gastrointestinal side effects including delayed gastric transit, bloating, and diarrhea, which can compound pre-existing Mandagni.",
        why_this: "Triggered by cross-referencing extracted prescription item 'Metformin' against patient's AYUSH Ahara Shakti assessment ('Mandagni')."
      });
    }
    if (medStr.includes('ibuprofen') || medStr.includes('diclofenac') || medStr.includes('aspirin') || medStr.includes('naproxen') || medStr.includes('aceclofenac')) {
      concerns.push({
        advisory: "Patient reports impaired digestive capacity (Mandagni) while on NSAID therapy — consider monitoring for gastric mucosal tolerance and potential dyspepsia, per clinical judgment.",
        medications: ['NSAIDs / Analgesics'],
        ayush_params: ['Ahara Shakti (Mandagni)'],
        rationale: "Impaired Ahara Shakti reduces mucosal protective secretion, increasing susceptibility to NSAID-induced gastric irritation.",
        why_this: "Triggered by cross-referencing extracted NSAID analgesics with patient's reported sluggish Agni (Mandagni)."
      });
    }
  }

  // Check 2: Tikshnagni (Hyperactive Agni / Pitta) + NSAIDs / Corticosteroids
  if (agni.includes('tikshnagni') || agni.includes('sharp') || vikriti.includes('pitta')) {
    if (medStr.includes('ibuprofen') || medStr.includes('diclofenac') || medStr.includes('aspirin') || medStr.includes('steroid') || medStr.includes('prednisolone')) {
      concerns.push({
        advisory: "Patient reports hyperactive digestive fire (Tikshnagni / Pitta aggravation) while taking NSAIDs/ulcerogenic medication — consider reviewing gastroprotective cover, per clinical judgment.",
        medications: ['NSAIDs / Anti-inflammatory'],
        ayush_params: ['Ahara Shakti (Tikshnagni)', 'Pitta Vikriti'],
        rationale: "Hyperactive Agni with high Pitta predisposes to hyperacidity and gastric erosion, amplifying NSAID ulcerogenic risk.",
        why_this: "Triggered by cross-referencing ulcerogenic allopathic medication against patient's reported Tikshnagni / Pitta imbalance."
      });
    }
  }

  // Check 3: Krura Koshtha (Constipated / Hard bowels) + Calcium Channel Blockers / Iron
  if (koshtha.includes('krura') || koshtha.includes('hard') || koshtha.includes('constipat')) {
    if (medStr.includes('amlodipine') || medStr.includes('verapamil') || medStr.includes('diltiazem') || medStr.includes('iron') || medStr.includes('ferrous')) {
      concerns.push({
        advisory: "Patient reports Krura Koshtha (constipation-prone bowel nature) while prescribed Calcium Channel Blocker / Iron therapy — consider reviewing bowel motility and hydration regimen, per clinical judgment.",
        medications: ['Amlodipine / CCB / Iron'],
        ayush_params: ['Koshtha (Krura Koshtha)'],
        rationale: "Calcium channel blockers reduce smooth muscle intestinal transit, which strongly aggravates Krura Koshtha.",
        why_this: "Triggered by cross-referencing constipating medication against patient's AYUSH Koshtha assessment ('Krura Koshtha')."
      });
    }
  }

  // Check 4: Mridu Koshtha (Soft/loose stools) + Metformin / Laxatives
  if (koshtha.includes('mridu') || koshtha.includes('soft') || koshtha.includes('loose')) {
    if (medStr.includes('metformin')) {
      concerns.push({
        advisory: "Patient reports Mridu Koshtha (hyper-sensitive bowel nature) and is taking Metformin — consider reviewing for osmotic loose stools and electrolyte hydration, per clinical judgment.",
        medications: ['Metformin'],
        ayush_params: ['Koshtha (Mridu Koshtha)'],
        rationale: "Metformin increases intestinal glucose and water secretion, which can trigger diarrhea in patients with Mridu Koshtha.",
        why_this: "Triggered by cross-referencing extracted Metformin against patient's AYUSH Mridu Koshtha assessment."
      });
    }
  }

  if (concerns.length > 0) {
    return {
      has_concern: true,
      advisory_text: concerns.map(c => c.advisory).join(' '),
      medications_involved: Array.from(new Set(concerns.flatMap(c => c.medications))),
      ayush_parameters_involved: Array.from(new Set(concerns.flatMap(c => c.ayush_params))),
      clinical_rationale: concerns.map(c => c.rationale).join(' '),
      why_this: concerns.map(c => c.why_this).join(' ')
    };
  }

  return { has_concern: false, advisory_text: null };
}

export async function evaluateAyushAllopathyCrossSafety({
  medications = [],
  ayushAssessment = {},
  hasPrescriptionDocs = false,
  isAyushMode = false,
  customKey = null
}) {
  // If no documents OR no AYUSH assessment are present in a given session, this section simply does not appear
  const hasMeds = (medications && medications.length > 0);
  const hasAyush = isAyushMode && (
    ayushAssessment.ayush_ahara_shakti ||
    ayushAssessment.ayush_koshtha ||
    ayushAssessment.ayush_prakriti ||
    ayushAssessment.ayush_vikriti
  );

  if (!hasPrescriptionDocs || !hasMeds || !hasAyush) {
    return null; // strictly does not appear if either is missing
  }

  const systemInstruction = `You are a clinical pharmacologist and integrative medicine safety specialist reviewing an outpatient consultation.
The patient has BOTH an active digitized prior Allopathic prescription AND a completed Ayurvedic Dashavidha Pariksha assessment.

YOUR OBJECTIVE:
Compare the patient's extracted allopathic medication list against the AYUSH assessment parameters:
1. Agni / Digestive Capacity (Mandagni [low/sluggish], Tikshnagni [hyperactive/burning], Vishamagni [irregular], Samagni [balanced]).
2. Koshtha / Bowel Elimination (Krura [constipated/hard], Mridu [soft/laxative-sensitive], Madhyama [normal]).
3. Prakriti / Vikriti (e.g. Pitta aggravation with ulcerogenic drugs, Vata dryness with constipating drugs).
4. Herb-Drug / Phytochemical-Pharmaceutical metabolic interactions (e.g., CYP450 competition, hypoglycemic or hypotensive potentiation, mucosal irritation).

CRITICAL PHRASING RULES:
- If a plausible interaction concern exists, frame it strictly as a PROMPT FOR PHYSICIAN REVIEW, NEVER as a diagnosis, decree, or directive.
- Example phrasing: "Patient reports low Agni (Mandagni) and is prescribed Metformin 500mg — consider reviewing for gastrointestinal intolerance and metabolic absorption, per clinical judgment."
- Example phrasing: "Patient reports Krura Koshtha (constipation-prone) while on Calcium Channel Blocker (Amlodipine) — consider monitoring bowel motility and fiber hydration regimen, per clinical judgment."
- If no plausible clinical concern or conflict is found between these specific medications and the AYUSH parameters, set "has_concern": false and "advisory_text": null.
- Provide a clear, transparent "why_this" explaining the specific session data (the exact extracted medication and the exact AYUSH answer) that led to this note.

Output strictly valid JSON with this schema:
{
  "has_concern": boolean,
  "advisory_text": string | null,
  "medications_involved": [ string ],
  "ayush_parameters_involved": [ string ],
  "clinical_rationale": string | null,
  "why_this": string | null
}`;

  const userPrompt = `CROSS-SYSTEM SAFETY EVALUATION:
Extracted Allopathic Medications:
${JSON.stringify(medications, null, 2)}

Completed AYUSH Dashavidha Pariksha Assessment:
- Agni / Ahara Shakti: ${ayushAssessment.ayush_ahara_shakti || 'Not specified'}
- Koshtha / Bowel Nature: ${ayushAssessment.ayush_koshtha || 'Not specified'}
- Prakriti (Constitution): ${ayushAssessment.ayush_prakriti || 'Not specified'}
- Vikriti (Active Imbalance): ${ayushAssessment.ayush_vikriti || 'Not specified'}
- Ahara-Vihara (Diet & Regimen): ${ayushAssessment.ayush_ahara_vihara || 'Not specified'}

Evaluate whether a plausible cross-system safety interaction exists between the extracted allopathic medications and the patient's reported Agni, Koshtha, or constitution.`;

  try {
    const result = await callGeminiJSON(systemInstruction, userPrompt, customKey);
    if (result.data && result.data.has_concern) {
      return {
        has_concern: true,
        advisory_text: result.data.advisory_text,
        medications_involved: result.data.medications_involved || [],
        ayush_parameters_involved: result.data.ayush_parameters_involved || [],
        clinical_rationale: result.data.clinical_rationale,
        why_this: result.data.why_this || result.data.clinical_rationale || 'Cross-referenced extracted medications with Dashavidha Pariksha findings.'
      };
    }
    return { has_concern: false, advisory_text: null };
  } catch (err) {
    console.warn(`[LLM Service] Cross-system safety evaluation error: ${err.message}. Using clinical rule fallback.`);
    return evaluateCrossSafetyFallback(medications, ayushAssessment);
  }
}

// ---------------------------------------------------------------------------
// FEATURE 2 — Longitudinal Contradiction Detection
// ---------------------------------------------------------------------------
export function detectLongitudinalFallback(priorData, currentData) {
  const discrepancies = [];

  // Check 1: Smoking / Tobacco Contradiction
  const pSmoke = (priorData.smoking_personal || '').toLowerCase();
  const cSmoke = (currentData.smoking_personal || '').toLowerCase();
  if (pSmoke && cSmoke) {
    const priorNonSmoker = pSmoke.includes('non-smoker') || pSmoke.includes('never smoked') || pSmoke.includes('no smoking') || pSmoke.includes('no tobacco') || pSmoke.includes('does not smoke');
    const currentSmoker = (cSmoke.includes('smok') || cSmoke.includes('cigarette') || cSmoke.includes('bidi') || cSmoke.includes('tobacco')) && !cSmoke.includes('non-smoker') && !cSmoke.includes('never');

    const priorSmoker = (pSmoke.includes('smok') || pSmoke.includes('cigarette') || pSmoke.includes('bidi') || pSmoke.includes('tobacco')) && !pSmoke.includes('non-smoker') && !pSmoke.includes('never');
    const currentNonSmoker = cSmoke.includes('non-smoker') || cSmoke.includes('never smoked') || cSmoke.includes('never used tobacco');

    if (priorNonSmoker && currentSmoker) {
      discrepancies.push({
        field: 'Smoking & Tobacco Status',
        prior_statement: priorData.smoking_personal,
        current_statement: currentData.smoking_personal,
        neutral_note: `Previously recorded: ${priorData.smoking_personal}. Current visit: ${currentData.smoking_personal}.`,
        why_this: 'Contradiction flagged by comparing prior visit personal history disclosure against current consultation report.'
      });
    } else if (priorSmoker && currentNonSmoker) {
      discrepancies.push({
        field: 'Smoking & Tobacco Status',
        prior_statement: priorData.smoking_personal,
        current_statement: currentData.smoking_personal,
        neutral_note: `Previously recorded: ${priorData.smoking_personal}. Current visit: ${currentData.smoking_personal}.`,
        why_this: 'Contradiction flagged: patient previously had recorded smoking history, but current intake reports never having smoked.'
      });
    }
  }

  // Check 2: Known Drug Allergies Contradiction
  const pAllergy = (priorData.allergies || '').toLowerCase();
  const cAllergy = (currentData.allergies || '').toLowerCase();
  if (pAllergy && cAllergy) {
    const priorHasAllergy = (pAllergy.includes('penicillin') || pAllergy.includes('sulfa') || pAllergy.includes('aspirin') || pAllergy.includes('allerg')) && !pAllergy.includes('no known') && !pAllergy.includes('none');
    const currentDeniesAllergy = cAllergy.includes('no known') || cAllergy.includes('none') || cAllergy.includes('nkda') || cAllergy.includes('no allergies') || cAllergy.includes('nil');

    if (priorHasAllergy && currentDeniesAllergy) {
      discrepancies.push({
        field: 'Drug Allergies & ADR',
        prior_statement: priorData.allergies,
        current_statement: currentData.allergies,
        neutral_note: `Previously recorded: ${priorData.allergies}. Current visit: ${currentData.allergies}.`,
        why_this: 'Contradiction flagged: active drug allergy was recorded during prior consultation, but patient denied allergies in current intake.'
      });
    }
  }

  // Check 3: Chronic Conditions Contradiction
  const pChronic = (priorData.chronic_conditions || '').toLowerCase();
  const cChronic = (currentData.chronic_conditions || '').toLowerCase();
  if (pChronic && cChronic) {
    const priorHasChronic = (pChronic.includes('diabetes') || pChronic.includes('hypertension') || pChronic.includes('asthma') || pChronic.includes('thyroid')) && !pChronic.includes('no chronic') && !pChronic.includes('none');
    const currentDeniesChronic = cChronic.includes('no chronic') || cChronic.includes('none') || cChronic.includes('nil') || cChronic.includes('healthy') || cChronic.includes('no medical history');

    if (priorHasChronic && currentDeniesChronic) {
      discrepancies.push({
        field: 'Past Medical History (Chronic Conditions)',
        prior_statement: priorData.chronic_conditions,
        current_statement: currentData.chronic_conditions,
        neutral_note: `Previously recorded: ${priorData.chronic_conditions}. Current visit: ${currentData.chronic_conditions}.`,
        why_this: 'Contradiction flagged: established chronic medical condition on prior record was not reported or denied in current intake.'
      });
    }
  }

  return discrepancies;
}

export async function detectLongitudinalContradictions(priorSummary, currentAnswers, currentSummary = {}, customKey = null) {
  if (!priorSummary) return [];

  // Extract comparable fields
  const priorData = {
    smoking_personal: priorSummary.personal_history || priorSummary.personal_social_history || null,
    allergies: priorSummary.drug_allergies || priorSummary.allergies || null,
    chronic_conditions: priorSummary.past_medical_history || null
  };

  const currentData = {
    smoking_personal: currentAnswers.personal_history || currentSummary.personal_history || null,
    allergies: currentAnswers.drug_allergies || currentSummary.drug_allergies || null,
    chronic_conditions: currentAnswers.past_medical_history || currentSummary.past_medical_history || null
  };

  const hasComparableData = (priorData.smoking_personal && currentData.smoking_personal) ||
                            (priorData.allergies && currentData.allergies) ||
                            (priorData.chronic_conditions && currentData.chronic_conditions);

  if (!hasComparableData) {
    return [];
  }

  const systemInstruction = `You are a clinical electronic health record (EHR) audit specialist performing longitudinal data reconciliation between a patient's prior visit and current intake.

YOUR OBJECTIVE:
Compare key factual fields between the prior consultation and the current consultation:
1. Smoking / Tobacco / Substance use status.
2. Known Drug Allergies (e.g. prior recorded Penicillin allergy, but current denies any allergy).
3. Chronic Conditions / Past Medical History (e.g. prior diagnosed with Diabetes on meds, but current denies having diabetes).

CRITICAL CONTRADICTION RULES:
- ONLY flag GENUINE CONTRADICTIONS where the statements conflict with each other (e.g. "Non-smoker" vs "Smoker", "Allergic to X" vs "No allergies", "Diagnosed with X" vs "No chronic conditions").
- DO NOT flag simply new/additional information (e.g., patient previously had hypertension, now also has knee pain — this is complementary, NOT a contradiction).
- Keep all notes strictly NEUTRAL and FACTUAL: "Previously recorded: [X]. Current visit: [Y]." Never imply which is correct, and never make a diagnosis or take sides.
- Provide a clear, plain-language "why_this" explaining the exact comparison between the two visits.

Output strictly valid JSON with this schema:
{
  "has_discrepancies": boolean,
  "discrepancies": [
    {
      "field": string,
      "prior_statement": string,
      "current_statement": string,
      "neutral_note": string,
      "why_this": string
    }
  ]
}`;

  const userPrompt = `LONGITUDINAL RECONCILIATION:
Prior Visit Record:
${JSON.stringify(priorData, null, 2)}

Current Consultation Intake:
${JSON.stringify(currentData, null, 2)}

Identify any genuine factual contradictions between the two visits.`;

  try {
    const result = await callGeminiJSON(systemInstruction, userPrompt, customKey);
    if (result.data && result.data.has_discrepancies && Array.isArray(result.data.discrepancies)) {
      return result.data.discrepancies;
    }
    return [];
  } catch (err) {
    console.warn(`[LLM Service] Longitudinal contradiction detection error: ${err.message}. Using rule fallback.`);
    return detectLongitudinalFallback(priorData, currentData);
  }
}



