// OCR Micro-Engine: Google Cloud Vision API (Primary) + Tesseract.js (Resilient Offline Fallback)
import fs from 'fs';
import path from 'path';

let visionClient = null;
let visionAvailable = false;

// Initialize Google Cloud Vision Client if credentials or API key is available
async function initVisionClient() {
  try {
    const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (credPath && fs.existsSync(credPath)) {
      const vision = await import('@google-cloud/vision');
      visionClient = new vision.ImageAnnotatorClient();
      visionAvailable = true;
      console.log('[OCR Service] Google Cloud Vision API initialized with service account key.');
    } else if (process.env.GCP_VISION_API_KEY) {
      const vision = await import('@google-cloud/vision');
      visionClient = new vision.ImageAnnotatorClient({
        apiKey: process.env.GCP_VISION_API_KEY
      });
      visionAvailable = true;
      console.log('[OCR Service] Google Cloud Vision API initialized with API Key.');
    } else {
      console.log('[OCR Service] GOOGLE_APPLICATION_CREDENTIALS not found. Tesseract.js will act as primary offline OCR provider.');
    }
  } catch (err) {
    console.warn('[OCR Service] Could not load @google-cloud/vision:', err.message);
    visionAvailable = false;
  }
}

initVisionClient();

/**
 * Perform real OCR on file buffer or base64
 * @param {Object} params - { buffer, base64, mimeType, fileName }
 * @returns {Promise<{ text: string, provider: string, confidence: number, latencyMs: number }>}
 */
