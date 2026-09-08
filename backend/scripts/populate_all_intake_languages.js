import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const intakeFile = path.resolve(__dirname, '../services/intakeService.js');

let fileContent = fs.readFileSync(intakeFile, 'utf-8');

// Dictionary of translations for all known English prompts
const PROMPT_MAP = {
  "Where exactly in your chest is the pain or discomfort located?": {
    ml: "നിങ്ങളുടെ നെഞ്ചിൽ കൃത്യമായി എവിടെയാണ് വേദനയോ അസ്വസ്ഥതയോ അനുഭവപ്പെടുന്നത്?",
    pa: "ਤੁਹਾਡੀ ਛਾਤੀ ਵਿੱਚ ਦਰਦ ਜਾਂ ਬੇਚੈਨੀ ਠੀਕ ਕਿਸ ਥਾਂ 'ਤੇ ਮਹਿਸੂਸ ਹੋ ਰਹੀ ਹੈ?"
  },
  "How quickly did the pain start, and what were you doing when it began?": {
    ml: "വേദന എത്ര പെട്ടെന്നാണ് തുടങ്ങിയത്, ആ സമയത്ത് നിങ്ങൾ എന്താണ് ചെയ്യുകയായിരുന്നു?",
    pa: "ਦਰਦ ਕਿੰਨੀ ਤੇਜ਼ੀ ਨਾਲ ਸ਼ੁਰੂ ਹੋਇਆ, ਅਤੇ ਉਸ ਸਮੇਂ ਤੁਸੀਂ ਕੀ ਕਰ ਰਹੇ ਸੀ?"
  },
  "How does the pain feel?": {
    ml: "വേദനയുടെ സ്വഭാവം എങ്ങനെയുള്ളതാണ്?",
    pa: "ਦਰਦ ਦਾ ਅਹਿਸਾਸ ਕਿਹੋ ਜਿਹਾ ਹੈ?"
  },
  "Does the pain radiate or travel anywhere else?": {
    ml: "ഈ വേദന ശരീരത്തിന്റെ മറ്റ് ഭാഗങ്ങളിലേക്ക് വ്യാപിക്കുന്നുണ്ടോ?",
    pa: "ਕੀ ਇਹ ਦਰਦ ਸਰੀਰ ਦੇ ਕਿਸੇ ਹੋਰ ਹਿੱਸੇ ਵਿੱਚ ਫੈਲਦਾ ਹੈ?"
  },
  "Are you experiencing any of these associated symptoms?": {
    ml: "ഇതോടൊപ്പം ഇനിപ്പറയുന്ന ലക്ഷണങ്ങൾ വല്ലതും അനുഭവപ്പെടുന്നുണ്ടോ?",
    pa: "ਕੀ ਤੁਹਾਨੂੰ ਇਹਨਾਂ ਵਿੱਚੋਂ ਕੋਈ ਹੋਰ ਲੱਛਣ ਵੀ ਮਹਿਸੂਸ ਹੋ ਰਹੇ ਹਨ?"
  },
  "How long does each episode last, or is it continuous?": {
    ml: "വേദന തുടർച്ചയായി ഉണ്ടോ അതോ ഇടവിട്ടാണോ വരുന്നത്?",
    pa: "ਕੀ ਇਹ ਦਰਦ ਲਗਾਤਾਰ ਬਣਿਆ ਰਹਿੰਦਾ ਹੈ ਜਾਂ ਰੁਕ-ਰੁਕ ਕੇ ਆਉਂਦਾ ਹੈ?"
  },
  "What makes the pain worse or better?": {
    ml: "എന്ത് ചെയ്യുമ്പോഴാണ് വേദന കൂടുന്നതോ കുറയുന്നതോ?",
    pa: "ਕਿਸ ਚੀਜ਼ ਨਾਲ ਦਰਦ ਵਧਦਾ ਹੈ ਜਾਂ ਆਰਾਮ ਮਿਲਦਾ ਹੈ?"
  },
  "On a scale from 1 (mild) to 10 (unbearable agony), how severe is the pain right now?": {
    ml: "1 മുതൽ 10 വരെയുള്ള അളവിൽ, വേദന ഇപ്പോൾ എത്രത്തോളം തീവ്രമാണ്?",
    pa: "1 (ਹਲਕਾ) ਤੋਂ 10 (ਅਸਹਿ) ਦੇ ਪੈਮਾਨੇ 'ਤੇ, ਦਰਦ ਇਸ ਸਮੇਂ ਕਿੰਨਾ ਗੰਭੀਰ ਹੈ?"
  },
  "Where in your abdomen is the pain located?": {
    ml: "നിങ്ങളുടെ വയറ്റിൽ എവിടെയാണ് വേദന അനുഭവപ്പെടുന്നത്?",
    pa: "ਤੁਹਾਡੇ ਪੇਟ ਵਿੱਚ ਠੀਕ ਕਿਸ ਥਾਂ 'ਤੇ ਦਰਦ ਹੈ?"
  },
  "When and how did this abdominal pain start?": {
    ml: "ഈ വയറുവേദന എപ്പോൾ, എങ്ങനെയാണ് ആരംഭിച്ചത്?",
    pa: "ਇਹ ਪੇਟ ਦਾ ਦਰਦ ਕਦੋਂ ਅਤੇ ਕਿਵੇਂ ਸ਼ੁਰੂ ਹੋਇਆ ਸੀ?"
  },
  "How would you describe the stomach discomfort?": {
    ml: "വയറുവേദനയുടെ സ്വഭാവം എങ്ങനെ വിവരിക്കാം?",
    pa: "ਤੁਸੀਂ ਪੇਟ ਦੇ ਦਰਦ ਨੂੰ ਕਿਵੇਂ ਬਿਆਨ ਕਰੋਗੇ?"
  },
  "Are you experiencing any associated digestive symptoms?": {
    ml: "ഇതോടൊപ്പം ഛർദ്ദി, വയറിളക്കം അല്ലെങ്കിൽ അസിഡിറ്റി ഉണ്ടോ?",
    pa: "ਕੀ ਇਸਦੇ ਨਾਲ ਉਲਟੀ, ਦਸਤ ਜਾਂ ਐਸੀਡਿਟੀ ਦੇ ਲੱਛਣ ਵੀ ਹਨ?"
  },
  "Does food or position change the pain?": {
    ml: "ഭക്ഷണം കഴിക്കുന്നതിനാലോ ഇരിക്കുന്ന രീതിയാലോ വേദനയിൽ വ്യത്യാസമുണ്ടോ?",
    pa: "ਕੀ ਖਾਣਾ ਖਾਣ ਜਾਂ ਬੈਠਣ ਦੀ ਸਥਿਤੀ ਬਦਲਣ ਨਾਲ ਦਰਦ ਵਿੱਚ ਫਰਕ ਪੈਂਦਾ ਹੈ?"
  },
  "Rate the pain severity from 1 to 10:": {
    ml: "വേദനയുടെ തീവ്രത 1 മുതൽ 10 വരെയുള്ള സ്കെയിലിൽ രേഖപ്പെടുത്തുക:",
    pa: "ਦਰਦ ਦੀ ਤੀਬਰਤਾ 1 ਤੋਂ 10 ਦੇ ਪੈਮਾਨੇ 'ਤੇ ਦੱਸੋ:"
  },
  "Please state your main health symptom or reason for visit today:": {
    ml: "ഇന്ന് ആശുപത്രി സന്ദർശിക്കാൻ ഇടയാക്കിയ പ്രധാന രോഗലക്ഷണം വ്യക്തമാക്കുക:",
    pa: "ਕਿਰਪਾ ਕਰਕੇ ਅੱਜ ਹਸਪਤਾਲ ਆਉਣ ਦਾ ਮੁੱਖ ਕਾਰਨ ਜਾਂ ਲੱਛਣ ਦੱਸੋ:"
  },
  "Where on your body is your primary complaint or pain located?": {
    ml: "നിങ്ങളുടെ ശരീരത്തിൽ പ്രധാനമായും എവിടെയാണ് വേദനയോ ബുദ്ധിമുട്ടോ ഉള്ളത്?",
    pa: "ਤੁਹਾਡੇ ਸਰੀਰ ਵਿੱਚ ਮੁੱਖ ਤਕਲੀਫ ਜਾਂ ਦਰਦ ਕਿਸ ਥਾਂ 'ਤੇ ਹੈ?"
  },
  "When did your symptoms begin and how quickly did they develop?": {
    ml: "ലക്ഷണങ്ങൾ എപ്പോഴാണ് തുടങ്ങിയത്, എത്ര പെട്ടെന്നാണ് കൂടിയത്?",
    pa: "ਤੁਹਾਡੇ ਲੱਛਣ ਕਦੋਂ ਸ਼ੁਰੂ ਹੋਏ ਅਤੇ ਕਿੰਨੀ ਤੇਜ਼ੀ ਨਾਲ ਵਧੇ?"
  },
  "How would you describe what you are feeling?": {
    ml: "നിങ്ങൾക്ക് അനുഭവപ്പെടുന്നത് എങ്ങനെയുള്ളതാണെന്ന് വിവരിക്കാമോ?",
    pa: "ਤੁਸੀਂ ਜੋ ਮਹਿਸੂਸ ਕਰ ਰਹੇ ਹੋ ਉਸਨੂੰ ਕਿਵੇਂ ਬਿਆਨ ਕਰੋਗੇ?"
  },
  "Does your discomfort or pain travel or spread anywhere else?": {
    ml: "വേദന ശരീരത്തിന്റെ മറ്റ് ഭാഗങ്ങളിലേക്ക് വ്യാപിക്കുന്നുണ്ടോ?",
    pa: "ਕੀ ਤੁਹਾਡੀ ਤਕਲੀਫ ਜਾਂ ਦਰਦ ਕਿਸੇ ਹੋਰ ਥਾਂ ਫੈਲਦਾ ਹੈ?"
  },
  "Are you having any other symptoms alongside your main complaint?": {
    ml: "പ്രധാന പ്രശ്നത്തോടൊപ്പം മറ്റ് ലക്ഷണങ്ങൾ വല്ലതും ഉണ്ടോ?",
    pa: "ਕੀ ਮੁੱਖ ਤਕਲੀਫ ਦੇ ਨਾਲ ਕੋਈ ਹੋਰ ਲੱਛਣ ਵੀ ਹਨ?"
  },
  "Is your symptom constant or does it come and go?": {
    ml: "ലക്ഷണങ്ങൾ തുടർച്ചയായി ഉണ്ടോ അതോ വന്നു പോകുകയാണോ?",
    pa: "ਕੀ ਤੁਹਾਡਾ ਲੱਛਣ ਲਗਾਤਾਰ ਹੈ ਜਾਂ ਆਉਂਦਾ-ਜਾਂਦਾ ਰਹਿੰਦਾ ਹੈ?"
  },
  "What makes your condition feel better or worse?": {
    ml: "എന്ത് ചെയ്യുമ്പോഴാണ് ആശ്വാസമോ ബുദ്ധിമുട്ടോ തോന്നുന്നത്?",
    pa: "ਕਿਸ ਚੀਜ਼ ਨਾਲ ਤੁਹਾਡੀ ਹਾਲਤ ਬਿਹਤਰ ਜਾਂ ਖਰਾਬ ਹੁੰਦੀ ਹੈ?"
  },
  "On a scale of 1 to 10, how bothersome or severe is this right now?": {
    ml: "1 മുതൽ 10 വരെയുള്ള അളവിൽ ഇത് ഇപ്പോൾ എത്രത്തോളം തീവ്രമാണ്?",
    pa: "1 ਤੋਂ 10 ਦੇ ਪੈਮਾਨੇ 'ਤੇ ਇਸ ਸਮੇਂ ਇਹ ਤਕਲੀਫ ਕਿੰਨੀ ਗੰਭੀਰ ਹੈ?"
  },
  "What best describes your general body build, skin, and temperature tolerance?": {
    ml: "നിങ്ങളുടെ ശരീരഘടന, ചർമ്മം, കാലാവസ്ഥാ സഹിഷ്ണുത എന്നിവ എങ്ങനെയാണ്?",
    pa: "ਤੁਹਾਡੀ ਆਮ ਸਰੀਰਕ ਬਣਤਰ, ਚਮੜੀ ਅਤੇ ਤਾਪਮਾਨ ਸਹਿਣਸ਼ੀਲਤਾ ਕਿਹੋ ਜਿਹੀ ਹੈ?"
  },
  "Which of these dosha imbalances feels most present in your current illness?": {
    ml: "നിങ്ങളുടെ ഇപ്പോഴത്തെ അസുഖത്തിൽ ഏത് ദോഷ വ്യതിയാനമാണ് കൂടുതൽ തോന്നുന്നത്?",
    pa: "ਤੁਹਾਡੀ ਮੌਜੂਦਾ ਬਿਮਾਰੀ ਵਿੱਚ ਕਿਹੜਾ ਦੋਸ਼ ਅਸੰਤੁਲਨ ਸਭ ਤੋਂ ਵੱਧ ਮਹਿਸੂਸ ਹੁੰਦਾ ਹੈ?"
  },
  "How is your digestion and appetite (Ahara Shakti)?": {
    ml: "നിങ്ങളുടെ ദഹനവും വിശപ്പും (ആഹാരശക്തി) എങ്ങനെയുണ്ട്?",
    pa: "ਤੁਹਾਡਾ ਪਾਚਨ ਅਤੇ ਭੁੱਖ (ਆਹਾਰ ਸ਼ਕਤੀ) ਕਿਹੋ ਜਿਹੀ ਹੈ?"
  },
  "How would you describe your overall physical stamina and strength (Vyayama Shakti)?": {
    ml: "നിങ്ങളുടെ ശാരീരിക ശേഷിയും ബലവും (വ്യായമശക്തി) എങ്ങനെയുണ്ട്?",
    pa: "ਤੁਸੀਂ ਆਪਣੀ ਸਰੀਰਕ ਤਾਕਤ (ਵਿਆਯਾਮ ਸ਼ਕਤੀ) ਨੂੰ ਕਿਵੇਂ ਬਿਆਨ ਕਰੋਗੇ?"
  },
  "How is your mental resilience, emotional stability, and sleep quality (Sattva)?": {
    ml: "നിങ്ങളുടെ മാനസികാരോഗ്യവും ഉറക്കവും (സത്വം) എങ്ങനെയുണ്ട്?",
    pa: "ਤੁਹਾਡਾ ਮਾਨਸਿਕ ਸੰਤੁਲਨ ਅਤੇ ਨੀਂਦ ਦੀ ਗੁਣਵੱਤਾ (ਸਤਵ) ਕਿਹੋ ਜਿਹੀ ਹੈ?"
  },
  "Describe your daily dietary habits, meal timings, and sleep schedule:": {
    ml: "നിങ്ങളുടെ ഭക്ഷണരീതിയും ദിനചര്യകളും (ആഹാര-വിഹാരം) എങ്ങനെയുണ്ട്?",
    pa: "ਤੁਹਾਡੀਆਂ ਆਮ ਖਾਣ-ਪੀਣ ਦੀਆਂ ਆਦਤਾਂ ਅਤੇ ਰੋਜ਼ਾਨਾ ਰੁਟੀਨ (ਆਹਾਰ-ਵਿਹਾਰ) ਕਿਹੋ ਜਿਹਾ ਹੈ?"
  }
};

