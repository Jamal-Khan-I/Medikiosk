import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const intakeFile = path.resolve(__dirname, '../services/intakeService.js');

let content = fs.readFileSync(intakeFile, 'utf-8');

// Mapping of english prompts or unique substrings to ml and pa translations
const PROMPT_TRANSLATIONS = [
  {
    enMatch: "Where exactly in your chest is the pain or discomfort located?",
    ml: "നിങ്ങളുടെ നെഞ്ചിൽ കൃത്യമായി എവിടെയാണ് വേദനയോ അസ്വസ്ഥതയോ അനുഭവപ്പെടുന്നത്?",
    pa: "ਤੁਹਾਡੀ ਛਾਤੀ ਵਿੱਚ ਦਰਦ ਜਾਂ ਬੇਚੈਨੀ ਠੀਕ ਕਿਸ ਥਾਂ 'ਤੇ ਮਹਿਸੂਸ ਹੋ ਰਹੀ ਹੈ?"
  },
  {
    enMatch: "How quickly did the pain start, and what were you doing when it began?",
    ml: "വേദന എത്ര പെട്ടെന്നാണ് തുടങ്ങിയത്, ആ സമയത്ത് നിങ്ങൾ എന്താണ് ചെയ്യുകയായിരുന്നു?",
    pa: "ਦਰਦ ਕਿੰਨੀ ਤੇਜ਼ੀ ਨਾਲ ਸ਼ੁਰੂ ਹੋਇਆ, ਅਤੇ ਉਸ ਸਮੇਂ ਤੁਸੀਂ ਕੀ ਕਰ ਰਹੇ ਸੀ?"
  },
  {
    enMatch: "How does the pain feel?",
    ml: "വേദനയുടെ സ്വഭാവം എങ്ങനെയുള്ളതാണ്?",
    pa: "ਦਰਦ ਦਾ ਅਹਿਸਾਸ ਕਿਹੋ ਜਿਹਾ ਹੈ?"
  },
  {
    enMatch: "Does the pain radiate or travel anywhere else?",
    ml: "ഈ വേദന ശരീരത്തിന്റെ മറ്റ് ഭാഗങ്ങളിലേക്ക് വ്യാപിക്കുന്നുണ്ടോ?",
    pa: "ਕੀ ਇਹ ਦਰਦ ਸਰੀਰ ਦੇ ਕਿਸੇ ਹੋਰ ਹਿੱਸੇ ਵਿੱਚ ਫੈਲਦਾ ਹੈ?"
  },
  {
    enMatch: "Are you experiencing any of these associated symptoms?",
    ml: "ഇതോടൊപ്പം ഇനിപ്പറയുന്ന ലക്ഷണങ്ങൾ വല്ലതും അനുഭവപ്പെടുന്നുണ്ടോ?",
    pa: "ਕੀ ਤੁਹਾਨੂੰ ਇਹਨਾਂ ਵਿੱਚੋਂ ਕੋਈ ਹੋਰ ਲੱਛਣ ਵੀ ਮਹਿਸੂਸ ਹੋ ਰਹੇ ਹਨ?"
  },
  {
    enMatch: "How long does each episode last, or is it continuous?",
    ml: "വേദന തുടർച്ചയായി ഉണ്ടോ അതോ ഇടവിട്ടാണോ വരുന്നത്?",
    pa: "ਕੀ ਇਹ ਦਰਦ ਲਗਾਤਾਰ ਬਣਿਆ ਰਹਿੰਦਾ ਹੈ ਜਾਂ ਰੁਕ-ਰੁਕ ਕੇ ਆਉਂਦਾ ਹੈ?"
  },
  {
    enMatch: "What makes the pain worse or better?",
    ml: "എന്ത് ചെയ്യുമ്പോഴാണ് വേദന കൂടുന്നതോ കുറയുന്നതോ?",
    pa: "ਕਿਸ ਚੀਜ਼ ਨਾਲ ਦਰਦ ਵਧਦਾ ਹੈ ਜਾਂ ਆਰਾਮ ਮਿਲਦਾ ਹੈ?"
  },
  {
    enMatch: "On a scale of 1 to 10, how severe is your pain right now?",
    ml: "1 മുതൽ 10 വരെയുള്ള അളവിൽ ഇപ്പോൾ നിങ്ങളുടെ വേദന എത്രത്തോളമുണ്ട്?",
    pa: "1 ਤੋਂ 10 ਦੇ ਪੈਮਾਨੇ 'ਤੇ ਇਸ ਸਮੇਂ ਤੁਹਾਡਾ ਦਰਦ ਕਿੰਨਾ ਗੰਭੀਰ ਹੈ?"
  },
  // Abdominal
  {
    enMatch: "Where in your abdomen or stomach is the discomfort located?",
    ml: "നിങ്ങളുടെ വയറ്റിൽ എവിടെയാണ് അസ്വസ്ഥതയോ വേദനയോ അനുഭവപ്പെടുന്നത്?",
    pa: "ਤੁਹਾਡੇ ਪੇਟ ਵਿੱਚ ਠੀਕ ਕਿਸ ਥਾਂ 'ਤੇ ਦਰਦ ਜਾਂ ਬੇਚੈਨੀ ਹੈ?"
  },
  {
    enMatch: "When did the stomach pain start and how did it begin?",
    ml: "വയറുവേദന എപ്പോഴാണ് തുടങ്ങിയത്, എങ്ങനെയാണ് ആരംഭിച്ചത്?",
    pa: "ਪੇਟ ਦਾ ਦਰਦ ਕਦੋਂ ਅਤੇ ਕਿਵੇਂ ਸ਼ੁਰੂ ਹੋਇਆ ਸੀ?"
  },
  {
    enMatch: "How would you describe the stomach pain?",
    ml: "വയറുവേദനയുടെ സ്വഭാവം എങ്ങനെയുള്ളതാണ്?",
    pa: "ਤੁਸੀਂ ਪੇਟ ਦੇ ਦਰਦ ਨੂੰ ਕਿਵੇਂ ਬਿਆਨ ਕਰੋਗੇ?"
  },
  {
    enMatch: "Does the stomach pain travel to your back or shoulder?",
    ml: "വയറുവേദന പുറകിലേക്കോ തോളിലേക്കോ വ്യാപിക്കുന്നുണ്ടോ?",
    pa: "ਕੀ ਪੇਟ ਦਾ ਦਰਦ ਪਿੱਠ ਜਾਂ ਮੋਢੇ ਵੱਲ ਫੈਲਦਾ ਹੈ?"
  },
  {
    enMatch: "Do you have any of these digestive symptoms?",
    ml: "നിങ്ങൾക്ക് ദഹന സംബന്ധമായ ഈ ലക്ഷണങ്ങൾ ഉണ്ടോ?",
    pa: "ਕੀ ਤੁਹਾਨੂੰ ਪਾਚਨ ਨਾਲ ਜੁੜੇ ਇਹ ਲੱਛਣ ਹਨ?"
  },
  {
    enMatch: "Is the pain related to eating food or bowel movements?",
    ml: "ഭക്ഷണം കഴിക്കുന്നതുമായോ മലശോധനയുമായോ വേദനയ്ക്ക് ബന്ധമുണ്ടോ?",
    pa: "ਕੀ ਦਰਦ ਖਾਣਾ ਖਾਣ ਜਾਂ ਸ਼ੌਚ ਨਾਲ ਜੁੜਿਆ ਹੋਇਆ ਹੈ?"
  },
  // Fever
  {
    enMatch: "Where in your body do you feel the most discomfort with this fever?",
    ml: "പനിയോടൊപ്പം ശരീരത്തിൽ എവിടെയാണ് ഏറ്റവും കൂടുതൽ അസ്വസ്ഥത അനുഭവപ്പെടുന്നത്?",
    pa: "ਬੁਖਾਰ ਦੇ ਨਾਲ ਸਰੀਰ ਦੇ ਕਿਸ ਹਿੱਸੇ ਵਿੱਚ ਸਭ ਤੋਂ ਵੱਧ ਤਕਲੀਫ ਮਹਿਸੂਸ ਹੋ ਰਹੀ ਹੈ?"
  },
  {
    enMatch: "How many days have you had the fever and did it start suddenly?",
    ml: "എത്ര ദിവസമായി പനിയുണ്ട്, പെട്ടെന്നാണോ തുടങ്ങിയത്?",
    pa: "ਤੁਹਾਨੂੰ ਕਿੰਨੇ ਦਿਨਾਂ ਤੋਂ ਬੁਖਾਰ ਹੈ ਅਤੇ ਕੀ ਇਹ ਅਚਾਨਕ ਸ਼ੁਰੂ ਹੋਇਆ ਸੀ?"
  },
  {
    enMatch: "What type of fever pattern are you experiencing?",
    ml: "ഏതു തരത്തിലുള്ള പനിയാണ് അനുഭവപ്പെടുന്നത്?",
    pa: "ਤੁਹਾਨੂੰ ਕਿਸ ਕਿਸਮ ਦਾ ਬੁਖਾਰ ਮਹਿਸੂਸ ਹੋ ਰਿਹਾ ਹੈ?"
  },
  {
    enMatch: "Does the body ache or chill spread anywhere specific?",
    ml: "ശരീരവേദനയോ വിറയലോ പ്രത്യേക ഭാഗങ്ങളിലേക്ക് വ്യാപിക്കുന്നുണ്ടോ?",
    pa: "ਕੀ ਸਰੀਰ ਦਾ ਦਰਦ ਜਾਂ ਕਾਂਬਾ ਕਿਸੇ ਖਾਸ ਥਾਂ ਵੱਲ ਫੈਲਦਾ ਹੈ?"
  },
  {
    enMatch: "Are you experiencing any of these fever-related symptoms?",
    ml: "പനിയോടൊപ്പം ഇനിപ്പറയുന്ന ലക്ഷണങ്ങൾ വല്ലതും ഉണ്ടോ?",
    pa: "ਕੀ ਤੁਹਾਨੂੰ ਬੁਖਾਰ ਨਾਲ ਜੁੜੇ ਇਹਨਾਂ ਲੱਛਣਾਂ ਵਿੱਚੋਂ ਕੋਈ ਹੈ?"
  },
  {
    enMatch: "Does the fever spike at a particular time of day?",
    ml: "ദിവസത്തിൽ ഏതെങ്കിലും പ്രത്യേക സമയത്താണോ പനി കൂടുന്നത്?",
    pa: "ਕੀ ਦਿਨ ਦੇ ਕਿਸੇ ਖਾਸ ਸਮੇਂ ਬੁਖਾਰ ਤੇਜ਼ ਹੁੰਦਾ ਹੈ?"
  },
  // Generic / Default SOCRATES
  {
    enMatch: "Where on your body is your primary complaint or pain located?",
    ml: "നിങ്ങളുടെ ശരീരത്തിൽ പ്രധാനമായും എവിടെയാണ് വേദനയോ ബുദ്ധിമുട്ടോ ഉള്ളത്?",
    pa: "ਤੁਹਾਡੇ ਸਰੀਰ ਵਿੱਚ ਮੁੱਖ ਤਕਲੀਫ ਜਾਂ ਦਰਦ ਕਿਸ ਥਾਂ 'ਤੇ ਹੈ?"
  },
  {
    enMatch: "When did your symptoms begin and how quickly did they develop?",
    ml: "ലക്ഷണങ്ങൾ എപ്പോഴാണ് തുടങ്ങിയത്, എത്ര പെട്ടെന്നാണ് കൂടിയത്?",
    pa: "ਤੁਹਾਡੇ ਲੱਛਣ ਕਦੋਂ ਸ਼ੁਰੂ ਹੋਏ ਅਤੇ ਕਿੰਨੀ ਤੇਜ਼ੀ ਨਾਲ ਵਧੇ?"
  },
  {
    enMatch: "How would you describe what you are feeling?",
    ml: "നിങ്ങൾക്ക് അനുഭവപ്പെടുന്നത് എങ്ങനെയുള്ളതാണെന്ന് വിവരിക്കാമോ?",
    pa: "ਤੁਸੀਂ ਜੋ ਮਹਿਸੂਸ ਕਰ ਰਹੇ ਹੋ ਉਸਨੂੰ ਕਿਵੇਂ ਬਿਆਨ ਕਰੋਗੇ?"
  },
  {
    enMatch: "Does your discomfort or pain travel or spread anywhere else?",
    ml: "വേദന ശരീരത്തിന്റെ മറ്റ് ഭാഗങ്ങളിലേക്ക് വ്യാപിക്കുന്നുണ്ടോ?",
    pa: "ਕੀ ਤੁਹਾਡੀ ਤਕਲੀਫ ਜਾਂ ਦਰਦ ਕਿਸੇ ਹੋਰ ਥਾਂ ਫੈਲਦਾ ਹੈ?"
  },
  {
    enMatch: "Are you having any other symptoms alongside your main complaint?",
    ml: "പ്രധാന പ്രശ്നത്തോടൊപ്പം മറ്റ് ലക്ഷണങ്ങൾ വല്ലതും ഉണ്ടോ?",
    pa: "ਕੀ ਮੁੱਖ ਤਕਲੀਫ ਦੇ ਨਾਲ ਕੋਈ ਹੋਰ ਲੱਛਣ ਵੀ ਹਨ?"
  },
  {
    enMatch: "Is your symptom constant or does it come and go?",
    ml: "ലക്ഷണങ്ങൾ തുടർച്ചയായി ഉണ്ടോ അതോ വന്നു പോകുകയാണോ?",
    pa: "ਕੀ ਤੁਹਾਡਾ ਲੱਛਣ ਲਗਾਤਾਰ ਹੈ ਜਾਂ ਆਉਂਦਾ-ਜਾਂਦਾ ਰਹਿੰਦਾ ਹੈ?"
  },
  {
    enMatch: "What makes your condition feel better or worse?",
    ml: "എന്ത് ചെയ്യുമ്പോഴാണ് ആശ്വാസമോ ബുദ്ധിമുട്ടോ തോന്നുന്നത്?",
    pa: "ਕਿਸ ਚੀਜ਼ ਨਾਲ ਤੁਹਾਡੀ ਹਾਲਤ ਬਿਹਤਰ ਜਾਂ ਖਰਾਬ ਹੁੰਦੀ ਹੈ?"
  },
  {
    enMatch: "On a scale of 1 to 10, how bothersome or severe is this right now?",
    ml: "1 മുതൽ 10 വരെയുള്ള അളവിൽ ഇത് ഇപ്പോൾ എത്രത്തോളം തീവ്രമാണ്?",
    pa: "1 ਤੋਂ 10 ਦੇ ਪੈਮਾਨੇ 'ਤੇ ਇਸ ਸਮੇਂ ਇਹ ਤਕਲੀਫ ਕਿੰਨੀ ਗੰਭੀਰ ਹੈ?"
  }
];

