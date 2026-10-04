// Test verification for Physician Treatment Plan, Prescriptions, and FHIR generation
import { store } from '../db/store.js';
import { buildFHIRBundle } from '../services/fhirService.js';
import { validateFhirBundle } from '../services/abdmService.js';

console.log('--- STARTING TREATMENT PLAN & PRESCRIPTIONS TEST ---');

// 1. Setup sample patient and summary
const patient = {
  id: 'pat_treat_01',
  full_name: 'Anita Deshmukh',
  gender: 'FEMALE',
  dob: '1979-04-12',
  phone_number: '+91 98223 34455',
  abha_number: '91-3829-1928-4421'
};

const summary = {
  encounter_id: 'enc_treat_01',
  chief_complaint: 'Generalized weakness and mild dizziness',
  history_of_present_illness: 'Patient reports weakness for 10 days, more prominent in the afternoon.',
  past_medical_history: 'None reported',
  current_medications: 'None',
  // Physician Added Treatment Plan & Prescriptions
  clinical_notes: 'BP 118/76 mmHg. Mild pallor on conjunctiva. Advised complete blood count and iron supplementation.',
  prescriptions: [
    {
      id: 'rx_01',
      name: 'Ferrous Ascorbate 100mg',
      dosage: '1 tablet',
      frequency: '1-0-1',
      duration: '30 days',
      instructions: 'After food'
    },
    {
      id: 'rx_02',
      name: 'Vitamin D3 60K',
      dosage: '1 sachet',
      frequency: 'Once a week',
      duration: '8 weeks',
      instructions: 'With milk'
    }
  ],
  investigations_ordered: 'Complete Blood Count (CBC), Serum Ferritin, Vitamin D levels',
  dietary_lifestyle_advice: 'Green leafy vegetables, jaggery, beetroot in diet',
  follow_up_instructions: 'Review in OPD after 4 weeks with CBC report'
};

const physician = {
  id: 'doc_101',
  name: 'Dr. Ajmal Khan, MD',
  nmc_registration_number: 'NMC-2024-88419'
};

// 2. Build Bundle
const bundle = buildFHIRBundle(patient, summary, [], physician);

// 3. Verify Bundle passes ABDM validation
validateFhirBundle(bundle);
console.log('✔ ABDM FHIR R4 Bundle validated successfully!');

// 4. Verify MedicationStatement resources contain the new prescriptions
const medStatements = bundle.entry.filter(e => e.resource?.resourceType === 'MedicationStatement');
console.log(`✔ Found ${medStatements.length} MedicationStatement resources in bundle:`);
medStatements.forEach(m => {
  console.log(`   - ${m.resource.medicationCodeableConcept?.text} | Dosage: ${m.resource.dosage?.[0]?.text}`);
});

const hasIron = medStatements.some(m => m.resource.medicationCodeableConcept?.text?.includes('Ferrous Ascorbate'));
const hasVitD = medStatements.some(m => m.resource.medicationCodeableConcept?.text?.includes('Vitamin D3'));

if (!hasIron || !hasVitD) {
  throw new Error('FAILED: Prescriptions missing from MedicationStatement resources in FHIR bundle!');
}
console.log('✔ Prescriptions successfully incorporated into FHIR MedicationStatements!');

// 5. Verify Composition contains the Care Plan section
const composition = bundle.entry[0]?.resource;
const carePlanSection = composition.section?.find(s => s.title?.includes('Care Plan'));
if (!carePlanSection) {
  throw new Error('FAILED: Care Plan section missing from FHIR Composition!');
}
console.log('✔ Care Plan & Physician Orders section present in Composition:');
console.log(`   Title: ${carePlanSection.title}`);
console.log(`   LOINC: ${carePlanSection.code?.coding?.[0]?.code} (${carePlanSection.code?.coding?.[0]?.display})`);

console.log('\n--- ALL TREATMENT PLAN & PRESCRIPTION TESTS PASSED! ---');