// Generic fallback for any other clinical questions
const defaultMl = "ദയവായി നിങ്ങളുടെ ആരോഗ്യവിവരം വ്യക്തമാക്കുക:";
const defaultPa = "ਕਿਰਪਾ ਕਰਕੇ ਆਪਣੇ ਸਿਹਤ ਲੱਛਣ ਬਾਰੇ ਦੱਸੋ:";

// We iterate through lines and find each prompt block:
// When we see `kn: "..."`, if the next non-empty line isn't `ml:`, we look backward to find the `en:` line
const lines = fileContent.split('\n');
const newLines = [];

for (let i = 0; i < lines.length; i++) {
  newLines.push(lines[i]);
  const trimmed = lines[i].trim();

  if (trimmed.startsWith('kn:')) {
    // Check if next line already has ml:
    const nextLine = (lines[i + 1] || '').trim();
    if (!nextLine.startsWith('ml:')) {
      // Find the en line in previous 12 lines
      let enText = '';
      for (let j = i - 1; j >= Math.max(0, i - 12); j--) {
        const prev = lines[j].trim();
        if (prev.startsWith('en:')) {
          const m = prev.match(/en:\s*["']([^"']+)["']/);
          if (m) enText = m[1];
          break;
        }
      }

      const trans = PROMPT_MAP[enText] || { ml: defaultMl, pa: defaultPa };
      const indent = lines[i].match(/^\s*/)[0];
      // Ensure comma on kn line if missing
      if (!lines[i].trim().endsWith(',')) {
        newLines[newLines.length - 1] = lines[i] + ',';
      }
      newLines.push(`${indent}ml: "${trans.ml}",`);
      newLines.push(`${indent}pa: "${trans.pa}"`);
    }
  }
}

fs.writeFileSync(intakeFile, newLines.join('\n'), 'utf-8');
console.log('✓ Successfully ensured ml and pa in all prompt blocks in intakeService.js');
