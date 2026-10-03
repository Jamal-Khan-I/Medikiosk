// Adaptive SOCRATES and AYUSH Intake Service
// Multilingual Clinical Question Prompts & Structured EHR Summary Generator
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let ayush22Translations = {};
try {
  const p = path.join(__dirname, 'ayush_questions_22.json');
  if (fs.existsSync(p)) {
    ayush22Translations = JSON.parse(fs.readFileSync(p, 'utf8'));
  }
} catch (e) {
  console.warn('[IntakeService] Notice: Could not load ayush_questions_22.json:', e.message);
}

let socrates22Translations = {};
try {
  const sp = path.join(__dirname, 'socrates_questions_22.json');
  if (fs.existsSync(sp)) {
    socrates22Translations = JSON.parse(fs.readFileSync(sp, 'utf8'));
  }
} catch (e) {
  console.warn('[IntakeService] Notice: Could not load socrates_questions_22.json:', e.message);
}

export const ADAPTIVE_COMPLAINT_TREES = {
  'CHEST_PAIN': {
    code: 'CARDIOVASCULAR',
    name: 'Chest Pain / Acute Coronary Syndrome Assessment',
    keywords: ['chest', 'heart', 'angina', 'palpitations', 'tightness', 'left arm', 'छाती', 'மார்பு', 'ఛాతీ', 'বুক', 'छाती दुखणे', 'છાતી'],
    questions: [
      {
        stepId: 'socrates_site',
        code: 'SITE',
        prompt: {
          en: "Where exactly in your chest is the pain or discomfort located?",
          hi: "छाती में ठीक किस जगह पर दर्द या बेचैनी महसूस हो रही है?",
          ta: "மார்பின் எந்தப் பகுதியில் வலி அதிகமாக உள்ளது?",
          te: "మీ ఛాతీలో ఖచ్చితంగా ఎక్కడ నొప్పి లేదా అసౌకర్యం ఉంది?",
          bn: "আপনার বুকের ঠিক কোন জায়গায় ব্যথা বা অস্বস্তি হচ্ছে?",
          mr: "तुमच्या छातीत नक्की कोणत्या ठिकाणी दुखणे किंवा अस्वस्थता जाणवत आहे?",
          gu: "તમારી છાતીમાં બરાબર કઈ જગ્યાએ દુખાવો અથવા અસ્વસ્થતા છે?",
          kn: "ನಿಮ್ಮ ಎದೆಯ ನಿಖರವಾದ ಯಾವ ಭಾಗದಲ್ಲಿ ನೋವು ಅಥವಾ ಅಸ್ವಸ್ಥತೆ ಇದೆ?",
          ml: "നിങ്ങളുടെ നെഞ്ചിൽ കൃത്യമായി എവിടെയാണ് വേദനയോ അസ്വസ്ഥതയോ അനുഭവപ്പെടുന്നത്?",
          pa: "ਤੁਹਾਡੀ ਛਾਤੀ ਵਿੱਚ ਦਰਦ ਜਾਂ ਬੇਚੈਨੀ ਠੀਕ ਕਿਸ ਥਾਂ 'ਤੇ ਮਹਿਸੂਸ ਹੋ ਰਹੀ ਹੈ?"
        },
        inputType: 'select_or_voice',
        quickOptions: ['Center of Chest (Retrosternal)', 'Left Side of Chest', 'Spreading to Left Shoulder & Arm', 'Upper Abdomen / Epigastrium', 'Both Sides of Chest']
      },
      {
        stepId: 'socrates_onset',
        code: 'ONSET',
        prompt: {
          en: "How quickly did the pain start, and what were you doing when it began?",
          hi: "दर्द कितनी तेजी से शुरू हुआ, और उस समय आप क्या कर रहे थे?",
          ta: "வலி எவ்வளவு வேகமாகத் தொடங்கியது? அப்போது நீங்கள் என்ன செய்து கொண்டிருந்தீர்கள்?",
          te: "నొప్పి ఎంత వేగంగా ప్రారంభమైంది, అది మొదలైనప్పుడు మీరు ఏమి చేస్తున్నారు?",
          bn: "ব্যথা কত দ্রুত শুরু হয়েছিল এবং যখন শুরু হয়েছিল তখন আপনি কী করছিলেন?",
          mr: "दुखणे किती वेगाने सुरू झाले आणि ते सुरू झाले तेव्हा तुम्ही काय करत होतात?",
          gu: "દુખાવો કેટલી ઝડપથી શરૂ થયો અને જ્યારે તે શરૂ થયો ત્યારે તમે શું કરી રહ્યા હતા?",
          kn: "ನೋವು ಎಷ್ಟು ವೇಗವಾಗಿ ಪ್ರಾರಂಭವಾಯಿತು, ಮತ್ತು ಅದು ಪ್ರಾರಂಭವಾದಾಗ ನೀವು ಏನು ಮಾಡುತ್ತಿದ್ದೀರಿ?",
          ml: "വേദന എത്ര പെട്ടെന്നാണ് തുടങ്ങിയത്, ആ സമയത്ത് നിങ്ങൾ എന്താണ് ചെയ്യുകയായിരുന്നു?",
          pa: "ਦਰਦ ਕਿੰਨੀ ਤੇਜ਼ੀ ਨਾਲ ਸ਼ੁਰੂ ਹੋਇਆ, ਅਤੇ ਉਸ ਸਮੇਂ ਤੁਸੀਂ ਕੀ ਕਰ ਰਹੇ ਸੀ?"
        },
        inputType: 'select_or_voice',
        quickOptions: ['Started suddenly < 3 hours ago', 'Began during physical exertion / stairs', 'Started at rest / during sleep', 'Gradual onset over several days', 'After a heavy meal']
      },
      {
        stepId: 'socrates_character',
        code: 'CHARACTER',
        prompt: {
          en: "How does the pain feel?",
          hi: "दर्द का अहसास कैसा है?",
          ta: "வலி எவ்வாறு உணரப்படுகிறது?",
          te: "నొప్పి అనుభూతి ఎలా ఉంది?",
          bn: "ব্যথার অনুভূতিটি কেমন?",
          mr: "दुखण्याचा प्रकार कसा आहे?",
          gu: "દુખાવો કેવો લાગે છે?",
          kn: "ನೋವಿನ ಅನುಭವ ಹೇಗಿದೆ?",
          ml: "വേദനയുടെ സ്വഭാവം എങ്ങനെയുള്ളതാണ്?",
          pa: "ਦਰਦ ਦਾ ਅਹਿਸਾਸ ਕਿਹੋ ਜਿਹਾ ਹੈ?"
        },
        inputType: 'select_or_voice',
        quickOptions: ['Heavy Crushing Weight / Tight Band', 'Sharp / Stabbing with breathing', 'Burning sensation / Acidity-like', 'Dull continuous ache', 'Tearing sensation']
      },
      {
        stepId: 'socrates_radiation',
        code: 'RADIATION',
        prompt: {
          en: "Does the pain radiate or travel anywhere else?",
          hi: "क्या यह दर्द शरीर के किसी अन्य हिस्से में फैलता है?",
          ta: "இந்த வலி உடலின் வேறு இடங்களுக்குப் பரவுகிறதா?",
          te: "ఈ నొప్పి శరీరంలోని ఇతర భాగాలకు పాకుతుందా?",
          bn: "ব্যথা কি অন্য কোথাও ছড়িয়ে পড়ছে?",
          mr: "हे दुखणे इतर कोणत्याही भागात पसरत आहे का?",
          gu: "શું આ દુખાવો શરીરના અન્ય કોઈ ભાગમાં ફેલાય છે?",
          kn: "ಈ ನೋವು ಬೇರೆಡೆಗೆ ಹರಡುತ್ತಿದೆಯೇ?",
          ml: "ഈ വേദന ശരീരത്തിന്റെ മറ്റ് ഭാഗങ്ങളിലേക്ക് വ്യാപിക്കുന്നുണ്ടോ?",
          pa: "ਕੀ ਇਹ ਦਰਦ ਸਰੀਰ ਦੇ ਕਿਸੇ ਹੋਰ ਹਿੱਸੇ ਵਿੱਚ ਫੈਲਦਾ ਹੈ?"
        },
        inputType: 'select_or_voice',
        quickOptions: ['Radiates to Left Arm & Shoulder', 'Radiates to Neck, Jaw & Teeth', 'Radiates straight through to the Back', 'Does not spread (Localized)', 'Radiates to both arms']
      },
      {
        stepId: 'socrates_associations',
        code: 'ASSOCIATIONS',
        prompt: {
          en: "Are you experiencing any of these associated symptoms?",
          hi: "क्या आपको इनमें से कोई अन्य लक्षण भी हैं?",
          ta: "பின்வரும் அறிகுறிகளில் ஏதேனும் உள்ளதா?",
          te: "మీకు ఈ క్రింది అనుబంధ లక్షణాలు ఏవైనా ఉన్నాయా?",
          bn: "আপনার কি এর সাথে অন্য কোনো লক্ষণ রয়েছে?",
          mr: "तुम्हाला यासोबत इतर कोणतीही लक्षणे जाणवत आहेत का?",
          gu: "શું તમને આની સાથે અન્ય કોઈ લક્ષણો પણ છે?",
          kn: "ನಿಮಗೆ ಈ ಕೆಳಗಿನ ಯಾವುದೇ ಸಂಬಂಧಿತ ಲಕ್ಷಣಗಳಿವೆಯೇ?",
          ml: "ഇതോടൊപ്പം ഇനിപ്പറയുന്ന ലക്ഷണങ്ങൾ വല്ലതും അനുഭവപ്പെടുന്നുണ്ടോ?",
          pa: "ਕੀ ਤੁਹਾਨੂੰ ਇਹਨਾਂ ਵਿੱਚੋਂ ਕੋਈ ਹੋਰ ਲੱਛਣ ਵੀ ਮਹਿਸੂਸ ਹੋ ਰਹੇ ਹਨ?"
        },
        inputType: 'multiselect',
        quickOptions: ['Profuse Cold Sweats / Diaphoresis', 'Shortness of Breath / Gasping', 'Nausea or Vomiting', 'Lightheadedness / Near Fainting', 'Palpitations / Fast Heartbeat', 'None of these']
      },
      {
        stepId: 'socrates_timing',
        code: 'TIMING',
        prompt: {
          en: "How long does each episode last, or is it continuous?",
          hi: "क्या यह दर्द लगातार बना हुआ है या रुक-रुक कर आता है?",
          ta: "வலி தொடர்ந்து இருக்கிறதா அல்லது அவ்வப்போது வருகிறதா?",
          te: "నొప్పి నిరంతరం ఉందా లేదా తరంగాల రూపంలో వస్తుందా?",
          bn: "ব্যথা কি ক্রমাগত হচ্ছে নাকি থেমে থেমে আসছে?",
          mr: "हे दुखणे सतत आहे की थांबून थांबून येत आहे?",
          gu: "શું આ દુખાવો સતત રહે છે કે રહી રહીને આવે છે?",
          kn: "ನೋವು ನಿರಂತರವಾಗಿದೆಯೇ ಅಥವಾ ಮಧ್ಯಂತರವಾಗಿ ಬರುತ್ತಿದೆಯೇ?",
          ml: "വേദന തുടർച്ചയായി ഉണ്ടോ അതോ ഇടവിട്ടാണോ വരുന്നത്?",
          pa: "ਕੀ ਇਹ ਦਰਦ ਲਗਾਤਾਰ ਬਣਿਆ ਰਹਿੰਦਾ ਹੈ ਜਾਂ ਰੁਕ-ਰੁਕ ਕੇ ਆਉਂਦਾ ਹੈ?"
        },
        inputType: 'select_or_voice',
        quickOptions: ['Continuous & Unrelenting (> 30 mins)', 'Comes in waves (5-15 mins each)', 'Brief sharp twinges (< 1 minute)', 'Constant ache throughout the day']
      },
      {
        stepId: 'socrates_exacerbating',
        code: 'EXACERBATING',
        prompt: {
          en: "What makes the pain worse or better?",
          hi: "किस चीज़ से दर्द बढ़ता है या आराम मिलता है?",
          ta: "எது வலியை அதிகப்படுத்துகிறது அல்லது குறைக்கிறது?",
          te: "దేని వల్ల నొప్పి పెరుగుతుంది లేదా తగ్గుతుంది?",
          bn: "কিসে ব্যথা বাড়ে বা উপশম হয়?",
          mr: "कशाने दुखणे वाढते किंवा आराम मिळतो?",
          gu: "શેનાથી દુખાવો વધે છે કે આરામ મળે છે?",
          kn: "ಯಾವುದರಿಂದ ನೋವು ಹೆಚ್ಚಾಗುತ್ತದೆ ಅಥವಾ ಶಮನಗೊಳ್ಳುತ್ತದೆ?",
          ml: "എന്ത് ചെയ്യുമ്പോഴാണ് വേദന കൂടുന്നതോ കുറയുന്നതോ?",
          pa: "ਕਿਸ ਚੀਜ਼ ਨਾਲ ਦਰਦ ਵਧਦਾ ਹੈ ਜਾਂ ਆਰਾਮ ਮਿਲਦਾ ਹੈ?"
        },
        inputType: 'select_or_voice',
        quickOptions: ['Worse with walking / climbing stairs', 'Relieved by rest', 'Worse with deep breaths / coughing', 'Worse on lying flat', 'Relieved with antacids']
      },
      {
        stepId: 'socrates_severity',
        code: 'SEVERITY',
        prompt: {
          en: "On a scale from 1 (mild) to 10 (unbearable agony), how severe is the pain right now?",
          hi: "1 (हल्का) से 10 (असहनीय) के पैमाने पर, दर्द अभी कितना तेज है?",
          ta: "1 முதல் 10 வரையிலான அளவில், வலி இப்போது எவ்வளவு தீவிரமாக உள்ளது?",
          te: "1 (తేలికపాటి) నుండి 10 (తీవ్రమైన) స్కేలుపై, నొప్పి ప్రస్తుతం ఎంత తీవ్రంగా ఉంది?",
          bn: "১ (হালকা) থেকে ১০ (অসহ্য)-এর স্কেলে, ব্যথা এখন কতটা তীব্র?",
          mr: "१ (कमी) ते १० (असह्य) स्केलवर, दुखणे सध्या किती तीव्र आहे?",
          gu: "૧ (હળવો) થી ૧૦ (અસહ્ય) ના સ્કેલ પર, દુખાવો અત્યારે કેટલો તીવ્ર છે?",
          kn: "೧ (ಸೌಮ್ಯ) ರಿಂದ ೧೦ (ತೀವ್ರ) ಪ್ರಮಾಣದಲ್ಲಿ, ನೋವು ಈಗ ಎಷ್ಟು ತೀವ್ರವಾಗಿದೆ?",
          ml: "1 മുതൽ 10 വരെയുള്ള അളവിൽ, വേദന ഇപ്പോൾ എത്രത്തോളം തീവ്രമാണ്?",
          pa: "1 (ਹਲਕਾ) ਤੋਂ 10 (ਅਸਹਿ) ਦੇ ਪੈਮਾਨੇ 'ਤੇ, ਦਰਦ ਇਸ ਸਮੇਂ ਕਿੰਨਾ ਗੰਭੀਰ ਹੈ?"
        },
        inputType: 'slider_rating',
        min: 1,
        max: 10
      }
    ]
  },
  'ABDOMINAL_PAIN': {
    code: 'GASTROINTESTINAL',
    name: 'Abdominal Pain / Gastrointestinal Distress',
    keywords: ['stomach', 'abdomen', 'belly', 'acidity', 'reflux', 'vomiting', 'loose motion', 'diarrhea', 'पेट दर्द', 'அடிவயிற்று வலி', 'కడుపు నొప్పి', 'পেট ব্যথা', 'पोटदुखी', 'પેટમાં દુખાવો'],
    questions: [
      {
        stepId: 'socrates_site',
        code: 'SITE',
        prompt: {
          en: "Where in your abdomen is the pain located?",
          hi: "पेट के किस हिस्से में सबसे ज्यादा दर्द है?",
          ta: "வயிற்றின் எந்தப் பகுதியில் வலி உள்ளது?",
          te: "మీ పొత్తికడుపులో ఏ భాగంలో నొప్పి ఉంది?",
          bn: "আপনার পেটের কোন অংশে ব্যথা হচ্ছে?",
          mr: "पोटाच्या कोणत्या भागात दुखत आहे?",
          gu: "પેટના કયા ભાગમાં દુખાવો છે?",
          kn: "ಹೊಟ್ಟೆಯ ಯಾವ ಭಾಗದಲ್ಲಿ ನೋವು ಇದೆ?",
          ml: "നിങ്ങളുടെ വയറ്റിൽ എവിടെയാണ് വേദന അനുഭവപ്പെടുന്നത്?",
          pa: "ਤੁਹਾਡੇ ਪੇਟ ਵਿੱਚ ਠੀਕ ਕਿਸ ਥਾਂ 'ਤੇ ਦਰਦ ਹੈ?"
        },
        inputType: 'select_or_voice',
        quickOptions: ['Upper Abdomen / Epigastrium', 'Right Upper Side (under ribs)', 'Right Lower Abdomen (groin)', 'All over the abdomen', 'Around the navel / umbilicus']
      },
      {
        stepId: 'socrates_onset',
        code: 'ONSET',
        prompt: {
          en: "When and how did this abdominal pain start?",
          hi: "यह पेट दर्द कब और कैसे शुरू हुआ?",
          ta: "இந்த வயிற்று வலி எப்போது, எப்படி தொடங்கியது?",
          te: "ఈ కడుపు నొప్పి ఎప్పుడు, ఎలా ప్రారంభమైంది?",
          bn: "এই পেট ব্যথা কখন এবং কীভাবে শুরু হয়েছিল?",
          mr: "हे पोटदुखी कधी आणि कसे सुरू झाले?",
          gu: "આ પેટનો દુખાવો ક્યારે અને કેવી રીતે શરૂ થયો?",
          kn: "ಈ ಹೊಟ್ಟೆ ನೋವು ಯಾವಾಗ ಮತ್ತು ಹೇಗೆ ಪ್ರಾರಂಭವಾಯಿತು?",
          ml: "ഈ വയറുവേദന എപ്പോൾ, എങ്ങനെയാണ് ആരംഭിച്ചത്?",
          pa: "ਇਹ ਪੇਟ ਦਾ ਦਰਦ ਕਦੋਂ ਅਤੇ ਕਿਵੇਂ ਸ਼ੁਰੂ ਹੋਇਆ ਸੀ?"
        },
        inputType: 'select_or_voice',
        quickOptions: ['Sudden severe pain (< 6 hours ago)', 'Started after eating oily/spicy food', 'Gradual discomfort over 2-3 days', 'Chronic on and off for weeks']
      },
      {
        stepId: 'socrates_character',
        code: 'CHARACTER',
        prompt: {
          en: "How would you describe the stomach discomfort?",
          hi: "दर्द का प्रकार कैसा है?",
          ta: "வலியின் தன்மை எப்படி இருக்கிறது?",
          te: "కడుపులోని అసౌకర్యాన్ని ఎలా వివరిస్తారు?",
          bn: "পেটের অস্বস্তির ধরন কেমন?",
          mr: "पोटातील दुखण्याचा प्रकार कसा आहे?",
          gu: "પેટની અસ્વસ્થતાનું સ્વરૂપ કેવું છે?",
          kn: "ಹೊಟ್ಟೆಯ ಅಸ್ವಸ್ಥತೆ ಯಾವ ರೀತಿಯಾಗಿದೆ?",
          ml: "വയറുവേദനയുടെ സ്വഭാവം എങ്ങനെ വിവരിക്കാം?",
          pa: "ਤੁਸੀਂ ਪੇਟ ਦੇ ਦਰਦ ਨੂੰ ਕਿਵੇਂ ਬਿਆਨ ਕਰੋਗੇ?"
        },
        inputType: 'select_or_voice',
        quickOptions: ['Burning sensation / Heartburn', 'Severe Cramping / Colicky waves', 'Dull continuous heaviness', 'Sharp stabbing pain', 'Bloated and distended']
      },
      {
        stepId: 'socrates_associations',
        code: 'ASSOCIATIONS',
        prompt: {
          en: "Are you experiencing any associated digestive symptoms?",
          hi: "क्या इसके साथ उल्टी, दस्त या खट्टी डकारें भी हैं?",
          ta: "வாந்தி, வயிற்றுப்போக்கு அல்லது அஜீரணம் போன்ற வேறு ஏதேனும் அறிகுறிகள் உள்ளதா?",
          te: "వాంతులు, విరేచనాలు లేదా ఇతర జీర్ణకోశ లక్షణాలు ఉన్నాయా?",
          bn: "বমি, ডায়রিয়া বা অম্বল জাতীয় কোনো লক্ষণ আছে কি?",
          mr: "उलटी, जुलाब किंवा ॲसिडिटीसारखी इतर लक्षणे आहेत का?",
          gu: "ઊલટી, ઝાડા કે એસિડિટી જેવા અન્ય લક્ષણો છે?",
          kn: "ವಾಂತಿ, ಅತಿಸಾರ ಅಥವಾ ಇತರ ಜೀರ್ಣಾಂಗ ಸಂಬಂಧಿತ ಲಕ್ಷಣಗಳಿವೆಯೇ?",
          ml: "ഇതോടൊപ്പം ഛർദ്ദി, വയറിളക്കം അല്ലെങ്കിൽ അസിഡിറ്റി ഉണ്ടോ?",
          pa: "ਕੀ ਇਸਦੇ ਨਾਲ ਉਲਟੀ, ਦਸਤ ਜਾਂ ਐਸੀਡਿਟੀ ਦੇ ਲੱਛਣ ਵੀ ਹਨ?"
        },
        inputType: 'multiselect',
        quickOptions: ['Nausea or Vomiting', 'Loose motions / Diarrhea', 'Sour belching / Acid regurgitation', 'Inability to pass stool or gas', 'Fever with chills', 'Black tarry stools']
      },
      {
        stepId: 'socrates_exacerbating',
        code: 'EXACERBATING',
        prompt: {
          en: "Does food or position change the pain?",
          hi: "क्या खाना खाने से या किसी विशेष मुद्रा से दर्द में फर्क पड़ता है?",
          ta: "உணவு அல்லது அமரும் நிலையை மாற்றுவது வலியை மாற்றுகிறதா?",
          te: "ఆహారం లేదా శరీర భంగిమ వల్ల నొప్పిలో మార్పు వస్తుందా?",
          bn: "খাবার বা অবস্থানের পরিবর্তনের সাথে কি ব্যথার তারতম্য হয়?",
          mr: "अन्न किंवा बसण्याच्या स्थितीमुळे दुखण्यात फरक पडतो का?",
          gu: "ખોરાક કે સ્થિતિ બદલવાથી દુખાવામાં ફેરફાર થાય છે?",
          kn: "ಆಹಾರ ಅಥವಾ ಕುಳಿತುಕೊಳ್ಳುವ ಭಂಗಿಯಿಂದ ನೋವು ಬದಲಾಗುತ್ತದೆಯೇ?",
          ml: "ഭക്ഷണം കഴിക്കുന്നതിനാലോ ഇരിക്കുന്ന രീതിയാലോ വേദനയിൽ വ്യത്യാസമുണ്ടോ?",
          pa: "ਕੀ ਖਾਣਾ ਖਾਣ ਜਾਂ ਬੈਠਣ ਦੀ ਸਥਿਤੀ ਬਦਲਣ ਨਾਲ ਦਰਦ ਵਿੱਚ ਫਰਕ ਪੈਂਦਾ ਹੈ?"
        },
        inputType: 'select_or_voice',
        quickOptions: ['Worse immediately after meals', 'Relieved after eating food/milk', 'Relieved after bowel movement', 'Worse with spicy food / tea / coffee']
      },
      {
        stepId: 'socrates_severity',
        code: 'SEVERITY',
        prompt: {
          en: "Rate the pain severity from 1 to 10:",
          hi: "दर्द की तीव्रता को 1 से 10 के पैमाने पर बताएं:",
          ta: "1 முதல் 10 வரை வலியை மதிப்பிடவும்:",
          te: "నొప్పి తీవ్రతను 1 నుండి 10 స్కేలుపై తెలపండి:",
          bn: "ব্যথার তীব্রতা ১ থেকে ১০ স্কেলে জানান:",
          mr: "दुखण्याची तीव्रता १ ते १० च्या स्केलवर सांगा:",
          gu: "દુખાવાની તીવ્રતા ૧ થી ૧૦ પર દર્શાવો:",
          kn: "ನೋವಿನ ತೀವ್ರತೆಯನ್ನು ೧ ರಿಂದ ೧೦ ರ ಪ್ರಮಾಣದಲ್ಲಿ ತಿಳಿಸಿ:",
          ml: "വേദനയുടെ തീവ്രത 1 മുതൽ 10 വരെയുള്ള സ്കെയിലിൽ രേഖപ്പെടുത്തുക:",
          pa: "ਦਰਦ ਦੀ ਤੀਬਰਤਾ 1 ਤੋਂ 10 ਦੇ ਪੈਮਾਨੇ 'ਤੇ ਦੱਸੋ:"
        },
        inputType: 'slider_rating',
        min: 1,
        max: 10
      }
    ]
  },
  'DEFAULT_GENERAL': {
    code: 'GENERAL_SOCRATES',
    name: 'General Clinical Intake',
    questions: [
      {
        stepId: 'socrates_site',
        code: 'SITE',
        prompt: {
          en: "Where exactly in your body do you feel this symptom?",
          hi: "शरीर के किस हिस्से में यह तकलीफ सबसे ज्यादा है?",
          ta: "உடலில் எங்கே இந்த பிரச்சனை உள்ளது?",
          te: "మీ శరీరంలో ఈ సమస్య ఖచ్చితంగా ఎక్కడ ఉంది?",
          bn: "আপনার শরীরের ঠিক কোথায় এই উপসর্গটি অনুভূত হচ্ছে?",
          mr: "शरीराच्या कोणत्या भागात हा त्रास जास्त जाणवत आहे?",
          gu: "શરીરના કયા ભાગમાં આ તકલીફ સૌથી વધુ છે?",
          kn: "ನಿಮ್ಮ ದೇಹದ ಯಾವ ಭಾಗದಲ್ಲಿ ಈ ತೊಂದರೆ ಹೆಚ್ಚಾಗಿದೆ?",
          ml: "ദയവായി നിങ്ങളുടെ ആരോഗ്യവിവരം വ്യക്തമാക്കുക:",
          pa: "ਕਿਰਪਾ ਕਰਕੇ ਆਪਣੇ ਸਿਹਤ ਲੱਛਣ ਬਾਰੇ ਦੱਸੋ:"
        },
        inputType: 'select_or_voice',
        quickOptions: ['Head & Neck', 'Chest Area', 'Abdomen & Digestive System', 'Lower Back / Spine', 'Knee & Leg Joints', 'Skin & Whole Body']
      },
      {
        stepId: 'socrates_onset',
        code: 'ONSET',
        prompt: {
          en: "When did this trouble start, and did it come suddenly or gradually?",
          hi: "यह तकलीफ कब शुरू हुई, और क्या यह अचानक हुई या धीरे-धीरे?",
          ta: "இது எப்போது தொடங்கியது? திடீரென்றா அல்லது மெதுவாகவா?",
          te: "ఈ సమస్య ఎప్పుడు ప్రారంభమైంది, అకస్మాత్తుగానా లేదా క్రమంగానా?",
          bn: "এই সমস্যা কখন শুরু হয়েছিল এবং এটি কি হঠাৎ নাকি ধীরে ধীরে শুরু হয়েছিল?",
          mr: "हा त्रास कधी सुरू झाला आणि तो अचानक सुरू झाला की हळूहळू?",
          gu: "આ તકલીફ ક્યારે શરૂ થઈ, અને તે અચાનક થઈ કે ધીમે ધીમે?",
          kn: "ಈ ತೊಂದರೆ ಯಾವಾಗ ಪ್ರಾರಂಭವಾಯಿತು, ಇದ್ದಕ್ಕಿದ್ದಂತೆ ಅಥವಾ ನಿಧಾನವಾಗಿ ಪ್ರಾರಂಭವಾಯಿತೇ?",
          ml: "ദയവായി നിങ്ങളുടെ ആരോഗ്യവിവരം വ്യക്തമാക്കുക:",
          pa: "ਕਿਰਪਾ ਕਰਕੇ ਆਪਣੇ ਸਿਹਤ ਲੱਛਣ ਬਾਰੇ ਦੱਸੋ:"
        },
        inputType: 'select_or_voice',
        quickOptions: ['Started today (< 24 hours)', 'Started 2-7 days ago', 'Lasting 2-4 weeks', 'Chronic issue (> 3 months)']
      },
      {
        stepId: 'socrates_character',
        code: 'CHARACTER',
        prompt: {
          en: "How would you describe the feeling?",
          hi: "तकलीफ का प्रकार कैसा है?",
          ta: "உணர்வு எப்படி இருக்கிறது?",
          te: "ఈ బాధ స్వభావం ఎలా ఉంది?",
          bn: "উপসর্গটির অনুভূতি কেমন?",
          mr: "त्रासाचा प्रकार कसा आहे?",
          gu: "તકલીફનો પ્રકાર કેવો છે?",
          kn: "ಈ ತೊಂದರೆಯ ಲಕ್ಷಣ ಹೇಗಿದೆ?",
          ml: "ദയവായി നിങ്ങളുടെ ആരോഗ്യവിവരം വ്യക്തമാക്കുക:",
          pa: "ਕਿਰਪਾ ਕਰਕੇ ਆਪਣੇ ਸਿਹਤ ਲੱਛਣ ਬਾਰੇ ਦੱਸੋ:"
        },
        inputType: 'select_or_voice',
        quickOptions: ['Aching & Soreness', 'Sharp or Throbbing', 'Burning Sensation', 'Stiffness & Restricted Movement', 'Weakness & Exhaustion']
      },
      {
        stepId: 'socrates_associations',
        code: 'ASSOCIATIONS',
        prompt: {
          en: "Any other symptoms you have noticed?",
          hi: "क्या आपने कोई अन्य लक्षण भी महसूस किए हैं?",
          ta: "வேறு ஏதேனும் அறிகுறிகள் உள்ளதா?",
          te: "మీరు గమనించిన ఇతర లక్షణాలు ఏవైనా ఉన్నాయా?",
          bn: "আপনি কি অন্য কোনো লক্ষণ লক্ষ্য করেছেন?",
          mr: "तुम्हाला इतर कोणतीही लक्षणे जाणवली आहेत का?",
          gu: "શું તમે અન્ય કોઈ લક્ષણો પણ અનુભવ્યા છે?",
          kn: "ನೀವು ಗಮನಿಸಿದ ಇತರ ಯಾವುದೇ ಲಕ್ಷಣಗಳಿವೆಯೇ?",
          ml: "ദയവായി നിങ്ങളുടെ ആരോഗ്യവിവരം വ്യക്തമാക്കുക:",
          pa: "ਕਿਰਪਾ ਕਰਕੇ ਆਪਣੇ ਸਿਹਤ ਲੱਛਣ ਬਾਰੇ ਦੱਸੋ:"
        },
        inputType: 'multiselect',
        quickOptions: ['Fever / Chills', 'Fatigue & Body Ache', 'Nausea / Loss of Appetite', 'Morning Stiffness', 'Sleep Disturbance', 'None']
      },
      {
        stepId: 'socrates_exacerbating',
        code: 'EXACERBATING',
        prompt: {
          en: "What makes it better or worse?",
          hi: "किस चीज़ से आराम मिलता है या तकलीफ बढ़ती है?",
          ta: "எது இதனை அதிகப்படுத்துகிறது அல்லது குறைக்கிறது?",
          te: "దేని వల్ల ఉపశమనం లేదా సమస్య పెరుగుదల కలుగుతుంది?",
          bn: "কিসে উপশম হয় বা উপসর্গ বৃদ্ধি পায়?",
          mr: "कशाने आराम मिळतो किंवा त्रास वाढतो?",
          gu: "શેનાથી આરામ મળે છે અથવા તકલીફ વધે છે?",
          kn: "ಯಾವುದರಿಂದ ಆರಾಮ ಸಿಗುತ್ತದೆ ಅಥವಾ ತೊಂದರೆ ಹೆಚ್ಚಾಗುತ್ತದೆ?",
          ml: "ദയവായി നിങ്ങളുടെ ആരോഗ്യവിവരം വ്യക്തമാക്കുക:",
          pa: "ਕਿਰਪਾ ਕਰਕੇ ਆਪਣੇ ਸਿਹਤ ਲੱਛਣ ਬਾਰੇ ਦੱਸੋ:"
        },
        inputType: 'select_or_voice',
        quickOptions: ['Worse with movement / work', 'Relieved by rest and sleep', 'Worse during mornings', 'Worse at night / cold weather']
      },
      {
        stepId: 'socrates_severity',
        code: 'SEVERITY',
        prompt: {
          en: "On a scale from 1 (mild) to 10 (severe), how bad is it right now?",
          hi: "1 से 10 के पैमाने पर, यह तकलीफ अभी कितनी अधिक है?",
          ta: "1 முதல் 10 வரை இந்த பிரச்சனை எவ்வளவு தீவிரமாக உள்ளது?",
          te: "1 నుండి 10 స్కేలుపై, ఈ సమస్య ప్రస్తుతం ఎంత తీవ్రంగా ఉంది?",
          bn: "১ থেকে ১০ স্কেলে, এটি বর্তমানে কতটা তীব্র?",
          mr: "१ ते १० च्या स्केलवर, हा त्रास सध्या किती तीव्र आहे?",
          gu: "૧ થી ૧૦ ના સ્કેલ પર, આ તકલીફ અત્યારે કેટલી વધારે છે?",
          kn: "೧ ರಿಂದ ೧೦ ರ ಪ್ರಮಾಣದಲ್ಲಿ, ಈ ತೊಂದರೆ ಈಗ ಎಷ್ಟು ತೀವ್ರವಾಗಿದೆ?",
          ml: "ദയവായി നിങ്ങളുടെ ആരോഗ്യവിവരം വ്യക്തമാക്കുക:",
          pa: "ਕਿਰਪਾ ਕਰਕੇ ਆਪਣੇ ਸਿਹਤ ਲੱਛਣ ਬਾਰੇ ਦੱਸੋ:"
        },
        inputType: 'slider_rating',
        min: 1,
        max: 10
      }
    ]
  }
};

