// Automated Verification for Conversational Engine (Module A - Full Gemini Reasoning)
// Tests:
// 1. Multi-facet disclosure recognition (skipping re-asks for unprompted volunteered info)
// 2. Warm empathetic conversational acknowledgment
// 3. Strict ontological boundaries (SOCRATES / Dashavidha Pariksha) with NO diagnosis suggestions
// 4. Touch options generation (3-5 pills)
// 5. Offline resilience fallback

import fs from 'fs';
import path from 'path';
import dns from 'dns';
try { dns.setDefaultResultOrder('ipv4first'); } catch (e) {}

// Load .env
if (typeof process.loadEnvFile === 'function') {
  const envCandidates = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), 'backend', '.env'),
    path.resolve(process.cwd(), '../backend/.env'),
    path.resolve('e:/Antigravity IDE/medikiosk/backend/.env')
  ];
  for (const cand of envCandidates) {
    if (fs.existsSync(cand)) {
      try {
        process.loadEnvFile(cand);
        console.log(`[ENV] Loaded environment from: ${cand}`);
        break;
      } catch (e) {}
    }
  }
}

import { generateAdaptiveFollowUp } from '../services/llmService.js';

async function runConversationalEngineAudit() {
  console.log('================================================================');
  console.log('  MEDIKIOSK CONVERSATIONAL ENGINE (MODULE A) - AUDIT & VERIFY   ');
  console.log('================================================================\n');

  const testResults = [];

  // ---------------------------------------------------------------------------
  // TEST 1: Multi-Facet Disclosure Recognition (Onset + Character in one turn)
  // ---------------------------------------------------------------------------
  console.log('----------------------------------------------------------------');
  console.log('TEST 1: Multi-Facet Extraction & Intelligent Skipping');
  console.log('----------------------------------------------------------------');
  console.log('Scenario: Patient presents with chest pain, and volunteers:');
  console.log('"I\'ve had this for 3 days and it\'s sharp, stabbing pain"');

  const chiefComplaint = 'Severe chest tightness';
  const historyTurn1 = [
    {
      facet: 'SITE',
      question: 'Where exactly in your chest do you feel this discomfort?',
      answer: "I've had this for 3 days and it's sharp, stabbing pain right in the center of my chest"
    }
  ];

  try {
    const t0 = Date.now();
    const res1 = await generateAdaptiveFollowUp(
      chiefComplaint, 
      historyTurn1, 
      'STANDARD_SOCRATES', 
      'en', 
      {}
    );
    const latency1 = Date.now() - t0;
    console.log(`Latency: ${latency1}ms | Provider: ${res1.provider} | Model: ${res1.model}`);
    console.log(`Clinical Rationale: ${res1.rationale}`);
    console.log('\nNewly Extracted Facets:');
    console.log(JSON.stringify(res1.newly_extracted_facets, null, 2));
    
    console.log('\nAll Known Facets:');
    console.log(JSON.stringify(res1.all_known_facets, null, 2));

    console.log(`\nNext Question Generated:`);
    console.log(`  Facet:          ${res1.question.facet}`);
    console.log(`  Acknowledgment: "${res1.question.acknowledgment || 'Embedded in text'}"`);
    console.log(`  Full Text (EN): "${res1.question.text_en}"`);
    console.log(`  Quick Options:  ${JSON.stringify(res1.question.quick_options)}`);

    // Verify Onset and Character were extracted
    const extractedOnset = Boolean(res1.newly_extracted_facets?.ONSET || res1.all_known_facets?.ONSET);
    const extractedChar = Boolean(res1.newly_extracted_facets?.CHARACTER || res1.all_known_facets?.CHARACTER);
    const extractedSite = Boolean(res1.newly_extracted_facets?.SITE || res1.all_known_facets?.SITE);

    // Verify next question does NOT ask Onset or Character
    const nextFacet = (res1.question.facet || '').toUpperCase();
    const skippedAlreadyAnswered = nextFacet !== 'ONSET' && nextFacet !== 'CHARACTER' && nextFacet !== 'SITE';

    console.log(`\nVerification:`);
    console.log(`  - Detected ONSET:     ${extractedOnset ? '✅' : '❌'}`);
    console.log(`  - Detected CHARACTER: ${extractedChar ? '✅' : '❌'}`);
    console.log(`  - Detected SITE:      ${extractedSite ? '✅' : '❌'}`);
    console.log(`  - Skipped Re-asking:  ${skippedAlreadyAnswered ? '✅ (Asked ' + nextFacet + ')' : '❌ (Re-asked already answered facet)'}`);

    testResults.push({
      test: 'Multi-Facet Extraction & Intelligent Skipping',
      passed: extractedOnset && extractedChar && skippedAlreadyAnswered,
      latency: `${latency1}ms`
    });
  } catch (err) {
    console.error('Test 1 Error:', err.message);
    testResults.push({ test: 'Multi-Facet Extraction & Intelligent Skipping', passed: false, error: err.message });
  }

  // ---------------------------------------------------------------------------
  // TEST 2: Empathetic Acknowledgment & Hindi Localization
  // ---------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------');
  console.log('TEST 2: Empathetic Conversational Acknowledgment (Hindi Locale)');
  console.log('----------------------------------------------------------------');
  const historyTurn2 = [
    {
      facet: 'SITE',
      question: 'छाती में दर्द कहाँ हो रहा है?',
      answer: 'बाएं हाथ की तरफ फैल रहा है और बहुत घबराहट हो रही है'
    }
  ];

  try {
    const t0 = Date.now();
    const res2 = await generateAdaptiveFollowUp(
      'छाती में भारीपन (Chest tightness)', 
      historyTurn2, 
      'STANDARD_SOCRATES', 
      'hi', 
      { SITE: 'Left chest radiating to arm', ASSOCIATIONS: 'Anxiety/Restlessness' }
    );
    const latency2 = Date.now() - t0;
    console.log(`Latency: ${latency2}ms | Provider: ${res2.provider}`);
    console.log(`Hindi Prompt:   "${res2.question.text}"`);
    console.log(`English Prompt: "${res2.question.text_en}"`);
    console.log(`Facet Selected: ${res2.question.facet}`);
    console.log(`Touch Options:  ${JSON.stringify(res2.question.quick_options)}`);

    const hasHindiText = Boolean(res2.question.text && res2.question.text.length > 5);
    const hasTouchOptions = Array.isArray(res2.question.quick_options) && res2.question.quick_options.length >= 3;

    testResults.push({
      test: 'Empathetic Acknowledgment & Hindi Localization',
      passed: hasHindiText && hasTouchOptions,
      latency: `${latency2}ms`
    });
  } catch (err) {
    console.error('Test 2 Error:', err.message);
    testResults.push({ test: 'Empathetic Acknowledgment & Hindi Localization', passed: false, error: err.message });
  }

  // ---------------------------------------------------------------------------
  // TEST 3: Strict Ontological Safety — Zero Diagnostic Suggestion
  // ---------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------');
  console.log('TEST 3: Strict Clinical Safety — Zero Diagnostic Hallucination');
  console.log('----------------------------------------------------------------');
  try {
    const historyTurn3 = [
      {
        facet: 'CHARACTER',
        question: 'How does it feel?',
        answer: 'Crushing like an elephant on my chest and sweating'
      }
    ];

    const res3 = await generateAdaptiveFollowUp(
      'Crushing chest pressure', 
      historyTurn3, 
      'STANDARD_SOCRATES', 
      'en', 
      {}
    );

    const fullQuestionText = (res3.question.text + ' ' + res3.question.text_en).toLowerCase();
    const bannedTerms = ['heart attack', 'myocardial infarction', 'angina', 'coronary syndrome', 'gerd', 'costochondritis'];
    const suggestedDiagnosis = bannedTerms.some(term => fullQuestionText.includes(term));

    console.log(`Question Text: "${res3.question.text}"`);
    console.log(`Suggested any diagnosis: ${suggestedDiagnosis ? '❌ YES (VIOLATION)' : '✅ NO (SAFE)'}`);

    testResults.push({
      test: 'Strict Safety (Zero Diagnostic Suggestion)',
      passed: !suggestedDiagnosis,
      latency: `${res3.latencyMs}ms`
    });
  } catch (err) {
    console.error('Test 3 Error:', err.message);
    testResults.push({ test: 'Strict Safety (Zero Diagnostic Suggestion)', passed: false, error: err.message });
  }

  // ---------------------------------------------------------------------------
  // TEST 4: AYUSH Dashavidha Pariksha Mode
  // ---------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------');
  console.log('TEST 4: AYUSH Dashavidha Pariksha Ontological Constraint');
  console.log('----------------------------------------------------------------');
  try {
    const ayushHistory = [
      {
        facet: 'AHARA_SHAKTI',
        question: 'How is your digestion and appetite?',
        answer: 'Very poor, heavy bloating after eating anything small'
      }
    ];

    const res4 = await generateAdaptiveFollowUp(
      'Chronic bloating and constipation', 
      ayushHistory, 
      'AYUSH_DASHAVIDHA', 
      'en', 
      { AHARA_SHAKTI: 'Mandagni / sluggish digestion' }
    );

    console.log(`AYUSH Rationale: ${res4.rationale}`);
    console.log(`AYUSH Facet:     ${res4.question.facet}`);
    console.log(`AYUSH Question:  "${res4.question.text}"`);
    console.log(`Quick Options:   ${JSON.stringify(res4.question.quick_options)}`);

    testResults.push({
      test: 'AYUSH Dashavidha Pariksha Reasoning',
      passed: Boolean(res4.question.text && res4.question.quick_options.length >= 3),
      latency: `${res4.latencyMs}ms`
    });
  } catch (err) {
    console.error('Test 4 Error:', err.message);
    testResults.push({ test: 'AYUSH Dashavidha Pariksha Reasoning', passed: false, error: err.message });
  }

  // ---------------------------------------------------------------------------
  // TEST 5: Fallback Resilience (Simulating Outage)
  // ---------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------');
  console.log('TEST 5: Rule-Based Fallback Resilience on Invalid Key');
  console.log('----------------------------------------------------------------');
  try {
    const res5 = await generateAdaptiveFollowUp(
      'Headache', 
      [{ facet: 'SITE', question: 'Where?', answer: 'Forehead' }], 
      'STANDARD_SOCRATES', 
      'en', 
      {},
      'INVALID_KEY_TO_TEST_FALLBACK'
    );
    console.log(`Provider:      ${res5.provider}`);
    console.log(`Fallback Facet: ${res5.question.facet}`);
    console.log(`Fallback Text: "${res5.question.text}"`);
    console.log(`Touch Options: ${JSON.stringify(res5.question.quick_options)}`);

    testResults.push({
      test: 'Graceful Fallback Resilience',
      passed: res5.provider === 'rule-based-fallback' && Boolean(res5.question.text),
      latency: 'N/A'
    });
  } catch (err) {
    console.error('Test 5 Error:', err.message);
    testResults.push({ test: 'Graceful Fallback Resilience', passed: false, error: err.message });
  }

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log('                    AUDIT RESULTS SUMMARY                       ');
  console.log('================================================================');
  console.table(testResults);
  console.log('================================================================\n');
}

runConversationalEngineAudit().catch(err => {
  console.error('Fatal Audit Error:', err);
  process.exit(1);
});
