import os
import requests
from dotenv import load_dotenv

load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    raise ValueError("🚫 GROQ_API_KEY not found in .env")

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

def format_for_summary(transcript_segments):
    dialogue = ""
    for seg in transcript_segments:
        speaker = seg.get("speaker", "Speaker")
        start = int(seg.get("start", 0))
        minute = start // 60
        second = start % 60
        time = f"[{minute:02}:{second:02}]"
        dialogue += f"{time} {speaker}: {seg['text']}\n"
    return dialogue.strip()

def call_groq(prompt, model="mixtral-8x7b-32768"):
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": "You are a helpful meeting assistant."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.4
    }

    print("🧠 Summarizing via Groq...")
    response = requests.post(GROQ_API_URL, headers=headers, json=payload)

    if response.status_code != 200:
        raise Exception(f"Groq API failed: {response.status_code} – {response.text}")

    return response.json()["choices"][0]["message"]["content"]

def summarize_transcript_dual(transcript_segments, model="llama-3.3-70b-versatile"):
    formatted_transcript = format_for_summary(transcript_segments)

    prompt_en = f"""
You are an expert meeting assistant. Given the following meeting transcript (which may include Bangla or English), generate a structured Minutes of Meeting (MoM) in **English**, covering:

- Title
- Attendees (if possible)
- Timestamped key points
- Action items

Transcript:
```
{formatted_transcript}
```git
"""

    prompt_bn = f"""
আপনি একজন দক্ষ মিটিং সহকারী। নিচের মিটিং ট্রান্সক্রিপ্টটি (যেটিতে বাংলা ও ইংরেজি মিশ্রিত ভাষা থাকতে পারে) দেখে একটি **বাংলায়** লেখা সংক্ষিপ্ত মিটিং সারাংশ তৈরি করুন (Minutes of Meeting):

- শিরোনাম দিন
- অংশগ্রহণকারীদের নাম (যদি বোঝা যায়)
- সময় অনুযায়ী গুরুত্বপূর্ণ পয়েন্ট
- অ্যাকশন আইটেম বা সিদ্ধান্তসমূহ

ট্রান্সক্রিপ্ট:
```
{formatted_transcript}
```
"""

    summary_en = call_groq(prompt_en, model=model)
    summary_bn = call_groq(prompt_bn, model=model)

    return summary_en, summary_bn