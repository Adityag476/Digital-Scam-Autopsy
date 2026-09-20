"use client";

import React, { useState } from "react";
import ResultView from "@/components/autopsy/ResultView";
import SamplePicker from "@/components/autopsy/SamplePicker";
import { ScamAutopsy } from "@/components/autopsy/types";
import { SampleScam } from "@/lib/samples";
import {
  Upload,
  AlertCircle,
  FileImage,
  X,
  ArrowRight,
  ExternalLink,
  Shield,
} from "lucide-react";

export default function Home() {
  const [text, setText] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>("image/png");
  const [activeSampleId, setActiveSampleId] = useState<string | null>(null);
  const [result, setResult] = useState<ScamAutopsy | null>(null);
  const [analyzedMessage, setAnalyzedMessage] = useState<string>("");
  const [isFallback, setIsFallback] = useState<boolean>(false);
  const [isGrounded, setIsGrounded] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectSample = (sample: SampleScam) => {
    setActiveSampleId(sample.id);
    setText(sample.text);
    setImage(null);
    setError(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (PNG, JPG, WebP).");
      return;
    }

    setMimeType(file.type);
    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result as string);
      setActiveSampleId(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleClearImage = () => {
    setImage(null);
  };

  const runAnalysis = async () => {
    if (!text.trim() && !image) {
      setError("Please paste message text or upload a screenshot to inspect.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.trim() || undefined,
          image: image || undefined,
          mimeType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Analysis request failed.");
      }

      setResult(data.result);
      setAnalyzedMessage(data.message_text || text.trim());
      setIsFallback(Boolean(data.is_fallback));
      setIsGrounded(Boolean(data.grounded));
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred during autopsy.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setText("");
    setImage(null);
    setActiveSampleId(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-between">
      {/* Minimal Top Navigation */}
      <header className="border-b border-slate-100 py-4 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-slate-900 flex items-center justify-center text-white">
              <Shield className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-sm tracking-tight text-slate-900">
              Digital Scam Autopsy
            </span>
          </div>

          <div className="text-xs text-slate-500 font-mono hidden sm:block">
            Evidence-Grounded Threat Analysis
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-8 py-10 sm:py-14">
        {!result ? (
          <div className="space-y-10">
            {/* Editorial Hero */}
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-950">
                Understand how the scam works.
              </h1>
              <p className="text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
                Most detectors only offer a generic verdict. Digital Scam Autopsy reconstructs the persuasion sequence step-by-step and anchors every conclusion to literal evidence in the message.
              </p>
            </div>

            {/* Core Input Utility Card */}
            <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="scam-text"
                    className="text-xs font-semibold uppercase tracking-wider text-slate-500"
                  >
                    Paste message content
                  </label>
                  <span className="text-xs text-slate-400 font-mono">
                    {text.length} characters
                  </span>
                </div>

                <textarea
                  id="scam-text"
                  rows={4}
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    setActiveSampleId(null);
                    setError(null);
                  }}
                  placeholder="Paste SMS or message text here (e.g. 'URGENT: Your SBI KYC has expired. Your account will be blocked today...')"
                  className="w-full rounded border border-slate-200 p-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:outline-none focus:ring-0 font-sans leading-relaxed transition-colors"
                />
              </div>

              {/* Upload Screenshot Option */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                    <span>Attach screenshot</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  {image && (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-100 text-xs text-slate-700 border border-slate-200">
                      <FileImage className="w-3.5 h-3.5 text-slate-500" />
                      <span>Image attached</span>
                      <button
                        onClick={handleClearImage}
                        className="text-slate-400 hover:text-slate-700 ml-1"
                        title="Remove image"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                <span className="text-xs text-slate-400">
                  Text analyzed locally; screenshots processed via vision provider.
                </span>
              </div>

              {/* Error Callout */}
              {error && (
                <div className="rounded border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="button"
                onClick={runAnalysis}
                disabled={loading || (!text.trim() && !image)}
                className="w-full py-3 px-4 rounded bg-slate-900 hover:bg-black text-white text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    <span>Analyzing manipulation sequence...</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <span>Analyze attack chain</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                )}
              </button>
            </div>

            {/* Sample Scenarios */}
            <div className="pt-2">
              <SamplePicker
                onSelectSample={handleSelectSample}
                activeSampleId={activeSampleId}
              />
            </div>
          </div>
        ) : (
          /* Result Report Screen */
          <ResultView
            result={result}
            message={analyzedMessage}
            isFallback={isFallback}
            grounded={isGrounded}
            onReset={handleReset}
          />
        )}
      </main>

      {/* Understated Civic Safety Footer */}
      <footer className="border-t border-slate-100 py-6 px-4 sm:px-8 mt-12 text-xs text-slate-500">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-slate-700 font-medium">Official Indian Cyber Reporting:</span>
            <a href="tel:1930" className="text-red-700 hover:underline font-semibold">
              Helpline 1930
            </a>
            <span>·</span>
            <a
              href="https://cybercrime.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-700 hover:underline inline-flex items-center gap-1"
            >
              <span>cybercrime.gov.in</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
            <span>·</span>
            <a
              href="https://sancharsaathi.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-700 hover:underline inline-flex items-center gap-1"
            >
              <span>Chakshu</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          </div>

          <div className="text-[11px] text-slate-400 font-mono">
            Digital Scam Autopsy
          </div>
        </div>
      </footer>
    </div>
  );
}
