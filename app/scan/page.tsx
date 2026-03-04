/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCompletion } from "@ai-sdk/react";
import { parsePartialJson } from "ai";
import plantsData from "../../data/plants.json";

export default function ScanPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [llmResult, setLlmResult] = useState<{
    commonName?: string | null;
    latinName?: string | null;
    light?: string | null;
    water?: string | null;
    careTips?: string[];
    warnings?: string[];
  } | null>(null);
  const [debug, setDebug] = useState<string[]>([]);

  const router = useRouter();

  const addDebug = (msg: string) =>
    setDebug((d) =>
      [`${new Date().toISOString()} — ${msg}`, ...d].slice(0, 50),
    );

  const {
    completion,
    complete,
    isLoading: llmLoading,
  } = useCompletion({
    api: "/api/plant-llm",
    streamProtocol: "text",
    onError(err) {
      addDebug(`LLM error: ${err?.message || String(err)}`);
      console.error("LLM error:", err);
    },
  });

  useEffect(() => {
    if (!completion) return;
    parsePartialJson(completion).then(({ value }) => {
      if (value && typeof value === "object") {
        setLlmResult(value as typeof llmResult);
      }
    });
  }, [completion]);

  useEffect(() => {
    async function initCamera() {
      addDebug("initCamera()");
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        if (videoRef.current) videoRef.current.srcObject = stream;
        addDebug("camera stream attached");
      } catch (e: any) {
        addDebug(`camera error: ${e?.message || String(e)}`);
      }
    }
    initCamera();
  }, []);

  function downscaleCanvas(canvas: HTMLCanvasElement, maxWidth = 1280) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = canvas;
    if (width <= maxWidth) return;

    const scale = maxWidth / width;
    const newWidth = maxWidth;
    const newHeight = height * scale;

    const tmp = document.createElement("canvas");
    tmp.width = newWidth;
    tmp.height = newHeight;

    const tmpCtx = tmp.getContext("2d");
    if (!tmpCtx) return;

    tmpCtx.drawImage(canvas, 0, 0, newWidth, newHeight);
    canvas.width = newWidth;
    canvas.height = newHeight;
    ctx.drawImage(tmp, 0, 0);
  }

  async function handleScan() {
    if (!videoRef.current || !canvasRef.current) return;
    setLoading(true);
    addDebug("handleScan()");

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    downscaleCanvas(canvas, 1280);
    const imageBase64 = canvas.toDataURL("image/jpeg", 0.7);
    addDebug(`image captured, len=${imageBase64.length}`);

    const res = await fetch("/api/ocr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64 }),
    });

    addDebug(`OCR status: ${res.status}`);
    const data = await res.json();
    const ocrText = data.text || "";
    setText(ocrText);
    addDebug(`OCR text len=${ocrText.length}`);

    const match = plantsData.find(
      (plant) =>
        ocrText.toLowerCase().includes(plant.commonName.toLowerCase()) ||
        ocrText.toLowerCase().includes(plant.latinName.toLowerCase()),
    );

    if (match) {
      addDebug(`match found: ${match.id}`);
      setQuery(match.commonName);
      setTimeout(() => router.push(`/plant/${match.id}`), 800);
    } else {
      addDebug("no match found");
      setQuery(ocrText.replace(/\s+/g, " ").trim());
    }
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-semibold mb-4 max-w-6xl mx-auto">
        Scan Plant Tag
      </h1>

      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-6">
        {/* Left: camera + controls */}
        <div className="flex-1 min-w-0">
          <div className="rounded-xl overflow-hidden bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-auto"
            />
          </div>

          <button
            onClick={handleScan}
            disabled={loading}
            className="mt-4 w-full rounded-lg bg-green-600 text-white py-3 font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Scanning..." : "Scan"}
          </button>

          <div className="mt-4 bg-gray-900 text-green-300 p-4 rounded-lg min-h-[120px] text-sm whitespace-pre-wrap">
            {text || "No OCR yet"}
          </div>

          <input
            className="w-full p-2 border rounded mt-4"
            placeholder="Edit plant name before lookup"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <button
            onClick={() => {
              const q = query || text;
              addDebug(`LLM submit: "${q}"`);
              if (!q) return;
              setLlmResult(null);
              complete(q);
            }}
            disabled={llmLoading || !(query || text)}
            className="mt-2 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {llmLoading ? "Streaming LLM..." : "Find Plant Info (LLM)"}
          </button>
        </div>

        {/* Right: LLM results */}
        <div className="flex-1 min-w-0">
          {llmLoading && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 animate-pulse">
              Streaming plant info...
            </div>
          )}

          {llmResult?.latinName && (
            <div className="p-4 bg-white rounded-xl shadow border border-blue-200">
              <div className="text-xl font-semibold">
                {llmResult.commonName}
              </div>
              <div className="italic text-gray-500 mb-3">
                {llmResult.latinName}
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                <div className="bg-gray-50 rounded p-2">
                  <span className="font-medium">Light</span>
                  <div>{llmResult.light}</div>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <span className="font-medium">Water</span>
                  <div>{llmResult.water}</div>
                </div>
              </div>
              {llmResult.careTips && llmResult.careTips.length > 0 && (
                <div className="mb-3">
                  <div className="font-medium text-sm mb-1">Care Tips</div>
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    {llmResult.careTips.map((t: string, i: number) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                </div>
              )}
              {llmResult.warnings && llmResult.warnings.length > 0 && (
                <div className="text-sm text-red-600 bg-red-50 rounded p-2">
                  <div className="font-medium mb-1">Warnings</div>
                  <ul className="list-disc pl-5 space-y-1">
                    {llmResult.warnings.map((w: string, i: number) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {!llmLoading && !llmResult && (
            <div className="p-4 bg-gray-100 rounded-lg text-sm text-gray-400">
              Plant info will appear here after lookup.
            </div>
          )}

          {/* Debug panel */}
          <div className="mt-6 bg-black text-green-400 p-3 rounded text-xs whitespace-pre-wrap">
            {debug.length ? debug.join("\n") : "debug log empty"}
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </main>
  );
}
