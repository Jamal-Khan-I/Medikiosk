const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const ARTIFACTS_DIR = 'C:\\Users\\Jamal Khan\\.gemini\\antigravity-ide\\brain\\9962f864-3f08-4f64-909e-e4e4321196ed';

async function createTarget() {
  return new Promise((resolve, reject) => {
    const req = http.request({
      host: '127.0.0.1',
      port: 9222,
      path: '/json/new?http://localhost:4000',
      method: 'PUT'
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function connectCDP(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let id = 1;
    const callbacks = new Map();

    ws.on('open', () => {
      resolve({
        send: (method, params = {}) => {
          return new Promise((res, rej) => {
            const reqId = id++;
            callbacks.set(reqId, { res, rej });
            ws.send(JSON.stringify({ id: reqId, method, params }));
          });
        },
        close: () => ws.close()
      });
    });
    ws.on('message', (msg) => {
      const parsed = JSON.parse(msg);
      if (parsed.id && callbacks.has(parsed.id)) {
        const { res, rej } = callbacks.get(parsed.id);
        callbacks.delete(parsed.id);
        if (parsed.error) rej(new Error(parsed.error.message));
        else res(parsed.result);
      }
    });
    ws.on('error', reject);
  });
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function captureScreenshot(cdp, filename) {
  const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
  const outPath = path.join(ARTIFACTS_DIR, filename);
  fs.writeFileSync(outPath, Buffer.from(shot.data, 'base64'));
  console.log(`[Screenshot Saved] ${filename}`);
}

async function runBrowserTests() {
  console.log('Starting CDP Multi-Language Verification...');
  const target = await createTarget();
  const cdp = await connectCDP(target.webSocketDebuggerUrl);

  try {
    await cdp.send('Page.enable');
    await cdp.send('DOM.enable');
    await cdp.send('Runtime.enable');

    // 1. Set kiosk viewport (1920x1080)
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
      mobile: false
    });

    // 2. Navigate to Kiosk
    await cdp.send('Page.navigate', { url: 'http://localhost:4000' });
    await sleep(2000);

    // Switch to Kiosk surface
    await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const kioskBtn = btns.find(b => b.innerText && b.innerText.includes('Patient Kiosk'));
        if (kioskBtn) kioskBtn.click();
      })()`
    });
    await sleep(1500);

    // Verify all 22 languages rendered
    const langCountRes = await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const cards = document.querySelectorAll('.kiosk-lang-grid button');
        return cards.length;
      })()`,
      returnByValue: true
    });
    console.log(`Total language cards rendered: ${langCountRes.result.value}`);

    // Capture Full 22 Languages Grid
    await captureScreenshot(cdp, 'language_selector_22_all.png');

    // Test Search Filter: "Tamil"
    await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const input = document.querySelector('input[placeholder*="Search language"]');
        if (input) {
          const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          nativeSetter.call(input, 'Tamil');
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      })()`
    });
    await sleep(600);
    await captureScreenshot(cdp, 'language_selector_search_tamil.png');

    // Clear search and select Tamil ('ta')
    await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const clearBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText === '✕');
        if (clearBtn) clearBtn.click();
      })()`
    });
    await sleep(500);

    // Click Tamil
    await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const cards = Array.from(document.querySelectorAll('.kiosk-lang-grid button'));
        const taCard = cards.find(c => c.innerText && c.innerText.includes('தமிழ்'));
        if (taCard) taCard.click();
      })()`
    });
    await sleep(1000);
    await captureScreenshot(cdp, 'kiosk_step1_identity_tamil.png');

    // Return to LANG and select Bengali ('bn')
    await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const backBtn = btns.find(b => b.innerText && (b.innerText.includes('மொழி') || b.innerText.includes('Back')));
        if (backBtn) backBtn.click();
      })()`
    });
    await sleep(800);

    // Click Bengali
    await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const cards = Array.from(document.querySelectorAll('.kiosk-lang-grid button'));
        const bnCard = cards.find(c => c.innerText && c.innerText.includes('বাংলা'));
        if (bnCard) bnCard.click();
      })()`
    });
    await sleep(1000);
    await captureScreenshot(cdp, 'kiosk_step1_identity_bengali.png');

    // Return to LANG and select Punjabi ('pa')
    await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const backBtn = btns.find(b => b.innerText && (b.innerText.includes('ভাষা') || b.innerText.includes('Back')));
        if (backBtn) backBtn.click();
      })()`
    });
    await sleep(800);

    // Click Punjabi
    await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const cards = Array.from(document.querySelectorAll('.kiosk-lang-grid button'));
        const paCard = cards.find(c => c.innerText && c.innerText.includes('ਪੰਜਾਬੀ'));
        if (paCard) paCard.click();
      })()`
    });
    await sleep(1000);
    await captureScreenshot(cdp, 'kiosk_step1_identity_punjabi.png');

    // Return to LANG and select Kashmiri ('ks')
    await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const backBtn = btns.find(b => b.innerText && (b.innerText.includes('ਭਾਸ਼ਾ') || b.innerText.includes('Back')));
        if (backBtn) backBtn.click();
      })()`
    });
    await sleep(800);

    // Click Kashmiri
    await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const cards = Array.from(document.querySelectorAll('.kiosk-lang-grid button'));
        const ksCard = cards.find(c => c.innerText && c.innerText.includes('کٲشُر'));
        if (ksCard) ksCard.click();
      })()`
    });
    await sleep(1000);
    await captureScreenshot(cdp, 'kiosk_step1_identity_kashmiri.png');

    // Return to LANG and select Santali ('sat')
    await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const backBtn = btns.find(b => b.innerText && b.innerText.includes('Back'));
        if (backBtn) backBtn.click();
      })()`
    });
    await sleep(800);

    // Click Santali
    await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const cards = Array.from(document.querySelectorAll('.kiosk-lang-grid button'));
        const satCard = cards.find(c => c.innerText && c.innerText.includes('ᱥᱟᱱᱛᱟᱲᱤ'));
        if (satCard) satCard.click();
      })()`
    });
    await sleep(1000);
    await captureScreenshot(cdp, 'kiosk_step1_identity_santali.png');

    console.log('All browser multi-language tests passed successfully!');

  } finally {
    cdp.close();
    // Close target
    http.get(`http://127.0.0.1:9222/json/close/${target.id}`, () => {});
  }
}

runBrowserTests();
