import argparse
import os
from datetime import datetime
from pydub import AudioSegment

from transcribe_groq import transcribe_audio_via_groq as transcribe_audio
from summarize import summarize_transcript_dual

def convert_to_wav(input_path):
    ext = os.path.splitext(input_path)[-1].lower().replace('.', '')
    if ext not in ["mp3", "m4a", "aac", "flac", "ogg", "wav"]:
        raise ValueError(f"❌ Unsupported audio format: .{ext}")
    try:
        print(f"🔄 Converting {ext.upper()} to WAV...")
        audio = AudioSegment.from_file(input_path, format=ext)
    except Exception as e:
        raise RuntimeError(f"❌ Failed to decode audio ({ext}): {e}")
    audio = audio.set_channels(1).set_frame_rate(16000)
    wav_path = input_path.rsplit('.', 1)[0] + "_converted.wav"
    audio.export(wav_path, format="wav")
    return wav_path

def main(audio_path):
    print(f"\n🎙️ Processing: {audio_path}\n{'-' * 60}")

    audio_path = convert_to_wav(audio_path)

    transcript_text, transcript_segments = transcribe_audio(audio_path)

    summary_en, summary_bn = summarize_transcript_dual(transcript_segments)

    num_words = sum(len(seg["text"].split()) for seg in transcript_segments)
    duration_minutes = transcript_segments[-1]["end"] / 60
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")

    metadata = f"""
**Duration**: {duration_minutes:.1f} min  
**Total Words**: {num_words}  
**Generated on**: {timestamp}
"""

    fname = os.path.basename(audio_path).split(".")[0]
    file_timestamp = datetime.now().strftime("%Y-%m-%d_%H%M")
    output_dir = "output"
    os.makedirs(output_dir, exist_ok=True)

    with open(f"{output_dir}/minutes_{fname}_{file_timestamp}_en.md", "w") as f_en:
        f_en.write(metadata + "\n\n" + summary_en)

    with open(f"{output_dir}/minutes_{fname}_{file_timestamp}_bn.md", "w") as f_bn:
        f_bn.write(metadata + "\n\n" + summary_bn)

    print(f"\n✅ English Minutes: {output_dir}/minutes_{fname}_{file_timestamp}_en.md")
    print(f"✅ Bangla Minutes: {output_dir}/minutes_{fname}_{file_timestamp}_bn.md\n")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="🎯 Transcribe & summarize meetings (dual-language)")
    parser.add_argument("--input", "-i", required=True, help="Path to audio file (.wav/.mp3/.m4a etc.)")
    args = parser.parse_args()
    main(args.input)