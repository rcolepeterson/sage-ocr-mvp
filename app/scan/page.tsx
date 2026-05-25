/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCompletion } from "@ai-sdk/react";
import { parsePartialJson } from "ai";
import { useAuth } from "@/lib/firebase/AuthContext";
import {
  getSpaces,
  createSpace,
  savePlantToSpace,
  Space,
} from "@/lib/firebase/spaces";
import { uploadPlantPhoto } from "@/lib/firebase/storage";
import { compressImage } from "@/lib/utils/imageCompression";
import { Button } from "@/components/ui/Button";
import { PhotoPicker } from "@/components/ui/PhotoPicker";
import { motion, AnimatePresence } from "motion/react";

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

/* ─── Types ─────────────────────────────────────────────────────────────── */
type ScanStep =
  | "idle"
  | "scanning"
  | "thinking"
  | "space-select"
  | "create-space";
type LightLevel = "full-sun" | "partial-sun" | "dappled-shade" | "full-shade";
type Containment = "container" | "in-ground" | "raised-bed";

/* ─── Error Banner ───────────────────────────────────────────────────────── */
function ErrorBanner({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="mx-4 mt-4 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 flex items-start justify-between gap-3"
      >
        <p className="font-body text-sm text-red-600 leading-relaxed">
          {message}
        </p>
        <button
          onClick={onDismiss}
          className="text-red-400 hover:text-red-600 font-body text-xs shrink-0 mt-0.5"
        >
          Dismiss
        </button>
      </motion.div>
    </AnimatePresence>
  );
}

/* ─── Scanning overlay — OCR phase ──────────────────────────────────────── */
function ScanningOverlay() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative w-48 h-32 border-2 border-swansons-navy rounded-lg overflow-hidden mb-8">
        <div
          className="absolute w-full h-0.5 bg-swansons-navy"
          style={{ animation: "scanline 1.5s ease-in-out infinite" }}
        />
      </div>
      <p className="font-heading text-2xl font-bold text-swansons-navy">
        Hold Still
      </p>
      <p className="font-body text-swansons-muted mt-2">Scanning in progress</p>
      <style>{`
      @keyframes scanline {
        0%, 100% { top: 0; }
        50% { top: calc(100% - 2px); }
      }
    `}</style>
    </div>
  );
}

