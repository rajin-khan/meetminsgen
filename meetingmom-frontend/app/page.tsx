// meetingmom-frontend/app/page.tsx
"use client";

import { useState, useCallback, ChangeEvent } from "react";
import {
  UploadCloud,
  Loader2,
  FileText,
  Clock,
  Languages,
  AlertCircle,
  X,
} from "lucide-react";
import axios, { AxiosError } from "axios";
import ReactMarkdown from "react-markdown";
// Optional: If your markdown might contain HTML, you might need rehype-raw
// import rehypeRaw from 'rehype-raw';

// --- Installation Reminders ---
// npm install react-markdown @tailwindcss/typography
// or
// yarn add react-markdown @tailwindcss/typography
// Add require('@tailwindcss/typography') to tailwind.config.js plugins array

// --- Type Definitions ---
interface SummaryMetadata {
  duration_minutes: number | null; // Allow null if data might be missing
  total_words: number | null;      // Allow null if data might be missing
  timestamp: string;               // Assuming timestamp is a string (e.g., ISO format)
}

interface SummaryData {
  summary_en: string;
  summary_bn: string;
  metadata: SummaryMetadata;
}

export default function Home() {
  // --- State Variables ---
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // --- Event Handlers ---
  const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setSummary(null); // Clear previous summary on new file selection
    setError(null);   // Clear previous error on new file selection
    // Reset the input value if the same file is selected again after clearing
    e.target.value = '';
  }, []);

  const clearFile = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault(); // Prevent label click if inside label
    setFile(null);
    // Keep summary/error visible if user just clears the file selection
    // setSummary(null);
    // setError(null);
  }, []);

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setSummary(null); // Clear previous summary before new request
    setError(null);   // Clear previous error before new request
    const formData = new FormData();
    formData.append("file", file);

    // --- Backend URL Configuration ---
    // Use environment variable for flexibility (create .env.local in frontend root)
    // Example .env.local content: NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:8000
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

    try {
      console.log(`Sending request to ${backendUrl}/transcribe`);
      const res = await axios.post<SummaryData>(`${backendUrl}/transcribe`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        // Optional: Increase timeout for potentially long processing
        timeout: 600000, // 10 minutes
      });
      console.log("Response received:", res.data);
      setSummary(res.data);
    } catch (err) {
      console.error("Error during transcription request:", err);
      let errorMessage = "An unexpected error occurred. Please try again later.";
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<{ detail?: string | { msg: string } }>; // Handle FastAPI validation errors too
        if (axiosError.response) {
          // Server responded with an error status (4xx, 5xx)
          const status = axiosError.response.status;
          let detail = `Server responded with status ${status}.`;
          if (axiosError.response.data?.detail) {
             if (typeof axiosError.response.data.detail === 'string') {
               detail = axiosError.response.data.detail;
             } else if (Array.isArray(axiosError.response.data.detail) && axiosError.response.data.detail[0]?.msg) {
               // Handle Pydantic validation error format
               detail = axiosError.response.data.detail[0].msg;
             }
          } else {
            detail = axiosError.response.statusText || detail;
          }
          errorMessage = `Error ${status}: ${detail}`;
        } else if (axiosError.request) {
          // Request was made but no response received (network error, server down)
          errorMessage = `Could not connect to the TidyMeet server at ${backendUrl}. Please ensure it's running and accessible.`;
        } else {
          // Error setting up the request
          errorMessage = `Request setup error: ${axiosError.message}`;
        }
      } else if (err instanceof Error) {
         // General JavaScript error
         errorMessage = `Client-side error: ${err.message}`;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // --- JSX Rendering ---
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-zinc-900 to-gray-950 text-gray-200 flex flex-col items-center px-4 py-10 md:py-16 selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <header className="text-center mb-10 md:mb-12">
        <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500 mb-2">
          TidyMeet
        </h1>
        <p className="text-lg text-indigo-200/80">Turn conversations into clarity.</p>
      </header>

      {/* Upload Section */}
      <section className="w-full max-w-2xl bg-zinc-800/60 backdrop-blur-md border border-zinc-700/80 rounded-xl shadow-xl p-6 md:p-8 flex flex-col items-center gap-5 transition-all duration-300">
        <label
          htmlFor="file-upload"
          className={`
            w-full flex flex-col items-center justify-center p-6 border-2 border-zinc-600 border-dashed rounded-lg cursor-pointer
            hover:border-indigo-500/80 hover:bg-zinc-700/30 transition-all duration-200 ease-in-out
            ${loading ? 'opacity-60 cursor-not-allowed' : ''}
            ${file ? 'border-indigo-500/50 bg-zinc-700/20' : ''}
          `}
        >
          <input
            id="file-upload"
            type="file"
            className="hidden"
            onChange={handleFileChange}
            // More comprehensive list based on common audio types & Whisper support
            accept="audio/mpeg,audio/mp4,audio/x-m4a,audio/wav,audio/ogg,audio/webm,audio/flac"
            disabled={loading}
          />
          <div className="flex flex-col items-center gap-3 text-center">
            <UploadCloud size={32} className={`transition-colors duration-200 ${file ? 'text-indigo-400' : 'text-zinc-400'}`} />
            {file ? (
              <div className="flex items-center gap-2 mt-2 text-sm">
                <FileText size={16} className="text-indigo-400 flex-shrink-0" />
                <span className="font-medium text-gray-100 truncate max-w-[200px] sm:max-w-xs md:max-w-sm" title={file.name}>{file.name}</span>
                {!loading && (
                  <button
                    onClick={clearFile}
                    className="ml-2 p-1 rounded-full text-zinc-500 hover:text-red-400 hover:bg-zinc-700 transition-colors duration-150"
                    aria-label="Clear file"
                    title="Clear selected file"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ) : (
              <>
                <span className="font-semibold text-gray-100">Click to upload or drag & drop</span>
                <span className="text-xs text-zinc-400/80">Supports MP3, M4A, WAV, OGG, WEBM, FLAC</span>
              </>
            )}
          </div>
        </label>
        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className="
            w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700
            focus:ring-4 focus:ring-indigo-500/50 focus:outline-none shadow-md hover:shadow-lg
            transition-all duration-300 ease-in-out px-8 py-3 rounded-lg text-white font-semibold text-base
            disabled:opacity-50 disabled:cursor-not-allowed disabled:from-indigo-800 disabled:to-purple-800 disabled:shadow-none
            flex items-center justify-center gap-2
          "
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={20} /> Processing Audio...
            </>
          ) : (
            "Upload & Summarize"
          )}
        </button>
      </section>

      {/* Error Display */}
      {error && (
        <div className="mt-8 w-full max-w-4xl bg-red-900/40 border border-red-700/80 text-red-200 px-4 py-3 rounded-lg relative flex items-start gap-3 shadow-lg" role="alert">
          <AlertCircle size={20} className="flex-shrink-0 mt-0.5 text-red-300" />
          <span className="flex-grow text-sm break-words">{error}</span>
          <button
            onClick={() => setError(null)}
            className="p-1 -mr-1 -mt-1 rounded-full text-red-300 hover:text-white hover:bg-red-800/50 transition-colors"
            aria-label="Dismiss error"
            title="Dismiss error"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Results Section */}
      <section className="mt-10 md:mt-16 w-full max-w-7xl">
        {/* --- Idle State --- */}
        {!loading && !summary && !error && (
           <div className="text-center text-zinc-500/80 py-12 border-2 border-dashed border-zinc-700/60 rounded-xl">
              <Languages size={48} className="mx-auto mb-4 opacity-50 text-zinc-600" />
              <p className="text-lg">Upload an audio file</p>
              <p className="text-sm">Your dual-language summaries will appear here.</p>
           </div>
        )}

        {/* --- Loading State --- */}
        {loading && (
          <div className="text-center text-zinc-400/90 py-12 border-2 border-dashed border-indigo-500/30 rounded-xl bg-zinc-800/30 animate-pulse">
            <Loader2 size={48} className="mx-auto mb-4 animate-spin text-indigo-400" />
            <p className="text-lg font-medium">Generating summaries...</p>
            <p className="text-sm">This may take a few moments depending on the audio length.</p>
          </div>
        )}

        {/* --- Summary Display State --- */}
        {summary && !loading && ( // Render only when summary exists and not currently loading
          <div className="space-y-8 animate-fade-in"> {/* Simple fade-in animation (requires setup in tailwind.config) */}
             {/* Metadata Bar */}
            <div className="bg-zinc-800/70 backdrop-blur-sm border border-zinc-700/80 rounded-lg p-4 flex flex-wrap justify-center items-center gap-x-6 gap-y-3 text-sm text-zinc-300 shadow">
               <div className="flex items-center gap-1.5" title="Audio Duration">
                  <Clock size={16} className="text-indigo-400" />
                  <span>{summary.metadata.duration_minutes?.toFixed(1) ?? 'N/A'} min</span>
               </div>
               <span className="text-zinc-600 hidden sm:inline">|</span>
               <div className="flex items-center gap-1.5" title="Word Count (approx.)">
                  <FileText size={16} className="text-indigo-400" />
                  <span>{summary.metadata.total_words?.toLocaleString() ?? 'N/A'} words</span>
               </div>
               <span className="text-zinc-600 hidden sm:inline">|</span>
               <div className="flex items-center gap-1.5" title="Processed Timestamp">
                   <Clock size={16} className="text-indigo-400" />
                   <span>{new Date(summary.metadata.timestamp).toLocaleString() ?? 'N/A'}</span>
               </div>
            </div>

            {/* Summaries Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
              {/* English Summary Card */}
              <div className="bg-zinc-800/70 backdrop-blur-sm border border-zinc-700/80 rounded-xl p-6 shadow-lg h-full flex flex-col overflow-hidden">
                <h2 className="text-xl font-semibold mb-4 text-white flex items-center gap-2 flex-shrink-0">
                   <span role="img" aria-label="USA flag" className="text-lg">🇺🇸</span> Minutes (English)
                </h2>
                {/* Apply prose for markdown styling. prose-invert for dark mode */}
                <article className="prose prose-sm prose-zinc prose-invert max-w-none text-zinc-300 flex-grow overflow-y-auto custom-scrollbar pr-2">
                  <ReactMarkdown
                    // If markdown includes HTML like <b>, <i>:
                    // import rehypeRaw from 'rehype-raw';
                    // rehypePlugins={[rehypeRaw]}
                    // Or use remark-gfm for GitHub Flavored Markdown:
                    // import remarkGfm from 'remark-gfm';
                    // remarkPlugins={[remarkGfm]} // Better for tables, strikethrough etc.
                  >{summary.summary_en || "_No English summary generated._"}</ReactMarkdown>
                </article>
              </div>

              {/* Bangla Summary Card */}
              <div className="bg-zinc-800/70 backdrop-blur-sm border border-zinc-700/80 rounded-xl p-6 shadow-lg h-full flex flex-col overflow-hidden">
                 <h2 className="text-xl font-semibold mb-4 text-white flex items-center gap-2 flex-shrink-0">
                    <span role="img" aria-label="Bangladesh flag" className="text-lg">🇧🇩</span> কার্যবিবরণী (Bangla)
                 </h2>
                 <article className="prose prose-sm prose-zinc prose-invert max-w-none text-zinc-300 flex-grow overflow-y-auto custom-scrollbar pr-2">
                   {/* Add lang="bn" for better font rendering/accessibility */}
                   <div lang="bn">
                     <ReactMarkdown
                        // rehypePlugins={[rehypeRaw]} // if needed
                        // remarkPlugins={[remarkGfm]} // if needed
                     >{summary.summary_bn || "_কোনো বাংলা সারাংশ তৈরি হয়নি।_"}</ReactMarkdown>
                   </div>
                 </article>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="mt-16 text-center text-zinc-500/80 text-xs">
        <p>© {new Date().getFullYear()} TidyMeet. Minimalist Meeting Intelligence.</p>
      </footer>
    </main>
  );
}