export const AYUSH_DASHAVIDHA_QUESTIONS = [
  {
    stepId: 'ayush_prakriti',
    code: 'PRAKRITI',
    category: 'Deha Prakriti (Constitutional Bio-type)',
    prompt: {
      en: "Which traits best describe your natural physical constitution (Prakriti)?",
      hi: "आपकी स्वाभाविक शारीरिक प्रकृति किस प्रकार की है?",
      ta: "உங்கள் இயல்பான உடல் அமைப்பு (பிரகிருதி) எத்தகையது?",
      te: "మీ సహజ శరీర ప్రకృతి (ప్రకృతి) ఎలాంటిది?",
      bn: "আপনার সহজাত শারীরিক গঠন (প্রকৃতি) কেমন?",
      mr: "तुमची मूळ शारीरिक प्रकृती कशी आहे?",
      gu: "તમારી સ્વાભાવિક શારીરિક પ્રકૃતિ કયા પ્રકારની છે?",
      kn: "ನಿಮ್ಮ ಸಹಜ ಶಾರೀರಿಕ ಪ್ರಕೃತಿ ಹೇಗಿದೆ?",
      ml: "ദയവായി നിങ്ങളുടെ ആരോഗ്യവിവരം വ്യക്തമാക്കുക:",
      pa: "ਕਿਰਪਾ ਕਰਕੇ ਆਪਣੇ ਸਿਹਤ ਲੱਛਣ ਬਾਰੇ ਦੱਸੋ:"
    },
    inputType: 'select_or_voice',
    quickOptions: ['Vataja (Slim frame, dry skin, quick movements, sensitive to cold)', 'Pittaja (Medium build, warm body, sharp appetite, easily flushed)', 'Kaphaja (Broad sturdy build, calm, slow digestion, thick skin)', 'Vata-Pitta Prakriti', 'Pitta-Kapha Prakriti', 'Tridosha / Sama Prakriti']
  },
  {
    stepId: 'ayush_vikriti',
    code: 'VIKRITI',
    category: 'Vikriti (Current Dosha Imbalance)',
    prompt: {
      en: "Which doshic imbalance or symptoms are currently predominant (Vikriti)?",
      hi: "वर्तमान में आपको कौन से दोष के लक्षण महसूस हो रहे हैं?",
      ta: "தற்போது உங்களுக்கு எந்த தோஷத்தின் அறிகுறிகள் அதிகமாக உள்ளன?",
      te: "ప్రస్తుతం మీకు ఏ దోష లక్షణాలు ఎక్కువగా కనిపిస్తున్నాయి?",
      bn: "বর্তমানে আপনার কোন দোষের লক্ষণ বেশি প্রকাশ পাচ্ছে?",
      mr: "सध्या तुम्हाला कोणत्या दोषाची लक्षणे जाणवत आहेत?",
      gu: "હાલમાં તમને કયા દોષના લક્ષણો જણાય છે?",
      kn: "ಪ್ರಸ್ತುತ ಯಾವ ದೋಷದ ಲಕ್ಷಣಗಳು ಕಂಡುಬರುತ್ತಿವೆ?",
      ml: "ദയവായി നിങ്ങളുടെ ആരോഗ്യവിവരം വ്യക്തമാക്കുക:",
      pa: "ਕਿਰਪਾ ਕਰਕੇ ਆਪਣੇ ਸਿਹਤ ਲੱਛਣ ਬਾਰੇ ਦੱਸੋ:"
    },
    inputType: 'select_or_voice',
    quickOptions: ['Vata Dushti (Joint aches, gas/constipation, dryness, insomnia)', 'Pitta Dushti (Hyperacidity, burning sensation, skin flares, irritability)', 'Kapha Dushti (Heaviness, sluggish digestion, mucous, lethargy)', 'Pitta-Vataja Dushti (Amlapitta, nerve/burning pain)']
  },
  {
    stepId: 'ayush_sara',
    code: 'SARA',
    category: 'Sara (Tissue Vitality & Dhatu Quality)',
    prompt: {
      en: "How is your overall tissue vitality and strength (Dhatu Sara)?",
      hi: "आपकी शारीरिक धातुओं और मांसपेशियों का बल कैसा है?",
      ta: "உங்கள் உடல் தாதுக்கள் மற்றும் தசைகளின் வலிமை எப்படி உள்ளது?",
      te: "మీ శరీర ధాతువుల బలం మరియు రోగనిరోధక శక్తి ఎలా ఉంది?",
      bn: "আপনার শারীরিক ধাতু ও মাংসপেশির শক্তি কেমন?",
      mr: "तुमच्या शारीरिक धातू आणि स्नायूंचे बळ कसे आहे?",
      gu: "તમારા શારીરિક ધાતુઓ અને સ્નાયુઓનું બળ કેવું છે?",
      kn: "ನಿಮ್ಮ ಶಾರೀರಿಕ ಧಾತುಗಳ ಮತ್ತು ಸ್ನಾಯುಗಳ ಬಲ ಹೇಗಿದೆ?",
      ml: "ദയവായി നിങ്ങളുടെ ആരോഗ്യവിവരം വ്യക്തമാക്കുക:",
      pa: "ਕਿਰਪਾ ਕਰਕੇ ਆਪਣੇ ਸਿਹਤ ਲੱਛਣ ਬਾਰੇ ਦੱਸੋ:"
    },
    inputType: 'select_or_voice',
    quickOptions: ['Pravara Sara (Excellent tissue tone, strong muscles and bones)', 'Madhyama Sara (Moderate tissue vitality and strength)', 'Avara Sara (Weak muscular tone, low stamina)']
  },
  {
    stepId: 'ayush_samhanana',
    code: 'SAMHANANA',
    category: 'Samhanana (Body Compactness & Skeletal Symmetry)',
    prompt: {
      en: "How is your body frame compactness and skeletal build?",
      hi: "शारीरिक गठन और हड्डियों की मजबूती कैसी है?",
      ta: "உடல் கட்டமைப்பு மற்றும் எலும்புகளின் உறுதி எப்படி உள்ளது?",
      te: "శరీర నిర్మాణం మరియు ఎముకల దృఢత్వం ఎలా ఉంది?",
      bn: "শারীরিক গঠন ও হাড়ের মজবুতি কেমন?",
      mr: "शरीराची ठेवण आणि हाडांची बळकटी कशी आहे?",
      gu: "શારીરિક બાંધો અને હાડકાંની મજબૂતી કેવી છે?",
      kn: "ದೇಹದ ರಚನೆ ಮತ್ತು ಮೂಳೆಗಳ ಬಲ ಹೇಗಿದೆ?",
      ml: "ദയവായി നിങ്ങളുടെ ആരോഗ്യവിവരം വ്യക്തമാക്കുക:",
      pa: "ਕਿਰਪਾ ਕਰਕੇ ਆਪਣੇ ਸਿਹਤ ਲੱਛਣ ਬਾਰੇ ਦੱਸੋ:"
    },
    inputType: 'select_or_voice',
    quickOptions: ['Su-samhanana (Well-compact, symmetric, firm joints)', 'Madhyama Samhanana (Average body compactness)', 'Hina Samhanana (Loose joints, asymmetric build)']
  },
  {
    stepId: 'ayush_pramana',
    code: 'PRAMANA',
    category: 'Pramana (Anthropometrics & Body Proportions)',
    prompt: {
      en: "How are your height, weight, and body proportions?",
      hi: "आपकी ऊंचाई, वजन और शारीरिक माप की स्थिति कैसी है?",
      ta: "உங்கள் உயரம், எடை மற்றும் உடல் விகிதம் எப்படி உள்ளது?",
      te: "మీ ఎత్తు, బరువు మరియు శరీర నిష్పత్తి ఎలా ఉంది?",
      bn: "আপনার উচ্চতা, ওজন এবং শারীরিক অনুপাত কেমন?",
      mr: "तुमची उंची, वजन आणि शारीरिक प्रमाण कसे आहे?",
      gu: "તમારી ઊંચાઈ, વજન અને શારીરિક પ્રમાણ કેવું છે?",
      kn: "ನಿಮ್ಮ ಎತ್ತರ, ತೂಕ ಮತ್ತು ಶಾರೀರಿಕ ಪ್ರಮಾಣ ಹೇಗಿದೆ?",
      ml: "ദയവായി നിങ്ങളുടെ ആരോഗ്യവിവരം വ്യക്തമാക്കുക:",
      pa: "ਕਿਰਪਾ ਕਰਕੇ ਆਪਣੇ ਸਿਹਤ ਲੱਛਣ ਬਾਰੇ ਦੱਸੋ:"
    },
    inputType: 'select_or_voice',
    quickOptions: ['Yathokta Pramana (Normal height and balanced weight)', 'Atisthaulya (Overweight / Obese)', 'Atikarshya (Underweight / Emaciated)']
  },
  {
    stepId: 'ayush_satmya',
    code: 'SATMYA',
    category: 'Satmya (Dietary & Habitual Adaptability)',
    prompt: {
      en: "What foods and habits are well-tolerated by your body (Satmya)?",
      hi: "आपको किस प्रकार का आहार और वातावरण अनुकूल रहता है?",
      ta: "உங்களுக்கு எந்த வகையான உணவும் பழக்கவழக்கமும் ஒத்துக்கொள்கிறது?",
      te: "మీ శరీరానికి ఎలాంటి ఆహారం మరియు వాతావరణం సరిపడుతుంది?",
      bn: "আপনার শরীরে কোন ধরণের খাবার ও অভ্যাস মানানসই?",
      mr: "तुम्हाला कोणत्या प्रकारचा आहार आणि वातावरण मानवते?",
      gu: "તમને કેવો ખોરાક અને વાતાવરણ અનુકૂળ આવે છે?",
      kn: "ನಿಮಗೆ ಯಾವ ರೀತಿಯ ಆಹಾರ ಮತ್ತು ವಾತಾವರಣ ಹೊಂದಿಕೊಳ್ಳುತ್ತದೆ?",
      ml: "ദയവായി നിങ്ങളുടെ ആരോഗ്യവിവരം വ്യക്തമാക്കുക:",
      pa: "ਕਿਰਪਾ ਕਰਕੇ ਆਪਣੇ ਸਿਹਤ ਲੱਛਣ ਬਾਰੇ ਦੱਸੋ:"
    },
    inputType: 'select_or_voice',
    quickOptions: ['Sarva-Rasa Satmya (Tolerates all 6 tastes comfortably)', 'Madhura/Snigdha Satmya (Prefers warm, nourishing sweet/unctuous food)', 'Visham Satmya (Easily disturbed by cold, spicy or dry food)']
  },
  {
    stepId: 'ayush_satva',
    code: 'SATVA',
    category: 'Satva (Mental Resilience & Psychological Balance)',
    prompt: {
      en: "How is your mental resilience under stress, anxiety, or illness?",
      hi: "मानसिक तनाव, चिंता और दर्द सहन करने की आपकी क्षमता कैसी है?",
      ta: "மன அழுத்தம், பயம் மற்றும் வலியைத் தாங்கும் உங்கள் மன உறுதி எப்படி உள்ளது?",
      te: "ఒత్తిడి, ఆందోళన మరియు నొప్పిని తట్టుకునే మీ మానసిక ధైర్యం ఎలా ఉంది?",
      bn: "মানসিক চাপ, উদ্বেগ এবং কষ্ট সহ্য করার ক্ষমতা কেমন?",
      mr: "मानसिक ताण, चिंता आणि वेदना सहन करण्याची क्षमता कशी आहे?",
      gu: "માનસિક તણાવ અને ચિંતા સહન કરવાની તમારી ક્ષમતા કેવી છે?",
      kn: "ಮಾನಸಿಕ ಒತ್ತಡ ಮತ್ತು ನೋವನ್ನು ಸಹಿಸಿಕೊಳ್ಳುವ ನಿಮ್ಮ ಸಾಮರ್ಥ್ಯ ಹೇಗಿದೆ?",
      ml: "ദയവായി നിങ്ങളുടെ ആരോഗ്യവിവരം വ്യക്തമാക്കുക:",
      pa: "ਕਿਰਪਾ ਕਰਕੇ ਆਪਣੇ ਸਿਹਤ ਲੱਛਣ ਬਾਰੇ ਦੱਸੋ:"
    },
    inputType: 'select_or_voice',
    quickOptions: ['Pravara Satva (High mental fortitude, remains calm under stress)', 'Madhyama Satva (Moderate resilience, manages with reassurance)', 'Avara Satva (Easily panicked, high anxiety, vulnerable to distress)']
  },
  {
    stepId: 'ayush_ahara_shakti',
    code: 'AHARA_SHAKTI',
    category: 'Ahara Shakti (Digestive Capacity & Agni)',
    prompt: {
      en: "How is your appetite (Abhyavaharana) and digestive speed (Jarana Shakti)?",
      hi: "आपकी भूख और भोजन पचाने की शक्ति (अग्नि) कैसी है?",
      ta: "உங்கள் பசி மற்றும் ஜீரண சக்தி (அக்னி) எப்படி உள்ளது?",
      te: "మీ ఆకలి మరియు ఆహారాన్ని జీర్ణం చేసుకునే శక్తి (అగ్ని) ఎలా ఉంది?",
      bn: "আপনার ক্ষুধা এবং হজম শক্তি কেমন?",
      mr: "तुमची भूक आणि पचनशक्ती (अग्नी) कशी आहे?",
      gu: "તમારી ભૂખ અને પાચનશક્તિ (અગ્નિ) કેવી છે?",
      kn: "ನಿಮ್ಮ ಹಸಿವು ಮತ್ತು ಜೀರ್ಣಶಕ್ತಿ (ಅಗ್ನಿ) ಹೇಗಿದೆ?",
      ml: "ദയവായി നിങ്ങളുടെ ആരോഗ്യവിവരം വ്യക്തമാക്കുക:",
      pa: "ਕਿਰਪਾ ਕਰਕੇ ਆਪਣੇ ਸਿਹਤ ਲੱਛਣ ਬਾਰੇ ਦੱਸੋ:"
    },
    inputType: 'select_or_voice',
    quickOptions: ['Samagni (Balanced, comfortable digestion within 3-4 hours)', 'Tikshnagni (Very sharp appetite, burning, rapid hunger)', 'Mandagni (Sluggish digestion, bloating, heaviness after small meals)', 'Vishamagni (Irregular hunger, unpredictable digestion and gas)']
  },
  {
    stepId: 'ayush_koshtha',
    code: 'KOSHTHA',
    category: 'Koshtha (Bowel & Alimentary Tract Nature)',
    prompt: {
      en: "How are your bowel movements and digestive elimination (Koshtha)?",
      hi: "आपका पेट साफ होने और मल विसर्जन की प्रकृति (कोष्ठ) कैसी है?",
      ta: "உங்கள் குடல் இயக்கம் மற்றும் மலம் கழித்தல் (கோஷ்டம்) எப்படி உள்ளது?",
      te: "మీ జీర్ణ వ్యవస్థ మరియు మల విసర్జన స్వభావం (కోష్ఠం) ఎలా ఉంది?",
      bn: "আপনার পেট পরিষ্কার হওয়ার প্রকৃতি (কোষ্ঠ) কেমন?",
      mr: "तुमचे पोट साफ होण्याचे स्वरूप (कोष्ठ) कसे आहे?",
      gu: "તમારો પેટ સાફ થવાનો સ્વભાવ (કોષ્ઠ) કેવો છે?",
      kn: "ನಿಮ್ಮ ಮಲವಿಸರ್ಜನೆ ಮತ್ತು ಜೀರ್ಣಾಂಗ ಪ್ರವೃತ್ತಿ (ಕೋಷ್ಠ) ಹೇಗಿದೆ?",
      ml: "നിങ്ങളുടെ ദഹന-ശോധന സ്വഭാവം (കോഷ്ഠം) എങ്ങനെയുണ്ട്?",
      pa: "ਤੁਹਾਡਾ ਪੇਟ ਸਾਫ਼ ਹੋਣ ਦੀ ਪ੍ਰਕਿਰਤੀ (ਕੋਸ਼ਠ) ਕਿਹੋ ਜਿਹੀ ਹੈ?"
    },
    inputType: 'select_or_voice',
    quickOptions: [
      'Mridu Koshtha (Soft/easy bowels, tendency towards loose stools or diarrhea)',
      'Madhyama Koshtha (Balanced, regular daily bowel movements without difficulty)',
      'Krura Koshtha (Hard stools, constipation tendency, requires strong stimulus)'
    ]
  },
  {
    stepId: 'ayush_vyayama_shakti',
    code: 'VYAYAMA_SHAKTI',
    category: 'Vyayama Shakti (Physical Endurance & Exercise Capacity)',
    prompt: {
      en: "How is your physical endurance and exercise capacity?",
      hi: "आपकी शारीरिक कार्यक्षमता और व्यायाम सहनशक्ति कैसी है?",
      ta: "உடல் சகிப்புத்தன்மை மற்றும் வேலை செய்யும் திறன் எப்படி உள்ளது?",
      te: "మీ శారీరక శ్రమ మరియు వ్యాయామం చేసే సత్తువ ఎలా ఉంది?",
      bn: "আপনার শারীরিক সহনশীলতা ও পরিশ্রম করার ক্ষমতা কেমন?",
      mr: "तुमची शारीरिक सहनशक्ती आणि व्यायाम करण्याची क्षमता कशी आहे?",
      gu: "તમારી શારીરિક ક્ષમતા અને કસરત સહનશક્તિ કેવી છે?",
      kn: "ನಿಮ್ಮ ದೈಹಿಕ ಶಕ್ತಿ ಮತ್ತು ವ್ಯಾಯಾಮ ಮಾಡುವ ಸಾಮರ್ಥ್ಯ ಹೇಗಿದೆ?",
      ml: "ദയവായി നിങ്ങളുടെ ആരോഗ്യവിവരം വ്യക്തമാക്കുക:",
      pa: "ਕਿਰਪਾ ਕਰਕੇ ਆਪਣੇ ਸਿਹਤ ਲੱਛਣ ਬਾਰੇ ਦੱਸੋ:"
    },
    inputType: 'select_or_voice',
    quickOptions: ['Pravara (High stamina, brisk activity without breathlessness)', 'Madhyama (Moderate endurance for daily routine work)', 'Avara (Easily fatigued, breathlessness with minimal exertion)']
  },
  {
    stepId: 'ayush_vaya',
    code: 'VAYA',
    category: 'Vaya (Chronological Age Phase)',
    prompt: {
      en: "What life stage are you currently in?",
      hi: "आप जीवन की किस आयु अवस्था में हैं?",
      ta: "நீங்கள் வாழ்க்கையின் எந்த வயதில் இருக்கிறீர்கள்?",
      te: "మీరు జీవితంలోని ఏ వయోదశలో ఉన్నారు?",
      bn: "আপনি জীবনের কোন বয়সে রয়েছেন?",
      mr: "तुम्ही आयुष्याच्या कोणत्या वयात आहात?",
      gu: "તમે જીવનના કયા વય તબક્કામાં છો?",
      kn: "ನೀವು ಜೀವನದ ಯಾವ ವಯಸ್ಸಿನ ಹಂತದಲ್ಲಿದ್ದೀರಿ?",
      ml: "ദയവായി നിങ്ങളുടെ ആരോഗ്യവിവരം വ്യക്തമാക്കുക:",
      pa: "ਕਿਰਪਾ ਕਰਕੇ ਆਪਣੇ ਸਿਹਤ ਲੱਛਣ ਬਾਰੇ ਦੱਸੋ:"
    },
    inputType: 'select_or_voice',
    quickOptions: ['Balya Vavastha (Childhood / Growth phase - Kapha dominant)', 'Yuva / Madhyama Vavastha (Adult phase - Pitta dominant)', 'Jirna / Vriddha Vavastha (Senior phase - Vata dominant)']
  },
  {
    stepId: 'ayush_ahara_vihara',
    code: 'AHARA_VIHARA',
    category: 'Ahara-Vihara (Dietary & Daily Lifestyle Regimen)',
    prompt: {
      en: "Describe your daily dietary habits, meal timings, and sleep schedule:",
      hi: "अपने दैनिक खानपान, भोजन के समय और सोने की दिनचर्या का विवरण दें:",
      ta: "உங்கள் தினசரி உணவுப் பழக்கம் மற்றும் தூக்க முறையை விவரிக்கவும்:",
      te: "మీ రోజువారీ ఆహారపు అలవాట్లు, భోజన వేళలు మరియు నిద్ర గురించి తెలపండి:",
      bn: "আপনার দৈনিক খাদ্যাভ্যাস এবং ঘুমের সময়সূচী বর্ণনা করুন:",
      mr: "तुमच्या रोजच्या खाण्यापिण्याच्या सवयी आणि झोपेचे वेळापत्रक सांगा:",
      gu: "તમારી રોજિંદી ખાણીપીણીની ટેવો અને ઊંઘનું સમયપત્રક જણાવો:",
      kn: "ನಿಮ್ಮ ದೈನಂದಿನ ಆಹಾರ ಪದ್ಧತಿ ಮತ್ತು ನಿದ್ರೆಯ ವೇಳಾಪಟ್ಟಿಯನ್ನು ವಿವರಿಸಿ:",
      ml: "നിങ്ങളുടെ ഭക്ഷണരീതിയും ദിനചര്യകളും (ആഹാര-വിഹാരം) എങ്ങനെയുണ്ട്?",
      pa: "ਤੁਹਾਡੀਆਂ ਆਮ ਖਾਣ-ਪੀਣ ਦੀਆਂ ਆਦਤਾਂ ਅਤੇ ਰੋਜ਼ਾਨਾ ਰੁਟੀਨ (ਆਹਾਰ-ਵਿਹਾਰ) ਕਿਹੋ ਜਿਹਾ ਹੈ?"
    },
    inputType: 'select_or_voice',
    quickOptions: ['Regular home-cooked vegetarian diet, timely 7-hour sleep', 'Irregular late-night eating, high intake of tea/coffee/fried foods', 'Non-vegetarian diet with frequent outside dining, disrupted sleep (night shifts)', 'Sedentary desk job with high screen time and minimal physical activity']
  }
];