let replacedCount = 0;

for (const t of PROMPT_TRANSLATIONS) {
  // Find prompt blocks that contain enMatch and kn: "..." but not ml:
  const escapedMatch = t.enMatch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(en:\\s*["'\`]${escapedMatch}["'\`][\\s\\S]*?kn:\\s*["'\`][^"'\`]+["'\`])(?![\\s\\S]*?ml:)`, 'g');
  
  content = content.replace(regex, (match) => {
    replacedCount++;
    return `${match},\n          ml: "${t.ml}",\n          pa: "${t.pa}"`;
  });
}

// Also handle AYUSH prompts if any
const ayushPrompts = [
  { match: "What best describes your general body build, skin, and temperature tolerance?", ml: "നിങ്ങളുടെ ശരീരഘടന, ചർമ്മം, കാലാവസ്ഥാ സഹിഷ്ണുത എന്നിവ എങ്ങനെയാണ്?", pa: "ਤੁਹਾਡੀ ਆਮ ਸਰੀਰਕ ਬਣਤਰ, ਚਮੜੀ ਅਤੇ ਤਾਪਮਾਨ ਸਹਿਣਸ਼ੀਲਤਾ ਕਿਹੋ ਜਿਹੀ ਹੈ?" },
  { match: "Which of these dosha imbalances feels most present in your current illness?", ml: "നിങ്ങളുടെ ഇപ്പോഴത്തെ അസുഖത്തിൽ ഏത് ദോഷ വ്യതിയാനമാണ് കൂടുതൽ തോന്നുന്നത്?", pa: "ਤੁਹਾਡੀ ਮੌਜੂਦਾ ਬਿਮਾਰੀ ਵਿੱਚ ਕਿਹੜਾ ਦੋਸ਼ ਅਸੰਤੁਲਨ ਸਭ ਤੋਂ ਵੱਧ ਮਹਿਸੂਸ ਹੁੰਦਾ ਹੈ?" },
  { match: "How is your digestion and appetite (Ahara Shakti)?", ml: "നിങ്ങളുടെ ദഹനവും വിശപ്പും (ആഹാരശക്തി) എങ്ങനെയുണ്ട്?", pa: "ਤੁਹਾਡਾ ਪਾਚਨ ਅਤੇ ਭੁੱਖ (ਆਹਾਰ ਸ਼ਕਤੀ) ਕਿਹੋ ਜਿਹੀ ਹੈ?" },
  { match: "How would you describe your overall physical stamina and strength (Vyayama Shakti)?", ml: "നിങ്ങളുടെ ശാരീരിക ശേഷിയും ബലവും (വ്യായമശക്തി) എങ്ങനെയുണ്ട്?", pa: "ਤੁਸੀਂ ਆਪਣੀ ਸਰੀਰਕ ਤਾਕਤ (ਵਿਆਯਾਮ ਸ਼ਕਤੀ) ਨੂੰ ਕਿਵੇਂ ਬਿਆਨ ਕਰੋਗੇ?" },
  { match: "How is your mental resilience, emotional stability, and sleep quality (Sattva)?", ml: "നിങ്ങളുടെ മാനസികാരോഗ്യവും ഉറക്കവും (സത്വം) എങ്ങനെയുണ്ട്?", pa: "ਤੁਹਾਡਾ ਮਾਨਸਿਕ ਸੰਤੁਲਨ ਅਤੇ ਨੀਂਦ ਦੀ ਗੁਣਵੱਤਾ (ਸਤਵ) ਕਿਹੋ ਜਿਹੀ ਹੈ?" },
  { match: "What are your usual dietary habits and daily physical routine (Ahara-Vihara)?", ml: "നിങ്ങളുടെ ഭക്ഷണരീതിയും ദിനചര്യകളും (ആഹാര-വിഹാരം) എങ്ങനെയുണ്ട്?", pa: "ਤੁਹਾਡੀਆਂ ਆਮ ਖਾਣ-ਪੀਣ ਦੀਆਂ ਆਦਤਾਂ ਅਤੇ ਰੋਜ਼ਾਨਾ ਰੁਟੀਨ (ਆਹਾਰ-ਵਿਹਾਰ) ਕਿਹੋ ਜਿਹਾ ਹੈ?" }
];

for (const a of ayushPrompts) {
  const escapedMatch = a.match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(en:\\s*["'\`]${escapedMatch}["'\`][\\s\\S]*?kn:\\s*["'\`][^"'\`]+["'\`])(?![\\s\\S]*?ml:)`, 'g');
  content = content.replace(regex, (match) => {
    replacedCount++;
    return `${match},\n      ml: "${a.ml}",\n      pa: "${a.pa}"`;
  });
}

fs.writeFileSync(intakeFile, content, 'utf-8');
console.log(`✓ Added ml and pa translations to ${replacedCount} prompt blocks in intakeService.js`);
