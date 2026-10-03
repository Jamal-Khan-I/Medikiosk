// Verification test for Feature 1: AYUSH-Allopathy Cross-System Safety Check
import { evaluateAyushAllopathyCrossSafety, evaluateCrossSafetyFallback } from '../services/llmService.js';
import { store } from '../db/store.js';

async function runFeature1Verification() {
  console.log('================================================================');
  console.log('VERIFYING FEATURE 1: AYUSH-Allopathy Cross-System Safety Check');
  console.log('================================================================\n');

  // Scenario A: Patient session containing BOTH:
  // 1. Extracted allopathic medications from digitized prescription (Metformin 500mg, Amlodipine 5mg)
  // 2. Completed Dashavidha Pariksha assessment (Mandagni [Low Agni], Krura Koshtha [Constipated bowel])
  console.log('--- SCENARIO A: BOTH Digitized Prescription AND AYUSH Dashavidha Present ---');
  const scenarioAMeds = ['Metformin Hydrochloride 500mg BD', 'Amlodipine 5mg OD'];
  const scenarioAAyush = {
    ayush_prakriti: 'Kapha-Vata Prakriti',
    ayush_vikriti: 'Vata Vriddhi with Agni Mandya',
    ayush_ahara_shakti: 'Mandagni (Sluggish digestion, bloating, heaviness after small meals)',
    ayush_koshtha: 'Krura Koshtha (Hard stools, constipation tendency, requires strong stimulus)',
    ayush_satva: 'Madhyama Satva',
    ayush_ahara_vihara: 'Heavy carbohydrate diet, sedentary routine'
  };

  const scenarioAResult = await evaluateAyushAllopathyCrossSafety({
    medications: scenarioAMeds,
    ayushAssessment: scenarioAAyush,
    hasPrescriptionDocs: true,
    isAyushMode: true
  });

  console.log('Scenario A Result:');
  console.log('  has_concern:', scenarioAResult?.has_concern);
  console.log('  advisory_text:', scenarioAResult?.advisory_text);
  console.log('  medications_involved:', scenarioAResult?.medications_involved);
  console.log('  ayush_parameters_involved:', scenarioAResult?.ayush_parameters_involved);
  console.log('  why_this:', scenarioAResult?.why_this);

  if (!scenarioAResult || !scenarioAResult.has_concern) {
    throw new Error('FAIL Scenario A: Cross-reference should have fired for Metformin + Mandagni');
  }
  if (!scenarioAResult.advisory_text || !scenarioAResult.advisory_text.toLowerCase().includes('consider')) {
    throw new Error('FAIL Scenario A: Advisory text must be phrased as physician prompt ("consider reviewing")');
  }
  if (!scenarioAResult.why_this) {
    throw new Error('FAIL Scenario A: Missing transparent AI reasoning ("why_this")');
  }
  console.log('=> SCENARIO A PASSED: Cross-system safety note successfully fired with advisory phrasing and "Why this?" trace.');

  // Scenario B: AYUSH Assessment ONLY (No prior allopathic prescription documents)
  console.log('\n--- SCENARIO B: AYUSH Mode ONLY (No Allopathic Prescription Docs) ---');
  const scenarioBResult = await evaluateAyushAllopathyCrossSafety({
    medications: [],
    ayushAssessment: scenarioAAyush,
    hasPrescriptionDocs: false,
    isAyushMode: true
  });
  console.log('Scenario B Result:', scenarioBResult);
  if (scenarioBResult !== null) {
    throw new Error('FAIL Scenario B: Cross-system note must NOT appear when no prescription documents are uploaded');
  }
  console.log('=> SCENARIO B PASSED: Cross-system note correctly does NOT appear (null).');

  // Scenario C: Allopathic Prescription ONLY (Standard Allopathic Mode, no AYUSH assessment)
  console.log('\n--- SCENARIO C: Allopathic Prescription Docs Present, but Standard Allopathic Mode (No AYUSH) ---');
  const scenarioCResult = await evaluateAyushAllopathyCrossSafety({
    medications: scenarioAMeds,
    ayushAssessment: {},
    hasPrescriptionDocs: true,
    isAyushMode: false
  });
  console.log('Scenario C Result:', scenarioCResult);
  if (scenarioCResult !== null) {
    throw new Error('FAIL Scenario C: Cross-system note must NOT appear when no AYUSH assessment was conducted');
  }
  console.log('=> SCENARIO C PASSED: Cross-system note correctly does NOT appear (null).');

  // Scenario D: Neither present
  console.log('\n--- SCENARIO D: Neither Prescription nor AYUSH Assessment Present ---');
  const scenarioDResult = await evaluateAyushAllopathyCrossSafety({
    medications: [],
    ayushAssessment: {},
    hasPrescriptionDocs: false,
    isAyushMode: false
  });
  console.log('Scenario D Result:', scenarioDResult);
  if (scenarioDResult !== null) {
    throw new Error('FAIL Scenario D: Cross-system note must NOT appear when neither is present');
  }
  console.log('=> SCENARIO D PASSED: Cross-system note correctly does NOT appear (null).');

  // Scenario E: NSAID (Diclofenac) + Tikshnagni / Pitta Hyperacidity
  console.log('\n--- SCENARIO E: NSAID (Diclofenac) with Tikshnagni (Pitta Hyperacidity) ---');
  const scenarioEMeds = ['Diclofenac Sodium 50mg BD'];
  const scenarioEAyush = {
    ayush_prakriti: 'Pitta-dominant Prakriti',
    ayush_vikriti: 'Pitta hyperacidity and burning pyrosis',
    ayush_ahara_shakti: 'Tikshnagni (Very sharp appetite, burning, rapid hunger)',
    ayush_koshtha: 'Madhyama Koshtha'
  };

  const scenarioEResult = await evaluateAyushAllopathyCrossSafety({
    medications: scenarioEMeds,
    ayushAssessment: scenarioEAyush,
    hasPrescriptionDocs: true,
    isAyushMode: true
  });
  console.log('Scenario E Result:');
  console.log('  has_concern:', scenarioEResult?.has_concern);
  console.log('  advisory_text:', scenarioEResult?.advisory_text);
  console.log('  why_this:', scenarioEResult?.why_this);

  if (!scenarioEResult || !scenarioEResult.has_concern) {
    throw new Error('FAIL Scenario E: Should have flagged NSAID + Tikshnagni ulcerogenic risk');
  }
  console.log('=> SCENARIO E PASSED: NSAID + Tikshnagni interaction identified.');

  console.log('\n================================================================');
  console.log('SUCCESS: FEATURE 1 (AYUSH-Allopathy Safety Check) FULLY VERIFIED');
  console.log('================================================================');
}

runFeature1Verification().catch(err => {
  console.error('\nFEATURE 1 VERIFICATION FAILED:', err);
  process.exit(1);
});
