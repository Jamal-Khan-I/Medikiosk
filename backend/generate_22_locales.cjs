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

const TARGET_LANGS = [
  { code: 'as', name: 'Assamese' },
  { code: 'brx', name: 'Bodo' },
  { code: 'doi', name: 'Dogri' },
  { code: 'gom', name: 'Konkani' },
  { code: 'ks', name: 'Kashmiri' },
  { code: 'mai', name: 'Maithili' },
  { code: 'mni', name: 'Manipuri' },
  { code: 'ne', name: 'Nepali' },
  { code: 'or', name: 'Odia' },
  { code: 'sa', name: 'Sanskrit' },
  { code: 'sat', name: 'Santali' },
  { code: 'sd', name: 'Sindhi' },
  { code: 'ur', name: 'Urdu' }
];

const LOCALES_DIR = path.join(__dirname, '../frontend/src/locales');
const EN_DIR = path.join(LOCALES_DIR, 'en');

const NAMESPACES = ['common', 'identity', 'consent', 'intake', 'scanner', 'review'];

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

async function translateBatch(items, targetLang, serviceId, callbackUrl) {
  if (!items || items.length === 0) return [];

  // Protect placeholders like {{current}}, {{total}}, etc.
  const placeholders = [];
  const sanitizedInputs = items.map((item, idx) => {
    let text = item;
    const matches = text.match(/\{\{[^}]+\}\}/g) || [];
    placeholders[idx] = matches;
    matches.forEach((m, mIdx) => {
      text = text.replace(m, `__PH_${mIdx}__`);
    });
    return { source: text };
  });

  const payload = {
    pipelineTasks: [{
      taskType: 'translation',
      config: {
        language: { sourceLanguage: 'en', targetLanguage: targetLang },
        serviceId
      }
    }],
    inputData: {
      input: sanitizedInputs
    }
  };

  const res = await fetch(callbackUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': inferenceKey
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Translation inference failed (${res.status}): ${txt}`);
  }

  const data = await res.json();
  const outputs = data.pipelineResponse?.[0]?.output || [];

  return outputs.map((out, idx) => {
    let result = out.target || items[idx];
    const itemPlaceholders = placeholders[idx] || [];
    itemPlaceholders.forEach((ph, pIdx) => {
      result = result.replace(new RegExp(`__PH_${pIdx}__`, 'g'), ph);
    });
    return result;
  });
}

async function generateLocales() {
  console.log('====================================================');
  console.log('MediKiosk: Generating 22-Language Localization Files');
  console.log('====================================================\n');

  // Load English source files
  const sourceData = {};
  for (const ns of NAMESPACES) {
    const filePath = path.join(EN_DIR, `${ns}.json`);
    sourceData[ns] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }

  for (const lang of TARGET_LANGS) {
    console.log(`Processing Language: ${lang.name} (${lang.code})...`);
    const targetDir = path.join(LOCALES_DIR, lang.code);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    try {
      const { serviceId, callbackUrl } = await getTranslationConfig(lang.code);

      for (const ns of NAMESPACES) {
        const enObj = sourceData[ns];
        const keys = Object.keys(enObj);
        const values = Object.values(enObj);

        // Filter non-empty strings
        const translatable = [];
        const indexMap = [];

        keys.forEach((k, idx) => {
          const val = values[idx];
          if (typeof val === 'string' && val.trim().length > 0) {
            translatable.push(val);
            indexMap.push(k);
          }
        });

        // Translate in chunks of 25 items
        const translatedValues = [];
        const CHUNK_SIZE = 25;
        for (let i = 0; i < translatable.length; i += CHUNK_SIZE) {
          const chunk = translatable.slice(i, i + CHUNK_SIZE);
          const chunkTrans = await translateBatch(chunk, lang.code, serviceId, callbackUrl);
          translatedValues.push(...chunkTrans);
        }

        const outObj = {};
        keys.forEach(k => {
          const transIdx = indexMap.indexOf(k);
          if (transIdx !== -1 && translatedValues[transIdx]) {
            outObj[k] = translatedValues[transIdx];
          } else {
            outObj[k] = enObj[k]; // fallback
          }
        });

        const outPath = path.join(targetDir, `${ns}.json`);
        fs.writeFileSync(outPath, JSON.stringify(outObj, null, 2), 'utf8');
        console.log(`  ✓ ${ns}.json written (${keys.length} keys)`);
      }
    } catch (err) {
      console.error(`  ✗ Failed for ${lang.name} (${lang.code}): ${err.message}`);
    }
  }

  // Create Provenance Registry
  const registry = {
    updatedAt: new Date().toISOString(),
    totalLanguages: 23,
    provenance: {
      en: { name: 'English', script: 'Latin', source: 'Manual / Reference' },
      hi: { name: 'Hindi', script: 'Devanagari', source: 'Manual / Clinical Team' },
      ta: { name: 'Tamil', script: 'Tamil', source: 'Manual / Clinical Team' },
      te: { name: 'Telugu', script: 'Telugu', source: 'Manual / Clinical Team' },
      bn: { name: 'Bengali', script: 'Bengali', source: 'Manual / Clinical Team' },
      mr: { name: 'Marathi', script: 'Devanagari', source: 'Manual / Clinical Team' },
      gu: { name: 'Gujarati', script: 'Gujarati', source: 'Manual / Clinical Team' },
      kn: { name: 'Kannada', script: 'Kannada', source: 'Manual / Clinical Team' },
      ml: { name: 'Malayalam', script: 'Malayalam', source: 'Manual / Clinical Team' },
      pa: { name: 'Punjabi', script: 'Gurmukhi', source: 'Manual / Clinical Team' },
      as: { name: 'Assamese', script: 'Bengali-Assamese', source: 'Bhashini NMT (IndicTrans-v2)' },
      brx: { name: 'Bodo', script: 'Devanagari', source: 'Bhashini NMT (IndicTrans-v2)' },
      doi: { name: 'Dogri', script: 'Devanagari', source: 'Bhashini NMT (IndicTrans-v2)' },
      gom: { name: 'Konkani', script: 'Devanagari', source: 'Bhashini NMT (IndicTrans-v2)' },
      ks: { name: 'Kashmiri', script: 'Perso-Arabic', source: 'Bhashini NMT (IndicTrans-v2)' },
      mai: { name: 'Maithili', script: 'Devanagari', source: 'Bhashini NMT (IndicTrans-v2)' },
      mni: { name: 'Manipuri', script: 'Meitei / Bengali', source: 'Bhashini NMT (IndicTrans-v2)' },
      ne: { name: 'Nepali', script: 'Devanagari', source: 'Bhashini NMT (IndicTrans-v2)' },
      or: { name: 'Odia', script: 'Odia', source: 'Bhashini NMT (IndicTrans-v2)' },
      sa: { name: 'Sanskrit', script: 'Devanagari', source: 'Bhashini NMT (IndicTrans-v2)' },
      sat: { name: 'Santali', script: 'Ol Chiki / Latin', source: 'Bhashini NMT (IndicTrans-v2)' },
      sd: { name: 'Sindhi', script: 'Perso-Arabic / Devanagari', source: 'Bhashini NMT (IndicTrans-v2)' },
      ur: { name: 'Urdu', script: 'Perso-Arabic', source: 'Bhashini NMT (IndicTrans-v2)' }
    }
  };

  fs.writeFileSync(
    path.join(LOCALES_DIR, 'provenance_registry.json'),
    JSON.stringify(registry, null, 2),
    'utf8'
  );
  console.log('\n✓ Provenance registry updated at frontend/src/locales/provenance_registry.json');
}

generateLocales();
