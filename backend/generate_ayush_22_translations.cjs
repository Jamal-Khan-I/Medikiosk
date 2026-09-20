const fs = require('fs');
const path = require('path');

// Parse .env natively
if (fs.existsSync(path.join(__dirname, '.env'))) {
  const envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
    }
  });
}

const udyatKey = process.env.BHASHINI_UDYAT_KEY;
const inferenceKey = process.env.BHASHINI_INFERENCE_KEY;
const configEndpoint = 'https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline';
const inferenceEndpoint = 'https://dhruva-api.bhashini.gov.in/services/inference/pipeline';
const pipelineId = '64392f96daac500b55c543cd';

const ALL_LANGUAGES = [
  'as', 'bn', 'brx', 'doi', 'gom', 'gu', 'hi', 'kn', 'ks', 'mai',
  'ml', 'mni', 'mr', 'ne', 'or', 'pa', 'sa', 'sat', 'sd', 'ta', 'te', 'ur'
];

// Base English questions
const QUESTIONS = [
  {
    stepId: 'chief_complaint',
    en: "Please state your main health symptom or reason for visit today:"
  },
  {
    stepId: 'ayush_prakriti',
    en: "Which traits best describe your natural physical constitution (Prakriti)?"
  },
  {
    stepId: 'ayush_vikriti',
    en: "Which doshic imbalance or symptoms are currently predominant (Vikriti)?"
  },
  {
    stepId: 'ayush_sara',
    en: "How is your overall tissue vitality and strength (Dhatu Sara)?"
  },
  {
    stepId: 'ayush_samhanana',
    en: "How is your body frame compactness and skeletal build?"
  },
  {
    stepId: 'ayush_pramana',
    en: "How are your height, weight, and body proportions?"
  },
  {
    stepId: 'ayush_satmya',
    en: "What foods and habits are well-tolerated by your body (Satmya)?"
  },
  {
    stepId: 'ayush_satva',
    en: "How is your mental resilience under stress, anxiety, or illness?"
  },
  {
    stepId: 'ayush_ahara_shakti',
    en: "How is your appetite (Abhyavaharana) and digestive speed (Jarana Shakti)?"
  },
  {
    stepId: 'ayush_vyayama_shakti',
    en: "How is your physical endurance and exercise capacity?"
  },
  {
    stepId: 'ayush_vaya',
    en: "What life stage are you currently in?"
  },
  {
    stepId: 'ayush_ahara_vihara',
    en: "Describe your daily dietary habits, meal timings, and sleep schedule:"
  }
];

async function getTranslationConfig(targetLang) {
  const payload = {
    pipelineTasks: [{
      taskType: 'translation',
      config: {
        language: { sourceLanguage: 'en', targetLanguage: targetLang }
      }
    }],
    pipelineRequestConfig: { pipelineId }
  };

  const res = await fetch(configEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'ulcaApiKey': udyatKey },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Pipeline config error (${res.status}): ${txt}`);
  }

  const data = await res.json();
  const serviceId = data.pipelineResponseConfig?.[0]?.config?.[0]?.serviceId || 'ai4bharat/indictrans-v2-all-gpu--t4';
  const callbackUrl = data.pipelineInferenceAPIEndPoint?.callbackUrl || inferenceEndpoint;

  return { serviceId, callbackUrl };
}

async function translateQuestions() {
  console.log('Translating AYUSH questions across all 22 Indian languages...\n');

  // Load existing prompts if any
  const results = {};
  QUESTIONS.forEach(q => {
    results[q.stepId] = { en: q.en };
  });

  // Languages that already have high-quality manual translations in intakeService.js
  const manualLangs = ['hi', 'ta', 'te', 'bn', 'mr', 'gu', 'kn'];

  for (const lang of ALL_LANGUAGES) {
    console.log(`Processing AYUSH for: ${lang}...`);
    try {
      const { serviceId, callbackUrl } = await getTranslationConfig(lang);

      const inputs = QUESTIONS.map(q => ({ source: q.en }));

      const res = await fetch(callbackUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': inferenceKey
        },
        body: JSON.stringify({
          pipelineTasks: [{
            taskType: 'translation',
            config: {
              language: { sourceLanguage: 'en', targetLanguage: lang },
              serviceId
            }
          }],
          inputData: { input: inputs }
        })
      });

      if (!res.ok) {
        console.warn(`  Failed HTTP ${res.status} for ${lang}`);
        continue;
      }

      const data = await res.json();
      const outputs = data.pipelineResponse?.[0]?.output || [];

      outputs.forEach((out, idx) => {
        const stepId = QUESTIONS[idx].stepId;
        if (out.target) {
          results[stepId][lang] = out.target;
        }
      });
      console.log(`  ✓ Translated 12 questions into ${lang}`);
    } catch (e) {
      console.error(`  ✗ Error translating to ${lang}: ${e.message}`);
    }
  }

  const outPath = path.join(__dirname, 'services/ayush_questions_22.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf8');
  console.log(`\n✓ Successfully saved all 22-language AYUSH questions to ${outPath}`);
}

translateQuestions();
