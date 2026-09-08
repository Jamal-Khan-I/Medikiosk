// Automated Live Benchmark of Gemini TTS and ASR across 10 Target Indian Languages
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
if (typeof process.loadEnvFile === 'function') {
  process.loadEnvFile(path.join(__dirname, '../.env'));
}

import { generateGeminiTTS, transcribeAudioWithGemini } from '../services/llmService.js';

const TARGET_LANGUAGES = [
  {
    code: 'hi',
    name: 'Hindi',
    clinicalPhrase: 'मुझे तीन दिनों से तेज बुखार और सिरदर्द है।',
    questionPrompt: 'आपको यह दर्द शरीर में किस जगह पर महसूस हो रहा है?'
  },
  {
    code: 'en',
    name: 'English (Indian accent)',
    clinicalPhrase: 'I have severe chest tightness and shortness of breath since this morning.',
    questionPrompt: 'Could you tell me exactly where you feel the discomfort and when it started?'
  },
  {
    code: 'ta',
    name: 'Tamil',
    clinicalPhrase: 'எனக்கு மூன்று நாட்களாக கடுமையான காய்ச்சல் மற்றும் தலைவலி உள்ளது.',
    questionPrompt: 'உங்களுக்கு இந்த வலி உடலில் எந்த இடத்தில் ஏற்படுகிறது?'
  },
  {
    code: 'te',
    name: 'Telugu',
    clinicalPhrase: 'నాకు మూడు రోజులుగా తీవ్రమైన జ్వరం మరియు తలనొప్పి ఉంది.',
    questionPrompt: 'మీకు ఈ నొప్పి శరీరంలో ఎక్కడ వస్తోంది?'
  },
  {
    code: 'kn',
    name: 'Kannada',
    clinicalPhrase: 'ನನಗೆ ಮೂರು ದಿನಗಳಿಂದ ತೀವ್ರ ಜ್ವರ ಮತ್ತು ತಲೆನೋವು ಇದೆ.',
    questionPrompt: 'ನಿಮಗೆ ಈ ನೋವು ದೇಹದ ಯಾವ ಭಾಗದಲ್ಲಿ ಕಾಣಿಸಿಕೊಳ್ಳುತ್ತಿದೆ?'
  },
  {
    code: 'ml',
    name: 'Malayalam',
    clinicalPhrase: 'എനിക്ക് മൂന്ന് ദിവസമായി കടുത്ത പനിയും തലവേദനയും ഉണ്ട്.',
    questionPrompt: 'നിങ്ങൾക്ക് ഈ വേദന ശരീരത്തിൽ എവിടെയാണ് അനുഭവപ്പെടുന്നത്?'
  },
  {
    code: 'bn',
    name: 'Bengali',
    clinicalPhrase: 'আমার তিন দিন ধরে প্রচণ্ড জ্বর এবং তীব্র মাথা ব্যথা হচ্ছে।',
    questionPrompt: 'আপনার শরীরের কোন অংশে এই ব্যথাটি অনুভূত হচ্ছে?'
  },
  {
    code: 'mr',
    name: 'Marathi',
    clinicalPhrase: 'मला तीन दिवसांपासून तीव्र ताप आणि डोकेदुखी आहे.',
    questionPrompt: 'तुम्हाला हा त्रास शरीराच्या कोणत्या भागात जाणवत आहे?'
  },
  {
    code: 'gu',
    name: 'Gujarati',
    clinicalPhrase: 'મને ત્રણ દિવસથી તીવ્ર તાવ અને માથાનો દુખાવો છે.',
    questionPrompt: 'તમને આ દુખાવો શરીરના કયા ભાગમાં અનુભવાય છે?'
  },
  {
    code: 'pa',
    name: 'Punjabi',
    clinicalPhrase: 'ਮੈਨੂੰ ਤਿੰਨ ਦਿਨਾਂ ਤੋਂ ਤੇਜ਼ ਬੁਖਾਰ ਅਤੇ ਸਿਰ ਦਰਦ ਹੈ।',
    questionPrompt: 'ਤੁਹਾਨੂੰ ਇਹ ਦਰਦ ਸਰੀਰ ਦੇ ਕਿਸ ਹਿੱਸੇ ਵਿੱਚ ਮਹਿਸੂਸ ਹੋ ਰਿਹਾ ਹੈ?'
  }
];

