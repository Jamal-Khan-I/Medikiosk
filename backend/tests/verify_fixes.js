import { processDocumentOCR } from '../services/documentService.js';
import { getAdaptiveQuestions, generateStructuredSummary } from '../services/intakeService.js';
import { OPTION_TRANSLATIONS, getLocalizedOption } from '../../frontend/src/services/optionTranslations.js';

async function runTests() {
  console.log('--- STARTING VERIFICATION TESTS ---');

  // Test 1: documentService strict extraction
  console.log('\n[Test 1] Testing Document OCR & Extraction Strictness...');
  const sampleLabText = `
    CITY CARE PATHOLOGY LABORATORY
    Patient: Rajesh Kumar, Age: 45
    Date: 2026-09-02
    Blood Glucose Fasting: 118 mg/dL
    Serum Creatinine: 1.1 mg/dL
    Hemoglobin (Hb): 14.2 g/dL
  `;

  const labResult = await processDocumentOCR({ file_name: 'test_lab.txt' }, sampleLabText, null);
  console.log('Detected Facility:', labResult.issuing_facility);
  if (labResult.issuing_facility === 'Apex Diagnostics & Clinical Records') {
    throw new Error('FAILED: Hardcoded fake facility default was used!');
  }
  console.log('Extracted entities count:', labResult.entities.length);
  const medsInLab = labResult.entities.filter(e => e.category === 'MEDICATION');
  if (medsInLab.length > 0) {
    throw new Error(`FAILED: False positive medications extracted from lab report: ${JSON.stringify(medsInLab)}`);
  }
  console.log('✔ No false-positive medications extracted from lab text.');

  // Test 1b: Real prescription text
  const rxText = `
    APOLLO HOSPITALS OPD
    Dr. Sharma, MD
    Rx:
    1. Tab Metformin 500mg 1-0-1 after meals
    2. Cap Omeprazole 20mg 1-0-0 before breakfast
    3. Tab Telmisartan 40mg OD
  `;
  const rxResult = await processDocumentOCR({ file_name: 'test_rx.txt' }, rxText, null);
  const rxMeds = rxResult.entities.filter(e => e.category === 'MEDICATION');
  console.log('Extracted medications:', rxMeds.map(m => `${m.entity_name} - ${m.entity_value}`));
  if (rxMeds.length < 3) {
    throw new Error(`FAILED: Expected at least 3 medications, got ${rxMeds.length}`);
  }
  console.log('✔ Real prescription medications correctly identified.');

  // Test 2: intakeService multilingual prompts
  console.log('\n[Test 2] Testing Multilingual Prompts (te, bn, mr, gu, kn)...');
  const questions = getAdaptiveQuestions('Chest pain', 'AYUSH_DASHAVIDHA');
  const supportedLangs = ['hi', 'ta', 'te', 'bn', 'mr', 'gu', 'kn'];
  
  for (const q of questions) {
    for (const lang of supportedLangs) {
      if (!q.prompt[lang] || q.prompt[lang].trim().length === 0) {
        throw new Error(`FAILED: Question ${q.code || q.stepId} missing translation for language '${lang}'`);
      }
    }
  }
  console.log(`✔ All ${questions.length} questions have native prompts for all 8 languages.`);

  // Test 3: intakeService strict summary (no demo defaults)
  console.log('\n[Test 3] Testing Strict EHR Summary (No Demo Defaults)...');
  const emptyAnswers = {
    chief_complaint: 'Chest Discomfort / Pressure',
    socrates_site: 'Center of Chest (Retrosternal)',
    socrates_onset: 'Started suddenly < 3 hours ago',
    socrates_severity: 7
  };
  const patient = { full_name: 'Anita Roy', age: 34, gender: 'FEMALE' };
  const summary = generateStructuredSummary(patient, emptyAnswers, [], 'STANDARD_SOCRATES');

  if (summary.past_medical_history === 'Recorded during clinical evaluation') {
    throw new Error('FAILED: Found canned demo string in past_medical_history');
  }
  if (summary.current_medications === 'Extracted from prior digitized records') {
    throw new Error('FAILED: Found canned demo string in current_medications');
  }
  if (summary.ayush_prakriti === 'Pitta-Vataja') {
    throw new Error('FAILED: Found canned demo string in ayush_prakriti when not provided');
  }
  console.log('Past medical history when empty:', summary.past_medical_history);
  console.log('Current medications when empty:', summary.current_medications);
  console.log('✔ Strict summary verified: no demo canned data injected.');

  // Test 4: Option Translations
  console.log('\n[Test 4] Testing Option Translations...');
  const testOption = 'Center of Chest (Retrosternal)';
  for (const lang of supportedLangs) {
    const localized = getLocalizedOption(testOption, lang);
    if (localized === testOption) {
      throw new Error(`FAILED: Option '${testOption}' not translated for '${lang}'`);
    }
    console.log(`[${lang}] ${testOption} -> ${localized}`);
  }
  console.log('✔ Option translations verified across all languages.');

  console.log('\n--- ALL VERIFICATION TESTS PASSED SUCCESSFULLY! ---');
}

runTests().catch(err => {
  console.error('\n❌ TEST RUN ERROR:', err);
  process.exit(1);
});
