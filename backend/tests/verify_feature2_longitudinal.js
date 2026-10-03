// Verification test for Feature 2: Longitudinal Contradiction Detection
import { detectLongitudinalContradictions, detectLongitudinalFallback } from '../services/llmService.js';
import { generateStructuredSummary } from '../services/intakeService.js';
import { store } from '../db/store.js';

async function runFeature2Verification() {
  console.log('================================================================');
  console.log('VERIFYING FEATURE 2: Longitudinal Contradiction Detection');
  console.log('================================================================\n');

  // Step 1: Set up real patient with ABHA ID
  const testAbha = 'ABHA-9988-7766-5544';
  let patient = store.get('patients').find(p => p.abha_number === testAbha);
  if (!patient) {
    patient = store.insert('patients', {
      full_name: 'Rameshwar Sharma',
      gender: 'Male',
      dob: '1975-06-15',
      age: 51,
      phone_number: '9845123456',
      abha_number: testAbha,
      abha_address: 'rameshwar.sharma@abdm',
      preferred_language: 'en'
    });
  }
  console.log(`[Test Setup] Patient registered: ${patient.full_name} (${patient.abha_number}) - ID: ${patient.id}`);

  // Step 2: Session 1 (Visit 1)
  console.log('\n--- SESSION 1 (VISIT 1): Patient states Non-Smoker, Penicillin Allergy, Diabetes ---');
  const session1Answers = {
    chief_complaint: 'Mild seasonal fever and dry cough',
    socrates_site: 'Throat',
    socrates_onset: '2 days ago',
    socrates_severity: '4',
    personal_history: 'Non-smoker, never used tobacco, vegetarian diet',
    drug_allergies: 'Penicillin allergy (causes severe urticaria and rash)',
    past_medical_history: 'Type 2 Diabetes Mellitus diagnosed 5 years ago'
  };

  const encounter1 = store.insert('encounters', {
    patient_id: patient.id,
    token_number: 'TK-801',
    kiosk_id: 'kiosk_01',
    department: 'OPD General Medicine',
    intake_mode: 'STANDARD_SOCRATES',
    status: 'REVIEWED_CONFIRMED',
    is_red_flagged: false,
    session_start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    session_end: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 10 * 60 * 1000).toISOString()
  });

  const summary1Data = generateStructuredSummary(patient, session1Answers, [], 'STANDARD_SOCRATES');
  const summary1 = store.insert('clinical_summaries', {
    encounter_id: encounter1.id,
    patient_id: patient.id,
    ...summary1Data
  });

  console.log(`Visit 1 Recorded: Token ${encounter1.token_number} | Enc ID: ${encounter1.id}`);
  console.log(`  Visit 1 Smoking Record: "${summary1.personal_history}"`);
  console.log(`  Visit 1 Allergy Record: "${summary1.drug_allergies}"`);
  console.log(`  Visit 1 Medical History: "${summary1.past_medical_history}"`);

  // Step 3: Session 2 (Visit 2 - Returning patient with same ABHA ID stating CONTRADICTING facts)
  console.log('\n--- SESSION 2 (VISIT 2): Same patient returns, states CONTRADICTING facts ---');
  const session2Answers = {
    chief_complaint: 'Persistent productive cough and shortness of breath',
    socrates_site: 'Chest',
    socrates_onset: '1 week ago',
    socrates_severity: '6',
    personal_history: 'Smokes 10 cigarettes daily for past 6 years', // CONTRADICTION with "Non-smoker, never used tobacco"
    drug_allergies: 'No known drug allergies (NKDA), never had any reaction', // CONTRADICTION with "Penicillin allergy"
    past_medical_history: 'Healthy, no chronic medical conditions' // CONTRADICTION with "Type 2 Diabetes Mellitus"
  };

  const encounter2 = store.insert('encounters', {
    patient_id: patient.id,
    token_number: 'TK-802',
    kiosk_id: 'kiosk_01',
    department: 'OPD General Medicine',
    intake_mode: 'STANDARD_SOCRATES',
    status: 'AWAITING_PHYSICIAN',
    is_red_flagged: false,
    session_start: new Date().toISOString(),
    session_end: new Date().toISOString()
  });

  const summary2Data = generateStructuredSummary(patient, session2Answers, [], 'STANDARD_SOCRATES');

  // Execute Longitudinal Contradiction Detection
  console.log('Running Longitudinal Contradiction Detection against prior Visit 1 (#TK-801)...');
  const detectedDiscrepancies = await detectLongitudinalContradictions(
    summary1,
    session2Answers,
    summary2Data
  );

  console.log(`\nDiscrepancies Detected Count: ${detectedDiscrepancies.length}`);
  console.dir(detectedDiscrepancies, { depth: null });

  // Verification Assertions
  if (detectedDiscrepancies.length === 0) {
    throw new Error('FAIL: Expected longitudinal contradictions, but none were detected!');
  }

  // 1. Check Smoking contradiction
  const smokingDisc = detectedDiscrepancies.find(d => 
    d.field.toLowerCase().includes('smok') || d.field.toLowerCase().includes('tobacco') || d.field.toLowerCase().includes('personal')
  );
  if (!smokingDisc) {
    throw new Error('FAIL: Smoking contradiction ("Non-smoker" vs "Smokes 10 cigarettes") was not flagged!');
  }
  console.log('\n[Verified] Smoking Contradiction:');
  console.log('  Field:', smokingDisc.field);
  console.log('  Prior Statement:', smokingDisc.prior_statement);
  console.log('  Current Statement:', smokingDisc.current_statement);
  console.log('  Neutral Note:', smokingDisc.neutral_note);
  console.log('  Why This:', smokingDisc.why_this);

  // Check language is neutral and factual
  if (smokingDisc.neutral_note.toLowerCase().includes('patient lied') || smokingDisc.neutral_note.toLowerCase().includes('incorrect')) {
    throw new Error('FAIL: Neutral note contains accusatory or judgmental language');
  }

  // 2. Check Allergy contradiction
  const allergyDisc = detectedDiscrepancies.find(d => 
    d.field.toLowerCase().includes('allerg')
  );
  if (!allergyDisc) {
    throw new Error('FAIL: Allergy contradiction ("Penicillin allergy" vs "No known drug allergies") was not flagged!');
  }
  console.log('\n[Verified] Allergy Contradiction:');
  console.log('  Prior Statement:', allergyDisc.prior_statement);
  console.log('  Current Statement:', allergyDisc.current_statement);
  console.log('  Neutral Note:', allergyDisc.neutral_note);

  // 3. Verify Visit 1 record is NOT overwritten
  const verifyPriorSummary = store.get('clinical_summaries').find(s => s.encounter_id === encounter1.id);
  if (!verifyPriorSummary || !verifyPriorSummary.personal_history.includes('Non-smoker')) {
    throw new Error('FAIL: Old Visit 1 record was silently overwritten!');
  }
  console.log('\n[Verified] Prior Record Integrity: Visit 1 summary remains untouched in hospital database:');
  console.log(`  Visit 1 stored personal_history: "${verifyPriorSummary.personal_history}"`);

  // Step 4: Test Complementary (Non-Contradictory) Visit 2 Scenario
  console.log('\n--- SCENARIO 3: Non-Contradictory Visit (Adds complementary info without conflict) ---');
  const complementaryAnswers = {
    chief_complaint: 'Routine follow-up',
    personal_history: 'Non-smoker, walks 30 minutes daily', // Not a contradiction, compatible with Non-smoker
    drug_allergies: 'Penicillin allergy', // Exact match
    past_medical_history: 'Type 2 Diabetes Mellitus on diet control and exercise' // Compatible
  };

  const compDiscrepancies = await detectLongitudinalContradictions(
    summary1,
    complementaryAnswers,
    {}
  );
  console.log(`Complementary visit discrepancies count: ${compDiscrepancies.length}`);
  if (compDiscrepancies.length > 0) {
    throw new Error(`FAIL: False positive discrepancy flagged on non-contradictory visit: ${JSON.stringify(compDiscrepancies)}`);
  }
  console.log('=> Non-contradictory visit correctly generated ZERO discrepancies.');

  console.log('\n================================================================');
  console.log('SUCCESS: FEATURE 2 (Longitudinal Contradiction Detection) VERIFIED');
  console.log('================================================================');
}

runFeature2Verification().catch(err => {
  console.error('\nFEATURE 2 VERIFICATION FAILED:', err);
  process.exit(1);
});