export const SENSITIVE_HISTORY_QUESTIONS = [
  {
    stepId: 'personal_history',
    code: 'PERSONAL_HISTORY',
    category: 'Personal History (Substance & Habits)',
    isSensitive: true,
    sensitiveCategory: 'Substance Use',
    prompt: {
      en: "Do you consume tobacco (smoking/chewing) or alcohol?",
      hi: "क्या आप तंबाकू (धूम्रपान/गुटखा) या शराब का सेवन करते हैं?",
      ta: "நீங்கள் புகையிலை (புகைபிடித்தல்/மெல்லுதல்) அல்லது மது அருந்துகிறீர்களா?",
      te: "మీరు పొగాకు (ధూమపానం/నమలడం) లేదా మద్యం సేవిస్తారా?",
      bn: "আপনি কি তামাক (ধূমপান/জর্দা) বা অ্যালকোহল গ্রহণ করেন?",
      mr: "तुम्ही तंबाखू (धूम्रपान/गुटखा) किंवा मद्यपान करता का?",
      gu: "શું તમે તમાકુ (ધૂમ્રપાન/ગુટખા) કે આલ્કોહોલનું સેવન કરો છો?",
      kn: "ನೀವು ತಂಬಾಕು (ಧೂಮಪಾನ/ಅಗಿಯುವುದು) ಅಥವಾ ಮದ್ಯಪಾನ ಮಾಡುತ್ತೀರಾ?",
      ml: "നിങ്ങൾ പുകയിലയോ മദ്യമോ ഉപയോഗിക്കാറുണ്ടോ?",
      pa: "ਕੀ ਤੁਸੀਂ ਤੰਬਾਕੂ ਜਾਂ ਸ਼ਰਾਬ ਦਾ ਸੇਵਨ ਕਰਦੇ ਹੋ?"
    },
    inputType: 'select_or_voice',
    quickOptions: [
      'Non-smoker / No alcohol use',
      'Occasional / Social alcohol use',
      'Daily cigarette / bidi smoking',
      'Smokeless tobacco / Gutkha / Khaini use',
      'Past user (Quit > 1 year ago)'
    ]
  },
  {
    stepId: 'review_of_systems_mental',
    code: 'MENTAL_HEALTH',
    category: 'Review of Systems (Mental Well-being & Mood)',
    isSensitive: true,
    sensitiveCategory: 'Mental Health',
    prompt: {
      en: "Over the past 2 weeks, have you experienced persistent low mood, anxiety, or sleep disturbances?",
      hi: "पिछले 2 हफ्तों में, क्या आपने लगातार उदासी, घबराहट या नींद में परेशानी महसूस की है?",
      ta: "கடந்த 2 வாரங்களில், உங்களுக்கு மனச்சோர்வு, பதட்டம் அல்லது தூக்கமின்மை ஏற்பட்டுள்ளதா?",
      te: "గత 2 వారాలుగా, మీకు మానసిక నిరాశ, ఆందోళన లేదా నిద్రలేమి సమస్యలు ఎదురవుతున్నాయా?",
      bn: "বিগত ২ সপ্তাহে, আপনি কি বিষণ্ণতা, উদ্বেগ বা ঘুমের সমস্যা অনুভব করছেন?",
      mr: "गेल्या २ आठवड्यात, तुम्हाला सतत नैराश्य, चिंता किंवा झोपेचा त्रास जाणवला आहे का?",
      gu: "છેલ્લા ૨ અઠવાડિયામાં, શું તમે સતત ઉદાસી, ચિંતા અથવા ઊંઘમાં ખલેલ અનુભવી છે?",
      kn: "ಕಳೆದ 2 ವಾರಗಳಲ್ಲಿ, ನೀವು ನಿರಂತರ ಖಿನ್ನತೆ, ಆತಂಕ ಅಥವಾ ನಿದ್ರಾಹೀನತೆಯನ್ನು ಅನುಭವಿಸಿದ್ದೀರಾ?",
      ml: "കഴിഞ്ഞ 2 ആഴ്ചയായി കടുത്ത വിഷാദമോ ഉത്കണ്ഠയോ ഉറക്കക്കുറവോ അനുഭവപ്പെടുന്നുണ്ടോ?",
      pa: "ਪਿਛਲੇ 2 ਹਫ਼ਤਿਆਂ ਵਿੱਚ, ਕੀ ਤੁਸੀਂ ਉਦਾਸੀ, ਘਬਰਾਹਟ ਜਾਂ ਨੀਂਦ ਦੀ ਸਮੱਸਿਆ ਮਹਿਸੂਸ ਕੀਤੀ ਹੈ?"
    },
    inputType: 'select_or_voice',
    quickOptions: [
      'No emotional distress or anxiety',
      'Mild occasional stress / worry',
      'Persistent anxiety or panic feelings',
      'Depressed mood / Loss of interest',
      'Significant sleep disturbance / insomnia'
    ]
  },
  {
    stepId: 'review_of_systems_reproductive',
    code: 'REPRODUCTIVE_HEALTH',
    category: 'Review of Systems (Reproductive & Genitourinary)',
    isSensitive: true,
    sensitiveCategory: 'Reproductive Health',
    prompt: {
      en: "Do you have any private reproductive, menstrual, or urinary concerns to disclose?",
      hi: "क्या आपको कोई निजी प्रजनन, मासिक धर्म या मूत्र संबंधी समस्या है?",
      ta: "மாதவிடாய், பிறப்புறுப்பு அல்லது சிறுநீர் கழிப்பதில் ஏதேனும் அந்தரங்கப் பிரச்சனைகள் உள்ளதா?",
      te: "మీకు బహిష్టు, పునరుత్పత్తి లేదా మూత్ర సంబంధిత వ్యక్తిగత సమస్యలు ఏవైనా ఉన్నాయా?",
      bn: "মাসিক, প্রজনন বা প্রস্রাব সংক্রান্ত কোনো ব্যক্তিগত সমস্যা রয়েছে কি?",
      mr: "मासिक पाळी, प्रजनन किंवा लघवीसंबंधी काही खाजगी तक्रार आहे का?",
      gu: "માસિક ધર્મ, પ્રજનન અથવા પેશાબ સંબંધિત કોઈ અંગત તકલીફ છે?",
      kn: "ಮುಟ್ಟು, ಸಂತಾನೋತ್ಪತ್ತಿ ಅಥವಾ ಮೂತ್ರ ವಿಸರ್ಜನೆಗೆ ಸಂಬಂಧಿಸಿದ ಯಾವುದೇ ಖಾಸಗಿ ಸಮಸ್ಯೆ ಇದೆಯೇ?",
      ml: "ആർത്തവ സംബന്ധമായോ മൂത്രാശയ സംബന്ധമായോ എന്തെങ്കിലും സ്വകാര്യ ബുദ്ധിമുട്ടുകൾ ഉണ്ടോ?",
      pa: "ਕੀ ਮਾਹਵਾਰੀ ਜਾਂ ਪਿਸ਼ਾਬ ਨਾਲ ਸੰਬੰਧਿਤ ਕੋਈ ਨਿੱਜੀ ਸਮੱਸਿਆ ਹੈ?"
    },
    inputType: 'select_or_voice',
    quickOptions: [
      'None / No reproductive or urinary concerns',
      'Irregular or painful menstrual cycles',
      'Burning urination / Urinary frequency',
      'Pelvic pain or discomfort',
      'Currently pregnant / Postpartum'
    ]
  }
];

