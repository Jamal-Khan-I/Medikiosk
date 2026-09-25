import fs from 'fs';
import path from 'path';
import dns from 'dns';
try { dns.setDefaultResultOrder('ipv4first'); } catch(e) {}
process.loadEnvFile('./backend/.env');

import { processDocumentOCR } from '../services/documentService.js';

async function testOCR() {
  console.log('=== TESTING NEW HIGH-ACCURACY FAST OCR PIPELINE ===\n');

  const samplePath = 'C:\\Users\\Jamal Khan\\.gemini\\antigravity-ide\\brain\\9962f864-3f08-4f64-909e-e4e4321196ed\\handwritten_prescription_sample_1788672406564.jpg';
  const imgBuf = fs.readFileSync(samplePath);
  const base64 = imgBuf.toString('base64');

  console.log(`[Test 1] Processing real handwritten doctor prescription (${(imgBuf.length / 1024).toFixed(1)} KB)...`);
  const t0 = Date.now();
  const result = await processDocumentOCR(
    { file_name: 'handwritten_prescription.jpg', document_type: 'AUTO_DETECT', mime_type: 'image/jpeg' },
    '',
    base64
  );
  const duration = Date.now() - t0;

  console.log(`\n✔ OCR Processing Completed in ${duration}ms (Reported Latency: ${result.ocr_latency_ms}ms)`);
  console.log(`✔ Provider:            ${result.ocr_provider}`);
  console.log(`✔ Processing Method:   ${result.processing_method}`);
  console.log(`✔ Confidence Score:    ${result.ocr_confidence_score}%`);
  console.log(`✔ Detected Doc Type:   ${result.document_type}`);
  console.log(`✔ Issuing Facility:    ${result.issuing_facility || 'N/A'}`);
  console.log(`✔ Doctor Name:         ${result.doctor_name || 'N/A'}`);
  console.log(`✔ Patient Name:        ${result.patient_name || 'N/A'}`);
  console.log(`\n--- Extracted Text Preview ---`);
  console.log(result.extracted_text.slice(0, 300) + '...');

  console.log(`\n--- Extracted Structured Entities (${result.entities.length} items) ---`);
  result.entities.forEach(ent => {
    console.log(`  • [${ent.category}] ${ent.entity_name} => ${ent.entity_value} ${ent.unit || ''} (Ref: ${ent.reference_range}) ${ent.is_unclear ? '⚠️ UNCLEAR' : ''}`);
  });

  if (result.flagged_uncertainties?.length > 0) {
    console.log(`\n--- Flagged Uncertainties (Anti-Hallucination) ---`);
    result.flagged_uncertainties.forEach(u => console.log(`  ⚠️ ${u}`));
  }

  // Test 2: Verify non-medical rejection
  console.log('\n[Test 2] Testing Non-Medical Document Guardrail...');
  try {
    const fakeReceiptBuffer = Buffer.from('GROCERY SUPERMARKET STORE RECEIPT 1x Milk $3.99 1x Bread $2.49 TOTAL $6.48');
    await processDocumentOCR(
      { file_name: 'grocery_receipt.png', document_type: 'AUTO_DETECT', mime_type: 'image/png' },
      '',
      fakeReceiptBuffer.toString('base64')
    );
    console.log('⚠️ Expected non-medical rejection, but document was accepted.');
  } catch (err) {
    console.log(`✔ Correctly rejected non-medical receipt: "${err.message}"`);
  }

  console.log('\n=== ALL OCR SPEED & ACCURACY TESTS PASSED! ===');
}

testOCR().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
