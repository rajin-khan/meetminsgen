import os
import requests
from dotenv import load_dotenv

load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_AUDIO_URL = "https://api.groq.com/openai/v1/audio/transcriptions"

HEADERS = {
    "Authorization": f"Bearer {GROQ_API_KEY}",
}

def transcribe_audio_via_groq(audio_path, model="whisper-large-v3-turbo"):
    if not GROQ_API_KEY:
        raise EnvironmentError("❌ GROQ_API_KEY not found in .env file!")

    with open(audio_path, "rb") as f:
        print("🔤 Uploading audio to Groq Whisper API...")
        response = requests.post(
            GROQ_AUDIO_URL,
            headers=HEADERS,
            files={"file": (os.path.basename(audio_path), f, "application/octet-stream")},
            data={
                "model": model,
                "response_format": "verbose_json"
            }
        )

    if response.status_code != 200:
        raise RuntimeError(f"Groq Whisper API error {response.status_code}: {response.text}")

    result = response.json()

    # Combine all segments into a single transcript string
    transcript_text = result.get("text", "")
    transcript_segments = result.get("segments", [])

    # Only keep needed fields for each segment
    cleaned_segments = [
        {
            "start": seg["start"],
            "end": seg["end"],
            "text": seg["text"]
        }
        for seg in transcript_segments
    ]

    return transcript_text, cleaned_segments