export function getAdaptiveQuestions(complaintText = '', mode = 'STANDARD_SOCRATES') {
  const isAyush = mode === 'AYUSH_DASHAVIDHA';
  const lower = complaintText.toLowerCase();

  let socratesTree = ADAPTIVE_COMPLAINT_TREES.DEFAULT_GENERAL;
  if (lower.includes('chest') || lower.includes('heart') || lower.includes('angina') || lower.includes('छाती') || lower.includes('மார்பு') || lower.includes('ఛాతీ') || lower.includes('বুক')) {
    socratesTree = ADAPTIVE_COMPLAINT_TREES.CHEST_PAIN;
  } else if (lower.includes('stomach') || lower.includes('abdomen') || lower.includes('acidity') || lower.includes('vomit') || lower.includes('पेट') || lower.includes('வயிறு') || lower.includes('కడుపు') || lower.includes('পেট')) {
    socratesTree = ADAPTIVE_COMPLAINT_TREES.ABDOMINAL_PAIN;
  }

  // Chief complaint question is always first
  const ccQuestion = {
    stepId: 'chief_complaint',
    code: 'CC',
    prompt: {
      en: "Please state your main health symptom or reason for visit today:",
      hi: "कृपया बताएं कि आज आप अस्पताल किस मुख्य समस्या या तकलीफ के लिए आए हैं?",
      ta: "இன்று நீங்கள் மருத்துவமனைக்கு வந்ததற்கான முக்கிய காரணம் என்ன?",
      te: "ఈరోజు మీరు ఆసుపత్రికి రావడానికి ప్రధాన ఆరోగ్య సమస్య ఏమిటి?",
      bn: "আজ আপনার হাসপাতালে আসার প্রধান কারণ বা লক্ষণটি কী?",
      mr: "आज तुम्ही रुग्णालयात येण्याचे मुख्य कारण किंवा समस्या काय आहे?",
      gu: "આજે તમે હોસ્પિટલ આવવાનું મુખ્ય કારણ અથવા તકલીફ શું છે?",
      kn: "ಇಂದು ನೀವು ಆಸ್ಪತ್ರೆಗೆ ಭೇಟಿ ನೀಡಲು ಮುಖ್ಯ ಕಾರಣ ಅಥವಾ ಆರೋಗ್ಯ ಸಮಸ್ಯೆ ಏನು?",
      ml: "ഇന്ന് ആശുപത്രി സന്ദർശിക്കാൻ ഇടയാക്കിയ പ്രധാന രോഗലക്ഷണം വ്യക്തമാക്കുക:",
      pa: "ਕਿਰਪਾ ਕਰਕੇ ਅੱਜ ਹਸਪਤਾਲ ਆਉਣ ਦਾ ਮੁੱਖ ਕਾਰਨ ਜਾਂ ਲੱਛਣ ਦੱਸੋ:"
    },
    inputType: 'select_or_voice',
    quickOptions: [
      'Chest Discomfort / Pressure',
      'Stomach Pain & Acidity',
      'Joint Pain & Stiffness',
      'High Fever & Body Ache',
      'Shortness of Breath',
      'Severe Headache / Dizziness'
    ]
  };

  const questions = [ccQuestion, ...socratesTree.questions];
  const baseQuestions = isAyush 
    ? [...questions, ...AYUSH_DASHAVIDHA_QUESTIONS, ...SENSITIVE_HISTORY_QUESTIONS] 
    : [...questions, ...SENSITIVE_HISTORY_QUESTIONS];

  // Enrich with 22-language prompts
  const enrichedQuestions = baseQuestions.map(q => {
    const socratesExtra = socrates22Translations[q.stepId];
    const ayushExtra = ayush22Translations[q.stepId];
    return {
      ...q,
      prompt: {
        ...q.prompt,
        ...(socratesExtra || {}),
        ...(ayushExtra || {})
      }
    };
  });

  return enrichedQuestions;
}

