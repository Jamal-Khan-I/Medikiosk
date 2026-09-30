import https from 'https';

const languages = [
  'hi', 'en', 'ta', 'te', 'bn', 'mr', 'gu', 'kn', 'ml', 'pa',
  'ur', 'or', 'as', 'ks', 'ne', 'sa', 'sd', 'doi', 'gom', 'mai', 'mni', 'brx', 'sat'
];

async function testLang(lang) {
  return new Promise((resolve) => {
    const text = encodeURIComponent('Namaste test');
    https.get(`https://medikiosk-9jyw.onrender.com/api/voice/tts?text=${text}&lang=${lang}&gender=female`, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        resolve({
          lang,
          status: res.statusCode,
          provider: res.headers['x-tts-provider'] || 'none',
          serviceId: res.headers['x-tts-service-id'] || 'none',
          bytes: body.length
        });
      });
    }).on('error', e => resolve({ lang, status: 500, error: e.message }));
  });
}

(async () => {
  console.log('Testing Bhashini TTS across all languages...');
  for (const l of languages) {
    const r = await testLang(l);
    console.log(`${r.lang.padEnd(5)} -> Status: ${r.status} Service: ${r.serviceId} Bytes: ${r.bytes}`);
  }
})();
