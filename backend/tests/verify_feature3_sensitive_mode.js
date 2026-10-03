// Verification Test Suite for Feature 3 — Dignity-Aware Sensitive Topic Mode
import assert from 'assert';
import { getAdaptiveQuestions, generateStructuredSummary, SENSITIVE_HISTORY_QUESTIONS, AYUSH_DASHAVIDHA_QUESTIONS } from '../services/intakeService.js';

console.log('================================================================');
console.log('TEST SUITE: Feature 3 — Dignity-Aware Sensitive Topic Mode');
console.log('================================================================\n');

async function runTests() {
  let passed = 0;
  let failed = 0;

  // --------------------------------------------------------------------------
  // TEST 1: Sensitive questions definition & metadata
  // --------------------------------------------------------------------------
  console.log('[TEST 1] Verifying SENSITIVE_HISTORY_QUESTIONS configuration...');
  try {
    assert(Array.isArray(SENSITIVE_HISTORY_QUESTIONS), 'SENSITIVE_HISTORY_QUESTIONS must be an array');
    assert(SENSITIVE_HISTORY_QUESTIONS.length >= 3, 'Must have at least 3 sensitive screening domains');

    const expectedCategories = ['Substance Use', 'Mental Health', 'Reproductive Health'];
    for (const cat of expectedCategories) {
      const q = SENSITIVE_HISTORY_QUESTIONS.find(item => item.sensitiveCategory === cat);
      assert(q, `Must include question for category: ${cat}`);
      assert.strictEqual(q.isSensitive, true, `Question ${q.stepId} must have isSensitive: true`);
      assert(Array.isArray(q.quickOptions) && q.quickOptions.length >= 3, `Question ${q.stepId} must have quickOptions for touch-first input`);
      assert(q.prompt && q.prompt.en && q.prompt.hi, `Question ${q.stepId} must have multilingual prompts`);
    }

    console.log('  ✓ All sensitive history questions have isSensitive: true and touch-first options.');
    passed++;
  } catch (err) {
    console.error('  ✗ TEST 1 Failed:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // TEST 2: Standard SOCRATES & AYUSH questions must remain normal (NOT sensitive)
  // --------------------------------------------------------------------------
  console.log('\n[TEST 2] Verifying standard AYUSH Dashavidha questions remain normal...');
  try {
    assert(Array.isArray(AYUSH_DASHAVIDHA_QUESTIONS), 'AYUSH_DASHAVIDHA_QUESTIONS must be an array');
    assert(AYUSH_DASHAVIDHA_QUESTIONS.length >= 10, 'Must have full Dashavidha Pariksha questions');

    for (const ayushQ of AYUSH_DASHAVIDHA_QUESTIONS) {
      assert(
        !ayushQ.isSensitive, 
        `Standard AYUSH question ${ayushQ.stepId} (${ayushQ.category}) must NOT be marked isSensitive! It must remain normal.`
      );
    }

    console.log(`  ✓ All ${AYUSH_DASHAVIDHA_QUESTIONS.length} standard Dashavidha Pariksha questions are non-sensitive (normal mode preserved).`);
    passed++;
  } catch (err) {
    console.error('  ✗ TEST 2 Failed:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // TEST 3: Adaptive Question List contains normal + sensitive questions in order
  // --------------------------------------------------------------------------
  console.log('\n[TEST 3] Verifying getAdaptiveQuestions includes sensitive topics at appropriate stages...');
  try {
    // 3a. Standard Allopathic Socrates Mode
    const socratesQuestions = getAdaptiveQuestions('Chest pain with heaviness', 'STANDARD_SOCRATES');
    assert(socratesQuestions.length > 5, 'Must return full SOCRATES questions');
    
    const ccQ = socratesQuestions.find(q => q.stepId === 'chief_complaint');
    assert(ccQ && !ccQ.isSensitive, 'Chief complaint must be non-sensitive');

    const socratesSite = socratesQuestions.find(q => q.stepId === 'socrates_site');
    assert(socratesSite && !socratesSite.isSensitive, 'SOCRATES Site must be non-sensitive');

    const sensitiveSubstance = socratesQuestions.find(q => q.stepId === 'personal_history');
    assert(sensitiveSubstance && sensitiveSubstance.isSensitive === true, 'personal_history must be marked sensitive');

    const sensitiveMental = socratesQuestions.find(q => q.stepId === 'review_of_systems_mental');
    assert(sensitiveMental && sensitiveMental.isSensitive === true, 'Mental health must be marked sensitive');

    const sensitiveRepro = socratesQuestions.find(q => q.stepId === 'review_of_systems_reproductive');
    assert(sensitiveRepro && sensitiveRepro.isSensitive === true, 'Reproductive health must be marked sensitive');

    // 3b. AYUSH Mode
    const ayushQuestions = getAdaptiveQuestions('Stomach discomfort', 'AYUSH_DASHAVIDHA');
    const prakritiQ = ayushQuestions.find(q => q.stepId === 'ayush_prakriti');
    assert(prakritiQ && !prakritiQ.isSensitive, 'Prakriti must remain normal non-sensitive');

    const koshthaQ = ayushQuestions.find(q => q.stepId === 'ayush_koshtha');
    assert(koshthaQ && !koshthaQ.isSensitive, 'Koshtha must remain normal non-sensitive');

    const ayushSubstance = ayushQuestions.find(q => q.stepId === 'personal_history');
    assert(ayushSubstance && ayushSubstance.isSensitive === true, 'Sensitive substance screening must be present in AYUSH stream');

    console.log('  ✓ Adaptive questions in both streams properly segregate standard vs sensitive mode.');
    passed++;
  } catch (err) {
    console.error('  ✗ TEST 3 Failed:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // TEST 4: Kiosk Auto-Voice Mute Logic Simulation
  // --------------------------------------------------------------------------
  console.log('\n[TEST 4] Simulating Kiosk Voice Guide auto-play behavior...');
  try {
    const testQuestions = getAdaptiveQuestions('Chest tightness', 'STANDARD_SOCRATES');

    function simulateVoiceGuideAutoPlay(question) {
      if (question?.isSensitive) {
        return {
          autoPlayAllowed: false,
          reason: 'DIGNITY_MODE_AUTO_MUTED',
          mode: 'TOUCH_FIRST_DISCREET'
        };
      }
      return {
        autoPlayAllowed: true,
        reason: 'STANDARD_AUDIO_GUIDE',
        mode: 'NORMAL_KIOSK_AUDIO'
      };
    }

    // Normal question (e.g. Chief complaint)
    const normalResult = simulateVoiceGuideAutoPlay(testQuestions[0]);
    assert.strictEqual(normalResult.autoPlayAllowed, true, 'Normal question must auto-play voice');

    // Sensitive question (e.g. Substance use)
    const substanceQ = testQuestions.find(q => q.stepId === 'personal_history');
    const sensitiveResult = simulateVoiceGuideAutoPlay(substanceQ);
    assert.strictEqual(sensitiveResult.autoPlayAllowed, false, 'Sensitive question must strictly mute auto-play voice');
    assert.strictEqual(sensitiveResult.mode, 'TOUCH_FIRST_DISCREET', 'Must operate in touch-first discreet mode');

    console.log('  ✓ Normal questions auto-play; sensitive questions strictly suppress auto-audio and activate touch-first.');
    passed++;
  } catch (err) {
    console.error('  ✗ TEST 4 Failed:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // TEST 5: Structured EHR Summary synthesis with sensitive answers
  // --------------------------------------------------------------------------
  console.log('\n[TEST 5] Verifying structured summary synthesis from sensitive topic answers...');
  try {
    const mockPatient = {
      id: 'pat_sens_001',
      full_name: 'Ananya Sharma',
      gender: 'FEMALE',
      age: 29,
      phone_number: '9876543210'
    };

    const mockAnswers = {
      chief_complaint: 'Lower abdominal pain and fatigue',
      socrates_site: 'Lower Abdomen (Suprapubic)',
      socrates_onset: 'Started 3 days ago',
      socrates_character: 'Dull cramping',
      socrates_severity: 6,
      // Sensitive topic answers
      personal_history: 'Non-smoker / No alcohol use',
      review_of_systems_mental: 'Persistent anxiety or panic feelings',
      review_of_systems_reproductive: 'Burning urination / Urinary frequency'
    };

    const summary = generateStructuredSummary(mockPatient, mockAnswers, [], 'STANDARD_SOCRATES');

    assert(summary.personal_history.includes('Non-smoker / No alcohol use'), 'personal_history must reflect patient answer');
    assert(summary.review_of_systems.includes('Mental well-being: Persistent anxiety or panic feelings'), 'ROS must reflect mental health answer');
    assert(summary.review_of_systems.includes('Reproductive/GU: Burning urination / Urinary frequency'), 'ROS must reflect reproductive answer');
    assert(summary.why_this_explanations.review_of_systems.includes('Burning urination') || summary.why_this_explanations.review_of_systems.includes('Persistent anxiety'), 'why_this must justify ROS from patient input');

    console.log('  ✓ Structured summary seamlessly synthesized sensitive findings into physician dashboard format:');
    console.log('    • Personal History:', summary.personal_history);
    console.log('    • Review of Systems:', summary.review_of_systems);
    console.log('    • Why This Explanation:', summary.why_this_explanations.review_of_systems);
    passed++;
  } catch (err) {
    console.error('  ✗ TEST 5 Failed:', err.message);
    failed++;
  }

  console.log('\n================================================================');
  console.log(`FEATURE 3 VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
