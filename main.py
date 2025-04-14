import os
import uuid
from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
from datetime import datetime
from pydub import AudioSegment

from summarize import summarize_transcript_dual
from transcribe_groq import transcribe_audio_via_groq
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or restrict to ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def convert_to_wav(uploaded_file: UploadFile, temp_dir="temp_audio") -> str:
    os.makedirs(temp_dir, exist_ok=True)
    ext = uploaded_file.filename.split('.')[-1].lower()
    temp_path = os.path.join(temp_dir, f"{uuid.uuid4()}.{ext}")

    with open(temp_path, "wb") as f:
        f.write(uploaded_file.file.read())

    audio = AudioSegment.from_file(temp_path, format=ext)
    audio = audio.set_channels(1).set_frame_rate(16000)
    wav_path = temp_path.rsplit('.', 1)[0] + ".wav"
    audio.export(wav_path, format="wav")

    return wav_path

@app.post("/transcribe")
async def transcribe_and_summarize(file: UploadFile = File(...)):
    try:
        # Convert to WAV
        wav_path = convert_to_wav(file)

        # Transcribe with Groq
        transcript_text, segments = transcribe_audio_via_groq(wav_path)

        # Summarize
        summary_en, summary_bn = summarize_transcript_dual(segments)

        # Metadata
        duration = segments[-1]["end"] / 60
        words = sum(len(seg["text"].split()) for seg in segments)
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")

        return JSONResponse({
            "summary_en": summary_en,
            "summary_bn": summary_bn,
            "metadata": {
                "duration_minutes": round(duration, 1),
                "total_words": words,
                "timestamp": timestamp
            }
        })

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})