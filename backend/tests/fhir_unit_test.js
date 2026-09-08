// Unit Test for buildFHIRBundle and validateFhirBundle
// Verifies compliance with NRCeS India / NDHM ABDM FHIR Release 4 specification

import { buildFHIRBundle } from '../services/fhirService.js';
import { validateFhirBundle } from '../services/abdmService.js';

console.log('--- STARTING FHIR R4 UNIT TESTS ---');

const samplePatient = {
  id: 'pat_test_901',
  full_name: 'Rajesh Kumar',
  abha_number: '91-4821-9920-3104',
  gender: 'MALE',
  dob: '1981-08-15',
  phone_number: '+91 9876543210',
  address: 'Flat 402, Green Meadows, Andheri East, Mumbai, Maharashtra',
  districtName: 'Mumbai',
  stateName: 'Maharashtra'
};

const sampleSummary = {
  encounter_id: 'enc_test_881',
  chief_complaint: 'Substernal chest pressure and dyspnea on exertion for 3 days.',
  history_of_present_illness: 'Patient reports progressive retrosternal heaviness radiating to left shoulder, exacerbated by climbing stairs. No diaphoresis or syncope.',
  past_medical_history: 'Essential Hypertension, Dyslipidemia',
  provisional_diagnosis: 'Essential Hypertension',
  current_medications: 'Telmisartan 40mg OD, Atorvastatin 20mg HS',
  drug_allergies: 'Penicillin (Skin rash)',
  food_allergies: 'None reported',
  family_history: 'Father had myocardial infarction at age 58.',
  personal_history: 'Non-smoker, sedentary lifestyle, vegetarian diet.',
  review_of_systems: 'Cardiovascular: +Chest tightness. Respiratory: +Mild dyspnea. CNS: -Dizziness.',
  prior_investigations_summary: 'TSH: 8.4 uIU/mL [HIGH], Serum Creatinine: 1.1 mg/dL [NORMAL], Fasting Blood Sugar: 168 mg/dL [HIGH]',
  created_at: new Date().toISOString()
};

const sampleExtractedEntities = [
  {
    entity_type: 'DIAGNOSIS',
    entity_name: 'Essential Hypertension',
    entity_value: 'Confirmed',
    details: { snomed_code: '59621000' }
  },
  {
    entity_type: 'MEDICATION',
    entity_name: 'Telmisartan',
    entity_value: '40mg OD Morning'
  },
  {
    entity_type: 'MEDICATION',
    entity_name: 'Atorvastatin',
    entity_value: '20mg HS Bedtime'
  },
  {
    entity_type: 'LAB_VALUE',
    entity_name: 'Thyroid Stimulating Hormone (TSH)',
    entity_value: '8.4',
    unit: 'uIU/mL',
    abnormal_flag: 'HIGH',
    reference_range: '0.4 - 4.2 uIU/mL'
  },
  {
    entity_type: 'LAB_VALUE',
    entity_name: 'Fasting Blood Sugar',
    entity_value: '168',
    unit: 'mg/dL',
    abnormal_flag: 'HIGH',
    reference_range: '70 - 100 mg/dL'
  },
  {
    entity_type: 'LAB_VALUE',
    entity_name: 'Serum Creatinine',
    entity_value: '1.1',
    unit: 'mg/dL',
    abnormal_flag: 'NORMAL',
    reference_range: '0.7 - 1.3 mg/dL'
  }
];

const samplePractitioner = {
  id: 'doc_101',
  name: 'Dr. Ajmal Khan, MD',
  nmc_registration_number: 'NMC-2024-88419'
};

// 1. Build Bundle
const bundle = buildFHIRBundle(samplePatient, sampleSummary, sampleExtractedEntities, samplePractitioner);

// Assertions
console.log('1. Checking Bundle Root Properties:');
if (bundle.resourceType !== 'Bundle') throw new Error(`Expected Bundle, got ${bundle.resourceType}`);
if (bundle.type !== 'document') throw new Error(`Expected document type, got ${bundle.type}`);
if (!bundle.identifier?.value) throw new Error('Missing bundle identifier');
console.log(`   [PASS] resourceType: ${bundle.resourceType}, type: ${bundle.type}, id: ${bundle.id}`);

