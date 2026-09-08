"""
AI4Bharat IndicConformer ASR Microservice
Provides multilingual speech recognition across all 22 official Indian languages.
Model: ai4bharat/indic-conformer-600m-multilingual
"""

import os
import sys
import io
import time
import logging
import tempfile
from typing import Optional

# Ensure standard user site-packages are loaded on Windows
roaming_site = os.path.expanduser(r"~\AppData\Roaming\Python\Python313\site-packages")
if os.path.exists(roaming_site) and roaming_site not in sys.path:
    sys.path.insert(0, roaming_site)

from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("indicconformer-asr")

app = FastAPI(
    title="MediKiosk IndicConformer ASR Service",
    version="1.0.0",
    description="Multilingual ASR microservice for outpatient intake powered by AI4Bharat IndicConformer"
)

# CORS configuration for Kiosk frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5500",
        "http://localhost:5501",
        "http://127.0.0.1:5500",
        "http://127.0.0.1:5501",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# All 22 official Indian languages supported by IndicConformer
SUPPORTED_INDIC_LANGUAGES = {
    "as": "Assamese",
    "bn": "Bengali",
    "brx": "Bodo",
    "doi": "Dogri",
    "gu": "Gujarati",
    "hi": "Hindi",
    "kn": "Kannada",
    "kas": "Kashmiri",
    "kok": "Konkani",
    "mai": "Maithili",
    "ml": "Malayalam",
    "mni": "Manipuri",
    "mr": "Marathi",
    "ne": "Nepali",
    "or": "Odia",
    "pa": "Punjabi",
    "sa": "Sanskrit",
    "sat": "Santali",
    "sd": "Sindhi",
    "ta": "Tamil",
    "te": "Telugu",
    "ur": "Urdu",
    "en": "English (Indian Accent)"
}

MODEL_ID = "ai4bharat/indic-conformer-600m-multilingual"
model = None
device = "cpu"
model_load_error = None
model_loading_in_progress = False

def load_indic_conformer_model():
    """Attempt to load IndicConformer model using transformers & torch"""
    global model, device, model_load_error, model_loading_in_progress
    if model is not None or model_loading_in_progress:
        return

    model_loading_in_progress = True
    logger.info("Initializing AI4Bharat IndicConformer model: %s", MODEL_ID)

    try:
        import torch
        from transformers import AutoModel

        device = "cuda" if torch.cuda.is_available() else "cpu"
        hf_token = os.environ.get("HF_TOKEN") or os.environ.get("HUGGING_FACE_HUB_TOKEN")

        logger.info("Loading model on device: %s (HF_TOKEN present: %s)", device, bool(hf_token))
        
        # Load model with trust_remote_code=True
        model = AutoModel.from_pretrained(
            MODEL_ID,
            trust_remote_code=True,
            token=hf_token
        )
        model.to(device)
        model.eval()
        logger.info("IndicConformer model successfully loaded on %s", device)
        model_load_error = None
    except Exception as e:
        model_load_error = str(e)
        logger.warning("Could not load IndicConformer model (%s). Real-time ASR will use resilient pipeline fallback.", e)
    finally:
        model_loading_in_progress = False


@app.on_event("startup")
def on_startup():
    logger.info("Starting IndicConformer ASR microservice on port 8001...")
    # Trigger model loader
    load_indic_conformer_model()


class HealthResponse(BaseModel):
    status: str
    model_id: str
    model_loaded: bool
    device: str
    model_error: Optional[str]
    supported_languages_count: int


@app.get("/health", response_model=HealthResponse)
def health_check():
    return HealthResponse(
        status="healthy",
        model_id=MODEL_ID,
        model_loaded=model is not None,
        device=device,
        model_error=model_load_error,
        supported_languages_count=len(SUPPORTED_INDIC_LANGUAGES)
    )


@app.get("/api/asr/languages")
def get_supported_languages():
    return {
        "count": len(SUPPORTED_INDIC_LANGUAGES),
        "languages": SUPPORTED_INDIC_LANGUAGES
    }


def preprocess_audio(file_bytes: bytes):
    """Convert audio input to 16kHz mono float32 tensor"""
    import torch
    import soundfile as sf

    try:
        audio_data, sample_rate = sf.read(io.BytesIO(file_bytes))
        # Convert to mono if multi-channel
        if len(audio_data.shape) > 1:
            audio_data = audio_data.mean(axis=1)

        wav_tensor = torch.from_numpy(audio_data).float()

        # Resample to 16000 Hz if needed
        if sample_rate != 16000:
            import torchaudio.transforms as T
            resampler = T.Resample(orig_freq=sample_rate, new_freq=16000)
            wav_tensor = resampler(wav_tensor)

        return wav_tensor.unsqueeze(0), sample_rate
    except Exception as e:
        logger.error("Error preprocessing audio: %s", e)
        return None, 0


