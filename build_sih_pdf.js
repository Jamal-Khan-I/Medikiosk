import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';

const htmlPath = path.resolve('MediKiosk_SIH_Presentation_Master_Guide.html');
const pdfPath = path.resolve('MediKiosk_SIH_Presentation_Master_Guide.pdf');

console.log('Target HTML:', htmlPath);
console.log('Target PDF:', pdfPath);

if (!fs.existsSync(htmlPath)) {
  console.error('HTML file not found!');
  process.exit(1);
}

const edgeExe = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const chromeExe = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const browserExe = fs.existsSync(edgeExe) ? edgeExe : chromeExe;

console.log('Using browser:', browserExe);

try {
  execSync(`"${browserExe}" --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="${pdfPath}" "${htmlPath}"`, {
    stdio: 'inherit'
  });
  if (fs.existsSync(pdfPath)) {
    const stats = fs.statSync(pdfPath);
    console.log(`SUCCESS! Generated PDF: ${pdfPath} (${stats.size} bytes)`);
  } else {
    console.error('PDF generation command finished but file was not found.');
  }
} catch (err) {
  console.error('Error during PDF conversion:', err.message);
}