export async function performOCR({ buffer, base64, mimeType = 'image/png', fileName = 'document.png' }) {
  const startTime = Date.now();
  let imageBuffer = buffer;

  if (!imageBuffer && base64) {
    // Strip data URL prefix if present
    const cleanBase64 = base64.replace(/^data:[^;]+;base64,/, '');
    imageBuffer = Buffer.from(cleanBase64, 'base64');
  }

  if (!imageBuffer || imageBuffer.length === 0) {
    throw new Error('Empty document buffer received. Cannot perform OCR.');
  }

  if (imageBuffer.length < 100) {
    throw new Error('Invalid or corrupted document image file.');
  }

  // 1. Check if document is a PDF
  const isPdf = (mimeType && mimeType.includes('pdf')) || 
                (fileName && fileName.toLowerCase().endsWith('.pdf')) ||
                (imageBuffer.length >= 4 && imageBuffer.slice(0, 4).toString() === '%PDF');

  // If PDF, first try pdf-parse for text-based PDFs (or Vision API if configured)
  if (isPdf) {
    if (visionAvailable && visionClient) {
      try {
        console.log(`[OCR Service] Calling Google Cloud Vision API for PDF: ${fileName}...`);
        const [result] = await visionClient.documentTextDetection({
          image: { content: imageBuffer }
        });
        const fullText = result.fullTextAnnotation?.text || (result.textAnnotations?.[0]?.description || '');
        if (fullText && fullText.trim().length > 0) {
          const latencyMs = Date.now() - startTime;
          return {
            text: fullText.trim(),
            provider: 'google-cloud-vision',
            confidence: 97.0,
            latencyMs
          };
        }
      } catch (visionErr) {
        console.warn(`[OCR Service] Vision API PDF detection failed (${visionErr.message}), falling back to PDF parser...`);
      }
    }

    // PDF Parser fallback
    try {
      console.log(`[OCR Service] Extracting text from PDF ${fileName} via pdf-parse...`);
      const { PDFParse } = await import('pdf-parse');
      const parser = new PDFParse({ data: imageBuffer });
      await parser.load();
      const textResult = await parser.getText();
      const extractedText = (textResult?.text || textResult || '').trim();
      const latencyMs = Date.now() - startTime;

      if (extractedText && extractedText.length > 0) {
        console.log(`[OCR Service] PDF parser succeeded in ${latencyMs}ms (${extractedText.length} chars)`);
        return {
          text: extractedText,
          provider: 'pdf-parser (offline fallback)',
          confidence: 95.0,
          latencyMs
        };
      } else {
        throw new Error('PDF has no extractable text layer or is an unrasterized scan.');
      }
    } catch (pdfErr) {
      console.warn(`[OCR Service] PDF text extraction failed: ${pdfErr.message}`);
      throw new Error(`PDF Processing Error: ${pdfErr.message}`);
    }
  }

  // 2. PRIMARY (Images): Try Google Cloud Vision API
  if (visionAvailable && visionClient) {
    try {
      console.log(`[OCR Service] Calling Google Cloud Vision API for ${fileName}...`);
      const [result] = await visionClient.documentTextDetection({
        image: { content: imageBuffer }
      });

      const fullText = result.fullTextAnnotation?.text || (result.textAnnotations?.[0]?.description || '');
      const latencyMs = Date.now() - startTime;

      if (fullText && fullText.trim().length > 0) {
        console.log(`[OCR Service] Google Cloud Vision OCR succeeded in ${latencyMs}ms (${fullText.trim().length} chars)`);
        return {
          text: fullText.trim(),
          provider: 'google-cloud-vision',
          confidence: 96.8,
          latencyMs
        };
      }
    } catch (gcpErr) {
      console.warn(`[OCR Service] Google Cloud Vision API failed (${gcpErr.message}), falling back to Tesseract.js...`);
    }
  }

  // 3. FALLBACK (Images): Tesseract.js (Offline Local OCR)
  try {
    console.log(`[OCR Service] Processing ${fileName} with Tesseract.js fallback...`);
    const tesseract = await import('tesseract.js');
    const Tesseract = tesseract.default || tesseract;

    const { data } = await Tesseract.recognize(
      imageBuffer,
      'eng',
      {
        logger: m => {
          if (m.status === 'recognizing text' && m.progress % 0.5 === 0) {
            console.log(`[Tesseract OCR] Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      }
    );

    const latencyMs = Date.now() - startTime;
    const extractedText = (data?.text || '').trim();

    console.log(`[OCR Service] Tesseract.js OCR completed in ${latencyMs}ms (${extractedText.length} chars, confidence: ${data?.confidence || 85}%)`);

    if (!extractedText || extractedText.length === 0) {
      throw new Error('No legible text recognized in document.');
    }

    return {
      text: extractedText,
      provider: 'tesseract.js',
      confidence: Math.round(data.confidence || 88),
      latencyMs
    };
  } catch (tessErr) {
    console.error('[OCR Service] Tesseract.js OCR error:', tessErr.message);
    throw new Error(`OCR Processing Failed: ${tessErr.message}`);
  }
}

/**
 * Auto-detect document classification based on extracted textual cues
 */
export function autoDetectDocumentType(text, declaredType = null) {
  if (declaredType && declaredType !== 'AUTO_DETECT') {
    return declaredType;
  }

  const lower = (text || '').toLowerCase();

  // Prescription patterns
  if (
    lower.includes('rx') ||
    lower.includes('tab') ||
    lower.includes('cap') ||
    lower.includes('syrup') ||
    lower.includes('dosage') ||
    lower.includes('doctor') ||
    lower.includes('dr.') ||
    lower.includes('mg') ||
    lower.includes('prescription')
  ) {
    return 'PRESCRIPTION';
  }

  // Lab report patterns
  if (
    lower.includes('laboratory') ||
    lower.includes('investigation') ||
    lower.includes('hba1c') ||
    lower.includes('glucose') ||
    lower.includes('serum') ||
    lower.includes('cholesterol') ||
    lower.includes('hemoglobin') ||
    lower.includes('blood test') ||
    lower.includes('reference range') ||
    lower.includes('pathology')
  ) {
    return 'LAB_REPORT';
  }

  // Discharge summary
  if (
    lower.includes('discharge') ||
    lower.includes('admission') ||
    lower.includes('hospital course') ||
    lower.includes('condition at discharge')
  ) {
    return 'DISCHARGE_SUMMARY';
  }

  return 'MEDICAL_RECORD';
}
