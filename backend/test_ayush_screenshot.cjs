const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const ARTIFACTS_DIR = 'C:\\Users\\Jamal Khan\\.gemini\\antigravity-ide\\brain\\9962f864-3f08-4f64-909e-e4e4321196ed';

async function createTarget() {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port: 9222, path: '/json/new?http://localhost:4000', method: 'PUT' }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(JSON.parse(data)));
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
    ws.on('open', () => resolve({
      send: (method, params = {}) => new Promise((res, rej) => {
        const reqId = id++;
        callbacks.set(reqId, { res, rej });
        ws.send(JSON.stringify({ id: reqId, method, params }));
      }),
      close: () => ws.close()
    }));
    ws.on('message', m => {
      const p = JSON.parse(m);
      if (p.id && callbacks.has(p.id)) {
        const { res, rej } = callbacks.get(p.id);
        callbacks.delete(p.id);
        if (p.error) rej(new Error(p.error.message));
        else res(p.result);
      }
    });
    ws.on('error', reject);
  });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function run() {
  const target = await createTarget();
  const cdp = await connectCDP(target.webSocketDebuggerUrl);
  try {
    await cdp.send('Page.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
    await cdp.send('Page.navigate', { url: 'http://localhost:4000' });
    await sleep(2000);

    // Switch to Kiosk
    await cdp.send('Runtime.evaluate', {
      expression: `Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.includes('Patient Kiosk')).click()`
    });
    await sleep(1500);

    // Click Bengali
    await cdp.send('Runtime.evaluate', {
      expression: `Array.from(document.querySelectorAll('.kiosk-lang-grid button')).find(c => c.innerText && c.innerText.includes('বাংলা')).click()`
    });
    await sleep(1200);

    // Proceed as New Patient
    await cdp.send('Runtime.evaluate', {
      expression: `Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.includes('NO')).click()`
    });
    await sleep(1200);

    // Fill demographic form
    await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const inputs = document.querySelectorAll('input');
        const setVal = (el, val) => {
          const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          s.call(el, val);
          el.dispatchEvent(new Event('input', { bubbles: true }));
        };
        if (inputs.length >= 4) {
          setVal(inputs[0], 'Anirban Das');
          setVal(inputs[1], '20/08/1988');
          setVal(inputs[3], '9123456780');
        }
        const mBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText && (b.innerText.includes('Male') || b.innerText.includes('পুরুষ')));
        if (mBtn) mBtn.click();
      })()`
    });
    await sleep(800);

    // Click confirm register
    await cdp.send('Runtime.evaluate', {
      expression: `Array.from(document.querySelectorAll('button')).find(b => b.innerText && (b.innerText.includes('Confirm') || b.innerText.includes('নিশ্চিত'))).click()`
    });
    await sleep(1500);

    // Consent screen: Authorize & Proceed
    await cdp.send('Runtime.evaluate', {
      expression: `Array.from(document.querySelectorAll('button')).find(b => b.innerText && (b.innerText.includes('Authorize') || b.innerText.includes('অনুমোদন'))).click()`
    });
    await sleep(1500);

    // Select AYUSH Mode!
    await cdp.send('Runtime.evaluate', {
      expression: `Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.includes('AYUSH')).click()`
    });
    await sleep(2000);

    // Capture Bengali AYUSH Intake question!
    const shot1 = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'kiosk_ayush_intake_bengali.png'), Buffer.from(shot1.data, 'base64'));
    console.log('[Screenshot Saved] kiosk_ayush_intake_bengali.png');

  } finally {
    cdp.close();
    http.get('http://127.0.0.1:9222/json/close/' + target.id, () => {});
  }
}
run();