async function runLanguageBenchmark() {
  console.log('========================================================================');
  console.log('  GEMINI NATIVE VOICE (TTS + ASR) MULTILINGUAL BENCHMARK (10 LANGUAGES)');
  console.log('========================================================================\n');

  const results = [];

  for (const lang of TARGET_LANGUAGES) {
    console.log(`\n------------------------------------------------------------`);
    console.log(`[Testing Language]: ${lang.name} (${lang.code})`);
    console.log(`Clinical Prompt: "${lang.clinicalPhrase}"`);
    console.log(`Kiosk Question:  "${lang.questionPrompt}"`);

    const result = {
      code: lang.code,
      name: lang.name,
      ttsSuccess: false,
      ttsLatencyMs: null,
      ttsBytes: 0,
      ttsModel: null,
      asrSuccess: false,
      asrLatencyMs: null,
      asrText: '',
      asrConfidence: null,
      notes: ''
    };

    // 1. Test Text-to-Speech (TTS)
    try {
      const ttsStart = Date.now();
      const ttsRes = await generateGeminiTTS(lang.questionPrompt, lang.code, 'Kore');
      result.ttsSuccess = true;
      result.ttsLatencyMs = Date.now() - ttsStart;
      result.ttsBytes = ttsRes.bytes || ttsRes.audioBuffer?.length || 0;
      result.ttsModel = ttsRes.model;

      console.log(`  ✓ TTS Generated: ${result.ttsBytes} bytes in ${result.ttsLatencyMs}ms (Model: ${result.ttsModel})`);

      // 2. Test Speech-to-Text (ASR) by feeding the generated clinical audio to Gemini ASR
      try {
        const asrStart = Date.now();
        const asrRes = await transcribeAudioWithGemini({
          audioBuffer: ttsRes.audioBuffer,
          mimeType: 'audio/wav',
          language: lang.code
        });

        result.asrSuccess = true;
        result.asrLatencyMs = Date.now() - asrStart;
        result.asrText = asrRes.text;
        result.asrConfidence = asrRes.confidence;

        console.log(`  ✓ ASR Transcribed: "${result.asrText}" (${result.asrLatencyMs}ms, Conf: ${result.asrConfidence})`);
      } catch (asrErr) {
        result.asrSuccess = false;
        result.asrError = asrErr.message;
        console.warn(`  ✗ ASR Failed: ${asrErr.message}`);
      }

    } catch (ttsErr) {
      result.ttsSuccess = false;
      result.ttsError = ttsErr.message;
      console.warn(`  ✗ TTS Failed: ${ttsErr.message}`);
    }

    results.push(result);
    // Pause briefly to respect API rate limits
    await new Promise(r => setTimeout(r, 1200));
  }

  console.log('\n\n========================================================================');
  console.log('                          FINAL BENCHMARK TABLE');
  console.log('========================================================================');
  console.table(results.map(r => ({
    Language: r.name,
    Code: r.code,
    'TTS Status': r.ttsSuccess ? `OK (${r.ttsLatencyMs}ms, ${Math.round(r.ttsBytes/1024)}KB)` : 'FAIL',
    'ASR Status': r.asrSuccess ? `OK (${r.asrLatencyMs}ms)` : 'FAIL',
    'Transcribed Text': r.asrText ? (r.asrText.length > 35 ? r.asrText.substring(0, 35) + '...' : r.asrText) : 'N/A'
  })));

  // Write detailed log for walkthrough artifact
  fs.writeFileSync(
    path.join(__dirname, 'gemini_voice_benchmark_results.json'),
    JSON.stringify(results, null, 2),
    'utf-8'
  );
  console.log(`\nDetailed benchmark saved to backend/tests/gemini_voice_benchmark_results.json`);
}

runLanguageBenchmark().catch(err => {
  console.error('Fatal Benchmark Error:', err);
  process.exit(1);
});
