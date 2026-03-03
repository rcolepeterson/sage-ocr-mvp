/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import plantsData from "../../data/plants.json";

export default function ScanPage() {
  const videoRef = useRef<HTMLVideoElement>();
  const canvasRef = useRef<HTMLCanvasElement>();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [matchId, setMatchId] = useState<string | null>();
  const [noMatch, setNoMatch] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [lookup, setLookup] = useState<any>();
  const [query, setQuery] = useState("");
  const [lookupError, setLookupError] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);

  const router = useRouter();
  const noMatchRef = useRef<HTMLDivElement>(null);

  async function handleLookup() {
    console.log("[lookup] button clicked");

    setLookupError("");
    setLookupLoading(true);

    const res = await fetch("/api/plant-lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: query || text }),
    });

    console.log("[lookup] fetching… status:", res.status);

    const data = await res.json();
    console.log("[lookup] response:", data);

    if (!res.ok || data?.error) {
      setLookup(null);
      setLookupError(data?.error || "No plant found");
      setLookupLoading(false);
      return;
    }

    setLookup(data);
    setLookupLoading(false);
  }

  useEffect(() => {
    async function initCamera() {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
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

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    downscaleCanvas(canvas, 1280);

    const imageBase64 = canvas.toDataURL("image/jpeg", 0.7);

    const res = await fetch("/api/ocr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64 }),
    });

    const data = await res.json();
    const ocrText = data.text || "";
    setText(ocrText);

    console.log("[ocr] text:", ocrText);

    const match = plantsData.find(
      (plant) =>
        ocrText.toLowerCase().includes(plant.commonName.toLowerCase()) ||
        ocrText.toLowerCase().includes(plant.latinName.toLowerCase()),
    );

    if (match) {
      setMatchId(match.id);
      setNoMatch(false);
      setTimeout(() => {
        router.push(`/plant/${match.id}`);
      }, 800);
    } else {
      setMatchId(null);
      setNoMatch(true);
      setTimeout(() => {
        if (noMatchRef.current) {
          noMatchRef.current.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }, 100);
    }
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6 flex justify-center">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-semibold mb-4">Scan Plant Tag</h1>

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

        {/* Plant lookup UI */}
        <input
          className="w-full p-2 border rounded mt-4"
          placeholder="Edit plant name before lookup"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          onClick={handleLookup}
          className="mt-2 w-full bg-green-600 text-white py-2 rounded"
        >
          Find Plant Info
        </button>

        {lookupLoading && (
          <div className="mt-2 text-sm text-gray-500">Looking up plant...</div>
        )}

        {lookupError && (
          <div className="mt-2 text-sm text-red-600">{lookupError}</div>
        )}

        {lookup?.latinName && (
          <div className="mt-4 p-4 bg-white rounded shadow">
            <div className="font-semibold">{lookup.commonName}</div>
            <div className="italic">{lookup.latinName}</div>
            {lookup.family && <div>Family: {lookup.family}</div>}
            {lookup.genus && <div>Genus: {lookup.genus}</div>}
            {lookup.usdaSymbol && <div>USDA: {lookup.usdaSymbol}</div>}
            {lookup.imageUrl && (
              <img
                src={lookup.imageUrl}
                alt={lookup.commonName || lookup.latinName}
                className="mt-2 rounded"
              />
            )}
          </div>
        )}

        {noMatch && (
          <div
            ref={noMatchRef}
            className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg"
          >
            <div className="text-red-700 font-semibold mb-2">
              No match found
            </div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Select plant manually:
            </label>
            <select
              className="w-full p-2 rounded border border-gray-300"
              value={selectedId}
              onChange={(e) => {
                setSelectedId(e.target.value);
                if (e.target.value) router.push(`/plant/${e.target.value}`);
              }}
            >
              <option value="">Choose a plant...</option>
              {plantsData.map((plant) => (
                <option key={plant.id} value={plant.id}>
                  {plant.commonName} ({plant.latinName})
                </option>
              ))}
            </select>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </main>
  );
}