@app.post("/api/asr")
async def transcribe_speech(
    file: UploadFile = File(...),
    language: str = Form("en")
):
    """
    Transcribe speech audio using AI4Bharat IndicConformer.
    Accepts: audio file (webm, wav, ogg, mp3) and 2-letter language code.
    Returns: JSON with transcribed text, provider indicator, and latency.
    """
    lang_code = language.lower().strip()
    if lang_code not in SUPPORTED_INDIC_LANGUAGES:
        # Default to Hindi or English if unrecognized
        lang_code = "hi" if lang_code in ["hin", "hindi"] else "en"

    start_time = time.perf_counter()
    logger.info("Received audio transcription request for language: %s (%s)", lang_code, SUPPORTED_INDIC_LANGUAGES.get(lang_code))

    file_bytes = await file.read()
    if not file_bytes or len(file_bytes) < 100:
        raise HTTPException(status_code=400, detail="Empty or invalid audio file received.")

    # 1. If IndicConformer model is loaded and ready, run real neural inference
    if model is not None:
        try:
            import torch
            wav_tensor, sr = preprocess_audio(file_bytes)
            if wav_tensor is None:
                raise ValueError("Could not decode audio stream")

            wav_tensor = wav_tensor.to(device)
            with torch.no_grad():
                # IndicConformer CTC inference: model(wav, language, "ctc")
                transcription = model(wav_tensor, lang_code, "ctc")
                if isinstance(transcription, (list, tuple)):
                    transcription = " ".join(str(x) for x in transcription)

            elapsed_ms = round((time.perf_counter() - start_time) * 1000)
            logger.info("IndicConformer neural transcription completed in %d ms: '%s'", elapsed_ms, transcription)

            return {
                "success": True,
                "text": str(transcription).strip(),
                "language": lang_code,
                "provider": "indic-conformer",
                "latency_ms": elapsed_ms
            }
        except Exception as inf_err:
            logger.error("IndicConformer inference runtime error: %s", inf_err)

    # 2. Resilient Fallback:
    # If model is not loaded (downloading, gated, or on CPU), signal client to use live Web Speech
    elapsed_ms = round((time.perf_counter() - start_time) * 1000)
    logger.info('IndicConformer neural weights not loaded; signaling client to prioritize live Web Speech (%s)', lang_code)
    return {
        'success': False,
        'model_loaded': False,
        'error': 'IndicConformer neural weights not loaded on host CPU. Use Web Speech API fallback for live user speech.',
        'provider': 'indic-conformer',
        'latency_ms': max(elapsed_ms, 120)
    }


# High-Fidelity Indian Regional Neural Voices (Microsoft Edge Neural Engine)
TTS_VOICE_MAP = {
    "hi": "hi-IN-SwaraNeural",    # Warm, friendly Hindi
    "en": "en-IN-NeerjaNeural",   # Natural Indian English
    "ta": "ta-IN-PallaviNeural",  # Gentle, polite Tamil
    "te": "te-IN-ShrutiNeural",   # Warm Telugu
    "bn": "bn-IN-TanishaaNeural", # Friendly Bengali
    "mr": "mr-IN-AarohiNeural",   # Polite Marathi
    "gu": "gu-IN-DhwaniNeural",   # Friendly Gujarati
    "kn": "kn-IN-SapnaNeural",    # Warm Kannada
    "ml": "ml-IN-SobhanaNeural",  # Malayalam
    "pa": "pa-IN-GurpreetNeural", # Punjabi
    "ur": "ur-IN-GulNeural"       # Urdu
}

tts_cache = {}

@app.get("/tts")
async def tts_endpoint(text: str, lang: str = "hi", gender: str = "female"):
    """
    Synthesize natural, human-quality Indian voice audio using Microsoft Neural TTS.
    Returns standard audio/mpeg MP3 stream compatible with any browser or mobile app.
    """
    clean_text = text.strip()
    if not clean_text:
        raise HTTPException(status_code=400, detail="Text parameter cannot be empty.")

    clean_lang = lang.lower().split("-")[0]
    cache_key = f"{clean_lang}:{gender.lower()}:{clean_text}"

    if cache_key in tts_cache:
        return Response(content=tts_cache[cache_key], media_type="audio/mpeg", headers={
            "Content-Type": "audio/mpeg",
            "Cache-Control": "public, max-age=86400",
            "X-TTS-Cache": "HIT"
        })

    selected_voice = TTS_VOICE_MAP.get(clean_lang, TTS_VOICE_MAP["hi"])
    if gender.lower() == "male":
        male_map = {
            "hi": "hi-IN-MadhurNeural",
            "en": "en-IN-PrabhatNeural",
            "ta": "ta-IN-ValluvarNeural",
            "te": "te-IN-MohanNeural",
            "bn": "bn-IN-BashkarNeural",
            "mr": "mr-IN-ManoharNeural",
            "gu": "gu-IN-NiranjanNeural",
            "kn": "kn-IN-GaganNeural"
        }
        selected_voice = male_map.get(clean_lang, selected_voice)

    try:
        import edge_tts
        communicate = edge_tts.Communicate(clean_text, selected_voice, rate="-2%", pitch="+1Hz")
        mp3_buffer = bytearray()
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                mp3_buffer.extend(chunk["data"])

        audio_bytes = bytes(mp3_buffer)
        if len(tts_cache) < 300:
            tts_cache[cache_key] = audio_bytes

        return Response(content=audio_bytes, media_type="audio/mpeg", headers={
            "Content-Type": "audio/mpeg",
            "Cache-Control": "public, max-age=86400",
            "X-TTS-Voice": selected_voice,
            "X-TTS-Cache": "MISS"
        })
    except Exception as tts_err:
        logger.error("TTS generation error: %s", tts_err)
        raise HTTPException(status_code=500, detail=f"TTS synthesis error: {str(tts_err)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8001)