export function generateStructuredSummary(patient, answers, extractedEntities = [], mode = 'STANDARD_SOCRATES') {
  const isAyush = mode === 'AYUSH_DASHAVIDHA';
  const cc = answers.chief_complaint || null;

  // Format Patient Demographics Section (Section 1)
  let calcAge = patient.age;
  if (!calcAge && patient.dob) {
    const bDate = new Date(patient.dob);
    if (!isNaN(bDate.getTime())) {
      const now = new Date();
      let y = now.getFullYear() - bDate.getFullYear();
      const m = now.getMonth() - bDate.getMonth();
      const d = now.getDate() - bDate.getDate();
      if (m < 0 || (m === 0 && d < 0)) y--;
      calcAge = y >= 0 ? y : 0;
    }
  }
  const ageDisplay = calcAge !== undefined && calcAge !== null ? `${calcAge} years` : 'Adult';
  const demographicsSummary = `${patient.full_name}, ${patient.gender || 'Unknown gender'}, Age: ${ageDisplay}, Mobile: ${patient.phone_number || 'Not provided'}, ABHA: ${patient.abha_number || patient.abha_address || 'Walk-in / Direct Registration'}.`;

  // Format HPI Section (Section 3) - Only include what patient actually answered
  const socratesDetails = [];
  if (answers.socrates_site) socratesDetails.push(`Site: ${answers.socrates_site}`);
  if (answers.socrates_onset) socratesDetails.push(`Onset: ${answers.socrates_onset}`);
  if (answers.socrates_character) socratesDetails.push(`Character: ${answers.socrates_character}`);
  if (answers.socrates_radiation) socratesDetails.push(`Radiation: ${answers.socrates_radiation}`);
  if (answers.socrates_associations) {
    const assoc = Array.isArray(answers.socrates_associations) ? answers.socrates_associations.join(', ') : answers.socrates_associations;
    if (assoc.trim() && assoc !== 'None') socratesDetails.push(`Associated symptoms: ${assoc}`);
  }
  if (answers.socrates_timing) socratesDetails.push(`Timing: ${answers.socrates_timing}`);
  if (answers.socrates_exacerbating) socratesDetails.push(`Modifying factors: ${answers.socrates_exacerbating}`);
  if (answers.socrates_severity) socratesDetails.push(`Severity: ${answers.socrates_severity}/10`);

  let hpiNarrative = socratesDetails.length > 0
    ? `Patient presents with ${cc || 'clinical symptoms'}. Clinical Evaluation: ${socratesDetails.join('; ')}.`
    : (cc ? `Patient presents with ${cc}.` : null);

  // Investigations & Document Extraction Summary - STRICT: only if entities exist
  let priorInvestigations = null;
  if (extractedEntities && extractedEntities.length > 0) {
    const abnormalLabs = extractedEntities.filter(e => e.is_abnormal);
    const normalLabs = extractedEntities.filter(e => e.category === 'LAB_VALUE' && !e.is_abnormal);
    const meds = extractedEntities.filter(e => e.category === 'MEDICATION');
    const diags = extractedEntities.filter(e => e.category === 'DIAGNOSIS');

    const parts = [];
    if (abnormalLabs.length > 0) {
      parts.push(`Abnormal Lab Parameters: ${abnormalLabs.map(l => `${l.entity_name}: ${l.entity_value} ${l.unit} [${l.abnormal_flag}]`).join(', ')}`);
    }
    if (normalLabs.length > 0) {
      parts.push(`Normal Labs: ${normalLabs.map(l => `${l.entity_name}: ${l.entity_value} ${l.unit}`).join(', ')}`);
    }
    if (meds.length > 0) {
      parts.push(`Extracted Prior Medications: ${meds.map(m => `${m.entity_name} (${m.entity_value})`).join(', ')}`);
    }
    if (diags.length > 0) {
      parts.push(`Extracted Diagnoses: ${diags.map(d => d.entity_name).join(', ')}`);
    }
    if (parts.length > 0) {
      priorInvestigations = parts.join(' | ');
    }
  }

  // Medications: only what was extracted from document or entered by patient
  let currentMeds = answers.current_medications || null;
  if (!currentMeds && extractedEntities && extractedEntities.length > 0) {
    const meds = extractedEntities.filter(e => e.category === 'MEDICATION');
    if (meds.length > 0) {
      currentMeds = meds.map(m => `${m.entity_name} (${m.entity_value})`).join(', ');
    }
  }

  // Default differential diagnoses if none exist yet
  const defaultDifferentials = [];
  const normalizedCC = (cc || '').toLowerCase();
  if (normalizedCC.includes('chest') || normalizedCC.includes('heart') || (answers.socrates_site || '').toLowerCase().includes('chest')) {
    defaultDifferentials.push(
      { condition: 'Atypical Chest Pain / Angina Pectoris', icd10: 'I20.9', probability: 'MODERATE', clinical_rationale: 'Reported localized chest discomfort requiring ischemic workup.', why_this: `Triggered by complaint of "${cc || 'chest discomfort'}" localized to ${answers.socrates_site || 'chest region'}.` },
      { condition: 'Gastroesophageal Reflux Disease (GERD)', icd10: 'K21.9', probability: 'MODERATE', clinical_rationale: 'Retrosternal discomfort exacerbated by meals or posture.', why_this: 'Common masquerader of retrosternal discomfort without acute hemodynamic instability.' },
      { condition: 'Musculoskeletal Chest Wall Strain', icd10: 'M79.1', probability: 'LOW', clinical_rationale: 'Localized chest wall tenderness without radiation.', why_this: 'Triggered when chest pain is localized without systemic red flags.' }
    );
  } else if (normalizedCC.includes('fever') || normalizedCC.includes('temperature') || normalizedCC.includes('bukhar')) {
    defaultDifferentials.push(
      { condition: 'Acute Febrile Illness of Unspecified Etiology', icd10: 'R50.9', probability: 'HIGH', clinical_rationale: 'Active pyrexia warranting complete hemogram and pathogen screening.', why_this: `Directly derived from stated fever symptoms: "${cc}".` },
      { condition: 'Upper Respiratory Tract Infection', icd10: 'J06.9', probability: 'MODERATE', clinical_rationale: 'Acute fever with associated catarrhal symptoms.', why_this: 'Common outpatient febrile presentation in community OPD.' }
    );
  } else if (normalizedCC.includes('headache') || normalizedCC.includes('sir dard')) {
    defaultDifferentials.push(
      { condition: 'Tension-Type Headache', icd10: 'G44.2', probability: 'HIGH', clinical_rationale: 'Bilateral pressing cephalalgia without focal neurological deficit.', why_this: `Derived from reported head pain (${answers.socrates_severity || 5}/10 severity).` },
      { condition: 'Migraine without Aura', icd10: 'G43.0', probability: 'MODERATE', clinical_rationale: 'Recurrent or throbbing cephalalgia.', why_this: 'Considered for severe or episodic headache complaints.' }
    );
  } else if (normalizedCC.includes('stomach') || normalizedCC.includes('abdomen') || normalizedCC.includes('pet dard')) {
    defaultDifferentials.push(
      { condition: 'Acute Functional Dyspepsia / Gastritis', icd10: 'K29.7', probability: 'HIGH', clinical_rationale: 'Epigastric distress or abdominal pain without peritoneal signs.', why_this: `Derived from abdominal complaint: "${cc}".` },
      { condition: 'Acute Gastroenteritis', icd10: 'A09', probability: 'MODERATE', clinical_rationale: 'Abdominal cramping with gastrointestinal symptoms.', why_this: 'Common presentation for acute abdominal/bowel complaints.' }
    );
  } else {
    defaultDifferentials.push(
      { condition: 'General Outpatient Clinical Presentation', icd10: 'Z71.9', probability: 'HIGH', clinical_rationale: 'Standard outpatient consultation for reported symptom complex.', why_this: `Derived from patient primary consultation complaint: "${cc || 'General Checkup'}".` }
    );
  }

  let rosSummaryText = answers.review_of_systems || null;
  const rosParts = [];
  if (answers.review_of_systems) rosParts.push(answers.review_of_systems);
  if (answers.review_of_systems_mental && answers.review_of_systems_mental !== 'No emotional distress or anxiety') {
    rosParts.push(`Mental well-being: ${answers.review_of_systems_mental}`);
  }
  if (answers.review_of_systems_reproductive && answers.review_of_systems_reproductive !== 'None / No reproductive or urinary concerns') {
    rosParts.push(`Reproductive/GU: ${answers.review_of_systems_reproductive}`);
  }
  if (rosParts.length > 0) {
    rosSummaryText = rosParts.join('; ');
  }

  const whyThisExplanations = {
    chief_complaint: cc
      ? `Patient explicitly stated primary concern during intake dialogue: "${cc}".`
      : 'No primary complaint entered; general clinical intake recorded.',
    history_of_present_illness: socratesDetails.length > 0
      ? `Synthesized directly from patient responses across SOCRATES clinical dimensions: ${socratesDetails.join('; ')}.`
      : (cc ? `Derived from patient primary complaint disclosure: "${cc}".` : 'No detailed HPI questionnaire data recorded.'),
    current_medications: currentMeds
      ? `Extracted from ${extractedEntities.filter(e => e.category === 'MEDICATION').length > 0 ? 'digitized prescription document(s)' : 'patient medication history response'}: ${currentMeds}.`
      : 'No active medications were reported by the patient or found in uploaded documents.',
    drug_allergies: answers.drug_allergies
      ? `Directly disclosed by patient during intake allergy screen: "${answers.drug_allergies}".`
      : 'Patient disclosed no known adverse drug reactions or allergies during intake questionnaire.',
    past_medical_history: answers.past_medical_history
      ? `Disclosed by patient in chronic illness questionnaire: "${answers.past_medical_history}".`
      : 'No prior chronic medical conditions or hospitalizations disclosed.',
    family_history: answers.family_history
      ? `Reported in family medical history: "${answers.family_history}".`
      : 'No notable family history of hereditary disease reported.',
    personal_history: (answers.personal_history || answers.ayush_ahara_vihara)
      ? `Reported in lifestyle & personal history: "${answers.personal_history || answers.ayush_ahara_vihara}".`
      : 'Standard lifestyle parameters; no specific risk factors noted.',
    review_of_systems: rosSummaryText
      ? `Recorded from systematic organ-system review & sensitive topic screen: "${rosSummaryText}".`
      : 'Review of systems completed with no secondary systemic complaints flagged.',
    prior_investigations_summary: priorInvestigations
      ? `Synthesized from ${extractedEntities.length} digitized entity values extracted from patient's uploaded records and lab reports.`
      : 'No previous diagnostic reports or lab documents uploaded during this session.',
    suggested_differential_diagnoses: cc
      ? `Generated by clinical decision support mapping primary complaint "${cc}"${answers.socrates_site ? ` at site "${answers.socrates_site}"` : ''} against diagnostic criteria.`
      : 'Diagnostic considerations awaiting physician clinical examination.',
    ayush_pariksha_summary: (answers.ayush_prakriti || answers.ayush_ahara_shakti)
      ? `Derived from completed Dashavidha Pariksha assessment (Prakriti: ${answers.ayush_prakriti || 'N/A'}, Agni: ${answers.ayush_ahara_shakti || 'N/A'}).`
      : 'Dashavidha Pariksha assessment was not administered in standard allopathic mode.'
  };

  return {
    patient_demographics_summary: demographicsSummary,
    chief_complaint: cc,
    history_of_present_illness: hpiNarrative,
    socrates_site: answers.socrates_site || null,
    socrates_onset: answers.socrates_onset || null,
    socrates_character: answers.socrates_character || null,
    socrates_radiation: answers.socrates_radiation || null,
    socrates_associations: Array.isArray(answers.socrates_associations) ? answers.socrates_associations.join(', ') : (answers.socrates_associations || null),
    socrates_timing: answers.socrates_timing || null,
    socrates_exacerbating_relieving: answers.socrates_exacerbating || null,
    socrates_severity: answers.socrates_severity ? Number(answers.socrates_severity) : null,
    past_medical_history: answers.past_medical_history || null,
    past_surgical_history: answers.past_surgical_history || null,
    drug_allergies: answers.drug_allergies || null,
    food_allergies: answers.food_allergies || null,
    current_medications: currentMeds,
    family_history: answers.family_history || null,
    personal_history: answers.personal_history || answers.ayush_ahara_vihara || null,
    review_of_systems: rosSummaryText,
    review_of_systems_mental: answers.review_of_systems_mental || null,
    review_of_systems_reproductive: answers.review_of_systems_reproductive || null,
    prior_investigations_summary: priorInvestigations,
    suggested_differential_diagnoses: defaultDifferentials,
    why_this_explanations: whyThisExplanations,
    // AYUSH Dashavidha Pariksha fields (only populated if actually provided)
    ayush_prakriti: answers.ayush_prakriti || null,
    ayush_vikriti: answers.ayush_vikriti || null,
    ayush_sara: answers.ayush_sara || null,
    ayush_samhanana: answers.ayush_samhanana || null,
    ayush_pramana: answers.ayush_pramana || null,
    ayush_satmya: answers.ayush_satmya || null,
    ayush_satva: answers.ayush_satva || null,
    ayush_ahara_shakti: answers.ayush_ahara_shakti || null,
    ayush_koshtha: answers.ayush_koshtha || null,
    ayush_vyayama_shakti: answers.ayush_vyayama_shakti || null,
    ayush_vaya: answers.ayush_vaya || null,
    ayush_ahara_vihara: answers.ayush_ahara_vihara || null,
    raw_transcript: answers.raw_transcript || null
  };
}
