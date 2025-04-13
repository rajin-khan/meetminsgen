import os
from dotenv import load_dotenv
from pyannote.audio import Pipeline
from pyannote.core import Segment

# Load HF token
load_dotenv()
hf_token = os.getenv("HF_TOKEN")

if hf_token is None:
    raise ValueError("❌ Hugging Face token not found in .env file!")

# Load diarization pipeline from Hugging Face
print("🗣️ Loading pyannote diarization pipeline...")
pipeline = Pipeline.from_pretrained(
    "pyannote/speaker-diarization@2.1",  # explicitly pin version
    use_auth_token=hf_token
)

def diarize_audio(audio_path, segments=None):
    print(f"🔍 Running diarization on {audio_path}...")

    diarization = pipeline(audio_path)

    labeled_segments = []
    for turn, _, speaker in diarization.itertracks(yield_label=True):
        labeled_segments.append({
            "start": turn.start,
            "end": turn.end,
            "speaker": speaker
        })

    return labeled_segments

# For testing
if __name__ == "__main__":
    test_path = "audio_input/meeting1.wav"
    diarized = diarize_audio(test_path)
    for seg in diarized[:5]:
        print(f"[{seg['start']:.2f}s - {seg['end']:.2f}s] Speaker: {seg['speaker']}")