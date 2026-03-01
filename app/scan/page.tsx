"use client";

import { useRef, useState, useEffect } from "react";

export default function ScanPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

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
    setText(data.text || "");
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

        <div className="mt-4 bg-gray-900 text-green-300 p-4 rounded-lg min-h-30 text-sm whitespace-pre-wrap">
          {text || "No OCR yet"}
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </main>
  );
}