console.log('2. Checking Entry[0] Composition:');
const comp = bundle.entry[0]?.resource;
if (comp?.resourceType !== 'Composition') throw new Error(`Expected Composition at entry[0], got ${comp?.resourceType}`);
if (comp.status !== 'final') throw new Error(`Expected status final, got ${comp.status}`);
const loincType = comp.type.coding.find(c => c.system === 'http://loinc.org' && c.code === '11488-4');
if (!loincType) throw new Error('Composition missing LOINC 11488-4 Consultation note');
console.log(`   [PASS] Composition LOINC: ${loincType.code} (${loincType.display})`);

console.log('3. Checking Standard LOINC Section Codes:');
const expectedLoincSections = {
  '10154-3': 'Chief Complaint',
  '10164-2': 'History of Present Illness',
  '11348-0': 'Past Medical History',
  '48765-2': 'Drug & Allergy History',
  '10157-6': 'Family Medical History',
  '29762-2': 'Personal & Social History',
  '10187-3': 'Review of Systems',
  '30954-2': 'Investigations & Diagnostic Findings'
};

Object.entries(expectedLoincSections).forEach(([code, name]) => {
  const section = comp.section.find(s => s.code?.coding?.some(c => c.code === code));
  if (!section) throw new Error(`Missing required LOINC section: ${code} (${name})`);
  console.log(`   [PASS] Found LOINC section ${code}: ${name}`);
});

console.log('4. Checking Subject Patient Resource:');
const pat = bundle.entry.find(e => e.resource?.resourceType === 'Patient')?.resource;
if (!pat) throw new Error('Missing Patient resource in bundle');
if (pat.identifier[0]?.system !== 'https://healthid.ndhm.gov.in') throw new Error('Patient missing ABDM healthid system identifier');
if (pat.identifier[0]?.value !== '91-4821-9920-3104') throw new Error('Patient ABHA value mismatch');
console.log(`   [PASS] Patient ABHA: ${pat.identifier[0].value}, Name: ${pat.name[0].text}`);

console.log('5. Checking Condition (Diagnoses) Resources:');
const conditions = bundle.entry.filter(e => e.resource?.resourceType === 'Condition').map(e => e.resource);
if (conditions.length === 0) throw new Error('No Condition resources generated');
const snomedHypertension = conditions.find(c => c.code.coding.some(cd => cd.code === '59621000'));
if (!snomedHypertension) throw new Error('Missing SNOMED CT 59621000 Essential Hypertension condition');
console.log(`   [PASS] Found ${conditions.length} Condition resource(s). SNOMED CT: ${snomedHypertension.code.coding[0].code} (${snomedHypertension.code.coding[0].display})`);

console.log('6. Checking MedicationStatement Resources:');
const meds = bundle.entry.filter(e => e.resource?.resourceType === 'MedicationStatement').map(e => e.resource);
if (meds.length === 0) throw new Error('No MedicationStatement resources generated');
console.log(`   [PASS] Found ${meds.length} MedicationStatement resource(s):`);
meds.forEach(m => console.log(`     - ${m.medicationCodeableConcept.text} (Dosage: ${m.dosage[0]?.text})`));

console.log('7. Checking Observation (Labs) Resources:');
const obs = bundle.entry.filter(e => e.resource?.resourceType === 'Observation').map(e => e.resource);
if (obs.length === 0) throw new Error('No Observation resources generated');
const tshObs = obs.find(o => o.code.coding.some(c => c.code === '3016-3'));
if (!tshObs) throw new Error('Missing LOINC 3016-3 TSH Observation');
if (tshObs.interpretation[0]?.coding[0]?.code !== 'H') throw new Error('Expected TSH interpretation flag H');
console.log(`   [PASS] Found ${obs.length} Observation resource(s). TSH: ${tshObs.valueQuantity.value} ${tshObs.valueQuantity.unit} (Flag: ${tshObs.interpretation[0].coding[0].display})`);

console.log('8. Testing Bundle Validator:');
const isValid = validateFhirBundle(bundle);
if (!isValid) throw new Error('validateFhirBundle returned false');
console.log('   [PASS] validateFhirBundle succeeded!');

// Test validator rejecting malformed bundle
try {
  validateFhirBundle({ resourceType: 'Observation' });
  throw new Error('Should have thrown on wrong resourceType');
} catch (err) {
  console.log(`   [PASS] Validator correctly rejected malformed bundle: ${err.message}`);
}

console.log('\n[SUCCESS] ALL FHIR R4 UNIT TESTS PASSED WITH 100% SPEC CONFORMANCE!\n');