/* ─── Thinking overlay — LLM phase ──────────────────────────────────────── */
function ThinkingOverlay() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-16 px-8"
    >
      {/* Spinning leaf */}
      <div className="relative w-20 h-20 mb-8">
        <div className="w-20 h-20 rounded-full border-4 border-swansons-green-muted border-t-swansons-navy animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center text-3xl">
          🌿
        </div>
      </div>
      <p className="font-heading text-2xl font-bold text-swansons-navy mb-3 text-center">
        Identifying your plant...
      </p>
      <p className="font-body text-swansons-muted text-center text-sm leading-relaxed">
        You can put the tag down now.
        <br />
        This usually takes a few seconds.
      </p>
    </motion.div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function ScanPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  /* step */
  const [step, setStep] = useState<ScanStep>("idle");
  const [showManual, setShowManual] = useState(true);
  const [manualQuery, setManualQuery] = useState("");

  /* errors */
  const [error, setError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  /* OCR / LLM */
  const [llmResult, setLlmResult] = useState<{
    commonName?: string | null;
    latinName?: string | null;
    light?: string | null;
    lightLevel?: "low" | "medium" | "high" | null;
    water?: string | null;
    careTips?: string[];
    warnings?: string[];
    tags?: string[];
  } | null>(null);
  const [debug, setDebug] = useState<string[]>([]);

  /* camera */
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    "environment",
  );

  /* spaces */
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState("");

  /* new space form */
  const [newSpaceName, setNewSpaceName] = useState("");
  const [spaceLight, setSpaceLight] = useState<LightLevel | "">("");
  const [spaceLocation, setSpaceLocation] = useState<"indoor" | "outdoor">(
    "outdoor",
  );
  const [spaceContainment, setSpaceContainment] = useState<Containment | "">(
    "",
  );

  /* saving */
  const [saving, setSaving] = useState(false);

  /* photo */
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

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
      setStep("idle");
      setError("Couldn't identify this plant. Please try again.");
    },
  });

  /* parse streaming LLM output */
  useEffect(() => {
    if (!completion) return;
    parsePartialJson(completion).then(({ value }) => {
      if (value && typeof value === "object") {
        setLlmResult(value as typeof llmResult);
      }
    });
  }, [completion]);

  /* advance to space-select when LLM finishes */
  useEffect(() => {
    if (!llmLoading && llmResult?.latinName && step === "thinking") {
      setStep("space-select");
    }
    if (
      !llmLoading &&
      completion &&
      !llmResult?.latinName &&
      step === "thinking"
    ) {
      setStep("idle");
      setError(
        "We couldn't identify a plant from that tag. Try holding the camera closer and scanning again.",
      );
    }
  }, [llmLoading, llmResult, step, completion]);

  /* read ?manual=true from URL */
  useEffect(() => {
    // const params = new URLSearchParams(window.location.search);
    // setShowManual(params.get("manual") === "true");
  }, []);

  /* load spaces */
  useEffect(() => {
    if (!user) return;
    getSpaces(user.uid).then((fetched) => {
      setSpaces(fetched);
      if (fetched.length > 0) setSelectedSpaceId(fetched[0].id);
    });
  }, [user]);

  /* init camera */
  useEffect(() => {
    initCamera("environment");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function initCamera(mode: "user" | "environment" = facingMode) {
    addDebug(`initCamera(${mode})`);
    setCameraError(null);
    try {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream)
          .getTracks()
          .forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode },
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
      addDebug("camera stream attached");
    } catch (e: any) {
      addDebug(`camera error: ${e?.message || String(e)}`);
      if (
        e?.name === "NotAllowedError" ||
        e?.name === "PermissionDeniedError"
      ) {
        setCameraError(
          "Camera access was denied. Please allow camera access in your browser settings and reload the page.",
        );
      } else if (e?.name === "NotFoundError") {
        setCameraError("No camera found on this device.");
      } else {
        setCameraError(
          "Couldn't start the camera. Please reload and try again.",
        );
      }
    }
  }

  function downscaleCanvas(canvas: HTMLCanvasElement, maxWidth = 1280) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width, height } = canvas;
    if (width <= maxWidth) return;
    const scale = maxWidth / width;
    const tmp = document.createElement("canvas");
    tmp.width = maxWidth;
    tmp.height = height * scale;
    tmp.getContext("2d")?.drawImage(canvas, 0, 0, tmp.width, tmp.height);
    canvas.width = tmp.width;
    canvas.height = tmp.height;
    ctx.drawImage(tmp, 0, 0);
  }

  async function handleScan(queryOverride?: string) {
    if (!queryOverride && (!videoRef.current || !canvasRef.current)) return;
    setError(null);
    setStep("scanning");
    setLlmResult(null);
    addDebug("handleScan()");

    let query = queryOverride || "";

    if (!queryOverride) {
      try {
        const video = videoRef.current!;
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        downscaleCanvas(canvas, 1280);
        const imageBase64 = canvas.toDataURL("image/jpeg", 0.7);
        addDebug(`image captured, len=${imageBase64.length}`);

        const [res] = await Promise.all([
          fetch("/api/ocr", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageBase64 }),
          }),
          new Promise((resolve) => setTimeout(resolve, 2000)), // minimum 2s
        ]);

        if (!res.ok) {
          throw new Error(`OCR failed with status ${res.status}`);
        }

        const data = await res.json();
        query = data.text || "";
        addDebug(`OCR text len=${query.length}`);

        if (!query.trim()) {
          setStep("idle");
          setError(
            "No text found on the tag. Hold the camera still and make sure the tag is clearly visible, then try again.",
          );
          return;
        }
      } catch (e: any) {
        addDebug(`OCR error: ${e?.message || String(e)}`);
        setStep("idle");
        setError("Something went wrong while scanning. Please try again.");
        return;
      }
    }

    // OCR done — switch to thinking before LLM starts
    setStep("thinking");
    addDebug(`LLM submit: "${query.slice(0, 60)}..."`);
    complete(query);
  }

  function handlePhotoChange(file: File) {
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function saveToSpace(spaceId: string) {
    if (!user || !llmResult?.latinName) return;
    setSaving(true);
    setUploading(false);
    setUploadProgress(0);
    setError(null);
    let photoUrl = "";

    try {
      if (photoFile) {
        setUploading(true);
        const compressed = await compressImage(photoFile);
        photoUrl = await uploadPlantPhoto(
          user.uid,
          spaceId,
          llmResult.latinName.replace(/\s+/g, "_"),
          compressed,
          (p) => setUploadProgress(p),
        );
        setUploading(false);
      }

      const plantId = await savePlantToSpace(
        user.uid,
        spaceId,
        {
          commonName: llmResult.commonName || "",
          latinName: llmResult.latinName || "",
          photo: photoUrl,
          lightLevel:
            llmResult.lightLevel ||
            (() => {
              const l = (llmResult.light || "").toLowerCase();
              if (l.includes("full sun") || l.includes("high")) return "high";
              if (l.includes("shade") || l.includes("low")) return "low";
              return "medium";
            })(),
          container: spaceContainment === "container",
          indoor: spaceLocation === "indoor",
          careInfo: llmResult,
          tags: (llmResult as any).tags || [],
        },
        photoUrl,
      );

      router.push(`/plant/${spaceId}/${plantId}`);
    } catch (e) {
      console.error("Error saving plant:", e);
      setError("Couldn't save your plant. Please try again.");
      setSaving(false);
      setUploading(false);
    }
  }

  async function handleCreateAndSave() {
    if (!user || !newSpaceName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const spaceId = await createSpace(
        user.uid,
        newSpaceName.trim(),
        spaceLocation,
      );
      await saveToSpace(spaceId);
    } catch (e) {
      console.error("Error creating space:", e);
      setError("Couldn't create the space. Please try again.");
      setSaving(false);
    }
  }

  function handleCancel() {
    setStep("idle");
    setLlmResult(null);
    setNewSpaceName("");
    setSpaceLight("");
    setSpaceContainment("");
    setPhotoFile(null);
    setPhotoPreview("");
    setSaving(false);
    setError(null);
  }

  /* ─── Render ─────────────────────────────────────────────────────────── */
  return (
    <main className="min-h-screen">
      {/* Camera error */}
      {cameraError && (
        <div className="mx-4 mt-4 bg-red-50 border border-red-200 rounded-2xl px-4 py-4 text-center">
          <p className="font-body text-sm text-red-600 leading-relaxed mb-3">
            📷 {cameraError}
          </p>
          <Button
            onClick={() => initCamera(facingMode)}
            variant="secondary"
            size="sm"
            className="rounded-full"
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Global error banner */}
      {error && (
        <ErrorBanner message={error} onDismiss={() => setError(null)} />
      )}

      {/* Camera — only during idle + scanning */}
      {(step === "idle" || step === "scanning") && !cameraError && (
        <div className="px-4 pt-4 relative">
          <div className="rounded-2xl overflow-hidden bg-black aspect-video">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          </div>
          <button
            onClick={() => {
              const next = facingMode === "user" ? "environment" : "user";
              setFacingMode(next);
              initCamera(next);
            }}
            className="absolute bottom-5 right-8 w-10 h-10 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center transition cursor-pointer"
            aria-label="Flip camera"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M1 4v6h6" />
              <path d="M23 20v-6h-6" />
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 0 1 3.51 15" />
            </svg>
          </button>
        </div>
      )}

      {/* ── IDLE ─────────────────────────────────────────────────────────── */}
      {step === "idle" && (
        <motion.div
          className="px-4 pt-4 pb-28 flex flex-col items-center justify-center"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <motion.p
            variants={itemVariants}
            className="font-body text-center text-swansons-black mb-8 text-base leading-relaxed font-semibold px-8"
          >
            Hold plant tag or label in front of camera, tap &apos;Scan&apos;
            button below and hold still as plant data is captured.
          </motion.p>

          <motion.div variants={itemVariants}>
            <Button
              onClick={() => handleScan()}
              variant="primary"
              className="py-2"
              disabled={!!cameraError}
            >
              Scan Plant Tag/Label
            </Button>
          </motion.div>

          {showManual && (
            <motion.div
              variants={itemVariants}
              className="bg-white rounded-2xl p-4 my-4"
            >
              <p className="text-xs font-body text-swansons-muted mb-2">
                🛠 Manual entry (dev only)
              </p>
              <input
                className="input w-full mb-3"
                placeholder="Enter plant name manually..."
                value={manualQuery}
                onChange={(e) => setManualQuery(e.target.value)}
              />
              <Button
                onClick={() => handleScan(manualQuery)}
                disabled={!manualQuery.trim()}
                variant="primary"
                className="w-full rounded-full"
              >
                Submit Manual Query
              </Button>
            </motion.div>
          )}

          {showManual && (
            <motion.p
              variants={itemVariants}
              className="text-center font-body text-sm text-swansons-muted underline cursor-pointer"
            >
              Can&apos;t find tag or label?
            </motion.p>
          )}
        </motion.div>
      )}

      {/* ── SCANNING — OCR phase ─────────────────────────────────────────── */}
      {step === "scanning" && (
        <div className="px-4 pb-28">
          <ScanningOverlay />
        </div>
      )}

      {/* ── THINKING — LLM phase ─────────────────────────────────────────── */}
      {step === "thinking" && (
        <div className="px-4 pb-28">
          <ThinkingOverlay />
        </div>
      )}

      {/* ── SPACE SELECT ─────────────────────────────────────────────────── */}
      {step === "space-select" && (
        <motion.div
          className="px-4 pt-8 pb-36 max-w-lg mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <motion.div
            variants={itemVariants}
            className="flex justify-center mb-6"
          >
            <img
              src="/images/add_plant_check_mark.png"
              alt="Success"
              width={100}
              height={100}
            />
          </motion.div>

          <motion.h2
            variants={itemVariants}
            className="font-heading text-4xl text-swansons-navy text-center mb-8 leading-tight"
          >
            Where is your {llmResult?.commonName} going?
          </motion.h2>

          <motion.div
            variants={itemVariants}
            className="flex flex-col items-center gap-4 mb-6"
          >
            <Button
              onClick={() => setStep("create-space")}
              variant="primary"
              className="w-65"
            >
              <span className="flex items-center gap-6">
                <span className="text-xl font-light leading-none">+</span>
                <span>Create a New Space</span>
              </span>
            </Button>

            {spaces.length > 0 && (
              <div className="relative w-65">
                <select
                  className="w-full border-2 border-swansons-navy text-swansons-navy font-body font-semibold py-2.5 rounded-full text-base bg-transparent px-6 appearance-none"
                  value={selectedSpaceId}
                  onChange={(e) => setSelectedSpaceId(e.target.value)}
                >
                  <option value="">Select Existing Space</option>
                  {spaces.map((space) => (
                    <option key={space.id} value={space.id}>
                      {space.name}
                    </option>
                  ))}
                </select>
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-swansons-navy pointer-events-none">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M6 9l6 6 6-6"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </div>
            )}
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="flex flex-col items-center gap-3 mb-4"
          >
            <PhotoPicker onFile={handlePhotoChange} disabled={saving}>
              <button
                type="button"
                disabled={saving}
                className="font-body text-swansons-navy border-2 border-swansons-navy rounded-full px-6 py-2.5 text-sm font-semibold hover:bg-swansons-navy hover:text-white transition"
              >
                {photoFile ? "Change Photo" : "+ Add Photo"}
              </button>
            </PhotoPicker>
            {photoPreview && (
              <div className="flex flex-col items-center gap-1">
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="rounded-xl max-h-32 object-cover"
                />
                <button
                  type="button"
                  className="text-xs font-body text-red-400"
                  onClick={() => {
                    setPhotoFile(null);
                    setPhotoPreview("");
                  }}
                >
                  Remove photo
                </button>
              </div>
            )}
            {uploading && (
              <p className="text-xs font-body text-swansons-green">
                Uploading... {uploadProgress.toFixed(0)}%
              </p>
            )}
          </motion.div>

          <div className="fixed bottom-0 left-0 right-0 bg-swansons-navy px-6 py-5 flex flex-col items-center gap-3">
            <Button
              onClick={() => selectedSpaceId && saveToSpace(selectedSpaceId)}
              disabled={saving || !selectedSpaceId}
              variant="inverted"
              className="max-w-[120px]"
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </motion.div>
      )}

      {/* ── CREATE SPACE ─────────────────────────────────────────────────── */}
      {step === "create-space" && (
        <motion.div
          className="px-4 pt-2 pb-36 max-w-lg mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <motion.h2
            variants={itemVariants}
            className="text-swansons-navy text-center mb-8"
          >
            Create a new <br />
            space
          </motion.h2>

          <motion.div variants={itemVariants} className="mb-6">
            <label className="font-body text-lg text-swansons-green-dark mb-2 block">
              Create a name for your space
            </label>
            <input
              className="input w-full"
              placeholder="eg. Backyard bed"
              value={newSpaceName}
              onChange={(e) => setNewSpaceName(e.target.value)}
            />
          </motion.div>

          <motion.div variants={itemVariants} className="mb-6">
            <p className="font-body text-lg text-swansons-green-dark mb-3">
              Light level of space
            </p>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  ["full-sun", "Full sun"],
                  ["dappled-shade", "Dappled shade"],
                  ["partial-sun", "Partial sun"],
                  ["full-shade", "Full shade"],
                ] as [LightLevel, string][]
              ).map(([val, label]) => (
                <label
                  key={val}
                  className="flex items-center gap-2 font-body text-lg text-swansons-green-dark cursor-pointer"
                >
                  <input
                    type="radio"
                    name="lightLevel"
                    value={val}
                    checked={spaceLight === val}
                    onChange={() => setSpaceLight(val)}
                    className="accent-swansons-green-dark"
                  />
                  {label}
                </label>
              ))}
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="mb-6">
            <p className="font-body text-lg text-swansons-green-dark mb-3">
              Location of space
            </p>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  ["indoor", "Indoor"],
                  ["outdoor", "Outdoor"],
                ] as ["indoor" | "outdoor", string][]
              ).map(([val, label]) => (
                <label
                  key={val}
                  className="flex items-center gap-2 font-body text-lg text-swansons-green-dark cursor-pointer"
                >
                  <input
                    type="radio"
                    name="location"
                    value={val}
                    checked={spaceLocation === val}
                    onChange={() => setSpaceLocation(val)}
                    className="accent-swansons-green-dark"
                  />
                  {label}
                </label>
              ))}
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="mb-8">
            <p className="font-body text-lg text-swansons-green-dark mb-3">
              Containment of space
            </p>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  ["container", "Container"],
                  ["in-ground", "In-ground"],
                  ["raised-bed", "Raised bed"],
                ] as [Containment, string][]
              ).map(([val, label]) => (
                <label
                  key={val}
                  className="flex items-center gap-2 font-body text-lg text-swansons-green-dark cursor-pointer"
                >
                  <input
                    type="radio"
                    name="containment"
                    value={val}
                    checked={spaceContainment === val}
                    onChange={() => setSpaceContainment(val)}
                    className="accent-swansons-green-dark"
                  />
                  {label}
                </label>
              ))}
            </div>
          </motion.div>

          <div className="fixed bottom-0 left-0 right-0 bg-swansons-navy px-6 py-5 flex flex-col items-center gap-3">
            <Button
              onClick={handleCreateAndSave}
              disabled={saving || !newSpaceName.trim()}
              variant="inverted"
              className=""
            >
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button
              onClick={handleCancel}
              variant="text"
              className="text-white"
            >
              Cancel Plant Profile
            </Button>
          </div>
        </motion.div>
      )}

      {/* Debug — dev only */}
      {showManual && (
        <div className="px-4 pb-8">
          <details>
            <summary className="text-sm font-body text-swansons-muted cursor-pointer">
              🛠 Debug Log
            </summary>
            <div className="mt-2 bg-swansons-navy text-swansons-green-light p-3 rounded-xl text-xs font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">
              {debug.length ? debug.join("\n") : "debug log empty"}
            </div>
          </details>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </main>
  );
}
