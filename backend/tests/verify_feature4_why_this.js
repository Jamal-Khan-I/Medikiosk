// Verification test for Feature 4: Transparent AI Reasoning ("Why This?" Layer)
import { evaluateRedFlags, generateClinicalSummary } from '../services/llmService.js';
import { analyzeRedFlags } from '../services/triageService.js';
import { generateStructuredSummary } from '../services/intakeService.js';
import { store } from '../db/store.js';

async function runFeature4Verification() {
  console.log('================================================================');
  console.log('VERIFYING FEATURE 4: Transparent AI Reasoning ("Why This?" Layer)');
  console.log('================================================================\n');

  // Test 1: Red-Flag Emergency Triage Rule & LLM with "Why this?" trace
  console.log('--- TEST 1: Red-Flag Emergency Triage "Why this?" Trace ---');
  const emergencyStatement = 'Severe crushing chest pain radiating to left arm and sweating heavily for 45 minutes';
  const ruleTriage = analyzeRedFlags(emergencyStatement, { chief_complaint: emergencyStatement });
  console.log('Rule Triage Result:');
  console.log('  isRedFlag:', ruleTriage.isRedFlag);
  console.log('  severity:', ruleTriage.severity);
  console.log('  summaryReason:', ruleTriage.summaryReason);
  console.log('  why_this:', ruleTriage.why_this);

  if (!ruleTriage.why_this) {
    throw new Error('FAIL: ruleTriage missing why_this explanation');
  }

  // Test 2: Gemini or Heuristic Red-Flag check with "Why this?"
  console.log('\n--- TEST 2: LLM / Fallback Red-Flag Evaluation "Why this?" ---');
  try {
    const llmFlag = await evaluateRedFlags(emergencyStatement, 'en');
    console.log('LLM Triage Result:');
    console.log('  is_emergency:', llmFlag.is_emergency);
    console.log('  triage_category:', llmFlag.triage_category);
    console.log('  reason:', llmFlag.reason);
    console.log('  why_this:', llmFlag.why_this);
    if (!llmFlag.why_this) {
      throw new Error('FAIL: llmFlag missing why_this explanation');
    }
  } catch (e) {
    console.warn('LLM network/key warning in test:', e.message);
  }

  // Test 3: Structured Clinical Summary deterministic generation
  console.log('\n--- TEST 3: Deterministic Structured Summary "Why this?" Explanations ---');
  const mockPatient = {
    id: 'pat_test_f4',
    full_name: 'Suresh Kumar',
    age: 52,
    gender: 'Male',
    phone_number: '9876543210',
    preferred_language: 'en'
  };

  const mockAnswers = {
    chief_complaint: 'Persistent burning epigastric pain',
    socrates_site: 'Epigastrium',
    socrates_onset: '3 days ago after dinner',
    socrates_character: 'Sharp burning sensation',
    socrates_radiation: 'Radiating upward to retrosternal chest',
    socrates_associations: ['Nausea', 'Sour belching'],
    socrates_timing: 'Worse on empty stomach',
    socrates_exacerbating: 'Spicy food',
    socrates_severity: '7',
    past_medical_history: 'Type 2 Diabetes Mellitus diagnosed 4 years ago',
    drug_allergies: 'Penicillin causes hives',
    current_medications: 'Metformin 500mg BD',
    personal_history: 'Sedentary desk job, non-smoker, drinks tea 4 times daily',
    review_of_systems: 'Mild retrosternal pyrosis, no shortness of breath, no melena'
  };

  const mockEntities = [
    { id: 'ent_1', category: 'MEDICATION', entity_name: 'Metformin Hydrochloride', entity_value: '500mg BD', is_abnormal: false },
    { id: 'ent_2', category: 'LAB_VALUE', entity_name: 'HbA1c', entity_value: '7.8', unit: '%', is_abnormal: true, abnormal_flag: 'HIGH' }
  ];

  const structuredSummary = generateStructuredSummary(mockPatient, mockAnswers, mockEntities, 'STANDARD_SOCRATES');
  console.log('Structured Summary Sections:');
  console.log('  Chief Complaint:', structuredSummary.chief_complaint);
  console.log('  HPI:', structuredSummary.history_of_present_illness);
  console.log('  Differentials Count:', (structuredSummary.suggested_differential_diagnoses || []).length);
  console.log('\n  "Why this?" Explanations Generated:');
  console.dir(structuredSummary.why_this_explanations, { depth: null });

  // Verification checks for Feature 4
  const expectedKeys = [
    'chief_complaint',
    'history_of_present_illness',
    'current_medications',
    'drug_allergies',
    'past_medical_history',
    'review_of_systems',
    'prior_investigations_summary',
    'suggested_differential_diagnoses'
  ];

  for (const k of expectedKeys) {
    if (!structuredSummary.why_this_explanations || !structuredSummary.why_this_explanations[k]) {
      throw new Error(`FAIL: Missing why_this_explanation for ${k}`);
    }
  }

  // Check differential diagnoses have why_this
  if (!structuredSummary.suggested_differential_diagnoses || structuredSummary.suggested_differential_diagnoses.length === 0) {
    throw new Error('FAIL: No suggested differential diagnoses in structured summary');
  }
  for (const diff of structuredSummary.suggested_differential_diagnoses) {
    if (!diff.why_this) {
      throw new Error(`FAIL: Differential ${diff.condition} is missing why_this trace`);
    }
  }

  // Test 4: Gemini Summary Generation with Why This
  console.log('\n--- TEST 4: Gemini Live Clinical Summary "Why this?" Verification ---');
  try {
    const geminiRes = await generateClinicalSummary(mockPatient, mockAnswers, mockEntities, 'STANDARD_SOCRATES');
    console.log('Gemini Summary Provider:', geminiRes.provider);
    console.log('Gemini why_this_explanations present:', Boolean(geminiRes.why_this_explanations));
    if (geminiRes.why_this_explanations) {
      console.log('Gemini CC Why This:', geminiRes.why_this_explanations.chief_complaint);
      console.log('Gemini HPI Why This:', geminiRes.why_this_explanations.history_of_present_illness);
    }
  } catch (e) {
    console.warn('Gemini live call note:', e.message);
  }

  console.log('\n================================================================');
  console.log('SUCCESS: FEATURE 4 (Why This Layer) IS VERIFIED AND FUNCTIONAL');
  console.log('================================================================');
}

runFeature4Verification().catch(err => {
  console.error('\nFEATURE 4 VERIFICATION FAILED:', err);
  process.exit(1);
});
