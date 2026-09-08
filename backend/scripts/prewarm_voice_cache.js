// Pre-warm disk cache for the 10 target Indian languages
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
if (typeof process.loadEnvFile === 'function') {
  process.loadEnvFile(path.join(__dirname, '../.env'));
}

import { generateGeminiTTS } from '../services/llmService.js';

const PROMPTS_TO_WARM = [
  // Consent explanations
  { lang: 'hi', text: 'कृपया अपनी अनुमतियां दें। आज के परामर्श के लिए चिकित्सीय इतिहास और दस्तावेज़ स्कैनिंग की सहमति अनिवार्य है।' },
  { lang: 'en', text: 'Please review and grant your permissions below. Consent for Clinical Intake and Document OCR are mandatory for today\'s OPD consultation.' },
  { lang: 'ta', text: 'தயவுசெய்து உங்கள் அனுமதிகளை வழங்கவும். இன்றைய ஆலோசனையில் மருத்துவ வரலாறு மற்றும் ஆவணங்களை ஸ்கேன் செய்வதற்கான ஒப்புதல் கட்டாயமாகும்.' },
  { lang: 'te', text: 'దయచేసి మీ అనుమతులను మంజూరు చేయండి. నేటి ఓపీడీ సంప్రదింపుల కోసం క్లినికల్ వివరాల సేకరణ మరియు పత్రాల స్కానింగ్ అనుమతి తప్పనిసరి.' },
  { lang: 'bn', text: 'দয়া করে আপনার অনুমতি দিন। আজকের ওপিডি পরামর্শের জন্য ক্লিনিকাল ইতিহাস এবং নথি স্ক্যান করার সম্মতি বাধ্যতামূলক।' },
  { lang: 'mr', text: 'कृपया खालील परवानग्या द्या. आजच्या ओपीडी तपासणीसाठी क्लिनिकल माहिती आणि कागदपत्रे स्कॅनिंगची संमती अनिवार्य आहे.' },
  { lang: 'gu', text: 'કૃપા કરીને નીચે તમારી પરવાનગી આપો. આજના પરામર્શ માટે ક્લિનિકલ વિગતો અને દસ્તાવેજ સ્કેનિંગની સંમતિ ફરજિયાત છે.' },
  { lang: 'kn', text: 'ದಯವಿಟ್ಟು ನಿಮ್ಮ ಅನುಮತಿಗಳನ್ನು ನೀಡಿ. ಇಂದಿನ ಸಮಾಲೋಚನೆಗಾಗಿ ಕ್ಲಿನಿಕಲ್ ಮಾಹಿತಿ ಮತ್ತು ದಾಖಲೆಗಳ ಸ್ಕ್ಯಾನಿಂಗ್ ಸಮ್ಮತಿ ಕಡ್ಡಾಯವಾಗಿದೆ.' },
  { lang: 'ml', text: 'ദയവായി നിങ്ങളുടെ സമ്മതങ്ങൾ തിരഞ്ഞെടുക്കുക. ഒപിഡി കൺസൾട്ടേഷനായി ക്ലിനിക്കൽ വിവര ശേഖരണവും രേഖ സ്കാനിംഗും നിർബന്ധമാണ്.' },
  { lang: 'pa', text: 'ਕਿਰਪਾ ਕਰਕੇ ਆਪਣੀ ਸਹਿਮਤੀ ਦਿਓ। ਅੱਜ ਦੇ ਚੈੱਕ-ਅੱਪ ਲਈ ਡਾਕਟਰੀ ਇਤਿਹਾਸ ਅਤੇ ਦਸਤਾਵੇਜ਼ ਸਕੈਨਿੰਗ ਦੀ ਸਹਿਮਤੀ ਲਾਜ਼ਮੀ ਹੈ।' },

  // Chief Complaint Q1
  { lang: 'hi', text: 'कृपया बताएं कि आज आप अस्पताल किस मुख्य समस्या या तकलीफ के लिए आए हैं?' },
  { lang: 'en', text: 'Please state your main health symptom or reason for visit today:' },
  { lang: 'ta', text: 'இன்று நீங்கள் மருத்துவமனைக்கு வந்ததற்கான முக்கிய காரணம் என்ன?' },
  { lang: 'te', text: 'ఈరోజు మీరు ఆసుపత్రికి రావడానికి ప్రధాన ఆరోగ్య సమస్య ఏమిటి?' },
  { lang: 'bn', text: 'আজ আপনার হাসপাতালে আসার প্রধান কারণ বা লক্ষণটি কী?' },
  { lang: 'mr', text: 'आज तुम्ही रुग्णालयात येण्याचे मुख्य कारण किंवा समस्या काय आहे?' },
  { lang: 'gu', text: 'આજે તમે હોસ્પિટલ આવવાનું મુખ્ય કારણ અથવા તકਲੀફ શું છે?' },
  { lang: 'kn', text: 'ಇಂದು ನೀವು ಆಸ್ಪತ್ರೆಗೆ ಭೇಟಿ ನೀಡಲು ಮುಖ್ಯ ಕಾರಣ ಅಥವಾ ಆರೋಗ್ಯ ಸಮಸ್ಯೆ ಏನು?' },
  { lang: 'ml', text: 'ഇന്ന് ആശുപത്രി സന്ദർശിക്കാൻ ഇടയാക്കിയ പ്രധാന രോഗലക്ഷണം വ്യക്തമാക്കുക:' },
  { lang: 'pa', text: 'ਕਿਰਪਾ ਕਰਕੇ ਅੱਜ ਹਸਪਤਾਲ ਆਉਣ ਦਾ ਮੁੱਖ ਕਾਰਨ ਜਾਂ ਲੱਛਣ ਦੱਸੋ:' }
];

async function warmCache() {
  console.log('Starting Voice Cache Pre-Warming across all 10 languages...');
  let successCount = 0;

  for (let i = 0; i < PROMPTS_TO_WARM.length; i++) {
    const item = PROMPTS_TO_WARM[i];
    console.log(`[${i + 1}/${PROMPTS_TO_WARM.length}] Caching ${item.lang.toUpperCase()}: "${item.text.substring(0, 35)}..."`);
    try {
      const res = await generateGeminiTTS(item.text, item.lang, 'Kore');
      console.log(`  ✓ Cached (${res.cached ? 'Already on disk' : 'Generated via ' + res.model}, ${res.bytes} bytes, ${res.latencyMs}ms)`);
      successCount++;
    } catch (err) {
      console.warn(`  ✗ Failed: ${err.message}`);
    }
    // Pace requests slightly to respect RPM
    await new Promise(r => setTimeout(r, 1500));
  }

  console.log(`\nCache Warming Complete: ${successCount}/${PROMPTS_TO_WARM.length} audio files primed on disk.`);
}

warmCache().catch(console.error);
