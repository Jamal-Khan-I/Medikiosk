const fs = require('fs');
const http = require('http');
const WebSocket = require('ws');

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

  await new Promise(r => setTimeout(r, 1500));

  // Click 'Open Physician Queue' button on Home page
  const resHome = await send('Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(btn => btn.textContent.includes('Open Physician Queue'));
      if (b) { b.click(); return 'Clicked Open Physician Queue'; }
      return 'Not found';
    })()`,
    returnByValue: true
  });
  console.log(resHome.result.value);

  await new Promise(r => setTimeout(r, 1000));

  // Verify in workstation
  const checkWs = await send('Runtime.evaluate', {
    expression: `document.body.innerText.includes('Active Outpatient Queue')`,
    returnByValue: true
  });
  console.log('Workstation directly opened from Home page:', checkWs.result.value);

  // Click 'Exit Workstation'
  const exitRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(btn => btn.textContent.includes('Exit Workstation'));
      if (b) { b.click(); return 'Clicked Exit Workstation'; }
      return 'Not found';
    })()`,
    returnByValue: true
  });
  console.log(exitRes.result.value);

  await new Promise(r => setTimeout(r, 1000));

  const checkHome = await send('Runtime.evaluate', {
    expression: `document.body.innerText.includes('Launch Patient Kiosk')`,
    returnByValue: true
  });
  console.log('Returned to Marketing Home:', checkHome.result.value);

  http.get('http://127.0.0.1:9222/json/close/' + target.id);
  ws.close();
}
main().catch(console.error);
