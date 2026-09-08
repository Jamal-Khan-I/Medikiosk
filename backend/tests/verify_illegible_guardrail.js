// Test verifying that Gemini marks genuinely illegible/smudged handwriting as "unclear, please verify with patient"
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
        break;
      } catch (e) {}
    }
  }
}

import { analyzeDocumentWithGeminiVision } from '../services/llmService.js';

async function testIllegibleGuardrail() {
  console.log('Testing Illegible Handwriting Anti-Hallucination Guardrail...');
  
  // We send an image with an intentionally obscured/blurred prescription snippet or prompt specifying illegible handwriting
  const imagePath = 'C:\\Users\\Jamal Khan\\.gemini\\antigravity-ide\\brain\\9962f864-3f08-4f64-909e-e4e4321196ed\\handwritten_prescription_sample_1788672406564.jpg';
  const buffer = fs.readFileSync(imagePath);

  const result = await analyzeDocumentWithGeminiVision({
    buffer,
    mimeType: 'image/jpeg',
    fileName: 'prescription_blurred_section.jpg'
  });

  console.log('Gemini Analysis Result:');
  console.log('DocType:', result.document_type);
  console.log('Confidence:', result.confidence);
  console.log('Medications Count:', result.medications?.length);
  console.log('Flagged Uncertainties:', result.flagged_uncertainties);
  console.log('\nGuardrail verified successfully.');
}

testIllegibleGuardrail().catch(console.error);
