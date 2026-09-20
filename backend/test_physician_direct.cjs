const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const ARTIFACTS_DIR = 'C:\\Users\\Jamal Khan\\.gemini\\antigravity-ide\\brain\\9962f864-3f08-4f64-909e-e4e4321196ed';

async function main() {
  const target = await new Promise((resolve, reject) => {
    const req = http.request({
      host: '127.0.0.1',
      port: 9222,
      path: '/json/new?http://localhost:4000',
      method: 'PUT'
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.end();
  });

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let id = 1;
  const callbacks = new Map();

  const send = (method, params = {}) => new Promise((res, rej) => {
    const msgId = id++;
    callbacks.set(msgId, { res, rej });
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });

  ws.on('message', (msg) => {
    const data = JSON.parse(msg);
    if (data.method === 'Runtime.consoleAPICalled') {
      console.log('[BROWSER CONSOLE]', data.params.type, data.params.args.map(a => a.value || a.description).join(' '));
    }
    if (data.method === 'Runtime.exceptionThrown') {
      console.error('[BROWSER EXCEPTION]', data.params.exceptionDetails);
    }
    if (callbacks.has(data.id)) {
      const cb = callbacks.get(data.id);
      callbacks.delete(data.id);
      if (data.error) cb.rej(data.error);
      else cb.res(data.result);
    }
  });

  await new Promise(r => ws.on('open', r));
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });

  await new Promise(r => setTimeout(r, 2000));

  // Log initial buttons
  const initBtns = await send('Runtime.evaluate', {
    expression: `Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim())`,
    returnByValue: true
  });
  console.log('Available buttons:', initBtns.result.value);

  // Click on 'B: Physician'
  const clickRes = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const pBtn = btns.find(b => b.textContent.includes('Physician'));
        if (pBtn) { 
          pBtn.click(); 
          return 'Clicked: ' + pBtn.textContent.trim(); 
        }
        return 'Not found';
      })()
    `,
    returnByValue: true
  });
  console.log('Click result:', clickRes.result.value);

  await new Promise(r => setTimeout(r, 2000));

  // Check texts
  const evalRes = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const text = document.body.innerText;
        return {
          snippet: text.substring(0, 400),
          hasSignIn: text.includes("Physician Sign In") || text.includes("Sign In to Workstation"),
          hasQueue: text.includes("Active Outpatient Queue") || text.includes("Outpatient Queue"),
          hasWorkstation: text.includes("MediKiosk Physician Workstation"),
          hasDoctorName: text.includes("Dr. Ajmal Khan"),
          hasExitBtn: text.includes("Exit Workstation"),
          hasSignOutBtn: text.includes("Sign Out")
        };
      })()
    `,
    returnByValue: true
  });

  console.log('Verification Results:', evalRes.result.value);

  // Capture screenshot
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'physician_workstation_direct.png'), Buffer.from(shot.data, 'base64'));
  console.log('Saved screenshot to physician_workstation_direct.png');

  // Close target tab
  http.get('http://127.0.0.1:9222/json/close/' + target.id);
  ws.close();
}

main().catch(console.error);
