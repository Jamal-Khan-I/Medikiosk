import fs from 'fs';
import dns from 'dns';
try { dns.setDefaultResultOrder('ipv4first'); } catch (e) {}

process.loadEnvFile('backend/.env');
const key = process.env.GEMINI_API_KEY;

async function test(model) {
  const t0 = Date.now();
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'Output JSON: {"status": "healthy"}' }] }],
        generationConfig: { responseMimeType: 'application/json' }
      })
    });
    const data = await res.json();
    console.log(`${model} -> Status: ${res.status}, Latency: ${Date.now() - t0}ms, Result: ${data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || JSON.stringify(data.error)}`);
  } catch (err) {
    console.log(`${model} -> Error in ${Date.now() - t0}ms: ${err.message}`);
  }
}

console.log('Testing model latency & health:');
await test('gemini-3.5-flash-lite');
await test('gemini-3.6-flash');
await test('gemini-3.7-flash');
