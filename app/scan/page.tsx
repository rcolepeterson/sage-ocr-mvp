// app/scan/page.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCompletion } from "@ai-sdk/react";
import { parsePartialJson } from "ai";
import plantsData from "../../data/plants.json";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/firebase/AuthContext";
import {
  getSpaces,
  createSpace,
  savePlantToSpace,
  Space,
} from "@/lib/firebase/spaces";
import { uploadPlantPhoto } from "@/lib/firebase/storage";

export default function ScanPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { user } = useAuth();

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
    tags?: string[];
  } | null>();
  const [debug, setDebug] = useState<string[]>([]);
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    "environment",
  );

  // Save plant state
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>("");
  const [newSpaceName, setNewSpaceName] = useState("");
  const [isIndoor, setIsIndoor] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showNewSpace, setShowNewSpace] = useState(false);

  // Photo upload state
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploading, setUploading] = useState(false);

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
    initCamera("environment");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!user) return;
    getSpaces(user.uid).then((fetchedSpaces) => {
      setSpaces(fetchedSpaces);
      if (fetchedSpaces.length > 0) {
        setSelectedSpaceId(fetchedSpaces[0].id);
        setShowNewSpace(false);
      } else {
        setShowNewSpace(true);
      }
    });
  }, [user]);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  }

  async function handleSavePlant() {
    if (!user || !llmResult?.latinName) return;
    setSaving(true);
    setUploading(false);
    setUploadProgress(0);
    let photoUrl = "";

    try {
      let spaceId = selectedSpaceId;

      if (showNewSpace && newSpaceName.trim()) {
        spaceId = await createSpace(
          user.uid,
          newSpaceName.trim(),
          isIndoor ? "indoor" : "outdoor",
        );
      }

      if (!spaceId) {
        alert("Please select or create a space first.");
        setSaving(false);
        return;
      }

      if (photoFile) {
        setUploading(true);
        photoUrl = await uploadPlantPhoto(
          user.uid,
          spaceId,
          llmResult.latinName.replace(/\s+/g, "_"),
          photoFile,
          (progress) => setUploadProgress(progress),
        );
        setUploading(false);
      }

      await savePlantToSpace(
        user.uid,
        spaceId,
        {
          commonName: llmResult.commonName || "",
          latinName: llmResult.latinName || "",
          photo: photoUrl,
          lightLevel: "medium",
          container: false,
          indoor: isIndoor,
          careInfo: llmResult,
          tags: (llmResult as any).tags || [],
        },
        photoUrl,
      );

      setSaved(true);
      setPhotoFile(null);
      setPhotoPreview("");
      setUploadProgress(0);
    } catch (e) {
      console.error("Error saving plant:", e);
    }

    setSaving(false);
    setUploading(false);
  }

  async function initCamera(mode: "user" | "environment" = facingMode) {
    addDebug(`initCamera(${mode})`);
    try {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode },
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
      addDebug("camera stream attached");
    } catch (e: any) {
      addDebug(`camera error: ${e?.message || String(e)}`);
    }
  }

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
    <main className="min-h-screen bg-swansons-cream pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌿</span>
            <h1 className="text-xl">Scan Plant Tag</h1>
          </div>
          <Link
            href="/"
            className="text-swansons-green hover:underline text-sm"
          >
            ← Back
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: Camera + Controls */}
          <div className="flex-1 min-w-0">
            <div className="card overflow-hidden">
              <div className="bg-swansons-green-dark">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-auto"
                />
              </div>
            </div>

            <Button
              onClick={handleScan}
              disabled={loading}
              variant="primary"
              size="lg"
              className="mt-4 w-full"
            >
              {loading ? "📷 Scanning..." : "📷 Scan"}
            </Button>

            <Button
              onClick={() => {
                const next = facingMode === "user" ? "environment" : "user";
                setFacingMode(next);
                initCamera(next);
              }}
              variant="secondary"
              className="mt-2 w-full"
            >
              {facingMode === "user"
                ? "↩️ Use Rear Camera"
                : "🤳 Use Selfie Camera"}
            </Button>

            <div className="mt-4 card p-4">
              <h3 className="text-sm font-medium text-swansons-muted mb-2">
                OCR Result
              </h3>
              <div className="bg-swansons-green-dark text-swansons-green-light p-4 rounded-swansons min-h-[100px] text-sm font-mono whitespace-pre-wrap">
                {text || "No OCR text yet — scan a plant tag to begin"}
              </div>
            </div>

            <div className="mt-4 card p-4">
              <label className="text-sm font-medium text-swansons-muted mb-2 block">
                Plant name (edit if needed)
              </label>
              <input
                className="input"
                placeholder="Edit plant name before lookup"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <Button
                onClick={() => {
                  const q = query || text;
                  addDebug(`LLM submit: "${q}"`);
                  if (!q) return;
                  setLlmResult(null);
                  setSaved(false);
                  complete(q);
                }}
                disabled={llmLoading || !(query || text)}
                variant="secondary"
                className="mt-3 w-full"
              >
                {llmLoading
                  ? "🔍 Streaming LLM..."
                  : "🔍 Find Plant Info (LLM)"}
              </Button>
            </div>
          </div>

          {/* Right: LLM Results */}
          <div className="flex-1 min-w-0">
            {/* Loading State */}
            {llmLoading && (
              <div className="card p-4 border-2 border-swansons-green bg-swansons-green-muted">
                <div className="flex items-center gap-3 text-swansons-green-dark">
                  <div className="animate-spin h-5 w-5 border-2 border-swansons-green border-t-transparent rounded-full"></div>
                  <span className="font-medium">Streaming plant info...</span>
                </div>
              </div>
            )}

            {/* Results Card */}
            {llmResult?.latinName && (
              <>
                <div className="card p-6">
                  <div className="text-center mb-4 pb-4 border-b border-gray-100">
                    <span className="text-4xl mb-2 block">🌱</span>
                    <h2 className="text-xl mb-1">{llmResult.commonName}</h2>
                    <p className="italic text-swansons-muted">
                      {llmResult.latinName}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-swansons-green-muted rounded-swansons p-3 text-center">
                      <span className="text-xl block mb-1">☀️</span>
                      <span className="text-xs font-medium text-swansons-muted block">
                        Light
                      </span>
                      <span className="text-sm text-swansons-text">
                        {llmResult.light}
                      </span>
                    </div>
                    <div className="bg-swansons-green-muted rounded-swansons p-3 text-center">
                      <span className="text-xl block mb-1">💧</span>
                      <span className="text-xs font-medium text-swansons-muted block">
                        Water
                      </span>
                      <span className="text-sm text-swansons-text">
                        {llmResult.water}
                      </span>
                    </div>
                  </div>

                  {llmResult.careTips && llmResult.careTips.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-sm font-semibold text-swansons-green-dark mb-2">
                        🌿 Care Tips
                      </h3>
                      <ul className="space-y-2">
                        {llmResult.careTips.map((t: string, i: number) => (
                          <li
                            key={i}
                            className="text-sm text-swansons-text bg-swansons-cream p-2 rounded-swansons"
                          >
                            {t}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {llmResult.warnings && llmResult.warnings.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-swansons p-3">
                      <h3 className="text-sm font-semibold text-red-700 mb-2">
                        ⚠️ Warnings
                      </h3>
                      <ul className="space-y-1">
                        {llmResult.warnings.map((w: string, i: number) => (
                          <li key={i} className="text-sm text-red-600">
                            {w}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Save Plant Section */}
                {!saved ? (
                  <div className="card p-6 mt-4">
                    <h3 className="text-sm font-semibold mb-1">
                      💾 Save to My Plants
                    </h3>

                    {spaces.length === 0 && (
                      <p className="text-xs text-gray-400 mb-3">
                        First, give your space a name — like &quot;Living
                        Room&quot; or &quot;Back Deck&quot; — then save your
                        plant to it.
                      </p>
                    )}

                    {spaces.length > 0 && !showNewSpace && (
                      <div className="mb-3">
                        <label className="text-xs text-gray-500 mb-1 block">
                          Select a space
                        </label>
                        <select
                          className="input w-full"
                          value={selectedSpaceId}
                          onChange={(e) => setSelectedSpaceId(e.target.value)}
                        >
                          {spaces.map((space) => (
                            <option key={space.id} value={space.id}>
                              {space.name} ({space.type})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <button
                      type="button"
                      className="text-xs text-swansons-green underline mb-3 block"
                      onClick={() => setShowNewSpace(!showNewSpace)}
                    >
                      {showNewSpace
                        ? "← Use existing space"
                        : spaces.length === 0
                          ? "📍 Name your space first"
                          : "+ Create new space"}
                    </button>

                    {showNewSpace && (
                      <div className="mb-3 space-y-2">
                        <input
                          className="input w-full"
                          placeholder="Space name (e.g. Front Deck)"
                          value={newSpaceName}
                          onChange={(e) => setNewSpaceName(e.target.value)}
                        />
                      </div>
                    )}

                    {/* Photo Upload */}
                    <div className="mb-4">
                      <label className="block text-xs text-gray-500 mb-1">
                        Optional: Add a photo
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="block w-full text-xs"
                        onChange={handlePhotoChange}
                        disabled={saving || uploading}
                      />
                      {photoPreview && (
                        <div className="mt-2 w-full flex justify-center">
                          <img
                            src={photoPreview}
                            alt="Plant preview"
                            className="rounded object-cover max-h-40 border"
                          />
                        </div>
                      )}
                      {uploading && (
                        <div className="mt-2 text-xs text-swansons-green">
                          Uploading photo... {uploadProgress.toFixed(0)}%
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 mb-4">
                      <button
                        type="button"
                        className={`flex-1 rounded-full py-1.5 text-sm border transition ${
                          isIndoor
                            ? "bg-green-700 text-white border-green-700"
                            : "bg-white text-gray-600 border-gray-200"
                        }`}
                        onClick={() => setIsIndoor(true)}
                      >
                        🏠 Indoor
                      </button>
                      <button
                        type="button"
                        className={`flex-1 rounded-full py-1.5 text-sm border transition ${
                          !isIndoor
                            ? "bg-green-700 text-white border-green-700"
                            : "bg-white text-gray-600 border-gray-200"
                        }`}
                        onClick={() => setIsIndoor(false)}
                      >
                        🌤️ Outdoor
                      </button>
                    </div>

                    <Button
                      onClick={handleSavePlant}
                      disabled={
                        saving ||
                        uploading ||
                        (showNewSpace && !newSpaceName.trim()) ||
                        (!showNewSpace && !selectedSpaceId)
                      }
                      variant="primary"
                      className="w-full"
                    >
                      {saving || uploading ? "Saving..." : "Save Plant 🌱"}
                    </Button>
                  </div>
                ) : (
                  <div className="card p-6 mt-4 text-center">
                    <span className="text-3xl mb-2 block">🎉</span>
                    <p className="font-medium text-green-700">Plant saved!</p>
                    <button
                      className="text-sm text-swansons-green underline mt-2"
                      onClick={() => router.push("/plants")}
                    >
                      View My Plants →
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Empty State */}
            {!llmLoading && !llmResult && (
              <div className="card p-8 text-center">
                <span className="text-4xl mb-3 block opacity-50">🌿</span>
                <p className="text-swansons-muted">
                  Plant info will appear here after lookup
                </p>
              </div>
            )}

            {/* Debug Panel */}
            <details className="mt-6">
              <summary className="text-sm text-swansons-muted cursor-pointer hover:text-swansons-green">
                🛠 Debug Log
              </summary>
              <div className="mt-2 bg-swansons-green-dark text-swansons-green-light p-3 rounded-swansons text-xs font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">
                {debug.length ? debug.join("\n") : "debug log empty"}
              </div>
            </details>
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </main>
  );
}
