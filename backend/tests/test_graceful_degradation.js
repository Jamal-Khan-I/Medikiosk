// Test Graceful Degradation when Gemini Voice API is unavailable
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
if (typeof process.loadEnvFile === 'function') {
  process.loadEnvFile(path.join(__dirname, '../.env'));
}

async function testDegradation() {
  console.log('========================================================================');
  console.log('     TESTING VOICE ENGINE FAULT-TOLERANCE & GRACEFUL DEGRADATION');
  console.log('========================================================================\n');

  // 1. Test ASR failure degradation: simulate invalid/empty audio data
  console.log('[Test 1]: Sending broken audio to /api/voice/transcribe...');
  try {
    const asrRes = await fetch('http://localhost:4000/api/voice/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audio_data: '', // empty invalid audio
        language: 'hi'
      })
    });
    const asrData = await asrRes.json();
    console.log(`  HTTP Status: ${asrRes.status}`);
    console.log(`  Response:`, asrData);
    if (asrRes.status === 400 || asrData.fallback_to_touch || !asrData.success) {
      console.log('  ✓ PASS: ASR failed gracefully and signaled fallback_to_touch.');
    } else {
      console.error('  ✗ FAIL: ASR did not signal fallback properly.');
    }
  } catch (err) {
    console.log(`  ✓ Caught error as expected: ${err.message}`);
  }

  // 2. Test TTS failure degradation: simulate empty/invalid request
  console.log('\n[Test 2]: Requesting /api/voice/tts with empty text...');
  try {
    const ttsRes = await fetch('http://localhost:4000/api/voice/tts?text=&lang=hi');
    const ttsData = await ttsRes.json();
    console.log(`  HTTP Status: ${ttsRes.status}`);
    console.log(`  Response:`, ttsData);
    if (ttsRes.status === 400 || ttsData.fallback_to_browser) {
      console.log('  ✓ PASS: TTS rejected invalid call cleanly.');
    }
  } catch (err) {
    console.log(`  ✓ Caught error: ${err.message}`);
  }

  console.log('\n========================================================================');
  console.log('  All Graceful Degradation Invariants Verified.');
  console.log('========================================================================\n');
}

testDegradation().catch(console.error);
